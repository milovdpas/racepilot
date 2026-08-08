// Read an activity *summary* screenshot: total distance, average pace or
// speed, moving time and the start time of day.
//
// Sibling of split-scanner.ts, which reads the per-kilometer table. Both run
// against the same preprocessed canvas (see ocr.ts) so a user can throw either
// screenshot at the same button.
//
// **Language-independent, by construction.** Nothing here reads a label:
// "Distance", "Afstand" and "Distancia" are all equally ignored. Values are
// found by their *shape* and their *unit token*, and units are the one part of
// a Strava screenshot that does not translate — "km", "mi", "km/h" and the
// clock's AM/PM are the same glyphs in every locale the app supports. That is
// the same rule split-scanner.ts follows by only ever inspecting numbers, and
// it is why a Dutch phone screenshot works without a Dutch keyword list.

import { type OcrWord, sameRow } from "@/lib/scanner/ocr";
import { KM_PER_MILE } from "@/lib/units";

/**
 * What a summary screenshot yielded, in **canonical** units: km and seconds
 * per km, whatever the screenshot itself was displaying.
 *
 * Converting here rather than at the field means a Strava account set to miles
 * fills a kilometer-configured app correctly, and vice versa. Every field is
 * optional: a screenshot that only shows distance still helps.
 */
export interface ScanSummary {
  distanceKm?: number;
  /** Seconds per km, the app's canonical pace unit. */
  paceSecPerKm?: number;
  durationMin?: number;
  /** Time of day as "HH:mm", 24-hour, which is what `<input type="time">` wants. */
  startTime?: string;
}

/** Anything usable at all? Used to decide whether a scan "found" a summary. */
export function hasSummary(s: ScanSummary): boolean {
  return (
    s.distanceKm != null ||
    s.paceSecPerKm != null ||
    s.durationMin != null ||
    s.startTime != null
  );
}

// --- shapes ----------------------------------------------------------------

/** "16.34", "16,34", "5" — a plain decimal, either separator. */
const DECIMAL = /^(\d{1,4})(?:[.,](\d{1,2}))?$/;
/** "5:03" — minutes and seconds, or an hour and minutes. Shape is shared. */
const MMSS = /^(\d{1,2}):([0-5]\d)$/;
/** "1:22:28" — two colons is the only unambiguous duration on the screen. */
const HMMSS = /^(\d{1,2}):([0-5]\d):([0-5]\d)$/;

/** A distance unit standing alone: "km", "mi", "KM". */
const DIST_UNIT = /^(km|mi)$/i;
/** A speed unit: "km/h", "kmh", "mph", "mi/h". */
const SPEED_UNIT = /^(km\/h|kmh|kph|mph|mi\/h)$/i;
/** A pace unit: "/km", "/mi", "min/km", and the "1km" OCR sometimes returns. */
const PACE_UNIT = /^(?:min)?\/?(km|mi)$/i;
/** A 12-hour marker, with or without the dots some locales add. */
const MERIDIEM = /^([ap])\.?m\.?$/i;

const isImperialToken = (t: string) => /mi|mph/i.test(t) && !/km/i.test(t);

function toNumber(m: RegExpMatchArray): number {
  return Number(m[2] ? `${m[1]}.${m[2]}` : m[1]);
}

// --- plausibility ----------------------------------------------------------
//
// Bounds exist to reject OCR noise, not to police the athlete. They are wide
// on purpose: a 3 km recovery jog, a 160 km ultra and a 6-hour ride all have
// to pass. Anything rejected here simply leaves the field blank for the user
// to type, which is a far better failure than a confidently wrong number.

const MIN_DISTANCE_KM = 0.05;
const MAX_DISTANCE_KM = 1000;
/** 1:30/km is world-record-ish; 30:00/km is a slow walk. */
const MIN_PACE_SEC = 90;
const MAX_PACE_SEC = 30 * 60;
const MIN_SPEED = 1;
const MAX_SPEED = 100;
const MAX_DURATION_MIN = 48 * 60;

/**
 * The status-bar clock lives in the top strip of every phone screenshot and
 * has exactly the shape of a start time. Nothing an athlete cares about is
 * printed up there, so the whole band is discarded before time-of-day matching.
 */
const STATUS_BAR_BAND = 0.06;

// --- matching --------------------------------------------------------------

/**
 * The word immediately to the right of `w` on the same row.
 *
 * "Immediately" is bounded by the row's own text height rather than a pixel
 * constant, so it scales with the screenshot: a value and its unit are set
 * close together, while the *next* stat in Strava's grid sits a column away.
 */
function rightNeighbour(w: OcrWord, words: OcrWord[]): OcrWord | undefined {
  const gap = (w.y1 - w.y0) * 2.5;
  return words
    .filter((o) => o !== w && sameRow(o, w) && o.x0 >= w.x1 && o.x0 - w.x1 <= gap)
    .sort((a, b) => a.x0 - b.x0)[0];
}

interface Anchored<T> {
  value: T;
  word: OcrWord;
}

/**
 * Find a value whose unit confirms it.
 *
 * Two spellings have to work: "16.34" + "km" as separate words, and "16.34km"
 * as one, because whether OCR splits on the space depends on the font metrics
 * of the particular screenshot. The joined form is tried first so its unit
 * suffix isn't mistaken for part of the number.
 */
function findAnchored<T>(
  words: OcrWord[],
  unit: RegExp,
  shape: RegExp,
  build: (m: RegExpMatchArray, unitToken: string) => T | null,
): Anchored<T> | undefined {
  for (const w of words) {
    const text = w.text.trim();

    // Joined: strip a trailing unit and re-test the remainder.
    const joined = /^(.+?)([a-z/.]+)$/i.exec(text);
    if (joined && unit.test(joined[2])) {
      const m = shape.exec(joined[1]);
      const value = m && build(m, joined[2]);
      if (value != null) return { value, word: w };
    }

    const m = shape.exec(text);
    if (!m) continue;
    const next = rightNeighbour(w, words);
    if (!next || !unit.test(next.text.trim())) continue;
    const value = build(m, next.text.trim());
    if (value != null) return { value, word: w };
  }
  return undefined;
}

/** All `h:mm:ss` durations, in reading order. */
function findDurations(words: OcrWord[]): Anchored<number>[] {
  return words
    .flatMap((w) => {
      const m = HMMSS.exec(w.text.trim());
      if (!m) return [];
      const min =
        Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 60;
      return min > 0 && min <= MAX_DURATION_MIN ? [{ value: min, word: w }] : [];
    })
    .sort((a, b) => a.word.y0 - b.word.y0 || a.word.x0 - b.word.x0);
}

/**
 * The activity's start time, as "HH:mm".
 *
 * This is the only value on the screen with no unit to anchor it: a clock time
 * and a running pace are both `h:mm`. Three rules separate them, in order of
 * how much they can be trusted:
 *
 *  1. **An AM/PM marker settles it outright** — a pace never carries one, and
 *     it also tells us to fold 12-hour into 24-hour.
 *  2. **Otherwise the value must sit above every stat we anchored.** Strava
 *     prints the date and time in the header, above the numbers; the pace,
 *     the moving time and their fragments are all at or below them. With no
 *     anchor found there is no "above" to test against, so a bare `h:mm` is
 *     left alone rather than guessed at.
 *  3. **The status-bar band is excluded** either way, or every scan would
 *     return the time the screenshot was taken.
 *
 * When two candidates survive, the lower one wins: the header sits directly
 * above the stats, and anything higher is further from the activity.
 */
function findStartTime(
  words: OcrWord[],
  imageHeight: number,
  anchorTop: number | undefined,
): string | undefined {
  const floor = imageHeight * STATUS_BAR_BAND;

  const candidates = words.flatMap((w) => {
    const m = MMSS.exec(w.text.trim());
    if (!m || w.y0 < floor) return [];
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23) return [];

    const next = rightNeighbour(w, words);
    const mer = next && MERIDIEM.exec(next.text.trim());
    if (mer) {
      if (h < 1 || h > 12) return []; // not a 12-hour clock reading
      const pm = mer[1].toLowerCase() === "p";
      const hour = h === 12 ? (pm ? 12 : 0) : pm ? h + 12 : h;
      return [{ word: w, hh: hour, mm: min, explicit: true }];
    }
    // No marker: only trust it above the stats block.
    if (anchorTop == null || w.y1 >= anchorTop) return [];
    return [{ word: w, hh: h, mm: min, explicit: false }];
  });

  if (candidates.length === 0) return undefined;
  const best = candidates.sort(
    (a, b) =>
      Number(b.explicit) - Number(a.explicit) || b.word.y0 - a.word.y0,
  )[0];
  return `${String(best.hh).padStart(2, "0")}:${String(best.mm).padStart(2, "0")}`;
}

/**
 * Pull whatever an activity summary screenshot is willing to give up.
 *
 * Pure and DOM-free so it can be tested against word boxes directly; the
 * caller supplies OCR output and the image height.
 */
export function parseSummary(
  words: OcrWord[],
  imageHeight: number,
): ScanSummary {
  const distance = findAnchored(words, DIST_UNIT, DECIMAL, (m, unit) => {
    const v = toNumber(m);
    const km = isImperialToken(unit) ? v * KM_PER_MILE : v;
    return km >= MIN_DISTANCE_KM && km <= MAX_DISTANCE_KM ? km : null;
  });

  const pace = findAnchored(words, PACE_UNIT, MMSS, (m, unit) => {
    const perUnit = Number(m[1]) * 60 + Number(m[2]);
    const secPerKm = isImperialToken(unit) ? perUnit / KM_PER_MILE : perUnit;
    return secPerKm >= MIN_PACE_SEC && secPerKm <= MAX_PACE_SEC
      ? secPerKm
      : null;
  });

  // A ride shows average speed instead of pace. Same canonical destination:
  // seconds per km, which is how every sport's speed is stored (lib/sport.ts).
  const speed = pace
    ? undefined
    : findAnchored(words, SPEED_UNIT, DECIMAL, (m, unit) => {
        const v = toNumber(m);
        if (v < MIN_SPEED || v > MAX_SPEED) return null;
        const kmh = isImperialToken(unit) ? v * KM_PER_MILE : v;
        return 3600 / kmh;
      });

  // Reading order, because Strava prints moving time before elapsed time and
  // moving time is the honest training duration.
  const duration = findDurations(words)[0];

  const anchorTop = [distance, pace, speed, duration]
    .filter((a) => a != null)
    .map((a) => a.word.y0)
    .sort((a, b) => a - b)[0];

  const paceSecPerKm = pace?.value ?? speed?.value;

  return {
    ...(distance ? { distanceKm: distance.value } : {}),
    ...(paceSecPerKm != null ? { paceSecPerKm } : {}),
    ...(duration ? { durationMin: duration.value } : {}),
    ...(() => {
      const t = findStartTime(words, imageHeight, anchorTop);
      return t ? { startTime: t } : {};
    })(),
  };
}
