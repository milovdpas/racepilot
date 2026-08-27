import { describe, expect, it } from "vitest";
import {
  buildFitMessages,
  clampBytes,
  encodeFit,
  speedFromPace,
} from "@/lib/export/fit";
import type { TrainingPlan, Workout, WorkoutBlock } from "@/lib/types";

const NOW = new Date("2026-08-09T12:00:00Z");

const workout = (o: Partial<Workout> = {}): Workout =>
  ({
    id: "w1",
    date: "2026-08-12",
    type: "interval",
    title: "6x800m",
    weekNumber: 1,
    plannedDistanceKm: 10,
    plannedPace: "5:00",
    completed: false,
    ...o,
  }) as Workout;

const plan = (o: Partial<TrainingPlan> = {}) =>
  ({ id: "p", sport: "run", ...o }) as TrainingPlan;

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
  { kind: "step", role: "cooldown", distanceKm: 2 },
];

const steps = (msgs: ReturnType<typeof buildFitMessages>) =>
  msgs.filter((m) => m.mesgNum === 27).map((m) => m.fields);
const header = (msgs: ReturnType<typeof buildFitMessages>, num: number) =>
  msgs.find((m) => m.mesgNum === num)?.fields ?? {};

/**
 * Encode and decode with the SDK's own decoder.
 *
 * This is the test that matters: it is the only way to know the scales are
 * right, because the raw values we write are meaningless without the profile
 * that interprets them. A file that decodes to 8 metres instead of 800 looks
 * perfectly fine as a number in an assertion.
 */
async function roundTrip(w: Workout, p: TrainingPlan | null = plan()) {
  const bytes = await encodeFit(buildFitMessages(w, p, NOW));
  const { Decoder, Stream } = await import("@garmin/fitsdk");
  const decoder = new Decoder(Stream.fromByteArray(bytes));
  expect(decoder.isFIT()).toBe(true);
  expect(decoder.checkIntegrity()).toBe(true);
  const { messages, errors } = decoder.read();
  expect(errors).toHaveLength(0);
  // Narrowed here rather than at every call site: a decoded workout file
  // without steps is a failure of this helper's premise, not of a test.
  const workoutStepMesgs = messages.workoutStepMesgs;
  expect(workoutStepMesgs).toBeDefined();
  return { ...messages, workoutStepMesgs: workoutStepMesgs ?? [] };
}

describe("speedFromPace", () => {
  it("converts seconds per km to metres per second", () => {
    expect(speedFromPace(250)).toBe(4); // 4:10/km
    expect(speedFromPace(300)).toBeCloseTo(3.333, 3); // 5:00/km
  });
});

describe("buildFitMessages", () => {
  it("emits a file id, a workout and its steps, in that order", () => {
    const msgs = buildFitMessages(workout({ steps: INTERVALS }), plan(), NOW);
    expect(msgs[0].mesgNum).toBe(0);
    expect(msgs[1].mesgNum).toBe(26);
    expect(msgs.slice(2).every((m) => m.mesgNum === 27)).toBe(true);
    expect(header(msgs, 0).type).toBe("workout");
    expect(header(msgs, 26).sport).toBe("running");
  });

  it("puts the repeat AFTER the steps it repeats, pointing back at them", () => {
    // warmup(0) work(1) recovery(2) repeat(3 -> 1, x6) cooldown(4)
    const s = steps(buildFitMessages(workout({ steps: INTERVALS }), plan(), NOW));
    expect(s).toHaveLength(5);
    expect(s.map((f) => f.messageIndex)).toEqual([0, 1, 2, 3, 4]);
    expect(s[3].durationType).toBe("repeatUntilStepsCmplt");
    expect(s[3].durationValue).toBe(1);
    expect(s[3].targetValue).toBe(6);
    expect(s[4].intensity).toBe("cooldown");
    expect(header(buildFitMessages(workout({ steps: INTERVALS }), plan(), NOW), 26).numValidSteps).toBe(5);
  });

  it("maps roles onto FIT intensities", () => {
    const s = steps(buildFitMessages(workout({ steps: INTERVALS }), plan(), NOW));
    expect(s[0].intensity).toBe("warmup");
    expect(s[1].intensity).toBe("active");
    expect(s[2].intensity).toBe("rest");
  });

  it("exports a flat workout as one step, so easy runs still work", () => {
    const s = steps(buildFitMessages(workout({ steps: undefined }), plan(), NOW));
    expect(s).toHaveLength(1);
    expect(s[0].durationType).toBe("distance");
    expect(s[0].durationValue).toBe(10 * 100_000);
  });

  it("leaves a step with no pace open rather than inventing a target", () => {
    const s = steps(buildFitMessages(workout({ steps: INTERVALS }), plan(), NOW));
    expect(s[4].targetType).toBe("open");
    expect(s[4].customTargetValueLow).toBeUndefined();
  });

  it("builds a band around a target, low = the slower end", () => {
    // 4:10/km is 250 s/km; +/-2% is 245..255 s/km, i.e. 3.92..4.08 m/s.
    // Inverted: the SLOWER pace is the LOWER speed. Getting this backwards
    // produces a band the watch silently ignores.
    const s = steps(buildFitMessages(workout({ steps: INTERVALS }), plan(), NOW));
    expect(s[1].targetType).toBe("speed");
    expect(s[1].targetValue).toBe(0);
    expect(s[1].customTargetValueLow).toBe(Math.round((1000 / 255) * 1000));
    expect(s[1].customTargetValueHigh).toBe(Math.round((1000 / 245) * 1000));
    expect(Number(s[1].customTargetValueLow)).toBeLessThan(
      Number(s[1].customTargetValueHigh),
    );
  });

  it("honours an explicit range instead of the default band", () => {
    const s = steps(
      buildFitMessages(
        workout({
          steps: [
            { kind: "step", role: "work", distanceKm: 5, pace: "4:00", paceRangeSec: 10 },
          ],
        }),
        plan(),
        NOW,
      ),
    );
    expect(s[0].customTargetValueLow).toBe(Math.round((1000 / 250) * 1000));
    expect(s[0].customTargetValueHigh).toBe(Math.round((1000 / 230) * 1000));
  });

  it("uses the workout's own sport", () => {
    const msgs = buildFitMessages(workout({ sport: "bike" }), plan(), NOW);
    expect(header(msgs, 26).sport).toBe("cycling");
    expect(header(buildFitMessages(workout({ sport: "swim" }), plan(), NOW), 26).sport).toBe("swimming");
  });

  it("inherits the plan's sport when the workout does not say", () => {
    const msgs = buildFitMessages(workout(), plan({ sport: "bike" }), NOW);
    expect(header(msgs, 26).sport).toBe("cycling");
  });

  it("trims a name too long to read on a wrist", () => {
    const msgs = buildFitMessages(workout({ title: "x".repeat(60) }), plan(), NOW);
    expect(String(header(msgs, 26).wktName)).toHaveLength(40);
  });

  it("falls back to a name rather than emitting an empty one", () => {
    expect(header(buildFitMessages(workout({ title: "  " }), plan(), NOW), 26).wktName).toBe("Workout");
  });
});

describe("encodeFit: the file a watch actually reads", () => {
  it("produces a valid FIT file that decodes without errors", async () => {
    const messages = await roundTrip(workout({ steps: INTERVALS }));
    expect(messages.fileIdMesgs?.[0]?.type).toBe("workout");
    expect(messages.workoutMesgs?.[0]?.wktName).toBe("6x800m");
    expect(messages.workoutMesgs?.[0]?.sport).toBe("running");
    expect(messages.workoutStepMesgs).toHaveLength(5);
  });

  it("round-trips distances as real metres", async () => {
    // The assertion that would catch a 100x error: durationDistance is the
    // decoder's scaled view of the raw centimetres we wrote.
    const m = await roundTrip(workout({ steps: INTERVALS }));
    expect(m.workoutStepMesgs[0].durationDistance).toBe(2000);
    expect(m.workoutStepMesgs[1].durationDistance).toBe(800);
    expect(m.workoutStepMesgs[2].durationDistance).toBe(400);
  });

  it("round-trips a time step as real seconds", async () => {
    const m = await roundTrip(
      workout({ steps: [{ kind: "step", role: "warmup", durationSec: 600 }] }),
    );
    expect(m.workoutStepMesgs[0].durationTime).toBe(600);
  });

  it("round-trips the speed band as metres per second", async () => {
    const m = await roundTrip(workout({ steps: INTERVALS }));
    const work = m.workoutStepMesgs[1];
    // 800m at 4:10/km, +/-2%: about 3.92 to 4.08 m/s.
    expect(work.customTargetSpeedLow).toBeCloseTo(3.92, 2);
    expect(work.customTargetSpeedHigh).toBeCloseTo(4.08, 2);
  });

  it("round-trips the repeat as a jump target and a count", async () => {
    const m = await roundTrip(workout({ steps: INTERVALS }));
    const repeat = m.workoutStepMesgs[3];
    expect(repeat.durationStep).toBe(1);
    expect(repeat.repeatSteps).toBe(6);
  });

  it("encodes a flat workout too", async () => {
    const m = await roundTrip(workout({ steps: undefined }));
    expect(m.workoutStepMesgs).toHaveLength(1);
    expect(m.workoutStepMesgs[0].durationDistance).toBe(10_000);
  });
});

describe("clampBytes", () => {
  const size = (s: string) => new TextEncoder().encode(s).length;

  it("leaves anything that already fits alone", () => {
    expect(clampBytes("Keep it easy on the hills")).toBe(
      "Keep it easy on the hills",
    );
    // Exactly at the limit is still a fit, not a trim.
    expect(clampBytes("a".repeat(254))).toHaveLength(254);
  });

  it("counts bytes and not characters", () => {
    // 64 emoji is 128 characters and 256 bytes. A character-based cap would
    // wave this through and the encoder would then reject the whole file.
    const notes = "🏃".repeat(64);
    expect(notes.length).toBeLessThan(254);
    expect(size(clampBytes(notes))).toBeLessThanOrEqual(254);
  });

  it("never cuts a character in half", () => {
    // The trim lands mid-emoji unless the continuation bytes are walked back.
    const trimmed = clampBytes("🏃".repeat(100));
    expect(trimmed).not.toContain("�");
    expect(trimmed.endsWith("…")).toBe(true);
  });
});

describe("step notes at the encoder's limit", () => {
  it("encodes a note far longer than a FIT string can hold", async () => {
    // The bug this pins: an uncapped note threw inside the SDK, which failed
    // the *entire* export with a generic message. One long note must not cost
    // the athlete their workout file.
    const m = await roundTrip(
      workout({
        steps: [
          {
            kind: "step",
            role: "work",
            distanceKm: 10,
            note: "Hold the effort steady. ".repeat(40),
          },
        ],
      }),
    );
    expect(m.workoutStepMesgs).toHaveLength(1);
    const notes = m.workoutStepMesgs[0].notes as string;
    expect(notes).toMatch(/^Hold the effort steady\./);
    expect(notes.endsWith("…")).toBe(true);
  });

  it("encodes a multi-byte note over the limit", async () => {
    const m = await roundTrip(
      workout({
        steps: [
          { kind: "step", role: "work", distanceKm: 5, note: "🏃".repeat(80) },
        ],
      }),
    );
    expect(m.workoutStepMesgs[0].notes).not.toContain("�");
  });
});
