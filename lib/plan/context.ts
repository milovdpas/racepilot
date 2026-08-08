// Turning a past plan into compact, useful context for the AI that builds the
// next one: a summary plus the runs actually logged (unrun planned workouts say
// nothing about fitness, and dropping them keeps the payload manageable).

import { todayISO } from "@/lib/date";
import { distanceRun, effectivePace, overallStats, weeklyMileage } from "@/lib/plan/stats";
import type { TrainingPlan, Workout, WorkoutSplit } from "@/lib/types";
import { raceLegWorkouts } from "@/lib/plan/multisport";
import { isLogged } from "@/lib/plan/workout";

/** A plan is done once its race day has passed. */
export function isPlanFinished(plan: TrainingPlan): boolean {
  return todayISO() > plan.raceDate;
}

/**
 * Can this plan be offered as context for a new plan?
 *
 * The bundled demo plan is someone else's training, and a plan with nothing
 * logged carries no signal about the user's fitness — both would only mislead.
 */
export function canBeContext(plan: TrainingPlan): boolean {
  if (plan.isExample) return false;
  return Object.values(plan.workouts).some(isLogged);
}

/**
 * The race itself: the workout on race day. Nothing flags a single-sport race
 * explicitly, so fall back to the longest one if a shakeout shares the date.
 *
 * For a multi-sport race this returns the FIRST leg, not the longest — but the
 * only question anyone asks is "is the race done?", and that is
 * `isRaceComplete`, not this.
 */
export function raceWorkout(plan: TrainingPlan): Workout | null {
  const legs = raceLegWorkouts(plan);
  if (legs.length > 0) return legs[0];

  const onRaceDay = Object.values(plan.workouts).filter(
    (w) => w.date === plan.raceDate,
  );
  if (onRaceDay.length === 0) return null;
  return onRaceDay.reduce((best, w) =>
    w.plannedDistanceKm > best.plannedDistanceKm ? w : best,
  );
}

/**
 * Has the race actually been raced?
 *
 * **Every leg must be done**, which is the whole point of asking it this way.
 * The old check was `raceWorkout(plan)?.completed`, and `raceWorkout` returned
 * the longest workout on race day — the 40 km bike leg of a triathlon. A
 * triathlete who logged their bike was told the race was finished while the run
 * was still ahead of them.
 */
export function isRaceComplete(plan: TrainingPlan): boolean {
  const legs = raceLegWorkouts(plan);
  if (legs.length > 0) return legs.every((l) => l.completed);
  return raceWorkout(plan)?.completed ?? false;
}

export interface PlanContextRun {
  date: string;
  type: string;
  title: string;
  plannedDistanceKm?: number;
  plannedPace?: string;
  distanceKm?: number;
  pace?: string;
  durationMin?: number;
  startTime?: string;
  tempC?: number;
  condition?: string;
  /** Pace per km, index 0 = km 1. Compact form of the scanned splits. */
  splits?: string[];
  /** Elevation delta per km, aligned with `splits`. Omitted when all flat. */
  elevM?: number[];
  notes?: string;
}

/** Free text the user typed ends up inside the AI prompt — keep it bounded. */
function safeNotes(notes?: string): string | undefined {
  if (!notes) return undefined;
  const clean = notes.replace(/[`\r\n]+/g, " ").trim();
  return clean.length > 200 ? `${clean.slice(0, 200)}…` : clean || undefined;
}

/**
 * `[{km:1,pace:"4:50",elevM:1}, …]` costs ~65 bytes per kilometer, which on a
 * fully-scanned block runs to six figures. The km is just the index, so store
 * paces as a flat array and only carry elevation when it isn't all flat.
 */
function compactSplits(splits?: WorkoutSplit[]): {
  splits?: string[];
  elevM?: number[];
} {
  if (!splits || splits.length === 0) return {};
  const paces = splits.map((s) => s.pace);
  const elev = splits.map((s) => s.elevM ?? 0);
  return {
    splits: paces,
    elevM: elev.some((e) => e !== 0) ? elev : undefined,
  };
}

export interface PlanContext {
  name: string;
  raceName: string;
  raceDistanceKm: number;
  raceDate: string;
  startDate?: string;
  goalLabel?: string;
  goalPace?: string;
  weeks: number;
  summary: {
    completionPct: number;
    completedRuns: number;
    totalKm: number;
    plannedTotalKm: number;
    longestRunKm: number;
    averagePace?: string;
    peakWeekKm: number;
  };
  weeklyMileage: { week: number; plannedKm: number; actualKm: number }[];
  completedRuns: PlanContextRun[];
}

/** Drop undefined/empty values so the request JSON stays lean. */
function compact<T extends object>(obj: T): T {
  const out = {} as T;
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

/** Everything about a past plan that helps an AI shape the next one. */
export function buildPlanContext(plan: TrainingPlan): PlanContext {
  const overall = overallStats(plan);
  const weekly = weeklyMileage(plan);

  const completedRuns = Object.values(plan.workouts)
    .filter(isLogged)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((w) =>
      compact<PlanContextRun>({
        date: w.date,
        type: w.type,
        title: w.title,
        plannedDistanceKm: w.plannedDistanceKm,
        plannedPace: w.plannedPace,
        distanceKm: distanceRun(w) || undefined,
        pace: effectivePace(w),
        durationMin: w.durationMin,
        startTime: w.startTime,
        // Whitelist the weather: WeatherSnapshot also holds lat/lon, i.e. the
        // user's home coordinates, which must never reach a third-party chatbot.
        tempC: w.weather?.tempC ?? undefined,
        condition: w.weather?.condition,
        ...compactSplits(w.splits),
        notes: safeNotes(w.notes),
      }),
    );

  return compact<PlanContext>({
    name: plan.name,
    raceName: plan.raceName,
    raceDistanceKm: plan.raceDistanceKm,
    raceDate: plan.raceDate,
    startDate: plan.startDate,
    goalLabel: plan.goalLabel,
    goalPace: plan.goalPace,
    weeks: plan.weeks.length,
    summary: {
      completionPct: overall.completionPct,
      completedRuns: overall.completedCount,
      totalKm: overall.totalKm,
      plannedTotalKm: overall.plannedTotalKm,
      longestRunKm: overall.longestRunKm,
      // averagePace() yields an em dash when there's nothing to average.
      averagePace: overall.averagePace === "—" ? undefined : overall.averagePace,
      peakWeekKm: weekly.reduce((m, w) => Math.max(m, w.actualKm), 0),
    },
    weeklyMileage: weekly.map((w) => ({
      week: w.weekNumber,
      plannedKm: w.plannedKm,
      actualKm: w.actualKm,
    })),
    completedRuns,
  });
}
