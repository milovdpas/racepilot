import { describe, expect, it } from "vitest";
import {
  describeSteps,
  flattenSteps,
  isValidSteps,
  normalizeSteps,
  type StepFormat,
  stepsDistanceKm,
  stepsDurationSec,
} from "@/lib/plan/workout-steps";
import type { WorkoutBlock } from "@/lib/types";

const step = (o: Partial<WorkoutBlock & { kind: "step" }> = {}): WorkoutBlock =>
  ({ kind: "step", role: "work", distanceKm: 1, ...o }) as WorkoutBlock;

/** 2 km warmup · 6 × (800 m @ 4:10 + 400 m jog) · 2 km cooldown. */
const INTERVALS: WorkoutBlock[] = [
  { kind: "step", role: "warmup", distanceKm: 2, pace: "6:00" },
  {
    kind: "repeat",
    times: 6,
    steps: [
      { role: "work", distanceKm: 0.8, pace: "4:10" },
      { role: "recovery", distanceKm: 0.4, pace: "7:00" },
    ],
  },
  { kind: "step", role: "cooldown", distanceKm: 2, pace: "6:00" },
];

/** Formatters that are easy to read in a failing assertion. */
const FMT: StepFormat = {
  distance: (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km} km`),
  duration: (sec) => `${Math.round(sec / 60)} min`,
  pace: (p) => `${p}/km`,
  role: (r) => r,
};

describe("flattenSteps", () => {
  it("writes repeats out in order", () => {
    const flat = flattenSteps(INTERVALS);
    expect(flat).toHaveLength(2 + 6 * 2);
    expect(flat[0].role).toBe("warmup");
    expect(flat[1].distanceKm).toBe(0.8);
    expect(flat[2].distanceKm).toBe(0.4);
    expect(flat.at(-1)?.role).toBe("cooldown");
  });

  it("drops the discriminant, so a step is just a step", () => {
    expect(flattenSteps([step({ distanceKm: 5 })])[0]).toEqual({
      role: "work",
      distanceKm: 5,
    });
  });

  it("survives a half-typed repeat", () => {
    // The editor can hold `times: 0` between keystrokes; that is not a crash.
    expect(flattenSteps([{ kind: "repeat", times: 0, steps: [] }])).toEqual([]);
  });
});

describe("stepsDistanceKm", () => {
  it("sums through repeats", () => {
    // 2 + 6 × (0.8 + 0.4) + 2 = 11.2
    expect(stepsDistanceKm(INTERVALS)).toBeCloseTo(11.2, 5);
  });

  it("skips time-based steps rather than estimating them", () => {
    // A guess dressed up as a measurement is worse than an obvious omission:
    // the caller can see 5 !== the workout's total and decide for themselves.
    const mixed: WorkoutBlock[] = [
      { kind: "step", role: "warmup", durationSec: 600 },
      { kind: "step", role: "work", distanceKm: 5 },
    ];
    expect(stepsDistanceKm(mixed)).toBe(5);
  });

  it("is zero for no steps", () => {
    expect(stepsDistanceKm([])).toBe(0);
  });
});

describe("stepsDurationSec", () => {
  it("adds time steps and paced distance steps together", () => {
    // 600s + 5 km at 5:00/km
    const mixed: WorkoutBlock[] = [
      { kind: "step", role: "warmup", durationSec: 600 },
      { kind: "step", role: "work", distanceKm: 5, pace: "5:00" },
    ];
    expect(stepsDurationSec(mixed)).toBe(600 + 5 * 300);
  });

  it("falls back to the workout's pace for a step with no target", () => {
    const blocks: WorkoutBlock[] = [{ kind: "step", role: "work", distanceKm: 4 }];
    expect(stepsDurationSec(blocks, "5:30")).toBe(4 * 330);
  });

  it("contributes nothing when there is no pace to work from", () => {
    // Rather than inventing one. The caller gets a short event, not a wrong one.
    expect(stepsDurationSec([step({ distanceKm: 10 })])).toBe(0);
  });

  it("estimates the interval session", () => {
    // 2×360 + 6×(0.8×250 + 0.4×420) + 2×360 = 720 + 2208 + 720
    expect(stepsDurationSec(INTERVALS)).toBeCloseTo(3648, 5);
  });
});

describe("isValidSteps", () => {
  it("accepts a well-formed session", () => {
    expect(isValidSteps(INTERVALS)).toBe(true);
  });

  it("rejects a step that is both distance and time", () => {
    expect(isValidSteps([step({ distanceKm: 1, durationSec: 60 })])).toBe(false);
  });

  it("rejects a step that is neither", () => {
    expect(
      isValidSteps([{ kind: "step", role: "work" } as WorkoutBlock]),
    ).toBe(false);
  });

  it("rejects zero and negative amounts", () => {
    expect(isValidSteps([step({ distanceKm: 0 })])).toBe(false);
    expect(isValidSteps([step({ distanceKm: undefined, durationSec: -5 })])).toBe(
      false,
    );
  });

  it("rejects an empty or non-repeating repeat", () => {
    expect(isValidSteps([{ kind: "repeat", times: 3, steps: [] }])).toBe(false);
    expect(
      isValidSteps([
        { kind: "repeat", times: 0, steps: [{ role: "work", distanceKm: 1 }] },
      ]),
    ).toBe(false);
  });

  it("accepts no steps at all, which is what a flat workout has", () => {
    expect(isValidSteps([])).toBe(true);
  });
});

describe("describeSteps", () => {
  it("writes the session as one line", () => {
    expect(describeSteps(INTERVALS, FMT)).toBe(
      "2 km @ 6:00/km warmup · 6 × (800 m @ 4:10/km + 400 m @ 7:00/km) · 2 km @ 6:00/km cooldown",
    );
  });

  it("leaves the role off work steps, which are the default", () => {
    expect(describeSteps([step({ distanceKm: 5, pace: "5:00" })], FMT)).toBe(
      "5 km @ 5:00/km",
    );
  });

  it("drops the parentheses when a repeat has a single step", () => {
    const blocks: WorkoutBlock[] = [
      { kind: "repeat", times: 4, steps: [{ role: "work", distanceKm: 1, pace: "4:00" }] },
    ];
    expect(describeSteps(blocks, FMT)).toBe("4 × 1 km @ 4:00/km");
  });

  it("omits the target for a step that has none", () => {
    expect(describeSteps([step({ distanceKm: 3, role: "warmup" })], FMT)).toBe(
      "3 km warmup",
    );
  });

  it("describes a time-based step", () => {
    expect(
      describeSteps(
        [{ kind: "step", role: "work", durationSec: 1200, pace: "4:30" }],
        FMT,
      ),
    ).toBe("20 min @ 4:30/km");
  });
});

describe("normalizeSteps", () => {
  it("keeps a well-formed session", () => {
    expect(normalizeSteps(INTERVALS)).toEqual(INTERVALS);
  });

  it("returns undefined for anything that is not a list", () => {
    // Absent is what a flat workout looks like everywhere else in the model.
    for (const junk of [undefined, null, "steps", 5, {}]) {
      expect(normalizeSteps(junk)).toBeUndefined();
    }
  });

  it("returns undefined rather than an empty array when nothing survives", () => {
    expect(normalizeSteps([{ role: "work" }, null, "nope"])).toBeUndefined();
  });

  it("treats a step with no kind as a step, so a sloppy AI still works", () => {
    expect(normalizeSteps([{ role: "work", distanceKm: 5, pace: "4:30" }])).toEqual([
      { kind: "step", role: "work", distanceKm: 5, pace: "4:30" },
    ]);
  });

  it("falls back to the work role for an unknown one", () => {
    expect(normalizeSteps([{ role: "sprint", distanceKm: 1 }])).toEqual([
      { kind: "step", role: "work", distanceKm: 1 },
    ]);
  });

  it("drops a step that ends on both a distance and a time", () => {
    // The exact thing a model invents, and the exact thing no encoder can use.
    expect(normalizeSteps([{ distanceKm: 1, durationSec: 300 }])).toBeUndefined();
  });

  it("rejects numbers that arrived as strings", () => {
    expect(normalizeSteps([{ distanceKm: "5" }])).toBeUndefined();
  });

  it("rejects zero, negative and non-finite amounts", () => {
    expect(normalizeSteps([{ distanceKm: 0 }])).toBeUndefined();
    expect(normalizeSteps([{ durationSec: -60 }])).toBeUndefined();
    expect(normalizeSteps([{ distanceKm: Number.NaN }])).toBeUndefined();
  });

  it("drops empty strings but keeps real text", () => {
    expect(normalizeSteps([{ distanceKm: 1, pace: "  ", note: " hard " }])).toEqual([
      { kind: "step", role: "work", distanceKm: 1, note: "hard" },
    ]);
  });

  it("keeps a repeat only when it repeats something", () => {
    expect(normalizeSteps([{ kind: "repeat", times: 3, steps: [] }])).toBeUndefined();
    expect(normalizeSteps([{ kind: "repeat", times: 0, steps: [{ distanceKm: 1 }] }]))
      .toBeUndefined();
    expect(normalizeSteps([{ kind: "repeat", times: 2.7, steps: [{ distanceKm: 1 }] }]))
      .toEqual([
        { kind: "repeat", times: 2, steps: [{ role: "work", distanceKm: 1 }] },
      ]);
  });

  it("drops the bad steps inside an otherwise good repeat", () => {
    expect(
      normalizeSteps([
        {
          kind: "repeat",
          times: 4,
          steps: [{ distanceKm: 0.8 }, { distanceKm: 1, durationSec: 60 }],
        },
      ]),
    ).toEqual([
      { kind: "repeat", times: 4, steps: [{ role: "work", distanceKm: 0.8 }] },
    ]);
  });

  it("produces something isValidSteps accepts, whatever it was given", () => {
    const junk = [
      { role: "warmup", distanceKm: 2 },
      { kind: "repeat", times: 3, steps: [{ distanceKm: 1 }, { bogus: true }] },
      { distanceKm: 1, durationSec: 1 },
      "garbage",
    ];
    const out = normalizeSteps(junk);
    expect(out).toBeDefined();
    expect(isValidSteps(out ?? [])).toBe(true);
  });
});
