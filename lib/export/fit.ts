// A planned workout as a Garmin FIT workout file.
//
// Split the way lib/scanner/ is split: `buildFitMessages` is pure and holds all
// the logic, `encodeFit` is a thin wrapper that dynamically imports the SDK so
// its 1.4 MB never enters the main bundle (the same trick `lib/scanner/ocr.ts`
// uses for tesseract.js).
//
// The units below are not guesses. They were established by encoding probe
// files and decoding them back with the SDK's own Decoder, and fit.test.ts
// pins every one of them the same way — a wrong scale here would put a workout
// 100x too long on someone's watch, and nothing else would notice.

import { flattenSteps } from "@/lib/plan/workout-steps";
import { paceToSeconds } from "@/lib/pace";
import { workoutSport } from "@/lib/plan/workout";
import type { Sport } from "@/lib/sport";
import type {
  StepRole,
  TrainingPlan,
  Workout,
  WorkoutStep,
} from "@/lib/types";

/** FIT message numbers we emit. From `Profile.MesgNum`, inlined so the pure
 *  half of this module needs no import from the SDK. */
const MESG_FILE_ID = 0;
const MESG_WORKOUT = 26;
const MESG_WORKOUT_STEP = 27;

/** `duration_value` is centimetres when the step ends on a distance. */
const CM_PER_KM = 100_000;
/** ...and milliseconds when it ends on a time. */
const MS_PER_SEC = 1000;
/** `custom_target_value_*` is metres per second at scale 1000. */
const SPEED_SCALE = 1000;

/**
 * Half-width of the speed band when a step names a target but no range.
 *
 * A proportion rather than a fixed number of seconds, because the sports do not
 * share a scale: +/-5 s/km is a comfortable window on a run at 5:00/km and an
 * unusably tight one on a bike at 1:50/km. Two percent is roughly +/-6 s/km for
 * a runner, which is about as precisely as anyone holds a pace.
 *
 * A band rather than an exact target because a watch given low === high alerts
 * continuously, which is why `paceRangeSec` distinguishes "no range" from
 * "zero range" in the first place.
 */
const DEFAULT_BAND = 0.02;

const FIT_SPORT: Record<Sport, string> = {
  run: "running",
  bike: "cycling",
  swim: "swimming",
};

const FIT_INTENSITY: Record<StepRole, string> = {
  warmup: "warmup",
  work: "active",
  recovery: "rest",
  cooldown: "cooldown",
};

export interface FitMessage {
  mesgNum: number;
  fields: Record<string, unknown>;
}

/** Seconds per km -> metres per second. The one conversion a watch needs. */
export function speedFromPace(secPerKm: number): number {
  return 1000 / secPerKm;
}

/**
 * The speed band for a step, as the two raw values FIT wants.
 *
 * Note the inversion: a *slower* pace is a *lower* speed, so the slow end of
 * the pace band produces `low` and the fast end produces `high`. Getting this
 * backwards yields a band a watch silently ignores.
 */
function speedBand(
  secPerKm: number,
  rangeSec?: number,
): { low: number; high: number } {
  const band = rangeSec ?? secPerKm * DEFAULT_BAND;
  const slow = secPerKm + band;
  const fast = Math.max(1, secPerKm - band);
  return {
    low: Math.round(speedFromPace(slow) * SPEED_SCALE),
    high: Math.round(speedFromPace(fast) * SPEED_SCALE),
  };
}

function stepMessage(step: WorkoutStep, messageIndex: number): FitMessage {
  const fields: Record<string, unknown> = {
    messageIndex,
    intensity: FIT_INTENSITY[step.role],
  };

  if (step.durationSec != null) {
    fields.durationType = "time";
    fields.durationValue = Math.round(step.durationSec * MS_PER_SEC);
  } else if (step.distanceKm != null) {
    fields.durationType = "distance";
    fields.durationValue = Math.round(step.distanceKm * CM_PER_KM);
  } else {
    // Neither, which `isValidSteps` rejects but an encoder should survive:
    // "open" means the athlete presses lap when they are done.
    fields.durationType = "open";
  }

  const secPerKm = paceToSeconds(step.pace);
  if (secPerKm != null && secPerKm > 0) {
    const { low, high } = speedBand(secPerKm, step.paceRangeSec);
    fields.targetType = "speed";
    // Zero means "not a preset zone, use the custom range below".
    fields.targetValue = 0;
    fields.customTargetValueLow = low;
    fields.customTargetValueHigh = high;
  } else {
    fields.targetType = "open";
  }

  if (step.note) fields.notes = step.note;
  return { mesgNum: MESG_WORKOUT_STEP, fields };
}

/**
 * Turn a workout into the FIT messages that describe it.
 *
 * A workout with no `steps` still exports: it becomes a single step carrying
 * the planned distance and pace, which is exactly what an easy run is. That is
 * the difference between this feature working for four of the five workout
 * types on day one and working for none of them.
 */
export function buildFitMessages(
  workout: Workout,
  plan: TrainingPlan | null,
  now: Date,
): FitMessage[] {
  const sport = workoutSport(workout, plan);
  const steps: FitMessage[] = [];
  let index = 0;

  const blocks = workout.steps ?? [];
  if (blocks.length === 0) {
    steps.push(
      stepMessage(
        {
          role: "work",
          ...(workout.plannedDistanceKm > 0
            ? { distanceKm: workout.plannedDistanceKm }
            : {}),
          ...(workout.plannedPace ? { pace: workout.plannedPace } : {}),
        },
        index++,
      ),
    );
  }

  for (const block of blocks) {
    if (block.kind === "step") {
      const { kind, ...step } = block;
      steps.push(stepMessage(step, index++));
      continue;
    }
    // The steps first, then a repeat step pointing back at the first of them.
    // FIT puts the repeat *after* the block it repeats, which is why the index
    // has to be captured before the inner steps are emitted.
    const firstIndex = index;
    for (const inner of block.steps) steps.push(stepMessage(inner, index++));
    steps.push({
      mesgNum: MESG_WORKOUT_STEP,
      fields: {
        messageIndex: index++,
        durationType: "repeatUntilStepsCmplt",
        // The index to jump back to, not a duration.
        durationValue: firstIndex,
        targetType: "open",
        // ...and the number of times to do so.
        targetValue: block.times,
      },
    });
  }

  return [
    {
      mesgNum: MESG_FILE_ID,
      fields: {
        type: "workout",
        // "development" is the manufacturer id reserved for exactly this: a
        // file produced by something that is not a Garmin product.
        manufacturer: "development",
        product: 0,
        serialNumber: 0,
        timeCreated: now,
      },
    },
    {
      mesgNum: MESG_WORKOUT,
      fields: {
        wktName: workoutName(workout),
        sport: FIT_SPORT[sport],
        numValidSteps: steps.length,
        capabilities: 32,
      },
    },
    ...steps,
  ];
}

/**
 * The name the watch shows. Trimmed to 40 characters: devices vary in how much
 * they display, and a name long enough to be truncated on the wrist is worse
 * than one written to fit.
 */
function workoutName(workout: Workout): string {
  const name = workout.title.trim() || "Workout";
  return name.length <= 40 ? name : `${name.slice(0, 39)}…`;
}

/** How many kilometres of steps a flattened workout covers. For the UI. */
export function fitStepCount(workout: Workout): number {
  return workout.steps?.length ? flattenSteps(workout.steps).length : 1;
}

/**
 * Encode messages into FIT bytes.
 *
 * The SDK is imported dynamically and only here, so nothing that merely wants
 * to *describe* an export pulls 1.4 MB of profile tables into the bundle.
 */
export async function encodeFit(
  messages: FitMessage[],
): Promise<Uint8Array<ArrayBuffer>> {
  const { Encoder } = await import("@garmin/fitsdk");
  const encoder = new Encoder();
  for (const { mesgNum, fields } of messages) {
    encoder.onMesg(mesgNum, fields);
  }
  // Copied into a view over a plain ArrayBuffer. The SDK returns
  // `Uint8Array<ArrayBufferLike>`, which `Blob` will not accept because it
  // might be backed by a SharedArrayBuffer. A workout file is a couple of
  // kilobytes, so the copy costs nothing worth measuring.
  return new Uint8Array(encoder.close());
}
