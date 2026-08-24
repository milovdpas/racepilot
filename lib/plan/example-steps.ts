// Structure for the demo plans.
//
// Why this exists at all: a demo plan with no `steps` walks a new athlete
// straight into the "your watch can do more with this plan" prompt the moment
// onboarding finishes. That prompt is advice for someone with a *real* plan
// written before structure existed; aimed at the example we ship ourselves it
// is just a chore we handed them on their first screen.
//
// Why it is generated rather than written out: `buildExamplePlan` scales every
// session by a weekly volume factor, so the same template session is 10 km in
// week 1 and 6.5 km in a cutback week. Steps written into the spec would be
// right once and wrong fifteen times.
//
// Pure: no React, no DOM, no dates.

import { paceToSeconds, secondsToPace } from "@/lib/pace";
import type { WorkoutBlock, WorkoutStep } from "@/lib/types";

/**
 * The intent of a session, independent of how long it happens to be this week.
 *
 * A rep is measured by distance **or** time, matching how the session is
 * actually written down: runners say `6×800m`, cyclists say `4×8 min`. That is
 * the same either/or a `WorkoutStep` enforces, one level up.
 *
 * `reps: 1` is a tempo: one sustained block with nothing to recover between.
 */
export interface StepShape {
  /** How many work reps. 1 is a single sustained block. */
  reps: number;
  /** Length of one rep. Exactly one of these two. */
  repKm?: number;
  repSec?: number;
  /** Jog between reps. Ignored when `reps` is 1: there is nothing between. */
  recoveryKm?: number;
  recoverySec?: number;
}

/** Least warmup, and least cooldown, worth calling one. */
const MIN_EASE_KM = 0.6;
/**
 * ...but never more than this share of the session, because the builder scales
 * a template right down in a taper week. A 2.5 km swim set becomes 0.9 km in
 * race week, and a flat 600 m floor at each end leaves nothing for the reps -
 * so the session would come back structureless and land the athlete right back
 * in the "your watch can do more with this plan" prompt.
 */
const MAX_EASE_SHARE = 0.12;
/** How much slower per km an easy stretch and a recovery jog run. */
const EASY_OFFSET_SEC = 90;
const RECOVERY_OFFSET_SEC = 150;

const round2 = (n: number) => Math.round(n * 100) / 100;

/** A pace slowed by `sec` per km. Takes seconds, since the caller has them. */
const slower = (secPerKm: number, sec: number) => secondsToPace(secPerKm + sec);

/**
 * A shape fitted to a total distance.
 *
 * The reps are the session and the ease around them is the padding, so the
 * remainder after the work becomes warmup and cooldown, split evenly. The reps
 * themselves are left alone unless they genuinely will not fit - which means
 * the plan's own numbers disagree with its title, the case that put a "6×800m"
 * label on a workout recorded as 5 km. Then everything shrinks by one factor,
 * because a session that overflows its own distance is worse than a short one.
 *
 * Returns `undefined` when the total cannot hold even a token version, so the
 * caller leaves the workout flat rather than shipping something absurd.
 */
export function shapedSteps(
  totalKm: number,
  pace: string,
  shape: StepShape,
): WorkoutBlock[] | undefined {
  // `paceToSeconds` returns null for anything it cannot read, which is the
  // whole reason a caller can hand this an imported plan's pace field.
  const secPerKm = paceToSeconds(pace);
  if (secPerKm === null || secPerKm <= 0 || totalKm <= 0) return undefined;

  const minEase = Math.min(MIN_EASE_KM, totalKm * MAX_EASE_SHARE);
  const reps = Math.max(1, Math.round(shape.reps));
  const repKm = shape.repKm ?? (shape.repSec ?? 0) / secPerKm;
  const jogKm =
    reps > 1 ? (shape.recoveryKm ?? (shape.recoverySec ?? 0) / secPerKm) : 0;
  if (repKm <= 0) return undefined;

  // Shrink only if the work plus a minimal warmup and cooldown overruns.
  const wanted = reps * (repKm + jogKm);
  const room = totalKm - 2 * minEase;
  if (room <= 0) return undefined;
  const scale = Math.min(1, room / wanted);
  // Below this a rep has stopped being a rep. Better to leave the session flat
  // than to put "6 × 30 m" on someone's watch.
  if (repKm * scale < 0.05) return undefined;

  const work = round2(reps * (repKm + jogKm) * scale);
  const ease = round2(Math.max(minEase, (totalKm - work) / 2));

  // Distance or time, whichever the shape was written in - so a bike session
  // written as "4×8 min" reaches the watch as eight minutes, not as the
  // distance eight minutes happens to cover at today's target pace.
  const measure = (
    km: number | undefined,
    sec: number | undefined,
  ): Pick<WorkoutStep, "distanceKm" | "durationSec"> =>
    km !== undefined
      ? { distanceKm: round2(km * scale) }
      : { durationSec: Math.round((sec ?? 0) * scale) };

  const easyPace = slower(secPerKm, EASY_OFFSET_SEC);

  return [
    { kind: "step", role: "warmup", distanceKm: ease, pace: easyPace },
    reps === 1
      ? { kind: "step", role: "work", ...measure(shape.repKm, shape.repSec), pace }
      : {
          kind: "repeat",
          times: reps,
          steps: [
            { role: "work", ...measure(shape.repKm, shape.repSec), pace },
            // Only when the shape asked for one. A repeat of back-to-back reps
            // is a legitimate session, and a zero-length recovery step is not a
            // shorter rest, it is a step no watch can end.
            ...(jogKm > 0
              ? [
                  {
                    role: "recovery" as const,
                    ...measure(shape.recoveryKm, shape.recoverySec),
                    pace: slower(secPerKm, RECOVERY_OFFSET_SEC),
                  },
                ]
              : []),
          ],
        },
    { kind: "step", role: "cooldown", distanceKm: ease, pace: easyPace },
  ];
}
