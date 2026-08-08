import { isWithinInterval, parseISO, startOfWeek } from "date-fns";
import { toISO, todayISO } from "@/lib/date";
import { averagePace, paceToSeconds, secondsToPace } from "@/lib/pace";
import { workoutSport } from "@/lib/plan/workout";
import { SPORTS, type Sport } from "@/lib/sport";
import type {
  TrainingPlan,
  TrainingWeek,
  Workout,
  WorkoutSplit,
} from "@/lib/types";

/** All workouts as a flat array, sorted by date. */
export function allWorkouts(plan: TrainingPlan): Workout[] {
  return Object.values(plan.workouts).sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}

/** Distance actually run for a workout (0 if not done). */
export function distanceRun(w: Workout): number {
  if (w.actualDistanceKm != null) return w.actualDistanceKm;
  return w.completed ? w.plannedDistanceKm : 0;
}

/** The pace to display/aggregate for a workout. */
export function effectivePace(w: Workout): string | undefined {
  return w.actualPace ?? (w.completed ? w.plannedPace : undefined);
}

/** Minutes actually spent, falling back to distance x pace when untimed. */
export function durationOf(w: Workout): number {
  if (w.durationMin != null) return w.durationMin;
  const secs = paceToSeconds(effectivePace(w));
  const km = distanceRun(w);
  return secs != null && km > 0 ? (secs * km) / 60 : 0;
}

export interface OverallStats {
  totalKm: number;
  /** Across every sport. The only total that means anything when they mix. */
  totalTimeMin: number;
  longestRunKm: number;
  averagePace: string; // "mm:ss" or "—"
  completedCount: number;
  totalCount: number;
  completionPct: number; // 0–100
  plannedTotalKm: number;
}

export function overallStats(plan: TrainingPlan): OverallStats {
  return statsForWorkouts(allWorkouts(plan));
}

/**
 * The same figures over any subset of workouts.
 *
 * Split out so a per-sport section can show exactly what a single-sport plan
 * shows, rather than a reduced summary: a triathlete wants their cycling
 * distance, longest ride and average speed, not a total that mixes three
 * sports together.
 */
export function statsForWorkouts(workouts: Workout[]): OverallStats {
  let totalKm = 0;
  let longestRunKm = 0;
  let completedCount = 0;
  let plannedTotalKm = 0;
  let totalTimeMin = 0;
  const paceRuns: { distanceKm: number; pace?: string }[] = [];

  for (const w of workouts) {
    plannedTotalKm += w.plannedDistanceKm;
    if (w.completed) completedCount += 1;
    const ran = distanceRun(w);
    if (ran > 0) {
      totalKm += ran;
      longestRunKm = Math.max(longestRunKm, ran);
      paceRuns.push({ distanceKm: ran, pace: effectivePace(w) });
      totalTimeMin += durationOf(w);
    }
  }

  return {
    totalKm: round1(totalKm),
    totalTimeMin: Math.round(totalTimeMin),
    longestRunKm: round1(longestRunKm),
    averagePace: averagePace(paceRuns),
    completedCount,
    totalCount: workouts.length,
    completionPct:
      workouts.length === 0
        ? 0
        : Math.round((completedCount / workouts.length) * 100),
    plannedTotalKm: round1(plannedTotalKm),
  };
}

/** Every overall figure, for one sport. */
export type SportStats = OverallStats & { sport: Sport };

/**
 * The full stat set, per sport, for the sports this plan contains.
 *
 * Deliberately NOT a cross-sport summary. Distance cannot be summed across
 * sports (40 km on a bike and 10 km running is not 50 km of anything) and a
 * pace averaged over a swim, a ride and a run blends three different units, so
 * each sport is reported in its own terms instead.
 */
export function statsBySport(plan: TrainingPlan): SportStats[] {
  const bySport = new Map<Sport, Workout[]>();
  for (const w of allWorkouts(plan)) {
    const sport = workoutSport(w, plan);
    bySport.set(sport, [...(bySport.get(sport) ?? []), w]);
  }
  // Canonical order, so sections don't reshuffle as sessions are logged.
  return SPORTS.filter((sp) => bySport.has(sp)).map((sport) => ({
    sport,
    ...statsForWorkouts(bySport.get(sport)!),
  }));
}

/**
 * The workouts that fall inside a week, selected **by date**.
 *
 * Not by `week.workoutIds`, which is bookkeeping that drifts: a workout logged
 * on a date the plan's weeks don't cover is filed under no week at all
 * (`addWorkout` only attaches when `weekIndexForDate` finds one), and one whose
 * date is later edited into a different week is never re-filed. The dashboard
 * has always counted by date (`mileageInRange`), so the two disagreed — a run
 * could show up in "this week" and be missing from the weekly charts.
 */
export function workoutsInWeek(
  plan: TrainingPlan,
  week: Pick<TrainingWeek, "startDate" | "endDate">,
): Workout[] {
  return allWorkouts(plan).filter(
    (w) => w.date >= week.startDate && w.date <= week.endDate,
  );
}

export interface RangeMileage {
  plannedKm: number;
  actualKm: number;
  completed: number;
  total: number;
}

/** Planned vs actual mileage for workouts within [startISO, endISO] inclusive. */
export function mileageInRange(
  plan: TrainingPlan,
  startISO: string,
  endISO: string,
): RangeMileage {
  const start = parseISO(startISO);
  const end = parseISO(endISO);
  let plannedKm = 0;
  let actualKm = 0;
  let completed = 0;
  let total = 0;
  for (const w of allWorkouts(plan)) {
    if (!isWithinInterval(parseISO(w.date), { start, end })) continue;
    total += 1;
    plannedKm += w.plannedDistanceKm;
    actualKm += distanceRun(w);
    if (w.completed) completed += 1;
  }
  return {
    plannedKm: round1(plannedKm),
    actualKm: round1(actualKm),
    completed,
    total,
  };
}

export interface WeeklyMileage {
  weekNumber: number;
  label: string;
  plannedKm: number;
  actualKm: number;
}

/** Per-week planned vs actual mileage (for the trend chart). */
export function weeklyMileage(plan: TrainingPlan): WeeklyMileage[] {
  return plan.weeks.map((week) => {
    let plannedKm = 0;
    let actualKm = 0;
    for (const w of workoutsInWeek(plan, week)) {
      plannedKm += w.plannedDistanceKm;
      actualKm += distanceRun(w);
    }
    return {
      weekNumber: week.weekNumber,
      label: `W${week.weekNumber}`,
      plannedKm: round1(plannedKm),
      actualKm: round1(actualKm),
    };
  });
}

export interface LongRunPoint {
  weekNumber: number;
  label: string;
  planned: number;
  /** `null` only while the week is still ahead — see below. */
  actual: number | null;
}

/**
 * Long-run progression, planned vs actual.
 *
 * "The long run" is **the longest session of the week**, not only a session
 * someone remembered to type as `long`. Filtering on `type === "long"` meant a
 * logged 10 km in a week with nothing planned charted as 0 and 0: the run was
 * real, the chart just wasn't looking at it. Intensity labels are a hint about
 * effort, not a reliable index of which run was longest.
 *
 * Two rules, pulling in opposite directions on purpose:
 *
 *  - **Planned is always a number, including 0.** A week with nothing planned
 *    is real information (a cutback, a taper, race week), so the line drops to
 *    the axis and the reader can see why.
 *  - **Actual is 0 once the week is behind you, and null while it is ahead.**
 *    A past week with nothing logged is a genuine zero and the line should keep
 *    going through it; a future week has no answer yet, and drawing 0 there
 *    would show every plan flatlining from today onward.
 */
export function longRunProgression(
  plan: TrainingPlan,
  today: string = todayISO(),
): LongRunPoint[] {
  return plan.weeks.map((week) => {
    let planned = 0;
    let actual = 0;
    let hasActual = false;
    for (const w of workoutsInWeek(plan, week)) {
      planned = Math.max(planned, w.plannedDistanceKm);
      const ran = distanceRun(w);
      if (ran > 0) {
        actual = Math.max(actual, ran);
        hasActual = true;
      }
    }
    // The current week stays open: there is still time to do the long run.
    const isPast = week.endDate < today;
    return {
      weekNumber: week.weekNumber,
      label: `W${week.weekNumber}`,
      planned: round1(planned),
      actual: hasActual ? round1(actual) : isPast ? 0 : null,
    };
  });
}

export interface WeekHistoryPoint {
  weekStart: string; // Monday ISO
  plannedKm: number;
  actualKm: number;
}

/**
 * Planned vs actual distance bucketed by calendar week (Mon-start), across
 * whatever workouts are passed in — use this with ALL plans' workouts to see
 * training volume over time, including runs outside the current plan.
 */
export function weeklyHistory(workouts: Workout[]): WeekHistoryPoint[] {
  const planned = new Map<string, number>();
  const actual = new Map<string, number>();
  for (const w of workouts) {
    const weekStart = toISO(startOfWeek(parseISO(w.date), { weekStartsOn: 1 }));
    planned.set(weekStart, (planned.get(weekStart) ?? 0) + (w.plannedDistanceKm || 0));
    const ran = distanceRun(w);
    if (ran > 0) actual.set(weekStart, (actual.get(weekStart) ?? 0) + ran);
  }
  return [...new Set([...planned.keys(), ...actual.keys()])]
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    .map((weekStart) => ({
      weekStart,
      plannedKm: round1(planned.get(weekStart) ?? 0),
      actualKm: round1(actual.get(weekStart) ?? 0),
    }));
}

export interface SplitRun {
  workoutId: string;
  date: string;
  title: string;
  splits: WorkoutSplit[];
  fastestPace: string;
  slowestPace: string;
  /** Seconds between the fastest and slowest full km — lower = more even. */
  spreadSec: number;
}

/**
 * The most recent completed workout that has scanned splits, with its pace
 * spread (fastest vs slowest full km) — a simple pacing-consistency read.
 */
export function latestSplitRun(plan: TrainingPlan): SplitRun | null {
  const withSplits = allWorkouts(plan).filter(
    (w) => w.splits && w.splits.length > 0,
  );
  const w = withSplits[withSplits.length - 1];
  if (!w?.splits) return null;

  // Only full kilometers are comparable; a partial km is always "faster".
  const full = w.splits.filter((s) => s.km >= 1);
  const secs = (full.length > 0 ? full : w.splits)
    .map((s) => paceToSeconds(s.pace))
    .filter((n): n is number => n != null);
  if (secs.length === 0) return null;
  const fastest = Math.min(...secs);
  const slowest = Math.max(...secs);

  return {
    workoutId: w.id,
    date: w.date,
    title: w.title,
    splits: w.splits,
    fastestPace: secondsToPace(fastest),
    slowestPace: secondsToPace(slowest),
    spreadSec: Math.round(slowest - fastest),
  };
}

/** Next `count` upcoming (not-completed) workouts on/after fromISO. */
export function upcomingWorkouts(
  plan: TrainingPlan,
  fromISO: string,
  count = 3,
): Workout[] {
  return allWorkouts(plan)
    .filter((w) => !w.completed && w.date >= fromISO)
    .slice(0, count);
}

/** Most recent `count` completed workouts (newest first). */
export function recentCompleted(plan: TrainingPlan, count = 4): Workout[] {
  return allWorkouts(plan)
    .filter((w) => w.completed)
    .reverse()
    .slice(0, count);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
