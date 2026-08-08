// The wire format the add-plan wizard hands to an AI.
//
// Pure data transformation, kept out of the wizard components: it's a
// versioned contract, so it's the part most likely to need a test when the
// schema bumps.

import { paceFromDistanceDuration, parseDurationToMinutes } from "@/lib/pace";
import { buildPlanContext } from "@/lib/plan/context";
import { backyardDistanceKm } from "@/lib/plan/backyard";
import { raceNameFor } from "@/lib/plan/defaults";
import { multisportDistanceKm } from "@/lib/plan/multisport";
import type {
  OffDay,
  RaceLeg,
  RaceType,
  TrainingPlan,
  TrainingPrefs,
} from "@/lib/types";
import type { Sport } from "@/lib/sport";
import { toStoredDistance, type UnitSystem } from "@/lib/units";

export interface LatestRun {
  /**
   * Absent means the plan's own sport, matching how `Workout.sport` works. A
   * multi-sport plan has no single default, so its rows set this explicitly.
   */
  sport?: Sport;
  /** As TYPED, in the user's display units. Converted by `buildPlanRequest`. */
  distanceKm: string;
  time: string; // total time, e.g. "50:43" or "1:05:30"
  date: string;
}

/** Everything the wizard collects across its four steps. */
export interface Draft {
  name: string;
  raceName: string;
  /** The sport the race is, and the default for every workout in the plan. */
  sport: Sport;
  raceDistanceKm: number;
  raceDate: string;
  startDate: string;
  raceType: RaceType;
  /** Backyard only. */
  loopKm: number;
  targetYards: number;
  /** Multisport only: the legs, in race order. */
  legs: RaceLeg[];
  goalType: "finish" | "time" | "pace";
  goalValue: string;
  offDays: OffDay[];
  latestRuns: LatestRun[];
  /** Previous plans attached as read-only context for the AI. */
  contextPlanIds: string[];
  prefs: TrainingPrefs;
}

/**
 * A sensible race name when the user hasn't typed one.
 *
 * The field used to be pre-filled with "Marathon" for every plan, so a
 * triathlete who never retyped it exported `marathon-plan-request.json` and
 * told the AI they were running a marathon. It is empty now, and this is what
 * fills the gap.
 */
export function defaultRaceName(
  draft: Pick<Draft, "raceType" | "sport" | "legs">,
): string {
  return raceNameFor(draft);
}

/**
 * A filename for the exported plan request, named after the race.
 *
 * Everything used to download as `marathon-plan-request.json`, which is wrong
 * for six of the seven race types and useless once you have exported two.
 * The race's own name is the most informative thing available, so it wins;
 * the format is the fallback when the field is still blank.
 */
export function planRequestFilename(draft: Draft): string {
  const slug = (draft.raceName.trim() || defaultRaceName(draft))
    .toLowerCase()
    .normalize("NFKD")
    // Strip accents, so "Marathon de Paris" doesn't become "marathon-de-par-s".
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  // `defaultRaceName` is never empty, so this only catches a typed name made
  // entirely of punctuation.
  return `${slug || draft.sport}-plan-request.json`;
}

/** Sent as names rather than indexes so the prompt reads naturally. */
const WEEKDAY_KEYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** Who is asking, so the coach can talk in their units and about their season. */
export interface RequestAthlete {
  country?: string;
  units: UnitSystem;
}

/**
 * The wire format is **always metric** — `distanceKm`, `pace` in min/km — no
 * matter what the athlete sees on screen. One canonical format means a plan
 * written for a US runner imports cleanly for a Dutch one, and the AI never has
 * to guess which system a bare number is in.
 *
 * `athlete.units` is what tells the AI how to *talk*: a runner who set miles
 * wants "8:00/mi" in the workout titles, computed from these metric numbers.
 */
export function buildPlanRequest(
  draft: Draft,
  plans: Record<string, TrainingPlan>,
  athlete: RequestAthlete = { units: "metric" },
) {
  const isBackyard = draft.raceType === "backyard";
  const isMultisport = draft.raceType === "multisport";

  return {
    app: "marathon-tracker-plan-request",
    // v2 added `previousPlans`.
    version: 2,
    race: {
      name: draft.name.trim(),
      raceName: draft.raceName.trim() || defaultRaceName(draft),
      sport: draft.sport,
      type: draft.raceType,
      // For a backyard the distance is derived, so downstream code that only
      // knows about "race distance" still gets a sensible number.
      distanceKm: isBackyard
        ? backyardDistanceKm(draft.loopKm, draft.targetYards)
        : isMultisport
          ? multisportDistanceKm(draft.legs)
          : draft.raceDistanceKm,
      date: draft.raceDate,
      ...(isBackyard
        ? { loopKm: draft.loopKm, targetYards: draft.targetYards }
        : {}),
      // The legs carry their own distances and the transition after each, so
      // the AI can plan bricks and T1/T2 rather than three separate races.
      ...(isMultisport ? { legs: draft.legs } : {}),
    },
    startDate: draft.startDate,
    athlete: {
      ...(athlete.country ? { country: athlete.country } : {}),
      units: athlete.units,
      // Explicit, because "km" appearing in a field name is not a promise the
      // AI will honour unless we say so.
      distanceUnit: "km",
      paceUnit: "min/km",
    },
    goal: isBackyard
      ? { type: "yards" as const, value: String(draft.targetYards) }
      : {
          type: draft.goalType,
          value:
            draft.goalType === "finish" ? null : draft.goalValue.trim() || null,
        },
    offDays: draft.offDays,
    latestRuns: draft.latestRuns
      .filter((r) => r.distanceKm)
      .map((r) => {
        // The only draft field held in display units — the rest of the wizard
        // stores canonical km and converts at its inputs.
        const distanceKm = toStoredDistance(
          Number(r.distanceKm) || 0,
          athlete.units,
        );
        const durationMin = parseDurationToMinutes(r.time) ?? null;
        return {
          // Resolved here so the AI never has to guess: a bare 40 km means
          // something very different on a bike than on foot.
          sport: r.sport ?? draft.sport,
          distanceKm,
          durationMin, // total time in minutes
          // Always min/km, for every sport — the wire format, not the display.
          pace:
            paceFromDistanceDuration(distanceKm, durationMin ?? undefined) ??
            null,
          date: r.date,
        };
      }),
    training: {
      daysPerWeek: draft.prefs.daysPerWeek,
      flexibleDays: draft.prefs.flexibleDays,
      trainingDays: draft.prefs.flexibleDays
        ? null
        : WEEKDAY_KEYS.filter((_, i) => draft.prefs.trainingDays[i]),
      planningMode: draft.prefs.planningMode,
      targetDistanceKm: draft.prefs.targetDistanceKm,
    },
    // Past training as read-only context. `filter(Boolean)` covers a plan
    // deleted while the wizard was open.
    previousPlans: draft.contextPlanIds
      .map((id) => plans[id])
      .filter(Boolean)
      .map(buildPlanContext),
  };
}
