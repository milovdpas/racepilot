// The backyard-ultra format, in one place.
//
// A backyard repeats a fixed loop every hour, on the hour, until one athlete
// is left. There is no finish time and no fixed distance: the goal is a number of
// "yards" (loops, one per hour), so 24 yards = 24 hours ≈ 100 miles.
//
// The rest of the app only understands "race distance", so a backyard plan
// stores a derived `raceDistanceKm` and these helpers translate at the edges.

import type { TrainingPlan } from "@/lib/types";
import {
  distanceUnit,
  formatDistance,
  formatDistanceValue,
  type UnitSystem,
} from "@/lib/units";

/** The official backyard loop: 4.16667 miles. */
export const BACKYARD_LOOP_KM = 6.706;

export function isBackyard(plan: Pick<TrainingPlan, "raceType">): boolean {
  return plan.raceType === "backyard";
}

/**
 * Total distance a backyard goal implies. Stored as `raceDistanceKm` so stats
 * and charts keep working without knowing what a yard is.
 */
export function backyardDistanceKm(
  loopKm: number,
  targetYards: number,
): number {
  return Math.round(loopKm * targetYards * 10) / 10;
}

/**
 * How to describe a plan's target. A backyard is measured in yards, so "160.9
 * km" would be technically true but wrong to a runner: the goal is to still be
 * standing, not to cover a distance.
 *
 * `units` is required rather than defaulted: a silent metric default is exactly
 * how a call site ends up showing kilometers to someone who set miles, and the
 * compiler catching it is cheaper than spotting it on screen.
 */
export function raceSizeLabel(plan: TrainingPlan, units: UnitSystem): string {
  if (isBackyard(plan) && plan.targetYards) return `${plan.targetYards} yards`;
  // A triathlon is "1.5 / 40 / 10 km", not "51.5 km": the total is a number no
  // racer thinks in, and it hides which legs they are actually facing.
  if (plan.legs?.length) {
    const parts = plan.legs.map((l) =>
      formatDistanceValue(l.distanceKm, units, l.distanceKm < 10 ? 1 : 0),
    );
    return `${parts.join(" / ")} ${distanceUnit(units)}`;
  }
  return formatDistance(plan.raceDistanceKm, units);
}
