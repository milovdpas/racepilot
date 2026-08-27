// Small shared predicates and indexes over a plan's workouts.

import { eachDayOfInterval } from "date-fns";
import { fromISO, toISO } from "@/lib/date";
import { DEFAULT_SPORT, SPORTS, type Sport } from "@/lib/sport";
import type { TrainingPlan, Workout } from "@/lib/types";

/**
 * A workout the user has actually run. Note `actualDistanceKm: 0` counts as
 * logged: `0 != null` is true, and someone who recorded a zero-distance session
 * did record something. Several call sites depend on this exact predicate to
 * decide what survives a re-import, so don't "tidy" it into a truthiness check.
 */
export function isLogged(w: Workout): boolean {
  return w.completed || w.actualDistanceKm != null;
}

/** Workouts keyed by the ISO date they're scheduled on. */
export function groupByDate(
  workouts: Iterable<Workout>,
): Map<string, Workout[]> {
  const map = new Map<string, Workout[]>();
  for (const w of workouts) {
    const list = map.get(w.date) ?? [];
    list.push(w);
    map.set(w.date, list);
  }
  return map;
}

/**
 * Every ISO day inside a flexible workout's window, mapped to the workouts
 * choosable that day. Lets the calendar offer "move it here" on any day of the
 * window, not just the one it's currently planned on.
 */
export function flexibleWindowIndex(
  workouts: Iterable<Workout>,
): Map<string, Workout[]> {
  const map = new Map<string, Workout[]>();
  for (const w of workouts) {
    if (!w.flexible || !w.windowStart || !w.windowEnd) continue;
    for (const d of eachDayOfInterval({
      start: fromISO(w.windowStart),
      end: fromISO(w.windowEnd),
    })) {
      const iso = toISO(d);
      const list = map.get(iso) ?? [];
      list.push(w);
      map.set(iso, list);
    }
  }
  return map;
}

/**
 * Which sport a workout is, resolved through its plan.
 *
 * The chain exists so nothing needed backfilling when multi-sport landed: a
 * workout with no `sport` inherits the plan's, and a plan with no `sport` is a
 * running plan — which every plan written before this was.
 */
export function workoutSport(
  workout: Pick<Workout, "sport">,
  plan?: Pick<TrainingPlan, "sport"> | null,
): Sport {
  return workout.sport ?? plan?.sport ?? DEFAULT_SPORT;
}

/**
 * Every sport this plan actually contains, in canonical order.
 *
 * The UI shows a sport icon only when this has more than one entry: a running
 * icon on every session of a running plan is noise, and the answer changes by
 * itself as soon as someone logs a cross-training ride.
 */
export function planSports(plan: TrainingPlan): Sport[] {
  const found = new Set<Sport>();
  for (const w of Object.values(plan.workouts)) {
    found.add(workoutSport(w, plan));
  }
  if (found.size === 0) found.add(plan.sport ?? DEFAULT_SPORT);
  return SPORTS.filter((s) => found.has(s));
}

/** Whether this plan mixes sports, and therefore needs sport labelling. */
export function isMultiSport(plan: TrainingPlan): boolean {
  return planSports(plan).length > 1;
}

/**
 * The sessions still ahead of the athlete: today and later.
 *
 * By **date**, not by whether they were completed. A calendar full of runs you
 * already did is a record, not a plan, and the point of exporting one is to see
 * what is coming. Date is also the predictable rule: today's session belongs in
 * today's calendar whether or not it has been ticked off, and a completed
 * workout dated next week is a data entry mistake, not a reason to hide it.
 *
 * `today` is passed in rather than read, so callers stay testable and a plan
 * exported at 23:59 does not disagree with one exported a minute later.
 */
export function upcomingWorkouts(
  workouts: readonly Workout[],
  today: string,
): Workout[] {
  // ISO dates compare correctly as strings, which is why the app stores them
  // this way; no Date objects and no timezone to get wrong.
  return workouts.filter((w) => w.date >= today);
}
