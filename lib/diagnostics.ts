// The shape of the hidden debug report, plus the pure parts of building it.
//
// Gathering happens in the component (it reads browser globals and store
// state); everything here is data-in, data-out so the fiddly bits — the tap
// unlock and the clipboard rendering — can be tested without a DOM.

/** One labelled value. `hint` is shown under it when something needs saying. */
export interface DiagRow {
  label: string;
  value: string;
  hint?: string;
}

export interface DiagSection {
  title: string;
  rows: DiagRow[];
}

/** Render a value that may be missing, so "" never looks like a real answer. */
export function shown(v: unknown): string {
  if (v === undefined || v === null || v === "") return "not set";
  if (Array.isArray(v)) return v.length === 0 ? "empty" : v.join(", ");
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

/**
 * The report as plain text, for pasting into a message.
 *
 * Deliberately not JSON: this gets sent from a phone into a chat, where a wall
 * of braces is unreadable and gets mangled by autocorrect and line wrapping.
 */
export function diagnosticsText(sections: DiagSection[]): string {
  return sections
    .map(
      (s) =>
        `## ${s.title}\n` +
        s.rows.map((r) => `- ${r.label}: ${r.value}`).join("\n"),
    )
    .join("\n\n");
}

/** Human-readable byte size, for the storage figures. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// --- the unlock ------------------------------------------------------------

/** Taps needed, and the window they must all land in. */
export const TAPS_NEEDED = 10;
export const TAP_WINDOW_MS = 3000;

export interface TapResult {
  /** The retained tap timestamps, to carry into the next call. */
  taps: number[];
  unlocked: boolean;
  /** How many more are needed; 0 once unlocked. Drives the "3 to go" hint. */
  remaining: number;
}

/**
 * Register a tap on the hidden target.
 *
 * A rolling window rather than a counter with a reset timer: the user is
 * tapping as fast as they can, and a fixed window that starts at tap 1 punishes
 * a slow start by discarding a run that was otherwise fine. Only taps older
 * than the window are dropped, so tapping steadily always gets there.
 */
export function registerTap(
  previous: number[],
  now: number,
  needed = TAPS_NEEDED,
  windowMs = TAP_WINDOW_MS,
): TapResult {
  const taps = [...previous.filter((t) => now - t < windowMs), now];
  const unlocked = taps.length >= needed;
  return {
    // Once it fires, start clean: the next visit should need a fresh run.
    taps: unlocked ? [] : taps,
    unlocked,
    remaining: unlocked ? 0 : needed - taps.length,
  };
}
