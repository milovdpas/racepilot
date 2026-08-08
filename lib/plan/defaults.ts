// Fallback plan metadata. Used to fill gaps when importing a partial plan
// (`lib/storage.ts` → `normalizePlan`) and by the store's migrations.
//
// The demo plan itself is no longer generated from rules — it's a real
// exported block loaded by `lib/example-plan.ts`.

import type { PlanMeta, TrainingPrefs } from "@/lib/types";

/** Schema version stamped into exported plans. */
export const PLAN_VERSION = 1;

export const MARATHON_KM = 42.2;

export const DEFAULT_PLAN_META = {
  name: "Milo's Marathon",
  raceName: "Marathon",
  raceDistanceKm: MARATHON_KM,
  raceDate: "2026-10-11", // a Sunday
  goalPace: "4:58",
  goalLabel: "Sub-3:30",
};

/** Stable id for the seeded example plan, so re-seeding is idempotent. */
export const DEFAULT_PLAN_ID = "milo-marathon";

export const DEFAULT_TRAINING_PREFS: TrainingPrefs = {
  daysPerWeek: 4,
  flexibleDays: false,
  trainingDays: [true, false, true, true, false, false, true], // Mon/Wed/Thu/Sun
  planningMode: "exact",
  targetDistanceKm: 30,
};


/**
 * A race name derived from the race itself, for when none was given.
 *
 * Everything used to fall back to "Marathon", so a triathlon whose author left
 * the field blank — a hand-made plan, or an AI plan that omitted it — showed
 * "Marathon" as the headline on the dashboard.
 */
export function raceNameFor(
  meta: Pick<PlanMeta, "raceType" | "sport" | "legs">,
): string {
  if (meta.raceType === "backyard") return "Backyard ultra";
  if (meta.raceType === "multisport") {
    return meta.legs?.some((l) => l.sport === "swim") ? "Triathlon" : "Duathlon";
  }
  if (meta.sport === "bike") return "Cycling race";
  if (meta.sport === "swim") return "Open water swim";
  return DEFAULT_PLAN_META.raceName;
}
