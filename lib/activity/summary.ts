// Reducing an imported history to something an AI can actually use.
//
// The wizard's `latestRuns` list holds a handful of sessions, which is thin
// evidence when the athlete has just handed over two and a half years. Sending
// all 101 instead would balloon the request and bury the signal: what a coach
// reads off a training log is the shape of it, not the rows.
//
// So this is the same judgement `lib/plan/context.ts` already makes when it
// drops unrun workouts - keep what says something about fitness, drop the rest.
//
// Pure: no React, no DOM, no clock of its own (the caller passes `today`).

import { addDays, startOfWeek } from "date-fns";
import { fromISO, toISO } from "@/lib/date";
import { paceToSeconds, secondsToPace } from "@/lib/pace";
import type { Sport } from "@/lib/sport";
import type { ActivitySummary } from "@/lib/types";

/** How far back "current fitness" reaches. One training block. */
const DEFAULT_WINDOW_WEEKS = 16;
/** How many weekly totals to send, so the AI can see a ramp or a layoff. */
const TREND_WEEKS = 8;
/**
 * How many recent sessions to send in full.
 *
 * The aggregates say what the block looked like; these say what a week actually
 * contains - that the 20 km was a Saturday long run and the 9 km was intervals,
 * rather than eight identical outings averaging 12 km. Ten reaches back about
 * five weeks at a typical frequency, which is enough to show the rotation.
 *
 * They live here rather than in the wizard's `latestRuns` list on purpose: that
 * list is a hand-editable form, and ten rows of inputs is a screen and a half
 * of scrolling on a phone. Here they cost a few hundred bytes and no pixels.
 */
const RECENT_SESSIONS = 10;

export interface RecentSession {
  date: string;
  sport: Sport;
  km: number;
  pace: string; // "mm:ss" per km
}

export interface SportPicture {
  sport: Sport;
  sessions: number;
  totalKm: number;
  longestKm: number;
  /** Median pace, "mm:ss" per km. Median because one easy jog with the dog
   *  should not drag the number the plan is built on. */
  typicalPace: string;
}

export interface TrainingPicture {
  from: string; // ISO, first session in the window
  to: string; // ISO, last session in the window
  sessions: number;
  weeks: number;
  sessionsPerWeek: number;
  avgWeeklyKm: number;
  peakWeeklyKm: number;
  longestKm: number;
  /** Weekly distance for the last `TREND_WEEKS`, oldest first. Zeros included:
   *  a week off is information, and dropping it would flatten a taper or an
   *  injury gap into a straight line. */
  recentWeeklyKm: number[];
  /** The last `RECENT_SESSIONS` in full, newest first. */
  recentSessions: RecentSession[];
  bySport: SportPicture[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Monday of the week containing `iso`, as an ISO date. */
function weekKey(iso: string): string {
  return toISO(startOfWeek(fromISO(iso), { weekStartsOn: 1 }));
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * The training picture over the last `windowWeeks`, or `null` when there is not
 * enough to say anything. Null rather than a picture of zeroes: "no data" and
 * "trained nothing" are different claims, and only one of them is ours to make.
 */
export function trainingPicture(
  activities: readonly ActivitySummary[],
  today: string,
  windowWeeks: number = DEFAULT_WINDOW_WEEKS,
): TrainingPicture | null {
  const thisMonday = startOfWeek(fromISO(today), { weekStartsOn: 1 });
  const from = toISO(addDays(thisMonday, -7 * (windowWeeks - 1)));

  const inWindow = activities
    .filter((a) => a.date >= from && a.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (inWindow.length === 0) return null;

  // Every week in the window, including empty ones - see `recentWeeklyKm`.
  const kmByWeek = new Map<string, number>();
  for (let i = 0; i < windowWeeks; i++) {
    kmByWeek.set(toISO(addDays(thisMonday, -7 * i)), 0);
  }
  for (const a of inWindow) {
    const key = weekKey(a.date);
    if (kmByWeek.has(key)) kmByWeek.set(key, kmByWeek.get(key)! + a.distanceKm);
  }

  const weeklyOldestFirst = [...kmByWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, km]) => round1(km));

  const sports = [...new Set(inWindow.map((a) => a.sport))];
  const bySport: SportPicture[] = sports.map((sport) => {
    const rows = inWindow.filter((a) => a.sport === sport);
    const paces = rows
      .map((r) => paceToSeconds(r.pace))
      .filter((s): s is number => s !== null);
    return {
      sport,
      sessions: rows.length,
      totalKm: round1(rows.reduce((sum, r) => sum + r.distanceKm, 0)),
      longestKm: round1(Math.max(...rows.map((r) => r.distanceKm))),
      typicalPace: secondsToPace(Math.round(median(paces) ?? 0)),
    };
  });

  const totalKm = inWindow.reduce((sum, a) => sum + a.distanceKm, 0);
  // Averaged over the weeks the history actually covers, not always 16.
  //
  // A six-week-old Strava account divided by 16 reports a third of its real
  // volume, and the plan AI is told to open near `avgWeeklyKm` - so an athlete
  // running 40 km a week would be handed a 15 km plan. Weeks before their first
  // ever activity are absent data; weeks after it with nothing in them are real
  // rest, and those still count.
  const firstEver = activities.reduce(
    (min, a) => (a.date < min ? a.date : min),
    activities[0]?.date ?? from,
  );
  const start = firstEver > from ? weekKey(firstEver) : from;
  const covered = Math.max(
    1,
    Math.round((fromISO(today).getTime() - fromISO(start).getTime()) / 604_800_000) + 1,
  );
  const weeks = Math.min(windowWeeks, covered);

  return {
    from: inWindow[0].date,
    to: inWindow[inWindow.length - 1].date,
    sessions: inWindow.length,
    weeks,
    sessionsPerWeek: round1(inWindow.length / weeks),
    avgWeeklyKm: round1(totalKm / weeks),
    peakWeeklyKm: Math.max(...weeklyOldestFirst),
    longestKm: round1(Math.max(...inWindow.map((a) => a.distanceKm))),
    recentWeeklyKm: weeklyOldestFirst.slice(-TREND_WEEKS),
    recentSessions: inWindow
      .slice(-RECENT_SESSIONS)
      .reverse()
      .map((a) => ({
        date: a.date,
        sport: a.sport,
        km: a.distanceKm,
        pace: a.pace,
      })),
    bySport,
  };
}
