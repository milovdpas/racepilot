import type { AthleteType } from "@/lib/types";

/** The sports a workout can belong to. Orthogonal to `WorkoutType`, which is
 *  an intensity axis — see docs/racepilot.md. */
export type Sport = "run" | "bike" | "swim";

/**
 * What the app should offer this athlete.
 *
 * UI branches on these, never on the raw `AthleteType[]`: a capability keeps
 * working when an eighth athlete type is added, whereas
 * `types.includes("ultra")` scattered across a dozen components does not.
 */
export interface AthleteCapabilities {
  sports: ReadonlySet<Sport>;
  /** Backyard ultras and other very-long-format races. */
  ultraFormats: boolean;
  /** Trail-specific concerns (elevation-first framing). */
  trail: boolean;
  /** Races combining more than one sport. */
  multiSport: boolean;
  /** The type the app's mark is drawn from — the first one selected. */
  primary?: AthleteType;
}

const SPORTS_BY_TYPE: Record<AthleteType, Sport[]> = {
  runner: ["run"],
  trail: ["run"],
  ultra: ["run"],
  triathlete: ["swim", "bike", "run"],
  cyclist: ["bike"],
  swimmer: ["swim"],
};

const ALL: AthleteCapabilities = {
  sports: new Set<Sport>(["run", "bike", "swim"]),
  ultraFormats: true,
  trail: true,
  multiSport: true,
};

// Capabilities are read during render by many components, so the same input
// must yield the same object — a fresh one each call would re-render all of
// them on every parent update.
//
// The key preserves order and does NOT sort. Order is meaningful: the first
// type picked becomes `primary`, so ["cyclist","runner"] and
// ["runner","cyclist"] are genuinely different inputs and must not collide.
const cache = new Map<string, AthleteCapabilities>();

/**
 * Absent or empty means "show everything": never hide a feature from someone
 * who hasn't told us anything about themselves. `undefined` (never asked) and
 * `[]` (asked and declined) differ only to the prompt that asks — see
 * `Preferences.athleteTypes`.
 */
export function capabilitiesFor(
  types?: readonly AthleteType[],
): AthleteCapabilities {
  if (!types?.length) return ALL;

  const key = types.join(",");
  const hit = cache.get(key);
  if (hit) return hit;

  const set = new Set(types);
  const sports = new Set<Sport>();
  for (const t of types) for (const s of SPORTS_BY_TYPE[t] ?? []) sports.add(s);

  const caps: AthleteCapabilities = {
    sports,
    ultraFormats: set.has("ultra") || set.has("trail"),
    trail: set.has("trail"),
    multiSport: set.has("triathlete"),
    // `types` order is the order the user picked them in, so the first is the
    // one they identify with most.
    primary: types[0],
  };
  cache.set(key, caps);
  return caps;
}

/** Whether a workout of this sport is relevant to the athlete. */
export function showsSport(caps: AthleteCapabilities, sport: Sport): boolean {
  return caps.sports.has(sport);
}

/**
 * The athlete's sport, when they only do one.
 *
 * Used to default a new plan. Without it a cyclist would get a running plan
 * *and* no picker to change it with, since the picker hides itself when there
 * is only one sport to choose.
 */
export function soleSport(caps: AthleteCapabilities): Sport | undefined {
  return caps.sports.size === 1 ? [...caps.sports][0] : undefined;
}

/** Which piece of artwork the app badge shows. See `components/layout/app-mark.tsx`. */
export type MarkId = Sport | "multi";

/**
 * Which mark an athlete gets.
 *
 * Chosen from the *sports* they train, not from the first type they happened to
 * pick. A swimmer-and-cyclist is doing two sports and the badge should say so;
 * showing whichever they tapped first would claim something narrower than the
 * truth. It also means runner + trail + ultra correctly stays the running mark,
 * since all three are the same sport.
 *
 * `primary` is used only as the "have they told us anything?" test: an athlete
 * who never answered gets `ALL` capabilities, and reading `sports.size` off
 * that would put the multi-sport mark on someone who has said nothing.
 */
export function markForAthlete(types?: readonly AthleteType[]): MarkId {
  const caps = capabilitiesFor(types);
  if (!caps.primary) return "run";
  if (caps.sports.size > 1) return "multi";
  return [...caps.sports][0];
}

const MARKS: readonly MarkId[] = ["run", "bike", "swim", "multi"];

/** A `MARK_COOKIE` value, or the running mark for anything unrecognised. */
export function markFromCookie(value?: string | null): MarkId {
  return MARKS.includes(value as MarkId) ? (value as MarkId) : "run";
}
