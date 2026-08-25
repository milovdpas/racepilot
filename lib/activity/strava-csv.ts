// Reading `activities.csv` out of a Strava account data export.
//
// Why the export and not the API: since June 2026 Strava's Standard API tier
// needs a paid subscription and caps an app at 10 connected athletes without
// review, neither of which works for a free self-hosted app. Any athlete can
// request a data export from Strava's website for nothing, and it needs no
// account linking, no key and no rate limit.
//
// Why only this one file out of the archive: activities.csv has no coordinate
// column of any kind - not lat, lon, address or start location - so reading it
// and nothing else means GPS data never enters the app. The sibling
// `activities/*.gpx` files are full traces starting at the athlete's front
// door. That is a guarantee by construction rather than by careful handling,
// which is the only kind worth relying on.
//
// Pure: no React, no DOM, no fetch.

import { parseCsv } from "@/lib/activity/csv";
import { secondsToPace } from "@/lib/pace";
import type { Sport } from "@/lib/sport";
import type { ActivitySummary } from "@/lib/types";

/** Why a row did not become an activity. Counted so the UI can say so. */
export type SkipReason = "unsupported-sport" | "unreadable-date" | "no-distance";

export interface ParseResult {
  activities: ActivitySummary[];
  /** Reason -> how many rows. Absent keys mean none. */
  skipped: Partial<Record<SkipReason, number>>;
}

/**
 * Strava's activity vocabulary, mapped onto the three sports this app plans
 * for. Anything absent here is skipped and counted rather than coerced: a hike
 * is not a slow run, and quietly filing it as one would corrupt the pace
 * picture the whole import exists to produce.
 */
const SPORT_BY_TYPE: Record<string, Sport> = {
  Run: "run",
  TrailRun: "run",
  VirtualRun: "run",
  Ride: "bike",
  VirtualRide: "bike",
  GravelRide: "bike",
  MountainBikeRide: "bike",
  EBikeRide: "bike",
  Handcycle: "bike",
  Velomobile: "bike",
  Swim: "swim",
};

/**
 * Month names for the fallback date parser, English and Dutch: the two locales
 * this app ships, and Strava writes `Activity Date` in the account's language.
 * Three letters is enough to be unambiguous in both, and matching on a prefix
 * covers "Aug", "August", "aug" and "augustus" with one table.
 */
const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  // Dutch, where it differs from English.
  mrt: 2, mei: 4, okt: 9,
};

/** A finite number from a cell, or undefined. Blank cells are common. */
function num(cell: string | undefined): number | undefined {
  const t = cell?.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Every column index carrying a given header name.
 *
 * Strava's header has genuine duplicates - `Distance`, `Elapsed Time` and
 * `Max Heart Rate` each appear twice with different units - so a name lookup
 * that returns one index is a coin toss. Callers get all of them and decide.
 */
function indicesOf(headers: string[], name: string): number[] {
  const want = name.trim().toLowerCase();
  return headers.flatMap((h, i) => (h.trim().toLowerCase() === want ? [i] : []));
}

/**
 * `Activity Date`, which is the only date the file has: `Start Time` is empty
 * in every row of a real export.
 *
 * It is written in the account's locale ("Aug 23, 2026, 9:17:44 AM"), so this
 * tries the engine first and falls back to picking a day, a month name and a
 * four-digit year out of the string in any order. Returns an ISO date, or null
 * so the caller can skip and count rather than invent a day.
 */
export function parseActivityDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  // `Date.parse` handles the US English form, which is what most exports carry.
  // Guarded because it also happily accepts things that are not dates at all.
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime()) && /\d{4}/.test(text)) {
    return toLocalISO(direct);
  }

  const year = text.match(/\b(\d{4})\b/)?.[1];
  const day = text.match(/\b(\d{1,2})\b/)?.[1];
  const month = text
    .toLowerCase()
    .match(/[a-z]{3,}/g)
    ?.map((word) => MONTHS[word.slice(0, 3)])
    .find((m) => m !== undefined);

  if (year === undefined || day === undefined || month === undefined) return null;
  const d = new Date(Number(year), month, Number(day));
  return Number.isNaN(d.getTime()) ? null : toLocalISO(d);
}

/** Local calendar date, not UTC: an evening run must not slide to tomorrow. */
function toLocalISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Pick the distance column that is actually in metres.
 *
 * `Distance` appears twice: once rounded to the athlete's display unit (18.16)
 * and once in metres (18164.8). Taking the first is wrong twice over - it loses
 * precision, and for an imperial athlete it is miles, which would silently
 * shrink every session by 40%.
 *
 * So instead of trusting column order, check the physics: distance must equal
 * average speed times moving time. Whichever candidate agrees is the one in
 * metres, whatever position it happens to sit in.
 */
function metresFrom(
  candidates: (number | undefined)[],
  avgSpeed: number | undefined,
  movingSec: number | undefined,
): number | undefined {
  const known = candidates.filter((c): c is number => c !== undefined && c > 0);
  if (known.length === 0) return undefined;

  if (avgSpeed && movingSec) {
    const expected = avgSpeed * movingSec;
    const best = known.reduce((a, b) =>
      Math.abs(a - expected) <= Math.abs(b - expected) ? a : b,
    );
    // Within 5% of what the speed implies is agreement; anything else means
    // the cross-check cannot settle it and we fall through to the largest.
    if (Math.abs(best - expected) <= expected * 0.05) return best;
  }

  // No usable speed. The metre figure is the larger one by a factor of ~1000,
  // which is a far weaker signal than the cross-check but better than position.
  return Math.max(...known);
}

/**
 * Parse an `activities.csv` into summaries, newest first.
 *
 * Only the columns named here are read. `Activity Description` carries deep
 * links to other athletes and `Media` references files in the archive; neither
 * is ours to import.
 */
export function parseStravaCsv(text: string): ParseResult {
  const rows = parseCsv(text);
  const skipped: Partial<Record<SkipReason, number>> = {};
  const skip = (r: SkipReason) => {
    skipped[r] = (skipped[r] ?? 0) + 1;
  };

  if (rows.length < 2) return { activities: [], skipped };

  const headers = rows[0];
  const at = (name: string) => indicesOf(headers, name);
  const first = (name: string) => at(name)[0];

  const idCol = first("Activity ID");
  const dateCol = first("Activity Date");
  const nameCol = first("Activity Name");
  const typeCol = first("Activity Type");
  const movingCol = first("Moving Time");
  const elapsedCols = at("Elapsed Time");
  const distanceCols = at("Distance");
  const speedCol = first("Average Speed");
  const elevCol = first("Elevation Gain");
  const hrCol = at("Average Heart Rate")[0];

  const activities: ActivitySummary[] = [];

  for (const row of rows.slice(1)) {
    // A trailing blank line, or a row so short it cannot be an activity.
    if (row.length < 2 || row.every((c) => c.trim() === "")) continue;

    const sport = SPORT_BY_TYPE[row[typeCol]?.trim() ?? ""];
    if (!sport) {
      skip("unsupported-sport");
      continue;
    }

    const date = parseActivityDate(row[dateCol] ?? "");
    if (!date) {
      skip("unreadable-date");
      continue;
    }

    const avgSpeed = num(row[speedCol]); // m/s
    // Moving time is what pace should be built from; elapsed includes the time
    // spent standing at traffic lights. Fall back only when moving is absent.
    const movingSec =
      num(row[movingCol]) ??
      elapsedCols.map((i) => num(row[i])).find((v) => v !== undefined);

    const metres = metresFrom(
      distanceCols.map((i) => num(row[i])),
      avgSpeed,
      movingSec,
    );

    if (!metres || !movingSec) {
      skip("no-distance");
      continue;
    }

    const distanceKm = Math.round((metres / 1000) * 100) / 100;
    activities.push({
      id: (row[idCol] ?? "").trim() || `${date}-${distanceKm}`,
      date,
      sport,
      name: (row[nameCol] ?? "").trim(),
      distanceKm,
      movingSec: Math.round(movingSec),
      pace: secondsToPace(Math.round(movingSec / distanceKm)),
      ...(num(row[elevCol]) !== undefined
        ? { elevGainM: Math.round(num(row[elevCol])!) }
        : {}),
      ...(num(row[hrCol]) !== undefined
        ? { avgHr: Math.round(num(row[hrCol])!) }
        : {}),
    });
  }

  activities.sort((a, b) => b.date.localeCompare(a.date));
  return { activities, skipped };
}

/**
 * Merge imported activities into an existing history, newest first.
 *
 * Deduped on the exporter's id, with the incoming copy winning: re-importing a
 * later export should correct an activity the athlete has since edited, not
 * append a second one.
 */
export function mergeActivities(
  existing: readonly ActivitySummary[],
  incoming: readonly ActivitySummary[],
  cap = 1000,
): ActivitySummary[] {
  const byId = new Map(existing.map((a) => [a.id, a]));
  for (const a of incoming) byId.set(a.id, a);
  return [...byId.values()]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, cap);
}
