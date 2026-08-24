// Domain models for the RacePilot training tracker.
// Everything is persisted in localStorage via the Zustand store.

import type { Sport } from "@/lib/sport";
import type { UnitSystem } from "@/lib/units";

export type WorkoutType = "easy" | "tempo" | "interval" | "long" | "recovery";

/** A weather observation captured for a workout (from OpenWeatherMap One Call 4.0). */
export interface WeatherSnapshot {
  tempC: number | null; // °C, 1 decimal (null if the source omitted it)
  conditionId: number; // OWM weather[0].id (0 if unknown)
  condition: string; // OWM weather[0].main, e.g. "Rain"
  icon: string; // OWM weather[0].icon, e.g. "10d" ("" if unknown)
  source: "forecast" | "historical"; // which timeline it came from
  observedAt: string; // ISO UTC of the observation
  /** Where it was observed. Absent on the bundled example plan, whose
   *  snapshots are scrubbed of coordinates before being committed. */
  lat?: number;
  lon?: number;
}

/** One kilometer split, typically scanned from a Strava screenshot. */
export interface WorkoutSplit {
  km: number; // 1, 2, 3 … or a fraction (0.4) for the final partial km
  pace: string; // "mm:ss" per km — same format as plannedPace/actualPace
  elevM?: number; // elevation delta in meters (may be negative)
}

export type WeekPhase =
  | "base"
  | "build"
  | "peak"
  | "taper"
  | "race"
  | "reduced";

/**
 * What a step is *for*. Separate from `WorkoutType`, which describes the
 * session as a whole: a single interval session contains warmup, work and
 * recovery steps, and each needs its own intensity on the watch.
 */
export type StepRole = "warmup" | "work" | "recovery" | "cooldown";

/**
 * One step of a structured workout.
 *
 * A step ends on **either** a distance or a time, never both — that is how
 * every watch models it, and allowing both would leave "which one wins?"
 * undefined. `isValidSteps()` in `lib/plan/workout-steps.ts` enforces it.
 */
export interface WorkoutStep {
  role: StepRole;
  /** Ends after this distance. Mutually exclusive with `durationSec`. */
  distanceKm?: number;
  /** Ends after this long. Mutually exclusive with `distanceKm`. */
  durationSec?: number;
  /**
   * Target pace, "mm:ss" per km — the same canonical unit as `plannedPace`
   * and every other pace in the app, for every sport. Absent means "no target",
   * which is a real answer for a warmup.
   */
  pace?: string;
  /**
   * Half-width of the target band, in seconds per km. Absent means a single
   * target rather than a zero-width range: a watch given `low === high` alerts
   * constantly, so the two cases must stay distinguishable.
   */
  paceRangeSec?: number;
  note?: string;
}

/**
 * A structured workout, as a flat list with **one** level of nesting for
 * repeats: `6 × (800m hard + 400m jog)`.
 *
 * One level and no more, deliberately. It is exactly what FIT expresses with
 * `repeat_steps`, it covers every session a human actually writes down, and
 * deeper nesting would need an editor far beyond what the gain justifies.
 */
export type WorkoutBlock =
  | ({ kind: "step" } & WorkoutStep)
  | { kind: "repeat"; times: number; steps: WorkoutStep[] };

export interface Workout {
  id: string;
  date: string; // ISO yyyy-mm-dd — anchors the calendar + week grouping
  /**
   * Which sport this session is. **Orthogonal to `type`**, which is intensity:
   * a tempo effort is a tempo effort on a bike too.
   *
   * Absent means the plan's sport, and a plan with no sport means running —
   * so every workout written before multi-sport keeps its meaning with no
   * backfill. Resolve it with `workoutSport(workout, plan)`.
   */
  sport?: Sport;
  type: WorkoutType;
  title: string; // e.g. "6×800m @ 4:10" or "Long run"
  weekNumber: number;
  plannedDistanceKm: number;
  plannedPace?: string; // "mm:ss" per km
  /**
   * The session broken into steps, for watches and for anyone who wants to
   * read the structure rather than decode `title`.
   *
   * Absent means a flat workout, which is every plan authored before this and
   * most easy runs after it. **`plannedDistanceKm` stays the authoritative
   * total** even when steps are present: every consumer in the app already
   * reads it, and a time-based step has no distance to derive from. Steps are
   * additive detail, never a second source of truth — see `stepsDistanceKm()`.
   */
  steps?: WorkoutBlock[];
  actualDistanceKm?: number;
  actualPace?: string; // entered, or derived from distance + duration
  durationMin?: number;
  notes?: string;
  /** Local time of day the run was started, "HH:mm" (optional). */
  startTime?: string;
  /** Weather captured for this workout (when the weather feature is on). */
  weather?: WeatherSnapshot;
  /** Per-kilometer splits (from the screenshot scanner). Running only. */
  splits?: WorkoutSplit[];
  /**
   * Which leg of the race this is, 0-based, for a multi-sport race day.
   *
   * Race day is three workouts rather than one workout carrying legs: every
   * consumer in the app already understands a workout, and none of them would
   * know how to sum legs. This index is what orders them and marks them as part
   * of the race — the plan has a single `raceDate`, so no separate group id is
   * needed to say which race they belong to.
   */
  raceLegIndex?: number;
  completed: boolean;
  isCustom?: boolean;
  /** When true, the workout may be done any day within [windowStart, windowEnd]. */
  flexible?: boolean;
  windowStart?: string; // ISO yyyy-mm-dd
  windowEnd?: string; // ISO yyyy-mm-dd
}

export interface TrainingWeek {
  weekNumber: number;
  startDate: string; // Monday ISO
  endDate: string; // Sunday ISO
  phase: WeekPhase;
  label?: string; // "Surf trip — recovery", "Taper", "Race week", ...
  workoutIds: string[];
}

/**
 * What the athlete does. A multi-select: plenty of people run trails *and*
 * race triathlon. Drives which features the app offers — see `lib/athlete.ts`,
 * which turns this into capabilities so the UI never branches on the raw list.
 */
export type AthleteType =
  | "runner"
  | "trail"
  | "ultra"
  | "triathlete"
  | "cyclist"
  | "swimmer";

export const ATHLETE_TYPES: AthleteType[] = [
  "runner",
  "trail",
  "ultra",
  "triathlete",
  "cyclist",
  "swimmer",
];

/**
 * Which watch the athlete owns. Drives the *instructions* an export shows, and
 * which targets are offered — never the file itself, which is the same bytes
 * for every brand that can read it.
 *
 * "other" is a watch we have no instructions for; "none" is asked and declined.
 */
export type WatchBrand =
  | "garmin"
  | "coros"
  | "wahoo"
  | "apple"
  | "polar"
  | "suunto"
  | "other"
  | "none";

export const WATCH_BRANDS: WatchBrand[] = [
  "garmin",
  "coros",
  "wahoo",
  "apple",
  "polar",
  "suunto",
  "other",
  "none",
];

export interface Preferences {
  theme: "light" | "dark" | "system";
  locale?: "en" | "nl";
  /** Whether the first-run onboarding has been shown. */
  onboardingSeen?: boolean;
  /**
   * Which sports the user trains for. Deliberately tri-state:
   *   `undefined` — never asked, so existing users still get the prompt;
   *   `[]`        — asked and declined, never ask again.
   * A boolean companion flag can't express that, which is why there isn't one.
   * Absent or empty means "show everything" (see `capabilitiesFor`).
   */
  athleteTypes?: AthleteType[];
  /**
   * ISO 3166-1 alpha-2, detected from the browser locale on first run and
   * editable in Settings. Used to pick a default unit system and passed to the
   * AI as context, since a coach writing a plan should know where you are.
   * Never derived from your IP or from the weather feature's location.
   */
  country?: string;
  /**
   * Which units to *display*. Absent means "follow the country".
   *
   * This never affects what is stored: distances stay in km, elevation in
   * metres, temperature in °C and pace in seconds per km, whatever this says.
   * See `lib/units.ts`.
   */
  units?: UnitSystem;
  /** Whether the one-time "add to home screen" prompt has been shown. */
  installPromptSeen?: boolean;
  /**
   * The athlete's watch, so export instructions match their device.
   *
   * Tri-state, the same mechanism `athleteTypes` uses and for the same reason:
   * `undefined` means never asked, so existing users still get the one-time
   * prompt, and `"none"` means asked and declined, so they are never asked
   * again. A companion "seen" boolean cannot express that difference.
   */
  watch?: WatchBrand;
  /**
   * Whether the one-time "your plan has sessions with no steps" prompt has run.
   *
   * A plain boolean, unlike `watch`: there is no "declined" worth
   * distinguishing here, because the same offer stays permanently available in
   * the watch settings card. This flag only stops the *popup* returning on
   * every load.
   */
  stepsUpgradePromptSeen?: boolean;
  /** Weather feature opted in (needs geolocation + a configured server key). */
  weatherEnabled?: boolean;
  /** Show per-day weather in the calendar. */
  weatherCalendar?: boolean;
  /** Scan a Strava screenshot for per-km splits when logging a run. */
  splitScannerEnabled?: boolean;
  /** Whether the one-time split-scanner prompt has been shown. */
  splitScannerOnboardingSeen?: boolean;
  /** Plan ids whose "race done, plan your next race?" prompt has been shown. */
  nextPlanPromptSeen?: string[];
  /**
   * Last calendar view the user picked. Absent means they haven't chosen yet,
   * which falls back to a per-device default (agenda on mobile, month on
   * desktop) rather than a fixed one.
   */
  calendarView?: CalendarViewMode;
}

/** The calendar's display modes. Persisted, so keep the strings stable. */
export type CalendarViewMode = "month" | "week" | "day" | "agenda";

/**
 * A backyard ultra repeats a fixed loop every hour, on the hour, until one
 * runner is left. There is no finish time and no fixed distance: the goal is a
 * number of "yards" (loops, one per hour).
 */
export type RaceType = "standard" | "backyard" | "multisport";

/**
 * One leg of a multi-sport race, in the order it is raced.
 *
 * `transitionMin` is the time spent AFTER this leg (T1 after the swim, T2 after
 * the bike), so the last leg leaves it unset. Transitions are part of the clock
 * in a triathlon and racers plan for them, but they are not a workout: nothing
 * is trained, and counting them as one would corrupt every distance total.
 */
export interface RaceLeg {
  sport: Sport;
  distanceKm: number;
  transitionMin?: number;
}

/** Editable per-plan metadata (race + goal), independent of the schedule. */
export interface PlanMeta {
  name: string; // "Milo's Marathon"
  /**
   * The sport the race itself is. Also the default for workouts that don't
   * name one, so a cycling plan doesn't have to stamp every session. Absent
   * means running.
   */
  sport?: Sport;
  raceName: string; // "Marathon"
  raceDistanceKm: number; // 42.2 — for a backyard plan, targetYards × loopKm
  raceDate: string; // "2026-10-11"
  startDate?: string; // "2026-06-22" — when the plan begins
  goalPace: string; // "4:58"
  goalLabel: string; // "Sub-3:30"
  /** Absent means a standard road race. */
  raceType?: RaceType;
  /** Backyard only: loop length, usually BACKYARD_LOOP_KM (see lib/backyard.ts). */
  loopKm?: number;
  /** Backyard only: the goal, in yards (= loops = hours). */
  targetYards?: number;
  /**
   * Multisport only: the legs, in race order. `raceDistanceKm` is their sum,
   * kept in step by `multisportDistanceKm` so everything that only understands
   * "race distance" still works.
   */
  legs?: RaceLeg[];
}

/** How the user wants to train — collected in the wizard, editable in settings. */
export interface TrainingPrefs {
  daysPerWeek: number;
  flexibleDays: boolean;
  trainingDays: boolean[]; // length 7, Monday→Sunday
  planningMode: "exact" | "flexible";
  targetDistanceKm: number | null; // null = let the AI decide
}

/** A period that may hinder training (vacation, trip, etc.) — context only. */
export interface OffDay {
  id: string;
  start: string; // ISO yyyy-mm-dd
  end: string; // ISO yyyy-mm-dd (inclusive)
  title: string; // "Vacation to Ghent"
  note?: string; // "Likely no training"
}

export interface TrainingPlan extends PlanMeta {
  id: string;
  version: number; // schema version, for export / migration
  createdAt: string;
  /**
   * The bundled demo plan seeded on first run. It's someone else's training,
   * so it must never be offered as context for a user's own next plan.
   */
  isExample?: boolean;
  weeks: TrainingWeek[];
  workouts: Record<string, Workout>; // keyed by id
  offDays: OffDay[];
  trainingPrefs?: TrainingPrefs;
}

export const WORKOUT_TYPES: WorkoutType[] = [
  "easy",
  "tempo",
  "interval",
  "long",
  "recovery",
];
