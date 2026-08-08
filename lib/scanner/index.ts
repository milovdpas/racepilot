// One screenshot in, whatever the app can learn from it out.
//
// The user does not know (or care) that the splits table and the activity
// summary are two different parsers — they took a screenshot of their run and
// want the log filled in. So there is one entry point and one button, and the
// scanners simply report what they each found.

import { createReader, preprocess } from "@/lib/scanner/ocr";
import { scanSplitsFrom } from "@/lib/scanner/split-scanner";
import {
  hasSummary,
  parseSummary,
  type ScanSummary,
} from "@/lib/scanner/summary-scanner";
import type { WorkoutSplit } from "@/lib/types";

export type { ScanSummary } from "@/lib/scanner/summary-scanner";

export interface ScreenshotScan {
  splits: WorkoutSplit[];
  summary: ScanSummary;
}

/**
 * Read a training screenshot on-device: never uploaded, discarded after.
 *
 * Both parsers run against one preprocessed canvas and one worker, which is
 * the whole reason ocr.ts exists — preprocessing is the slow part on a phone
 * and doing it twice would be felt.
 *
 * **The splits table wins outright when it is present.** A column of stacked
 * paces only exists on the splits screen, so finding one identifies the
 * screenshot, and the summary parser is not consulted at all.
 *
 * That is not tidiness, it is correctness. Strava prints "best efforts" above
 * the splits table, and each of those rows carries a real distance and a real
 * pace with real unit tokens next to them: `0.28 km  1:24  4:52 /km`. By shape
 * alone that is indistinguishable from an activity total, and taking it
 * overwrites the athlete's actual distance with a 280-metre segment. Measured
 * against 15 real splits screenshots, 9 produced exactly that. Nothing in the
 * summary parser can tell the two apart, because nothing in the pixels does
 * except the context the splits table itself provides.
 *
 * It also costs nothing: a splits screenshot now skips the summary pass
 * entirely, so the common case is no slower than before this existed.
 */
export async function scanScreenshot(file: File): Promise<ScreenshotScan> {
  const canvas = await preprocess(file);
  const { read, PSM, done } = await createReader();

  try {
    const { splits } = await scanSplitsFrom(canvas, read, PSM);
    if (splits.length > 0) return { splits, summary: {} };

    // No whitelist for the summary pass, unlike the splits table. A numeric
    // whitelist would force Tesseract to map "Distance" onto the nearest
    // allowed glyphs and could manufacture a "km" out of a label — and unit
    // tokens are the entire basis for trusting a value here.
    const { words } = await read(canvas, "", PSM.SPARSE_TEXT);
    return { splits, summary: parseSummary(words, canvas.height) };
  } finally {
    await done();
  }
}

export { hasSummary };
