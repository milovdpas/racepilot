// Reading a structured workout: totals, expansion, and the human summary.
//
// Pure and DOM-free. Every exporter and every piece of UI that wants to know
// what a structured session actually contains comes through here, so the
// arithmetic exists once rather than once per consumer.
//
// Paces are "mm:ss" per km for every sport, as everywhere else in the app
// (see lib/sport.ts). Nothing in this file converts units; that happens at the
// display edge, or in the encoder that needs m/s.

import { paceToSeconds } from "@/lib/pace";
import type { StepRole, WorkoutBlock, WorkoutStep } from "@/lib/types";

/** Every step in order, with repeats written out. What encoders want. */
export function flattenSteps(blocks: readonly WorkoutBlock[]): WorkoutStep[] {
  const out: WorkoutStep[] = [];
  for (const block of blocks) {
    if (block.kind === "step") {
      const { kind, ...step } = block;
      out.push(step);
      continue;
    }
    // A repeat of zero or one is a legitimate thing to have half-typed in the
    // editor; it just contributes that many passes.
    for (let i = 0; i < Math.max(0, Math.floor(block.times)); i++) {
      out.push(...block.steps);
    }
  }
  return out;
}

/**
 * Total distance of the distance-based steps, in km.
 *
 * Time-based steps are skipped rather than estimated. This is used to *offer*
 * a total, and a guess dressed up as a measurement is worse than an obvious
 * omission — the caller can see the two numbers disagree and decide.
 */
export function stepsDistanceKm(blocks: readonly WorkoutBlock[]): number {
  return flattenSteps(blocks).reduce((km, s) => km + (s.distanceKm ?? 0), 0);
}

/**
 * Rough total duration in seconds, for sizing a calendar event.
 *
 * A distance step is only as long as the pace it is run at, so steps without a
 * target fall back to `fallbackPace` and, failing that, contribute nothing.
 * Explicitly an estimate: nothing is stored from it.
 */
export function stepsDurationSec(
  blocks: readonly WorkoutBlock[],
  fallbackPace?: string,
): number {
  const fallback = paceToSeconds(fallbackPace);
  return flattenSteps(blocks).reduce((sec, s) => {
    if (s.durationSec != null) return sec + s.durationSec;
    if (s.distanceKm == null) return sec;
    const perKm = paceToSeconds(s.pace) ?? fallback;
    return perKm == null ? sec : sec + perKm * s.distanceKm;
  }, 0);
}

/** Exactly one of distance/duration per step, and repeats that repeat. */
export function isValidSteps(blocks: readonly WorkoutBlock[]): boolean {
  const stepOk = (s: WorkoutStep) =>
    (s.distanceKm != null) !== (s.durationSec != null) &&
    (s.distanceKm == null || s.distanceKm > 0) &&
    (s.durationSec == null || s.durationSec > 0);

  return blocks.every((block) =>
    block.kind === "step"
      ? stepOk(block)
      : block.times >= 1 && block.steps.length > 0 && block.steps.every(stepOk),
  );
}

/** How the app writes a single step: "800 m @ 4:10", "10 min easy". */
function describeStep(step: WorkoutStep, fmt: StepFormat): string {
  const amount =
    step.distanceKm != null
      ? fmt.distance(step.distanceKm)
      : fmt.duration(step.durationSec ?? 0);
  return step.pace ? `${amount} @ ${fmt.pace(step.pace)}` : amount;
}

/**
 * What a structured session says in one line:
 * "2 km warmup · 6 × (800 m @ 4:10 + 400 m jog) · 2 km cooldown".
 *
 * Takes its formatters rather than importing `useFormat`, because this runs in
 * the ICS encoder as well as in React and must not depend on either.
 */
export interface StepFormat {
  /** km -> "800 m" / "2 km", in the reader's units. */
  distance: (km: number) => string;
  /** seconds -> "10 min". */
  duration: (sec: number) => string;
  /** stored "mm:ss" per km -> however this sport and unit system says it. */
  pace: (pace: string) => string;
  /** A role, translated. */
  role: (role: WorkoutStep["role"]) => string;
}

export function describeSteps(
  blocks: readonly WorkoutBlock[],
  fmt: StepFormat,
): string {
  return blocks
    .map((block) => {
      if (block.kind === "step") {
        const { kind, ...step } = block;
        const body = describeStep(step, fmt);
        // "work" is the default and adds nothing; the others are worth saying.
        return step.role === "work" ? body : `${body} ${fmt.role(step.role)}`;
      }
      const inner = block.steps.map((s) => describeStep(s, fmt)).join(" + ");
      // No parentheses around a single step: "6 × 800 m" reads better than
      // "6 × (800 m)", and the ambiguity parentheses solve cannot arise.
      return block.steps.length === 1
        ? `${block.times} × ${inner}`
        : `${block.times} × (${inner})`;
    })
    .join(" · ");
}

// --- the import boundary ---------------------------------------------------

const ROLES: StepRole[] = ["warmup", "work", "recovery", "cooldown"];

/** A finite, strictly positive number, or undefined. Rejects "5", NaN and 0. */
function positive(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;
}

function normalizeStep(raw: unknown): WorkoutStep | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const step: WorkoutStep = {
    role: ROLES.includes(r.role as StepRole) ? (r.role as StepRole) : "work",
    ...(positive(r.distanceKm) != null ? { distanceKm: positive(r.distanceKm) } : {}),
    ...(positive(r.durationSec) != null ? { durationSec: positive(r.durationSec) } : {}),
    ...(typeof r.pace === "string" && r.pace.trim() ? { pace: r.pace.trim() } : {}),
    ...(positive(r.paceRangeSec) != null
      ? { paceRangeSec: positive(r.paceRangeSec) }
      : {}),
    ...(typeof r.note === "string" && r.note.trim() ? { note: r.note.trim() } : {}),
  };
  // A step that ends on both, or on neither, is not a step. Dropping it beats
  // importing something no watch and no reader can make sense of.
  return (step.distanceKm != null) !== (step.durationSec != null) ? step : null;
}

/**
 * Coerce whatever an import or an AI response called "steps" into blocks we
 * can trust, dropping anything that survives as nonsense.
 *
 * Returns `undefined` rather than `[]` when nothing is usable, because absent
 * is what a flat workout looks like everywhere else in the model — an empty
 * array would be a second way to say the same thing.
 */
export function normalizeSteps(raw: unknown): WorkoutBlock[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  const blocks: WorkoutBlock[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;

    if (e.kind === "repeat") {
      const times = positive(e.times);
      const steps = Array.isArray(e.steps)
        ? e.steps.map(normalizeStep).filter((s): s is WorkoutStep => s !== null)
        : [];
      if (times != null && times >= 1 && steps.length > 0) {
        blocks.push({ kind: "repeat", times: Math.floor(times), steps });
      }
      continue;
    }

    // Anything not explicitly a repeat is treated as a step, so an AI that
    // omits `kind` still produces something usable.
    const step = normalizeStep(entry);
    if (step) blocks.push({ kind: "step", ...step });
  }

  return blocks.length > 0 ? blocks : undefined;
}
