import { newId } from "@/lib/id";
import {
  DEFAULT_PLAN_META,
  PLAN_VERSION,
  raceNameFor,
} from "@/lib/plan/defaults";
import { normalizeSteps } from "@/lib/plan/workout-steps";
import { toSport } from "@/lib/sport";
import {
  WORKOUT_TYPES,
  type Preferences,
  type TrainingPlan,
  type Workout,
} from "@/lib/types";

export const STORAGE_KEY = "marathon-training-v1";

export interface ExportBundle {
  app: "marathon-tracker";
  version: number;
  exportedAt: string;
  plans: Record<string, TrainingPlan>;
  activePlanId: string | null;
  preferences: Preferences;
}

/** Serialize the full app state to a pretty JSON string for export. */
export function serializeExport(
  plans: Record<string, TrainingPlan>,
  activePlanId: string | null,
  preferences: Preferences,
): string {
  const bundle: ExportBundle = {
    app: "marathon-tracker",
    version: PLAN_VERSION,
    exportedAt: new Date().toISOString(),
    plans,
    activePlanId,
    preferences,
  };
  return JSON.stringify(bundle, null, 2);
}

/**
 * From position `start` (a "{"), return the balanced object substring, or null
 * if the braces never close. String-aware so braces inside strings don't count.
 */
function balancedObjectFrom(s: string, start: number): string | null {
  let depth = 0;
  let inStr = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Best-effort repair of JSON that was pasted from an AI chat. Handles the common
 * copy slips: a wrapping ```json code fence, surrounding prose (even prose that
 * itself contains braces, or an AI "thinking" line above the JSON), a missing
 * leading `{` (the text starts straight at the first key), or a missing trailing
 * `}`. Returns a string to hand to JSON.parse.
 */
export function sanitizeImportJson(raw: string): string {
  let s = raw.trim();

  // Unwrap a ```json … ``` (or plain ``` … ```) code fence.
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();

  // Classic slip: the opening "{" was left out, so it starts at the first key
  // (e.g. `"plans": { … }`). Put the brace back.
  if (/^"[\w-]+"\s*:/.test(s)) s = `{${s}`;

  // Find the real JSON object by trying each "{" in turn: take the balanced
  // substring from there and keep the first one that actually parses. This skips
  // any prose around it — including prose that happens to contain a brace.
  for (let i = s.indexOf("{"); i !== -1; i = s.indexOf("{", i + 1)) {
    const candidate = balancedObjectFrom(s, i);
    if (!candidate) break; // no balanced close from here on
    try {
      JSON.parse(candidate);
      return candidate;
    } catch {
      // Not valid JSON from this "{" — try the next one.
    }
  }

  // Nothing parsed cleanly (e.g. a missing trailing "}"). Strip leading prose to
  // the first "{" and re-balance any unclosed braces, then let the caller parse.
  const first = s.indexOf("{");
  if (first > 0) s = s.slice(first);
  const opens = (s.match(/{/g) ?? []).length;
  const closes = (s.match(/}/g) ?? []).length;
  if (opens > closes) s += "}".repeat(opens - closes);

  return s;
}

function isValidPlanShape(p: unknown): p is TrainingPlan {
  const plan = p as TrainingPlan;
  return (
    !!plan &&
    Array.isArray(plan.weeks) &&
    typeof plan.workouts === "object" &&
    plan.workouts != null
  );
}

/**
 * Force every workout's enums into range.
 *
 * `type` and `sport` are both used to index static style maps, so an
 * AI-authored plan naming a workout "threshold" or a sport "triathlon" would
 * take the whole calendar down with an undefined lookup. Coercing here is the
 * fix rather than a guard at each of the five index sites: this is the one
 * boundary every foreign plan crosses, and after it the types are true.
 */
function normalizeWorkouts(
  raw: Record<string, Workout> | undefined,
): Record<string, Workout> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, Workout> = {};
  for (const [id, w] of Object.entries(raw)) {
    if (!w || typeof w !== "object") continue;
    out[id] = {
      ...w,
      type: WORKOUT_TYPES.includes(w.type) ? w.type : "easy",
      // An absent sport is left absent ON PURPOSE. It does not mean "unknown",
      // it means "inherit the plan's sport" — and `workoutSport()` already
      // resolves absent+absent to running, so every pre-multi-sport workout
      // reads as a run without being rewritten.
      //
      // Stamping "run" here instead would be actively wrong: a cycling plan
      // declares `plan.sport: "bike"` once and lets its sessions inherit it, so
      // stamping would silently turn every imported cycling plan into running.
      // A *present* value is still coerced, since that one can be nonsense.
      ...(w.sport === undefined ? {} : { sport: toSport(w.sport) }),
      // Same rule for structure: absent stays absent (a flat workout), and
      // anything present is rebuilt from scratch. This is the boundary an
      // AI-authored plan crosses, so a step that ends on both a distance and a
      // time, or on neither, is dropped rather than handed to an encoder.
      ...(w.steps === undefined ? {} : { steps: normalizeSteps(w.steps) }),
    };
  }
  return out;
}

/** Ensure a raw plan object has all required PlanMeta + id fields. */
function normalizePlan(
  raw: TrainingPlan,
  fallbackMeta?: Partial<TrainingPlan>,
): TrainingPlan {
  return {
    ...DEFAULT_PLAN_META,
    ...fallbackMeta,
    ...raw,
    // Explicit fields win, recovering any missing meta from fallback/defaults.
    id: raw.id ?? fallbackMeta?.id ?? newId(),
    name: raw.name ?? fallbackMeta?.name ?? DEFAULT_PLAN_META.name,
    // Derived from the race, not a flat "Marathon": an AI plan that omits the
    // field would otherwise headline a triathlon as a marathon.
    raceName:
      raw.raceName ??
      fallbackMeta?.raceName ??
      raceNameFor({
        raceType: raw.raceType,
        sport: raw.sport,
        legs: raw.legs,
      }),
    raceDistanceKm:
      typeof raw.raceDistanceKm === "number"
        ? raw.raceDistanceKm
        : DEFAULT_PLAN_META.raceDistanceKm,
    raceDate: raw.raceDate ?? fallbackMeta?.raceDate ?? DEFAULT_PLAN_META.raceDate,
    startDate: raw.startDate ?? raw.weeks?.[0]?.startDate,
    goalPace: raw.goalPace ?? fallbackMeta?.goalPace ?? DEFAULT_PLAN_META.goalPace,
    goalLabel:
      raw.goalLabel ?? fallbackMeta?.goalLabel ?? DEFAULT_PLAN_META.goalLabel,
    version: raw.version ?? PLAN_VERSION,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    offDays: Array.isArray(raw.offDays) ? raw.offDays : [],
    ...(raw.sport === undefined ? {} : { sport: toSport(raw.sport) }),
    workouts: normalizeWorkouts(raw.workouts),
  };
}

/**
 * Parse + validate an exported bundle into the multi-plan shape. Accepts:
 *  - a new bundle ({ plans, activePlanId, preferences }),
 *  - a legacy single-plan bundle ({ plan, preferences }), or
 *  - a bare plan object ({ weeks, workouts, ... }).
 * Throws on malformed input.
 */
export function parseImport(json: string): NormalizedBundle {
  let data;
  try {
    data = JSON.parse(sanitizeImportJson(json));
  } catch {
    throw new Error(
      "That doesn't look like valid JSON — it may have been copied incompletely. Copy the AI's whole response (including the first { and last }), or use Attach file.",
    );
  }
  return normalizeBundle(data);
}

export interface NormalizedBundle {
  plans: Record<string, TrainingPlan>;
  activePlanId: string | null;
  preferences?: Preferences;
}

/**
 * Validate + normalize already-parsed bundle data. Split out from
 * `parseImport` so the bundled example plan can travel the same path a user's
 * import does, without a pointless stringify/parse round trip.
 */
export function normalizeBundle(data: unknown): NormalizedBundle {
  return normalizeBundleData(data as BundleShape);
}

/** The union of shapes `normalizeBundle` tolerates. */
interface BundleShape {
  plans?: Record<string, unknown>;
  activePlanId?: string;
  plan?: TrainingPlan;
  preferences?: Preferences & Partial<TrainingPlan>;
}

function normalizeBundleData(data: BundleShape): NormalizedBundle {
  // New multi-plan bundle.
  if (data?.plans && typeof data.plans === "object") {
    const plans: Record<string, TrainingPlan> = {};
    for (const [key, raw] of Object.entries(data.plans)) {
      if (!isValidPlanShape(raw)) {
        throw new Error("Invalid file: a plan is missing `weeks`/`workouts`.");
      }
      const plan = normalizePlan(raw as TrainingPlan, { id: key });
      plans[plan.id] = plan;
    }
    const ids = Object.keys(plans);
    if (ids.length === 0) throw new Error("Invalid file: no plans found.");
    const activePlanId =
      data.activePlanId && plans[data.activePlanId] ? data.activePlanId : ids[0];
    return { plans, activePlanId, preferences: data.preferences };
  }

  // Legacy single-plan bundle, or a bare plan object.
  const rawPlan = (data?.plan ?? data) as TrainingPlan;
  if (!isValidPlanShape(rawPlan)) {
    throw new Error(
      "Invalid file: expected plans, or a plan with `weeks` and `workouts`.",
    );
  }
  // Legacy preferences carried the race meta — fold it into the plan.
  const legacyPrefs: Partial<BundleShape["preferences"]> = data?.preferences ?? {};
  const plan = normalizePlan(rawPlan, {
    name: legacyPrefs.raceName ?? rawPlan.raceName,
    raceName: legacyPrefs.raceName,
    raceDate: legacyPrefs.raceDate ?? rawPlan.raceDate,
    goalPace: legacyPrefs.goalPace,
    goalLabel: legacyPrefs.goalLabel,
  });
  const preferences: Preferences | undefined = legacyPrefs.theme
    ? { theme: legacyPrefs.theme }
    : undefined;
  return { plans: { [plan.id]: plan }, activePlanId: plan.id, preferences };
}

/** Trigger a browser download of the export bundle. */
export function downloadJSON(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
