// Scan a Strava "Splits" screenshot for per-kilometer splits, entirely in the
// browser (tesseract.js WASM). The image never leaves the device and there's no
// API key. tesseract is imported dynamically so it stays out of the main bundle.
//
// Canvas preprocessing and the worker moved to ocr.ts when the summary scanner
// arrived, so both can share one preprocessed image. Everything below that line
// — column detection, split parsing, elevation repair — is unchanged and stays
// here deliberately; see docs/tech-debt.md item 2.

import {
  cropScaled,
  median,
  NUMERIC_CHARS,
  type OcrWord,
  type ReadFn,
} from "@/lib/scanner/ocr";
import type { WorkoutSplit } from "@/lib/types";

// Everything here is internal except `scanSplitsFrom`/`ScanResult`. Two helpers
// (`parsePartialKm`, `resolveElevations`) stay exported on purpose: they are
// pure, they encode the fiddliest OCR-repair rules, and they are covered by
// split-scanner.test.ts. Nothing else should be exported without a reason.

/** Plausible running pace bounds, in seconds per km. */
const MIN_PACE_SEC = 2 * 60;
const MAX_PACE_SEC = 15 * 60;
const MAX_ELEV_M = 500;

const PACE_RE = /^(\d{1,2}):([0-5]\d)$/;

/**
 * Build splits from word **geometry** rather than line text.
 *
 * Strava's table puts Km / Pace / Elev far apart with a bar chart between them,
 * which mangles Tesseract's line output (`1 4:50 1` comes back as `1450`). The
 * per-word boxes are reliable though, so we:
 *   1. keep only strict `m:ss` words within a plausible pace range,
 *   2. cluster them by x — the biggest column is the Pace column (the pace
 *      chart's axis labels form their own, smaller cluster at a different x),
 *   3. read km from **row order** (the index column OCRs poorly and is just
 *      1,2,3… anyway), honoring a leading fraction for the final partial km,
 *   4. attach an elevation number found far to the right on the same row.
 *
 * Only numbers are ever inspected, so the screenshot's language is irrelevant.
 */
const paceSeconds = (w: OcrWord): number => {
  const m = PACE_RE.exec(w.text.trim())!;
  return Number(m[1]) * 60 + Number(m[2]);
};

/**
 * Does this column read like a chart axis rather than a table of splits?
 *
 * A pace chart's Y axis is by definition an arithmetic progression (3:00, 3:30,
 * 4:00 …), and it can easily be *longer* than the splits table, so size alone
 * picks the wrong column. Real splits vary run to run. Constant-zero steps are
 * allowed through — that's a perfectly even-paced run, not an axis.
 */
function looksLikeAxis(column: OcrWord[]): boolean {
  if (column.length < 3) return false;
  const secs = column.map(paceSeconds);
  const steps = secs.slice(1).map((s, i) => s - secs[i]);
  const first = steps[0];
  if (first === 0) return false;
  return steps.every((s) => Math.abs(s - first) <= 1);
}

/** The vertically-stacked column of `m:ss` words = the Pace column. */
function findPaceColumn(
  words: OcrWord[],
  imageWidth: number,
): OcrWord[] {
  const paces = words.filter((w) => {
    const m = PACE_RE.exec(w.text.trim());
    if (!m) return false;
    const sec = Number(m[1]) * 60 + Number(m[2]);
    return sec >= MIN_PACE_SEC && sec <= MAX_PACE_SEC;
  });
  if (paces.length === 0) return [];

  // Cluster by left edge — the pace chart's axis labels sit at their own x.
  const tol = Math.max(20, imageWidth * 0.05);
  const columns: OcrWord[][] = [];
  for (const w of paces) {
    const col = columns.find((c) => Math.abs(c[0].x0 - w.x0) <= tol);
    if (col) col.push(w);
    else columns.push([w]);
  }
  for (const c of columns) c.sort((a, b) => a.y0 - b.y0);

  const sameRow = (w: OcrWord, row: OcrWord) => {
    const mid = (w.y0 + w.y1) / 2;
    return mid >= row.y0 && mid <= row.y1;
  };

  // Score each candidate: a splits column has a km index to its left and often
  // an elevation far to its right; an axis has neither.
  const scored = columns.map((col) => {
    const withIndex = col.filter((p) =>
      words.some(
        (w) => w !== p && sameRow(w, p) && w.x1 <= p.x0 && /^\d/.test(w.text),
      ),
    ).length;
    const withElev = col.filter((p) =>
      words.some(
        (w) =>
          w !== p &&
          sameRow(w, p) &&
          w.x0 > p.x1 + imageWidth * 0.1 &&
          /^-?\d{1,3}$/.test(w.text.trim()),
      ),
    ).length;
    return {
      col,
      axis: looksLikeAxis(col),
      score: withIndex * 3 + withElev * 2 + col.length,
    };
  });

  // Prefer non-axis columns outright; only fall back to one if nothing else.
  const real = scored.filter((s) => !s.axis);
  const pool = real.length > 0 ? real : scored;
  const best = pool.sort((a, b) => b.score - a.score)[0];
  if (!best || best.col.length < 2) return []; // a lone match is noise
  return best.col;
}

/**
 * Read Strava's trailing partial kilometer ("0.4", "0.1").
 *
 * OCR frequently loses the decimal point ("0.1" → "01") or splits the label
 * into separate words ("0" + "1"), which would otherwise parse as 1 and make
 * the row look like another whole kilometer. A leading zero followed by digits
 * is therefore read as the fraction it must be. Whole indices ("1", "10") never
 * match, so this can't corrupt a normal row.
 */
export function parsePartialKm(raw: string): number | null {
  const t = raw.replace(/[^\d.,]/g, "").replace(",", ".");
  if (!t) return null;

  const direct = Number.parseFloat(t);
  if (Number.isFinite(direct) && direct > 0 && direct < 1) return direct;

  // "01" / "025" — the decimal point didn't survive OCR.
  const lost = /^0(\d+)$/.exec(t);
  if (lost) {
    const v = Number(`0.${lost[1]}`);
    return v > 0 && v < 1 ? v : null;
  }
  return null;
}

function parseSplitsFromWords(
  words: OcrWord[],
  imageWidth: number,
  /** Elevation per row index, from the dedicated high-resolution pass. */
  elevations?: Map<number, number>,
): WorkoutSplit[] {
  const column = findPaceColumn(words, imageWidth);
  if (column.length === 0) return [];

  // Row pitch lets us notice a *skipped* row: if OCR misses one pace, naive
  // 1,2,3… numbering would silently renumber every split after it.
  const gaps = column
    .slice(1)
    .map((w, i) => (w.y0 + w.y1) / 2 - (column[i].y0 + column[i].y1) / 2);
  const pitch = median(gaps);

  const sameRow = (w: OcrWord, row: OcrWord) => {
    const mid = (w.y0 + w.y1) / 2;
    return mid >= row.y0 && mid <= row.y1;
  };

  let kmCounter = 0;
  return column.map((paceWord, i) => {
    const m = PACE_RE.exec(paceWord.text.trim())!;
    const pace = `${Number(m[1])}:${m[2]}`;

    // Advance by however many row-slots we actually moved down the table.
    if (i === 0) kmCounter = 1;
    else {
      const steps =
        pitch > 0 ? Math.max(1, Math.round((gaps[i - 1] ?? pitch) / pitch)) : 1;
      kmCounter += steps;
    }
    let km = kmCounter;

    // Only Strava's final row can be a partial kilometer ("0.4"), and OCR
    // mangles it often — so join everything left of the pace on that row and
    // parse leniently.
    if (i === column.length - 1) {
      const leftText = words
        .filter(
          (w) => w !== paceWord && sameRow(w, paceWord) && w.x1 <= paceWord.x0,
        )
        .sort((a, b) => a.x0 - b.x0)
        .map((w) => w.text.trim())
        .join("");
      const partial = parsePartialKm(leftText);
      if (partial != null) km = partial;
    }

    const elevM = elevations?.get(i);
    return { km, pace, ...(elevM != null ? { elevM } : {}) };
  });
}

export interface ScanResult {
  splits: WorkoutSplit[];
  rawText: string;
}

/**
 * Recover minus signs that OCR dropped, from box geometry.
 *
 * Elevation is right-aligned, so a leading "-" simply makes the word box
 * *wider* — in practice ~1.7× (e.g. 74px for "1" vs 129px for "-1"). That's a
 * far stronger signal than asking Tesseract to classify a 2px dash. Words OCR
 * already read as negative calibrate the threshold; if it found none, fall back
 * to a generous multiple of the narrowest box.
 */
export type ElevEntry = {
  row: number;
  text: string;
  value: number;
  width: number;
  signed: boolean;
};

/**
 * Turn raw elevation readings into signed values, repairing OCR damage.
 *
 * Two corrections, both driven by the column being **right-aligned** so that a
 * leading "-" simply makes the word box ~1.7× wider (74px for `1` vs 129px for
 * `-1`) — far more reliable than asking OCR to classify a 2px dash:
 *
 *  1. **Missing dash** — a box in the wide band is negative even if OCR
 *     returned no sign.
 *  2. **Dash read as a digit** — "-1" sometimes comes back as "41". Such a
 *     value is wildly out of line with the rest of the run *and* sits in the
 *     wide band, so it's reinterpreted as minus-the-last-digit. If that still
 *     looks implausible the row is dropped: no elevation beats a wrong one.
 *
 * Bounds scale with the run's own magnitudes, so a genuinely hilly run
 * (±40 m/km) keeps every reading.
 */
export function resolveElevations(entries: ElevEntry[]): Map<number, number> {
  const out = new Map<number, number>();
  if (entries.length === 0) return out;

  const digitsOf = (e: ElevEntry) => e.text.replace(/\D/g, "");
  const mags = entries.map((e) => Math.abs(e.value)).sort((a, b) => a - b);
  const limit = Math.max(5, mags[Math.floor(mags.length / 2)] * 8);
  const plausible = entries.filter((e) => Math.abs(e.value) <= limit);

  // Width of a single glyph, from the tightest *believable* reading. Comparing
  // per-glyph matters: a two-digit "45" is as wide as a one-digit "-8", so a
  // raw width threshold would call every hilly-run reading negative.
  const unit = Math.min(
    ...(plausible.length > 0 ? plausible : entries).map(
      (e) => e.width / Math.max(1, digitsOf(e).length),
    ),
  );
  const hasDash = (e: ElevEntry) =>
    e.signed || e.width >= (digitsOf(e).length + 0.6) * unit;

  for (const e of entries) {
    if (Math.abs(e.value) <= limit || entries.length < 3) {
      out.set(e.row, hasDash(e) ? -Math.abs(e.value) : e.value);
      continue;
    }
    // Implausible magnitude in a two-glyph box → the leading glyph was a dash
    // ("-1" read as "41"). Anything longer is junk, so drop the row instead.
    const digits = digitsOf(e);
    const salvaged = Number(digits.slice(-1));
    if (digits.length === 2 && Number.isFinite(salvaged) && salvaged <= limit) {
      out.set(e.row, -salvaged);
    }
  }
  return out;
}

/** True when the row pitch implies OCR skipped a row inside the table. */
function hasRowGap(column: OcrWord[]): boolean {
  if (column.length < 3) return false;
  const gaps = column
    .slice(1)
    .map((w, i) => (w.y0 + w.y1) / 2 - (column[i].y0 + column[i].y1) / 2);
  const pitch = median(gaps);
  return pitch > 0 && gaps.some((g) => Math.round(g / pitch) > 1);
}

/**
 * Find the splits in an already-preprocessed screenshot.
 *
 * Takes the canvas and reader rather than a File so the summary scanner can
 * run against the same image and the same worker — see `scanScreenshot`.
 */
export async function scanSplitsFrom(
  canvas: HTMLCanvasElement,
  read: ReadFn,
  PSM: typeof import("tesseract.js").PSM,
): Promise<ScanResult> {
  // Pass 1 — locate the table. Sparse text, because the columns sit far apart
  // and a "uniform block" model merges them and drops characters.
  const { words, text: rawText } = await read(
    canvas,
    NUMERIC_CHARS,
    PSM.SPARSE_TEXT,
  );
  let column = findPaceColumn(words, canvas.width);
  if (column.length === 0) {
    // No pace column found — not a splits screenshot we can read. (A
    // line-text fallback used to live here; it never once succeeded, since
    // the far-apart columns break Tesseract's line segmentation.)
    return { splits: [], rawText };
  }

  // If the row pitch says a pace row was skipped, re-read just the table
  // strip at higher resolution to recover it (only pays the cost when needed).
  let tableWords = words;
  if (hasRowGap(column)) {
    const recovered = await rereadTable(canvas, column, read, PSM);
    if (recovered && recovered.column.length > column.length) {
      column = recovered.column;
      tableWords = recovered.words;
    }
  }

  const elevations = await readElevations(canvas, column, read, PSM);
  const splits = parseSplitsFromWords(tableWords, canvas.width, elevations);
  return { splits, rawText };
}

/**
 * Re-OCR only the table's rows at higher resolution to recover a pace the
 * full-page pass dropped. Results are mapped back into canvas coordinates so
 * the caller can keep working in one coordinate space.
 */
async function rereadTable(
  canvas: HTMLCanvasElement,
  column: OcrWord[],
  read: ReadFn,
  PSM: typeof import("tesseract.js").PSM,
): Promise<{ words: OcrWord[]; column: OcrWord[] } | null> {
  const first = column[0];
  const last = column[column.length - 1];
  const rowH = (last.y0 - first.y0) / Math.max(1, column.length - 1);
  const top = Math.max(0, Math.round(first.y0 - rowH));
  const bottom = Math.min(canvas.height, Math.round(last.y1 + rowH));
  if (bottom - top < 10) return null;

  const SCALE_UP = 2;
  try {
    const strip = cropScaled(canvas, 0, top, canvas.width, bottom - top, SCALE_UP);
    const { words } = await read(strip, NUMERIC_CHARS, PSM.SPARSE_TEXT);
    // Back into canvas space.
    const mapped = words.map((w) => ({
      text: w.text,
      x0: w.x0 / SCALE_UP,
      x1: w.x1 / SCALE_UP,
      y0: w.y0 / SCALE_UP + top,
      y1: w.y1 / SCALE_UP + top,
    }));
    return { words: mapped, column: findPaceColumn(mapped, canvas.width) };
  } catch {
    return null;
  }
}

/**
 * Elevation is a 1–2 character glyph ("-0", "1") that the full-page pass either
 * misses or misreads. Re-OCR just that narrow column, blown up 4×, as a single
 * block — that pass finds every row (a bare "1" is a single thin stroke that
 * sparse mode discards as noise), and `resolveElevations` recovers any minus
 * sign the OCR dropped from the word-box widths.
 */
async function readElevations(
  canvas: HTMLCanvasElement,
  column: OcrWord[],
  read: ReadFn,
  PSM: typeof import("tesseract.js").PSM,
): Promise<Map<number, number>> {
  const out = new Map<number, number>();
  const first = column[0];
  const last = column[column.length - 1];
  const rowH =
    column.length > 1
      ? (last.y0 - first.y0) / (column.length - 1)
      : first.y1 - first.y0;
  const top = Math.max(0, Math.round(first.y0 - rowH * 0.6));
  const bottom = Math.min(canvas.height, Math.round(last.y1 + rowH * 0.6));
  // Right-hand slice, well clear of the pace column and the bar chart.
  const xStart = Math.round(first.x1 + (canvas.width - first.x1) * 0.55);
  const width = canvas.width - xStart;
  if (width < 10 || bottom - top < 10) return out;

  const SCALE = 4;
  const crop = cropScaled(canvas, xStart, top, width, bottom - top, SCALE);

  try {
    const block = await read(crop, "0123456789-", PSM.SINGLE_BLOCK);
    const candidates = block.words.filter((w) =>
      /^-?\d{1,3}$/.test(w.text.trim()),
    );

    const entries: ElevEntry[] = [];

    column.forEach((paceWord, i) => {
      const mid = ((paceWord.y0 + paceWord.y1) / 2 - top) * SCALE;
      const hits = candidates.filter((w) => mid >= w.y0 && mid <= w.y1);
      if (hits.length === 0) return;
      // Prefer a signed reading — OCR tends to drop the minus.
      const best = hits.find((w) => w.text.trim().startsWith("-")) ?? hits[0];
      const text = best.text.trim();
      const e = Number(text);
      if (!Number.isFinite(e) || Math.abs(e) > MAX_ELEV_M) return;
      entries.push({
        row: i,
        text,
        value: e,
        width: best.x1 - best.x0,
        signed: text.startsWith("-"),
      });
    });

    // Repair dropped/mis-scanned minus signs using the box widths.
    for (const [row, value] of resolveElevations(entries)) out.set(row, value);
  } catch {
    // Elevation is a bonus — never fail the whole scan for it.
  }
  return out;
}
