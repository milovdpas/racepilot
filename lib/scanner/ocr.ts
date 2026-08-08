// Canvas preprocessing and the tesseract.js worker, shared by every scanner.
//
// Extracted from split-scanner.ts unchanged when the summary scanner arrived:
// both read the *same* screenshot, so preprocessing it twice and standing up a
// second WASM worker would double the slowest part of the job for nothing.
//
// Nothing here knows what a split or a pace is. The tuned, hard-won parsing
// rules stay where they were (see docs/tech-debt.md item 2 on why that file is
// left alone) — this is only the plumbing under them.

/** Cap the long edge before OCR — phone screenshots are far bigger than needed. */
const MAX_EDGE = 1600;
/** Upscale factor after downscaling, so small table text has enough pixels. */
const SCALE = 2;

/** A 2D context with the best resampling the browser offers. */
export function smoothCanvas(
  w: number,
  h: number,
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  // Chrome defaults to "low", which visibly degrades OCR on small glyphs.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

/** Draw the image to a canvas, grayscale + invert it, and upscale for OCR. */
export async function preprocess(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const longEdge = Math.max(bitmap.width, bitmap.height);
  const fit = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1;
  const w = Math.round(bitmap.width * fit * SCALE);
  const h = Math.round(bitmap.height * fit * SCALE);

  // Resize in two steps (fit, then upscale) rather than one big jump — it
  // smooths JPEG artifacts and measurably improves recognition.
  let source: CanvasImageSource = bitmap;
  if (fit < 1) {
    const fw = Math.max(1, Math.round(bitmap.width * fit));
    const fh = Math.max(1, Math.round(bitmap.height * fit));
    const mid = smoothCanvas(fw, fh);
    mid.ctx.drawImage(bitmap, 0, 0, fw, fh);
    source = mid.canvas;
  }

  const { canvas, ctx } = smoothCanvas(w, h);
  ctx.drawImage(source, 0, 0, w, h);
  bitmap.close();

  // Tesseract expects dark text on a light background; Strava is dark mode.
  const img = ctx.getImageData(0, 0, w, h);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const v = 255 - gray;
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/** Crop a region of the preprocessed canvas and blow it up for tiny glyphs. */
export function cropScaled(
  src: HTMLCanvasElement,
  x: number,
  y: number,
  w: number,
  h: number,
  scale: number,
): HTMLCanvasElement {
  const { canvas, ctx } = smoothCanvas(
    Math.max(1, Math.round(w * scale)),
    Math.max(1, Math.round(h * scale)),
  );
  ctx.drawImage(src, x, y, w, h, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** A recognized word plus where it sits on the page. */
export interface OcrWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export function median(ns: number[]): number {
  if (ns.length === 0) return 0;
  const s = [...ns].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/** Vertical midpoint of `w` falls inside `row`'s box: they're on one line. */
export function sameRow(w: OcrWord, row: OcrWord): boolean {
  const mid = (w.y0 + w.y1) / 2;
  return mid >= row.y0 && mid <= row.y1;
}

/**
 * Whitelist for a pass that only cares about numbers. The single biggest
 * accuracy win on the splits table, where every glyph is a digit.
 */
export const NUMERIC_CHARS = "0123456789:.-";

/** Tesseract's page-segmentation modes. Type-only, so nothing is pulled in. */
export type Psm = import("tesseract.js").PSM;

export type ReadFn = (
  image: HTMLCanvasElement,
  /** `tessedit_char_whitelist`, or "" to let Tesseract use the full model. */
  whitelist: string,
  psm: Psm,
) => Promise<{ words: OcrWord[]; text: string }>;

/**
 * Start a worker and hand back a `read` function plus its terminator.
 *
 * The worker is the expensive object (it loads a WASM binary and a language
 * model), so passes share one. Callers must `await done()` in a `finally`.
 */
export async function createReader(): Promise<{
  read: ReadFn;
  PSM: typeof import("tesseract.js").PSM;
  done: () => Promise<void>;
}> {
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng");

  const read: ReadFn = async (image, whitelist, psm) => {
    await worker.setParameters({
      tessedit_char_whitelist: whitelist,
      tessedit_pageseg_mode: psm,
      // Canvases carry no DPI metadata, so Tesseract would guess and log
      // "Estimating resolution as N". Our upscaled input is ~300dpi-equivalent;
      // stating it keeps the console clean and the estimate consistent.
      user_defined_dpi: "300",
    });
    const { data } = await worker.recognize(
      image,
      {},
      { blocks: true, text: true },
    );
    const words: OcrWord[] = [];
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs ?? []) {
        for (const line of para.lines ?? []) {
          for (const w of line.words ?? []) {
            const text = (w.text ?? "").trim();
            if (text) words.push({ text, ...w.bbox });
          }
        }
      }
    }
    return { words, text: data.text ?? "" };
  };

  return { read, PSM, done: () => worker.terminate().then(() => undefined) };
}
