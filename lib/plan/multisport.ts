// Multi-sport races, in one place — the same role `backyard.ts` plays for the
// backyard format.
//
// The rest of the app only understands "a race distance" and "a workout", so a
// multisport plan stores a derived `raceDistanceKm` and models race day as one
// workout per leg. These helpers translate at the edges.

import type { RaceLeg, TrainingPlan, Workout } from "@/lib/types";
import type { Sport } from "@/lib/sport";

export function isMultisportRace(
  plan: Pick<TrainingPlan, "raceType">,
): boolean {
  return plan.raceType === "multisport";
}

/**
 * Total race distance across the legs. Stored as `raceDistanceKm` so stats and
 * charts keep working without knowing what a leg is — the same trick the
 * backyard format uses.
 */
export function multisportDistanceKm(legs: readonly RaceLeg[]): number {
  return Math.round(legs.reduce((sum, l) => sum + l.distanceKm, 0) * 10) / 10;
}

/** Total time spent in transition, in minutes. */
export function totalTransitionMin(legs: readonly RaceLeg[]): number {
  return legs.reduce((sum, l) => sum + (l.transitionMin ?? 0), 0);
}

/** The standard distances, so nobody has to remember that 70.3 is 1.9/90/21.1. */
export interface MultisportPreset {
  key: string;
  legs: RaceLeg[];
}

const tri = (
  swim: number,
  bike: number,
  run: number,
  t1: number,
  t2: number,
): RaceLeg[] => [
  { sport: "swim", distanceKm: swim, transitionMin: t1 },
  { sport: "bike", distanceKm: bike, transitionMin: t2 },
  { sport: "run", distanceKm: run },
];

export const MULTISPORT_PRESETS: MultisportPreset[] = [
  { key: "sprint", legs: tri(0.75, 20, 5, 2, 2) },
  { key: "olympic", legs: tri(1.5, 40, 10, 3, 2) },
  // "70.3" and "140.6" are the miles the branding is named for; the legs
  // themselves are metric, which is how they are actually raced and measured.
  { key: "half", legs: tri(1.9, 90, 21.1, 5, 3) },
  { key: "full", legs: tri(3.8, 180, 42.2, 8, 5) },
  { key: "duathlon", legs: [
    { sport: "run", distanceKm: 10, transitionMin: 2 },
    { sport: "bike", distanceKm: 40, transitionMin: 2 },
    { sport: "run", distanceKm: 5 },
  ] },
];

export function presetByKey(key: string): MultisportPreset | undefined {
  return MULTISPORT_PRESETS.find((p) => p.key === key);
}

/**
 * Whether a set of legs matches a preset exactly, so the picker can show which
 * one is selected without storing the choice.
 */
export function matchingPresetKey(
  legs: readonly RaceLeg[],
): string | undefined {
  return MULTISPORT_PRESETS.find(
    (p) =>
      p.legs.length === legs.length &&
      p.legs.every(
        (l, i) =>
          l.sport === legs[i].sport && l.distanceKm === legs[i].distanceKm,
      ),
  )?.key;
}

/**
 * The race-day workouts, in race order.
 *
 * Selected by `raceLegIndex` rather than by date alone: a shakeout or a
 * travel-day note can share race day, and counting it as a leg would make the
 * race look unfinished forever.
 */
export function raceLegWorkouts(plan: TrainingPlan): Workout[] {
  return Object.values(plan.workouts)
    .filter((w) => w.date === plan.raceDate && w.raceLegIndex != null)
    .sort((a, b) => (a.raceLegIndex ?? 0) - (b.raceLegIndex ?? 0));
}

/** The sports raced, in order — for a compact "swim · bike · run" label. */
export function legSports(legs: readonly RaceLeg[]): Sport[] {
  return legs.map((l) => l.sport);
}
