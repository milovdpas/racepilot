import { describe, expect, it } from "vitest";
import { shapedSteps } from "@/lib/plan/example-steps";
import {
  flattenSteps,
  isValidSteps,
  needsSteps,
  stepsDistanceKm,
} from "@/lib/plan/workout-steps";
import { loadExamplePlan } from "@/lib/plan/example-plan";
import { buildGeneratedExample } from "@/lib/plan/example-specs";
import type { TrainingPlan, WorkoutBlock } from "@/lib/types";

/** The repeat block, which is where every interesting case lives. */
const repeatOf = (blocks: WorkoutBlock[]) =>
  blocks.find((b) => b.kind === "repeat");

describe("shapedSteps", () => {
  it("wraps a single block in a warmup and a cooldown", () => {
    const steps = shapedSteps(9, "4:30", { reps: 1, repKm: 6 });
    expect(steps).toBeDefined();
    expect(steps!.map((b) => (b.kind === "step" ? b.role : "repeat"))).toEqual([
      "warmup",
      "work",
      "cooldown",
    ]);
    // 6 km of work, 1.5 km either side: the whole planned distance, used.
    expect(stepsDistanceKm(steps!)).toBeCloseTo(9, 5);
  });

  it("leaves the reps alone and gives the remainder to the ease", () => {
    // "6×800m" on a 9 km session: the reps must survive at 800 m exactly,
    // because the title on screen says 800 and a watch beeping at 700 is wrong.
    const steps = shapedSteps(9, "4:10", { reps: 6, repKm: 0.8, recoveryKm: 0.4 })!;
    const rep = repeatOf(steps)!;
    expect(rep.kind === "repeat" && rep.times).toBe(6);
    expect(rep.kind === "repeat" && rep.steps[0].distanceKm).toBe(0.8);
    expect(rep.kind === "repeat" && rep.steps[1].distanceKm).toBe(0.4);
    expect(stepsDistanceKm(steps)).toBeCloseTo(9, 5);
  });

  it("shrinks everything by one factor when the reps overflow the total", () => {
    // The failure this guards: a 5 km session titled "6×800m" is 4.8 km of reps
    // plus 2 km of jog, which is 6.8 km of work in a 5 km workout.
    const steps = shapedSteps(5, "4:10", { reps: 6, repKm: 0.8, recoveryKm: 0.4 })!;
    const rep = repeatOf(steps)!;
    expect(rep.kind === "repeat" && rep.steps[0].distanceKm!).toBeLessThan(0.8);
    // Still six reps: the shape is the intent, only the size gives.
    expect(rep.kind === "repeat" && rep.times).toBe(6);
    expect(stepsDistanceKm(steps)).toBeLessThanOrEqual(5.01);
  });

  it("keeps time-based reps in time", () => {
    // A cyclist's "4×8 min" must reach the watch as eight minutes, not as the
    // distance eight minutes covers at today's target pace.
    const steps = shapedSteps(40, "1:55", {
      reps: 4,
      repSec: 480,
      recoverySec: 240,
    })!;
    const rep = repeatOf(steps)!;
    expect(rep.kind === "repeat" && rep.steps[0].durationSec).toBe(480);
    expect(rep.kind === "repeat" && rep.steps[0].distanceKm).toBeUndefined();
    expect(rep.kind === "repeat" && rep.steps[1].durationSec).toBe(240);
  });

  it("omits the recovery step when the shape asks for none", () => {
    const steps = shapedSteps(10, "4:00", { reps: 4, repKm: 1 })!;
    const rep = repeatOf(steps)!;
    expect(rep.kind === "repeat" && rep.steps).toHaveLength(1);
  });

  it("targets the work faster than the ease around it", () => {
    const steps = shapedSteps(9, "4:10", { reps: 6, repKm: 0.8, recoveryKm: 0.4 })!;
    const flat = flattenSteps(steps);
    expect(flat[0].pace).toBe("5:40"); // warmup, +90s
    expect(flat[1].pace).toBe("4:10"); // work, on target
    expect(flat[2].pace).toBe("6:40"); // jog, +150s
  });

  it("declines rather than inventing something absurd", () => {
    // 6×800m in a 200 m session: scaled to fit, a rep would be 30 m.
    expect(shapedSteps(0.2, "4:00", { reps: 6, repKm: 0.8 })).toBeUndefined();
    expect(shapedSteps(10, "4:00", { reps: 4 })).toBeUndefined();
    expect(shapedSteps(10, "nonsense", { reps: 1, repKm: 5 })).toBeUndefined();
  });

  it("always produces steps a watch can encode", () => {
    // Every shape the specs use, across the volume range the builder scales
    // through. `isValidSteps` is the same gate the FIT encoder relies on.
    const shapes = [
      { reps: 1, repKm: 6 },
      { reps: 5, repKm: 1, recoveryKm: 0.4 },
      { reps: 10, repKm: 0.1, recoverySec: 20 },
      { reps: 4, repSec: 480, recoverySec: 240 },
    ];
    for (const shape of shapes) {
      for (const km of [2.5, 5, 9, 12, 40, 60]) {
        const steps = shapedSteps(km, "4:30", shape);
        if (steps) expect(isValidSteps(steps), `${km} km`).toBe(true);
      }
    }
  });
});

describe("the demo plans", () => {
  // A new athlete picks a watch during onboarding and immediately meets "your
  // watch can do more with this plan". That prompt is advice for someone's own
  // plan written before `steps` existed; pointed at the example we ship
  // ourselves it is a chore handed over on the first screen.
  //
  // These also backstop `scripts/scrub-example-plan.mjs`: regenerate the
  // marathon demo from a fresh export whose intervals have no steps and this
  // fails here, rather than in front of an athlete.
  const stepless = (plan: TrainingPlan) =>
    Object.values(plan.workouts).filter(needsSteps).map((w) => w.title);

  it("ship structure in the bundled marathon block", async () => {
    expect(stepless(await loadExamplePlan(new Date("2026-08-24")))).toEqual([]);
  });

  it.each(["trail", "ultra", "backyard", "cycling", "swimming", "triathlon"] as const)(
    "ship structure in the generated %s block",
    (key) => {
      expect(stepless(buildGeneratedExample(key, new Date("2026-08-24")))).toEqual([]);
    },
  );

  it("keep every generated session inside its own planned distance", () => {
    // The builder scales each session by a weekly volume factor, so a shape
    // that fits in week 1 has to keep fitting in a cutback week and a taper.
    for (const key of ["ultra", "cycling", "swimming", "triathlon"] as const) {
      for (const w of Object.values(
        buildGeneratedExample(key, new Date("2026-08-24")).workouts,
      )) {
        if (!w.steps) continue;
        expect(isValidSteps(w.steps), `${key}: ${w.title}`).toBe(true);
        // Time-based steps contribute no distance, so this is a ceiling check
        // rather than an equality one.
        expect(
          stepsDistanceKm(w.steps),
          `${key}: ${w.title} (${w.plannedDistanceKm} km)`,
        ).toBeLessThanOrEqual(w.plannedDistanceKm + 0.01);
      }
    }
  });
});
