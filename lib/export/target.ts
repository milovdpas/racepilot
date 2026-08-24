// Where a planned workout goes, behind one interface.
//
// Delivery is the part of this feature that will change. Today a file is the
// only route to a Garmin, because Garmin Connect refuses workout uploads and
// the Training API is a partner programme we do not have access to. If that
// access arrives, or intervals.icu turns out to be the better bridge, the
// encoders and the whole UI should not notice.
//
// So each target owns **both** its format and its delivery. That avoids a
// format-times-transport matrix, and it means adding the Garmin target later is
// a new file plus one line in the factory.

import { downloadFile } from "@/lib/plan/storage";
import type { Preferences, TrainingPlan, WatchBrand, Workout } from "@/lib/types";

export type ExportTargetId = "fit-file" | "ics-file" | "intervals" | "garmin";

/** What the athlete still has to do by hand once we have handed off. */
export type FollowUp = "usb" | "app-import" | "calendar" | "none";

/**
 * What a target is *for*. These are genuinely different jobs, not one job with
 * a flag: a `.fit` is a single session you take out on a run, and a calendar is
 * the whole block laid out over months. Offering the calendar next to a single
 * workout invites the question "which one do I want?" when the answer for one
 * workout is always the file.
 */
export type ExportScope = "workout" | "plan";

export type TargetStatus =
  | { state: "ready" }
  | { state: "needs-setup"; reason: "no-api-key" | "not-connected" }
  | { state: "unavailable"; reason: "not-configured" | "no-access" };

export interface DeliveryResult {
  ok: boolean;
  /** A key for the message to show, or undefined on success. */
  error?: string;
}

/**
 * Human strings in the reader's own units, supplied by the caller.
 *
 * The targets take these rather than importing `useFormat`, because they run
 * outside React and must not depend on it. It also keeps "how a workout reads"
 * in one place instead of once per target.
 */
export interface ExportFormat {
  /** One line: "Long run 20 km". */
  summary: (workout: Workout) => string;
  /** The body: structure, targets, notes. */
  describe: (workout: Workout) => string;
  /** Estimated length, for sizing a calendar entry. */
  durationMin: (workout: Workout) => number | undefined;
}

export interface ExportRequest {
  plan: TrainingPlan;
  workouts: Workout[];
  format: ExportFormat;
  now: Date;
}

export interface ExportTarget {
  id: ExportTargetId;
  scope: ExportScope;
  followUp: FollowUp;
  status(prefs: Preferences): Promise<TargetStatus>;
  deliver(request: ExportRequest): Promise<DeliveryResult>;
}

/** A filename component with nothing in it that a filesystem dislikes. */
function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "workout"
  );
}

// --- the targets -----------------------------------------------------------

/**
 * A `.fit` workout file: the only format that produces a real, guided workout
 * on a watch, and the one Garmin, COROS, Wahoo and (via a helper app) Apple
 * Watch all read.
 *
 * `followUp: "usb"` is not a limitation of this app. Garmin Connect accepts
 * activities, not workouts, so a cable is genuinely the only way in.
 */
const fitFileTarget: ExportTarget = {
  id: "fit-file",
  scope: "workout",
  followUp: "usb",
  status: async () => ({ state: "ready" }),
  async deliver({ workouts, plan, now }) {
    // Imported here rather than at the top: this pulls the FIT SDK, and a page
    // that merely lists the available targets must not download 1.4 MB.
    const { buildFitMessages, encodeFit } = await import("@/lib/export/fit");
    try {
      for (const workout of workouts) {
        const bytes = await encodeFit(buildFitMessages(workout, plan, now));
        downloadFile(
          `${slug(workout.title)}-${workout.date}.fit`,
          bytes,
          "application/vnd.ant.fit",
        );
      }
      return { ok: true };
    } catch (e) {
      console.error("FIT export failed:", e);
      return { ok: false, error: "exportFailed" };
    }
  },
};

/**
 * The plan as a calendar file.
 *
 * Honest about what it is: a label with a date, not a workout the watch guides
 * you through. What it buys is that the label reaches the wrist with no cable
 * and no computer, and that it is the only route open to Polar and Suunto
 * owners, or to anyone whose only device is a phone.
 */
const icsFileTarget: ExportTarget = {
  id: "ics-file",
  scope: "plan",
  followUp: "calendar",
  status: async () => ({ state: "ready" }),
  async deliver({ workouts, plan, format, now }) {
    const { buildIcs } = await import("@/lib/export/ics");
    try {
      const ics = buildIcs(
        workouts.map((workout) => ({
          workout,
          summary: format.summary(workout),
          description: format.describe(workout),
          durationMin: format.durationMin(workout),
        })),
        plan,
        now,
      );
      downloadFile(`${slug(plan.name)}-${now.toISOString().slice(0, 10)}.ics`, ics, "text/calendar");
      return { ok: true };
    } catch (e) {
      console.error("Calendar export failed:", e);
      return { ok: false, error: "exportFailed" };
    }
  },
};

const TARGETS: Record<string, ExportTarget> = {
  "fit-file": fitFileTarget,
  "ics-file": icsFileTarget,
};

export function targetFor(id: ExportTargetId): ExportTarget | undefined {
  return TARGETS[id];
}

// --- what each watch can actually use --------------------------------------

/**
 * Watches that read a `.fit` workout file, directly or through a helper app.
 *
 * Polar and Suunto are absent because neither accepts a third-party workout
 * import at all: offering them a file would be offering them a dead end.
 */
const READS_FIT: readonly WatchBrand[] = [
  "garmin",
  "coros",
  "wahoo",
  "apple",
];

/**
 * The targets this athlete can actually use, in the order to offer them.
 *
 * **An unanswered profile gets everything.** `undefined` means never asked, and
 * hiding a feature from someone who has told us nothing about themselves is the
 * mistake `capabilitiesFor` already refuses to make. `"none"` and `"other"` are
 * different: those are answers, and the answer is that a file will not help.
 */
export async function availableTargets(
  prefs: Preferences,
  scope?: ExportScope,
): Promise<ExportTarget[]> {
  const watch = prefs.watch;
  const fitUsable = watch === undefined || READS_FIT.includes(watch);
  const ordered = [
    ...(fitUsable ? [fitFileTarget] : []),
    icsFileTarget,
  ].filter((target) => scope === undefined || target.scope === scope);

  const withStatus = await Promise.all(
    ordered.map(async (target) => ({
      target,
      status: await target.status(prefs),
    })),
  );
  return withStatus
    .filter(({ status }) => status.state !== "unavailable")
    .map(({ target }) => target);
}
