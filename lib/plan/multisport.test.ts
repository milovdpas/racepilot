import { describe, expect, it } from "vitest";
import { isRaceComplete, raceWorkout } from "@/lib/plan/context";
import {
  MULTISPORT_PRESETS,
  matchingPresetKey,
  multisportDistanceKm,
  presetByKey,
  raceLegWorkouts,
  totalTransitionMin,
} from "@/lib/plan/multisport";
import { makeWorkout } from "@/lib/test/factories";
import type { TrainingPlan } from "@/lib/types";

const RACE_DATE = "2026-09-20";

/** An Olympic triathlon whose legs are completed as given. */
const triPlan = (done: boolean[], extra: Record<string, unknown> = {}) =>
  ({
    raceType: "multisport",
    raceDate: RACE_DATE,
    legs: presetByKey("olympic")!.legs,
    workouts: {
      swim: makeWorkout({
        id: "swim",
        date: RACE_DATE,
        sport: "swim",
        raceLegIndex: 0,
        plannedDistanceKm: 1.5,
        completed: done[0],
      }),
      bike: makeWorkout({
        id: "bike",
        date: RACE_DATE,
        sport: "bike",
        raceLegIndex: 1,
        plannedDistanceKm: 40,
        completed: done[1],
      }),
      run: makeWorkout({
        id: "run",
        date: RACE_DATE,
        sport: "run",
        raceLegIndex: 2,
        plannedDistanceKm: 10,
        completed: done[2],
      }),
      ...extra,
    },
  }) as unknown as TrainingPlan;

describe("isRaceComplete", () => {
  it("is false when only the bike leg is done", () => {
    // The reported bug: raceWorkout() returned the LONGEST workout on race day,
    // which for a triathlon is the 40 km bike. Logging it told the athlete the
    // race was finished while the run was still ahead of them.
    expect(isRaceComplete(triPlan([false, true, false]))).toBe(false);
  });

  it("is false while any single leg is outstanding", () => {
    expect(isRaceComplete(triPlan([true, true, false]))).toBe(false);
    expect(isRaceComplete(triPlan([true, false, true]))).toBe(false);
    expect(isRaceComplete(triPlan([false, true, true]))).toBe(false);
  });

  it("is true only once every leg is done", () => {
    expect(isRaceComplete(triPlan([true, true, true]))).toBe(true);
  });

  it("ignores a shakeout that happens to share race day", () => {
    // Not a leg, so it must not keep the race open forever.
    const plan = triPlan([true, true, true], {
      shakeout: makeWorkout({
        id: "shakeout",
        date: RACE_DATE,
        plannedDistanceKm: 3,
        completed: false,
      }),
    });
    expect(isRaceComplete(plan)).toBe(true);
  });

  it("still works for a single-sport race", () => {
    const plan = {
      raceDate: RACE_DATE,
      workouts: {
        m: makeWorkout({
          id: "m",
          date: RACE_DATE,
          plannedDistanceKm: 42.2,
          completed: true,
        }),
      },
    } as unknown as TrainingPlan;
    expect(isRaceComplete(plan)).toBe(true);
  });
});

describe("raceWorkout", () => {
  it("returns the first leg of a multi-sport race, not the longest", () => {
    expect(raceWorkout(triPlan([false, false, false]))?.id).toBe("swim");
  });

  it("returns the longest on race day for a single-sport race", () => {
    const plan = {
      raceDate: RACE_DATE,
      workouts: {
        short: makeWorkout({ id: "short", date: RACE_DATE, plannedDistanceKm: 3 }),
        race: makeWorkout({ id: "race", date: RACE_DATE, plannedDistanceKm: 42.2 }),
      },
    } as unknown as TrainingPlan;
    expect(raceWorkout(plan)?.id).toBe("race");
  });
});

describe("raceLegWorkouts", () => {
  it("returns the legs in race order, whatever the record order", () => {
    expect(raceLegWorkouts(triPlan([false, false, false])).map((w) => w.id)).toEqual([
      "swim",
      "bike",
      "run",
    ]);
  });
});

describe("presets", () => {
  it("knows the standard distances", () => {
    expect(presetByKey("olympic")!.legs.map((l) => l.distanceKm)).toEqual([
      1.5, 40, 10,
    ]);
    // 70.3 and 140.6 are the miles the branding is named for; the legs are
    // metric, which is how they are actually measured.
    expect(multisportDistanceKm(presetByKey("half")!.legs)).toBe(113);
    expect(multisportDistanceKm(presetByKey("full")!.legs)).toBe(226);
  });

  it("derives the total distance from the legs", () => {
    expect(multisportDistanceKm(presetByKey("olympic")!.legs)).toBe(51.5);
  });

  it("sums transitions, and the last leg has none", () => {
    const legs = presetByKey("olympic")!.legs;
    expect(legs.at(-1)!.transitionMin).toBeUndefined();
    expect(totalTransitionMin(legs)).toBe(5);
  });

  it("recognises a preset it produced, so the picker shows a selection", () => {
    for (const p of MULTISPORT_PRESETS) {
      expect(matchingPresetKey(p.legs)).toBe(p.key);
    }
  });

  it("recognises nothing for custom distances", () => {
    expect(matchingPresetKey([{ sport: "run", distanceKm: 7 }])).toBeUndefined();
  });

  it("offers a duathlon, which runs twice and never swims", () => {
    const legs = presetByKey("duathlon")!.legs;
    expect(legs.map((l) => l.sport)).toEqual(["run", "bike", "run"]);
  });
});
