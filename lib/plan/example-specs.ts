// Specs for the generated demo plans. Loaded lazily by `examples.ts` — only a
// user who actually opens one of these ever downloads the builder.

import { BACKYARD_LOOP_KM, backyardDistanceKm } from "@/lib/plan/backyard";
import {
  multisportDistanceKm,
  presetByKey,
} from "@/lib/plan/multisport";
import { buildExamplePlan, type ExampleSpec } from "@/lib/plan/example-builder";
import type { TrainingPlan } from "@/lib/types";

const BACKYARD_YARDS = 20;

/** The demo races an Olympic-distance triathlon: 1.5 / 40 / 10 km. */
const OLYMPIC_LEGS = presetByKey("olympic")!.legs;

const TRAIL: ExampleSpec = {
  id: "example-trail",
  name: "Trail 50K — example",
  raceName: "Trail 50K",
  raceDistanceKm: 50,
  goalPace: "6:30",
  goalLabel: "Sub-5:30",
  weeks: 12,
  pastWeeks: 5,
  raceSessions: [{ type: "long", title: "Trail 50K", km: 50, pace: "6:30" }],
  sessions: [
    { day: 1, type: "easy", title: "Easy trails", km: 8, pace: "5:40" },
    { day: 3, type: "tempo", title: "Tempo on rolling terrain", km: 10, pace: "4:55" },
    { day: 5, type: "easy", title: "Hill repeats", km: 12, pace: "6:00" },
    { day: 6, type: "long", title: "Long trail run", km: 22, pace: "6:10" },
  ],
  trainingPrefs: {
    daysPerWeek: 4,
    flexibleDays: false,
    trainingDays: [false, true, false, true, false, true, true],
    planningMode: "exact",
    targetDistanceKm: 55,
  },
};

const ULTRA: ExampleSpec = {
  id: "example-ultra",
  name: "100 km ultra — example",
  raceName: "100 km ultra",
  raceDistanceKm: 100,
  goalPace: "6:45",
  goalLabel: "Sub-12:00",
  weeks: 16,
  pastWeeks: 6,
  raceSessions: [{ type: "long", title: "100 km ultra", km: 100, pace: "6:45" }],
  sessions: [
    { day: 0, type: "recovery", title: "Recovery jog", km: 6, pace: "6:10" },
    { day: 2, type: "interval", title: "5×1 km at threshold", km: 10, pace: "4:45" },
    { day: 3, type: "easy", title: "Easy run", km: 10, pace: "5:35" },
    // Back-to-back long days are the point of ultra training: the Sunday run
    // starts on Saturday's legs.
    { day: 5, type: "long", title: "Long run (day 1)", km: 20, pace: "5:55" },
    { day: 6, type: "long", title: "Long run (day 2)", km: 26, pace: "6:05" },
  ],
  trainingPrefs: {
    daysPerWeek: 5,
    flexibleDays: false,
    trainingDays: [true, false, true, true, false, true, true],
    planningMode: "exact",
    targetDistanceKm: 90,
  },
};

const BACKYARD: ExampleSpec = {
  id: "example-backyard",
  name: "Backyard ultra — example",
  raceName: "Backyard ultra",
  raceDistanceKm: backyardDistanceKm(BACKYARD_LOOP_KM, BACKYARD_YARDS),
  goalPace: "7:00",
  goalLabel: `${BACKYARD_YARDS} yards`,
  raceType: "backyard",
  loopKm: BACKYARD_LOOP_KM,
  targetYards: BACKYARD_YARDS,
  weeks: 14,
  pastWeeks: 5,
  raceSessions: [
    {
      type: "long",
      title: `Backyard ultra — ${BACKYARD_YARDS} yards`,
      km: backyardDistanceKm(BACKYARD_LOOP_KM, BACKYARD_YARDS),
      pace: "7:00",
    },
  ],
  sessions: [
    { day: 1, type: "easy", title: "Easy run", km: 8, pace: "5:50" },
    { day: 3, type: "tempo", title: "Tempo run", km: 10, pace: "5:05" },
    // Practising the actual format: the same loop, on the hour, over and over.
    { day: 5, type: "long", title: "Loop practice (3 yards)", km: 20, pace: "6:00" },
    { day: 6, type: "easy", title: "Easy run on tired legs", km: 12, pace: "6:10" },
  ],
  trainingPrefs: {
    daysPerWeek: 4,
    flexibleDays: false,
    trainingDays: [false, true, false, true, false, true, true],
    planningMode: "exact",
    targetDistanceKm: 60,
  },
};


const CYCLING: ExampleSpec = {
  id: "example-cycling",
  name: "Gran fondo 120 km — example",
  sport: "bike",
  raceName: "Gran fondo 120 km",
  raceDistanceKm: 120,
  // Stored as seconds per km like every sport, so 2:00 is 30 km/h. The UI
  // shows it as km/h, because nobody says "my bike pace was 2:00/km".
  goalPace: "2:00",
  goalLabel: "Sub-4:30",
  weeks: 12,
  pastWeeks: 4,
  raceSessions: [{
    type: "long",
    title: "Gran fondo 120 km",
    km: 120,
    pace: "2:00",
  }],
  sessions: [
    { day: 1, type: "recovery", title: "Recovery spin", km: 25, pace: "2:24" },
    { day: 2, type: "interval", title: "4×8 min at threshold", km: 40, pace: "1:55" },
    { day: 4, type: "tempo", title: "Sweet-spot tempo", km: 45, pace: "1:52" },
    { day: 6, type: "long", title: "Long endurance ride", km: 80, pace: "2:10" },
  ],
  trainingPrefs: {
    daysPerWeek: 4,
    flexibleDays: false,
    trainingDays: [false, true, true, false, true, false, true],
    planningMode: "exact",
    targetDistanceKm: 190,
  },
};

const SWIMMING: ExampleSpec = {
  id: "example-swimming",
  name: "5 km open water — example",
  sport: "swim",
  raceName: "5 km open water",
  raceDistanceKm: 5,
  // 17:30 per km = 1:45 per 100 m, which is how the app displays it.
  goalPace: "17:30",
  goalLabel: "Sub-1:30",
  weeks: 10,
  pastWeeks: 3,
  raceSessions: [{
    type: "long",
    title: "5 km open water",
    km: 5,
    pace: "17:30",
  }],
  sessions: [
    { day: 1, type: "easy", title: "Technique and drills", km: 2, pace: "20:00" },
    { day: 3, type: "interval", title: "10×100 m at race pace", km: 2.5, pace: "16:40" },
    { day: 5, type: "tempo", title: "Threshold set", km: 3, pace: "17:30" },
    { day: 6, type: "long", title: "Continuous swim", km: 4, pace: "18:20" },
  ],
  trainingPrefs: {
    daysPerWeek: 4,
    flexibleDays: false,
    trainingDays: [false, true, false, true, false, true, true],
    planningMode: "exact",
    targetDistanceKm: 11,
  },
};

/**
 * Olympic-distance triathlon: 1.5 km swim, 40 km bike, 10 km run.
 *
 * Every session names its own sport, so this is the one demo where the plan has
 * no default at all. Paces are stored per km like everywhere else — 1:52 is
 * 32 km/h on the bike, 18:20 is 1:50/100m in the pool — and the UI converts.
 *
 * Race day is three workouts on one date rather than one workout with legs:
 * every consumer in the app already understands a workout, and none of them
 * would know how to sum legs. Formally linking them (and the transitions
 * between) is slice 4.
 */
const TRIATHLON: ExampleSpec = {
  id: "example-triathlon",
  name: "Olympic triathlon — example",
  raceName: "Olympic triathlon",
  raceType: "multisport",
  legs: OLYMPIC_LEGS,
  raceDistanceKm: multisportDistanceKm(OLYMPIC_LEGS),
  // The average over all 51.5 km. A triathlon has no single goal pace, so the
  // dashboard shows the label instead — this is only here because PlanMeta
  // requires it, and a composite is at least not an impossible run pace.
  goalPace: "2:55",
  goalLabel: "Sub-2:30",
  weeks: 12,
  pastWeeks: 5,
  raceSessions: [
    { sport: "swim", type: "long", title: "Swim leg — 1.5 km", km: 1.5, pace: "17:30" },
    { sport: "bike", type: "long", title: "Bike leg — 40 km", km: 40, pace: "1:44" },
    { sport: "run", type: "long", title: "Run leg — 10 km", km: 10, pace: "4:40" },
  ],
  sessions: [
    { day: 0, sport: "swim", type: "easy", title: "Technique and drills", km: 2, pace: "20:00" },
    { day: 1, sport: "bike", type: "interval", title: "5×5 min at threshold", km: 35, pace: "1:52" },
    { day: 2, sport: "run", type: "tempo", title: "Tempo run", km: 8, pace: "4:30" },
    { day: 3, sport: "swim", type: "long", title: "Endurance swim", km: 3, pace: "18:20" },
    { day: 5, sport: "bike", type: "long", title: "Long ride", km: 70, pace: "2:00" },
    // A brick: off the bike and straight into the run, same day, in order.
    { day: 6, sport: "bike", type: "tempo", title: "Brick — bike", km: 40, pace: "1:50" },
    { day: 6, sport: "run", type: "easy", title: "Brick — run off the bike", km: 5, pace: "4:50" },
  ],
  trainingPrefs: {
    daysPerWeek: 6,
    flexibleDays: false,
    trainingDays: [true, true, true, true, false, true, true],
    planningMode: "exact",
    targetDistanceKm: 160,
  },
};

const SPECS = {
  trail: TRAIL,
  ultra: ULTRA,
  backyard: BACKYARD,
  cycling: CYCLING,
  swimming: SWIMMING,
  triathlon: TRIATHLON,
};

export type GeneratedExampleKey = keyof typeof SPECS;

export function buildGeneratedExample(
  key: GeneratedExampleKey,
  now?: Date,
): TrainingPlan {
  return buildExamplePlan(SPECS[key], now);
}
