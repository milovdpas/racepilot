// Builds the demo plans that aren't backed by a real export.
//
// The marathon demo is a scrubbed export of someone's actual training
// (`example-plan.ts`), which is what makes it convincing. There is no such
// export for a trail, ultra or backyard block, so those are generated from a
// small spec instead of shipping three more 26 KB JSON files of invented data.
//
// Everything here is deterministic: the same spec and the same `now` always
// produce the same plan, so a demo can be asserted in a test.

import { addDays, startOfWeek } from "date-fns";
import { toISO } from "@/lib/date";
import { paceToSeconds, secondsToPace } from "@/lib/pace";
import { PLAN_VERSION } from "@/lib/plan/defaults";
import type { Sport } from "@/lib/sport";
import type {
  TrainingPlan,
  TrainingPrefs,
  TrainingWeek,
  WeekPhase,
  Workout,
  WorkoutType,
} from "@/lib/types";

/** One recurring session in the template week. */
export interface SessionTemplate {
  /** 0 = Monday … 6 = Sunday. Repeat a day for a brick (bike straight to run). */
  day: number;
  /** Omit to inherit the plan's sport; set it for a multi-sport block. */
  sport?: Sport;
  type: WorkoutType;
  title: string;
  /** Distance in the plan's first week; scaled by the weekly ramp. */
  km: number;
  /** Target pace, "m:ss" per km. */
  pace: string;
}

export interface ExampleSpec {
  id: string;
  name: string;
  /** The plan's sport. Workouts inherit it, so sessions needn't repeat it. */
  sport?: Sport;
  raceName: string;
  raceDistanceKm: number;
  goalPace: string;
  goalLabel: string;
  raceType?: TrainingPlan["raceType"];
  /** Multisport only: the legs, in race order. */
  legs?: TrainingPlan["legs"];
  loopKm?: number;
  targetYards?: number;
  /** Total length of the block, in weeks. */
  weeks: number;
  /** How many of those weeks are already behind the athlete. */
  pastWeeks: number;
  /**
   * Race day, replacing the template on the final Sunday. An array because a
   * triathlon is three legs run back to back.
   */
  raceSessions: Omit<SessionTemplate, "day">[];
  sessions: SessionTemplate[];
  trainingPrefs: TrainingPrefs;
}

/**
 * A stable pseudo-random number in [0, 1) from a string. Logged sessions need
 * to differ from their plan a little or the demo looks synthetic, but they must
 * differ the *same way* on every load — otherwise the plan's stats change every
 * time the chunk is re-imported.
 */
function jitter(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/** Volume multiplier for week `i`, with a cutback every fourth week. */
function volumeFactor(i: number, weeks: number): number {
  if (i === weeks - 1) return 0.35; // race week
  if (i === weeks - 2) return 0.55; // taper
  if (i > 0 && i % 4 === 3) return 0.7; // cutback
  return 1 + i * 0.05;
}

function phaseFor(i: number, weeks: number): WeekPhase {
  if (i === weeks - 1) return "race";
  if (i === weeks - 2) return "taper";
  if (i > 0 && i % 4 === 3) return "reduced";
  if (i < weeks / 3) return "base";
  if (i < (weeks * 2) / 3) return "build";
  return "peak";
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function buildExamplePlan(
  spec: ExampleSpec,
  now: Date = new Date(),
): TrainingPlan {
  const todayIso = toISO(now);
  // The block is anchored so that "this week" is week `pastWeeks + 1`: the demo
  // opens mid-training rather than on day one or after the race.
  const firstMonday = addDays(
    startOfWeek(now, { weekStartsOn: 1 }),
    -7 * spec.pastWeeks,
  );

  const weeks: TrainingWeek[] = [];
  const workouts: Record<string, Workout> = {};

  // The two shortest non-Sunday sessions, kept in race week as shakeouts.
  const raceWeekKeep = new Set(
    [...spec.sessions]
      .filter((s) => s.day !== 6)
      .sort((a, b) => a.km - b.km)
      .slice(0, 2),
  );

  for (let i = 0; i < spec.weeks; i++) {
    const monday = addDays(firstMonday, 7 * i);
    const weekNumber = i + 1;
    const factor = volumeFactor(i, spec.weeks);
    const isRaceWeek = i === spec.weeks - 1;
    const workoutIds: string[] = [];

    for (const s of spec.sessions) {
      // Race day replaces whatever the template had on the final Sunday.
      if (isRaceWeek && s.day === 6) continue;
      // Race week is a taper: only the two shortest shakeouts survive.
      // Chosen by rank, not by an absolute distance — a 25 km recovery spin is
      // a shakeout for a cyclist and a hard week for a swimmer.
      if (isRaceWeek && !raceWeekKeep.has(s)) continue;

      const date = toISO(addDays(monday, s.day));
      // The index keeps a brick's two sessions on the same day distinct.
      const id = `${spec.id}-w${weekNumber}-d${s.day}-${spec.sessions.indexOf(s)}`;
      workouts[id] = logIfPast(
        {
          id,
          date,
          ...(s.sport ? { sport: s.sport } : {}),
          type: s.type,
          title: s.title,
          weekNumber,
          plannedDistanceKm: round1(s.km * factor),
          plannedPace: s.pace,
          completed: false,
        },
        todayIso,
      );
      workoutIds.push(id);
    }

    if (isRaceWeek) {
      const date = toISO(addDays(monday, 6));
      spec.raceSessions.forEach((leg, legIndex) => {
        const id =
          spec.raceSessions.length > 1
            ? `${spec.id}-race-${legIndex}`
            : `${spec.id}-race`;
        workouts[id] = {
          id,
          date,
          ...(leg.sport ? { sport: leg.sport } : {}),
          // Marks it as part of the race and orders it, so `isRaceComplete`
          // waits for every leg rather than the longest one.
          ...(spec.raceSessions.length > 1 ? { raceLegIndex: legIndex } : {}),
          type: leg.type,
          title: leg.title,
          weekNumber,
          plannedDistanceKm: leg.km,
          plannedPace: leg.pace,
          completed: false,
        };
        workoutIds.push(id);
      });
    }

    weeks.push({
      weekNumber,
      startDate: toISO(monday),
      endDate: toISO(addDays(monday, 6)),
      phase: phaseFor(i, spec.weeks),
      workoutIds,
    });
  }

  return {
    id: spec.id,
    version: PLAN_VERSION,
    createdAt: new Date(firstMonday).toISOString(),
    isExample: true,
    name: spec.name,
    raceName: spec.raceName,
    raceDistanceKm: spec.raceDistanceKm,
    raceDate: toISO(addDays(firstMonday, 7 * (spec.weeks - 1) + 6)),
    startDate: toISO(firstMonday),
    goalPace: spec.goalPace,
    goalLabel: spec.goalLabel,
    ...(spec.sport ? { sport: spec.sport } : {}),
    ...(spec.raceType ? { raceType: spec.raceType } : {}),
    ...(spec.legs ? { legs: spec.legs } : {}),
    ...(spec.loopKm ? { loopKm: spec.loopKm } : {}),
    ...(spec.targetYards ? { targetYards: spec.targetYards } : {}),
    weeks,
    workouts,
    offDays: [],
    trainingPrefs: spec.trainingPrefs,
  };
}

/**
 * Fill in what the athlete actually did, for sessions already in the past. A
 * demo with an empty history has no stats, no charts and nothing to show.
 */
function logIfPast(w: Workout, todayIso: string): Workout {
  if (w.date >= todayIso) return w;

  const r = jitter(w.id);
  // ±4% on distance, and a pace between 6 s/km quicker and 10 s/km slower —
  // roughly what a real block looks like once weather and legs are involved.
  const actualDistanceKm = round1(w.plannedDistanceKm * (0.96 + r * 0.08));
  const plannedSec = paceToSeconds(w.plannedPace) ?? 300;
  const actualSec = Math.round(plannedSec - 6 + r * 16);

  return {
    ...w,
    completed: true,
    actualDistanceKm,
    actualPace: secondsToPace(actualSec),
    durationMin: Math.round((actualDistanceKm * actualSec) / 60),
  };
}
