import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { deriveStartTime, paceFromDistanceDuration } from "@/lib/pace";
import {
  defaultExampleFor,
  exampleByKey,
  type ExamplePlanKey,
} from "@/lib/plan/examples";
import {
  DEFAULT_PLAN_META,
  DEFAULT_TRAINING_PREFS,
} from "@/lib/plan/defaults";
import { parseImport, serializeExport, STORAGE_KEY } from "@/lib/plan/storage";
import { newId } from "@/lib/id";
import {
  findMatchingPlanId,
  mergeLoggedWorkouts,
  rekeyCollidingWorkouts,
  weekIndexForDate,
} from "@/lib/plan/merge";
import { mergeActivities } from "@/lib/activity/strava-csv";
import type {
  ActivitySummary,
  OffDay,
  PlanMeta,
  Preferences,
  TrainingPlan,
  TrainingPrefs,
  Workout,
} from "@/lib/types";

const DEFAULT_PREFERENCES: Preferences = { theme: "system" };
const nowISO = () => new Date().toISOString();

/**
 * Seeding is async (the example plan lives in its own chunk), and two entry
 * points race for it: `onRehydrateStorage` and the `useHydrated` safety net.
 * Without this both pass the "no plans yet" check before either resolves.
 */
let seedInFlight: Promise<void> | null = null;

interface TrainingState {
  plans: Record<string, TrainingPlan>;
  activePlanId: string | null;
  preferences: Preferences;
  /**
   * Sessions the athlete actually did, imported from a data export. Evidence of
   * current fitness for the plan AI, and separate from `plans` on purpose: it
   * is a record of the past that outlives any one training block, so deleting a
   * plan must not delete the history that shaped it.
   */
  activities: ActivitySummary[];
  hydrated: boolean;
  /** ISO timestamp of the last local mutation — used for sync conflict resolution. */
  lastModified: string;

  setHydrated: (v: boolean) => void;
  /**
   * Install a bundled example plan. No opinion about onboarding — the caller
   * decides, which is what lets the welcome flow seed one before the user is
   * marked as onboarded. Single-flight; no-ops once any plan exists.
   */
  seedExamplePlan: (key?: ExamplePlanKey) => Promise<void>;
  /** Automatic seeding — only for a user who has finished the welcome flow. */
  initializePlan: () => Promise<void>;

  // Plan management
  /** Add an AI-built plan from imported JSON (does not replace existing plans). */
  addPlanFromImport: (
    json: string,
    opts?: {
      trainingPrefs?: TrainingPrefs;
      startDate?: string;
      /**
       * Always insert as a brand-new plan instead of updating one that shares
       * workout ids. Set when previous plans were shown to the AI as context,
       * since it may echo their ids back.
       */
      asNewPlan?: boolean;
    },
  ) => void;
  /** Add an example plan alongside the existing ones, and make it active. */
  addExamplePlan: (key: ExamplePlanKey) => Promise<void>;
  selectPlan: (id: string) => void;
  deletePlan: (id: string) => void;
  updatePlanMeta: (patch: Partial<PlanMeta>) => void;
  updateTrainingPrefs: (patch: Partial<TrainingPrefs>) => void;

  // Off days (operate on the active plan)
  addOffDay: (input: Omit<OffDay, "id">) => void;
  updateOffDay: (id: string, patch: Partial<Omit<OffDay, "id">>) => void;
  deleteOffDay: (id: string) => void;

  // Workout edits (operate on the active plan)
  toggleComplete: (id: string) => void;
  updateWorkout: (id: string, patch: Partial<Workout>) => void;
  addWorkout: (
    input: Omit<Workout, "id" | "weekNumber" | "completed"> &
      Partial<Pick<Workout, "completed">>,
  ) => string;
  deleteWorkout: (id: string) => void;

  /** Merge an import into the history, deduped on the exporter's id. */
  addActivities: (incoming: ActivitySummary[]) => void;
  clearActivities: () => void;
  setPreferences: (patch: Partial<Preferences>) => void;
  exportData: () => string;
  importData: (json: string) => void;
  applyRemote: (json: string, modifiedTime: string) => void;
}

/** Produce a state patch that replaces the active plan via `fn`. */
function mutateActive(
  state: TrainingState,
  fn: (plan: TrainingPlan) => TrainingPlan,
): Partial<TrainingState> {
  const id = state.activePlanId;
  const current = id ? state.plans[id] : null;
  if (!id || !current) return {};
  return {
    plans: { ...state.plans, [id]: fn(current) },
    lastModified: nowISO(),
  };
}

export const useTrainingStore = create<TrainingState>()(
  persist(
    (set, get) => ({
      plans: {},
      activePlanId: null,
      activities: [],
      preferences: DEFAULT_PREFERENCES,
      hydrated: false,
      lastModified: "",

      setHydrated: (v) => set({ hydrated: v }),

      seedExamplePlan: (key) => {
        if (seedInFlight) return seedInFlight;
        if (Object.keys(get().plans).length > 0) return Promise.resolve();

        // No key given: pick the demo that matches what the user told us they
        // train for. Falls back to the marathon plan when they haven't said.
        const entry = key
          ? exampleByKey(key)
          : defaultExampleFor(get().preferences.athleteTypes);

        seedInFlight = (async () => {
          const plan = await entry.load();
          // A Drive sync or an import can land while the chunk is loading.
          if (Object.keys(get().plans).length > 0) return;
          set({
            plans: { [plan.id]: plan },
            activePlanId: plan.id,
            lastModified: nowISO(),
          });
        })().finally(() => {
          seedInFlight = null;
        });

        return seedInFlight;
      },

      /**
       * The automatic path. Fresh installs wait for the welcome flow to decide
       * (create your own vs. look around with the example), so this stays inert
       * until `onboardingSeen`; the flow itself calls `seedExamplePlan`.
       */
      initializePlan: () => {
        if (!get().preferences.onboardingSeen) return Promise.resolve();
        return get().seedExamplePlan();
      },

      addPlanFromImport: (json, opts) => {
        const { trainingPrefs, startDate, asNewPlan } = opts ?? {};
        const { plans: imported } = parseImport(json);
        const entries = Object.values(imported);
        if (entries.length === 0) throw new Error("No plan found in file.");
        const existing = get().plans;
        const next = { ...existing };
        let activeId = get().activePlanId;
        // Ids already spoken for, so a forced-new plan can dodge them.
        const takenWorkoutIds = new Set(
          Object.values(existing).flatMap((pl) => Object.keys(pl.workouts)),
        );

        for (const raw of entries) {
          // `asNewPlan` short-circuits the update path: the AI saw previous
          // plans and may have echoed their ids, which would otherwise be read
          // as "update that plan" and wipe it.
          const p = asNewPlan
            ? rekeyCollidingWorkouts(raw, takenWorkoutIds)
            : raw;
          // If this import updates a plan we already have (shared workout ids),
          // replace it in place and carry over completed sessions — so a "behind"
          // AI plan never wipes finished workouts, and stats aren't double-counted.
          const targetId = asNewPlan ? null : findMatchingPlanId(existing, p);
          const source = targetId ? existing[targetId] : null;
          const merged = source ? mergeLoggedWorkouts(p, source) : p;
          const id = targetId ?? newId();
          next[id] = {
            ...merged,
            id,
            createdAt: source?.createdAt ?? merged.createdAt,
            trainingPrefs: trainingPrefs ?? p.trainingPrefs ?? source?.trainingPrefs,
            startDate: startDate ?? p.startDate ?? source?.startDate,
          };
          for (const wid of Object.keys(merged.workouts)) takenWorkoutIds.add(wid);
          activeId = id;
        }
        set({ plans: next, activePlanId: activeId, lastModified: nowISO() });
      },

      addExamplePlan: async (key) => {
        const plan = await exampleByKey(key).load();
        // Re-adding one the user already has would silently replace it (the ids
        // are fixed per entry), so treat that as "just switch to it".
        if (!get().plans[plan.id]) {
          set((s) => ({ plans: { ...s.plans, [plan.id]: plan } }));
        }
        set({ activePlanId: plan.id, lastModified: nowISO() });
      },

      selectPlan: (id) => {
        if (!get().plans[id]) return;
        set({ activePlanId: id, lastModified: nowISO() });
      },

      deletePlan: (id) => {
        set((s) => {
          const plans = { ...s.plans };
          delete plans[id];
          let activePlanId = s.activePlanId;
          if (activePlanId === id) activePlanId = Object.keys(plans)[0] ?? null;
          return { plans, activePlanId, lastModified: nowISO() };
        });
        // Never leave the app planless. Re-seeding through initializePlan means
        // the fallback is the same full example a first run gets, rather than
        // the stripped-down one this used to build inline.
        if (Object.keys(get().plans).length === 0) void get().initializePlan();
      },

      updatePlanMeta: (patch) =>
        set((s) => mutateActive(s, (p) => ({ ...p, ...patch }))),

      updateTrainingPrefs: (patch) =>
        set((s) =>
          mutateActive(s, (p) => ({
            ...p,
            trainingPrefs: {
              ...DEFAULT_TRAINING_PREFS,
              ...p.trainingPrefs,
              ...patch,
            },
          })),
        ),

      addOffDay: (input) =>
        set((s) =>
          mutateActive(s, (p) => ({
            ...p,
            offDays: [...(p.offDays ?? []), { ...input, id: newId() }],
          })),
        ),

      updateOffDay: (id, patch) =>
        set((s) =>
          mutateActive(s, (p) => ({
            ...p,
            offDays: (p.offDays ?? []).map((o) =>
              o.id === id ? { ...o, ...patch } : o,
            ),
          })),
        ),

      deleteOffDay: (id) =>
        set((s) =>
          mutateActive(s, (p) => ({
            ...p,
            offDays: (p.offDays ?? []).filter((o) => o.id !== id),
          })),
        ),

      toggleComplete: (id) =>
        set((s) =>
          mutateActive(s, (p) => {
            const w = p.workouts[id];
            if (!w) return p;
            return {
              ...p,
              workouts: { ...p.workouts, [id]: { ...w, completed: !w.completed } },
            };
          }),
        ),

      updateWorkout: (id, patch) =>
        set((s) =>
          mutateActive(s, (p) => {
            const existing = p.workouts[id];
            if (!existing) return p;
            const merged: Workout = { ...existing, ...patch };
            if (
              patch.actualPace === undefined &&
              (patch.actualDistanceKm !== undefined ||
                patch.durationMin !== undefined)
            ) {
              const derived = paceFromDistanceDuration(
                merged.actualDistanceKm,
                merged.durationMin,
              );
              if (derived) merged.actualPace = derived;
            }
            return { ...p, workouts: { ...p.workouts, [id]: merged } };
          }),
        ),

      addWorkout: (input) => {
        const id = newId();
        set((s) =>
          mutateActive(s, (p) => {
            const idx = weekIndexForDate(p, input.date);
            const week = idx >= 0 ? p.weeks[idx] : undefined;
            const workout: Workout = {
              ...input,
              id,
              weekNumber: week?.weekNumber ?? 0,
              completed: input.completed ?? false,
              isCustom: true,
            };
            const weeks =
              idx >= 0
                ? p.weeks.map((w, i) =>
                    i === idx ? { ...w, workoutIds: [...w.workoutIds, id] } : w,
                  )
                : p.weeks;
            return { ...p, weeks, workouts: { ...p.workouts, [id]: workout } };
          }),
        );
        return id;
      },

      deleteWorkout: (id) =>
        set((s) =>
          mutateActive(s, (p) => {
            const workouts = { ...p.workouts };
            delete workouts[id];
            return {
              ...p,
              weeks: p.weeks.map((w) => ({
                ...w,
                workoutIds: w.workoutIds.filter((wid) => wid !== id),
              })),
              workouts,
            };
          }),
        ),

      setPreferences: (patch) =>
        set((s) => ({ preferences: { ...s.preferences, ...patch } })),

      addActivities: (incoming) =>
        set((s) => ({
          activities: mergeActivities(s.activities, incoming),
          lastModified: nowISO(),
        })),

      clearActivities: () => set({ activities: [], lastModified: nowISO() }),

      exportData: () => {
        const { plans, activePlanId, preferences, activities } = get();
        if (Object.keys(plans).length === 0) return "";
        return serializeExport(plans, activePlanId, preferences, activities);
      },

      importData: (json) => {
        const { plans, activePlanId, preferences, activities } = parseImport(json);
        // Carry over finished sessions by id: an AI-modified import is often
        // built from a stale export, so merge logged workouts from the current
        // plans rather than letting the import overwrite them.
        const prev = get().plans;
        const mergedPlans: Record<string, TrainingPlan> = {};
        for (const [id, p] of Object.entries(plans)) {
          const sourceId = findMatchingPlanId(prev, p);
          const source = sourceId ? prev[sourceId] : null;
          mergedPlans[id] = source ? mergeLoggedWorkouts(p, source) : p;
        }
        set((s) => ({
          plans: mergedPlans,
          activePlanId,
          // Merged, not replaced. An import is usually an AI round trip built
          // from a stale export, and the same reasoning that carries logged
          // workouts across applies here: history the athlete has imported
          // since must not be dropped by a bundle that predates it.
          activities: activities
            ? mergeActivities(s.activities, activities)
            : s.activities,
          preferences: preferences
            ? { ...s.preferences, ...preferences }
            : s.preferences,
          lastModified: nowISO(),
        }));
      },

      applyRemote: (json, modifiedTime) => {
        const { plans, activePlanId, preferences, activities } = parseImport(json);
        set((s) => ({
          plans,
          activePlanId,
          // Merged for the same reason as `importData`, and it matters more
          // here: a device that has never imported would otherwise push an
          // empty history over the top of one another device just built.
          activities: activities
            ? mergeActivities(s.activities, activities)
            : s.activities,
          preferences: preferences
            ? { ...s.preferences, ...preferences }
            : s.preferences,
          lastModified: modifiedTime,
        }));
      },
    }),
    {
      name: STORAGE_KEY,
      // v5: additive — Workout.startTime/weather + Preferences weather flags.
      // v6: rename Workout.finishTime -> startTime (derive start via duration).
      // v7: additive — Workout.splits + Preferences.splitScannerEnabled
      //     (absent = correct default, so no transform needed).
      // v8: additive — Preferences.splitScannerOnboardingSeen. Left unset for
      //     existing users on purpose, so they get the one-time prompt too.
      // v9: additive — Preferences.nextPlanPromptSeen (plan ids already asked).
      // v10: additive — TrainingPlan.isExample, set only on newly seeded demo
      //      plans. Deliberately NOT backfilled: an existing seeded plan may
      //      have been adopted as the user's real training.
      // v11: additive — PlanMeta.raceType/loopKm/targetYards. Absent raceType
      //      means "standard", so existing plans need no backfill.
      //      v11 also adds `preferences.calendarView`; absent means "month",
      //      so it needs no backfill either.
      // v12: additive — Preferences.athleteTypes and installPromptSeen. Both
      //      left unset for existing users on purpose: `athleteTypes`
      //      distinguishes "never asked" (undefined) from "declined" ([]), so
      //      absent is exactly what makes the one-time prompt appear.
      //      v12 also drops the write-only `weatherOnboardingSeen`. Leftover
      //      copies in stored blobs are harmless, and stripping them would
      //      rewrite every user's data for nothing.
      // v13: additive — Preferences.country and Preferences.units. Nothing is
      //      backfilled and nothing stored changes shape: every distance stays
      //      in km, elevation in metres, temperature in °C and pace in seconds
      //      per km. `units` is a display choice only (see lib/units.ts), and
      //      absent means "follow the country", which is detected on first run.
      // v14: additive — Workout.sport and PlanMeta.sport. Deliberately NOT
      //      backfilled: absent on a workout means "the plan's sport" and
      //      absent on a plan means running, which every plan written before
      //      multi-sport was. Stamping "run" everywhere would rewrite every
      //      user's data to say what the default already says.
      // v15: additive — RaceType gains "multisport", plus PlanMeta.legs and
      //      Workout.raceLegIndex. Only a multi-sport plan carries any of
      //      them and none could exist before this, so there is nothing to
      //      backfill. Bumped anyway: the convention is that a shape change
      //      moves the version, so "which version introduced this field?" is
      //      answerable from this list alone.
      // v16: additive — Workout.steps, the structured breakdown a watch needs,
      //      and Preferences.watch. The latter is left unset on purpose: unset
      //      means "never asked", which is exactly what makes the one-time
      //      prompt appear for existing users.
      //      Absent means a flat workout, which is every session authored
      //      before this and most easy runs after it, so there is nothing to
      //      backfill and no transform to write. Structure cannot be derived
      //      from a title anyway: "6×800m @ 4:10" is prose, and guessing at it
      //      would put a wrong target on someone's watch. Existing plans gain
      //      it through the AI round trip instead — see docs/watch-export.md.
      // v17: additive — Preferences.stepsUpgradePromptSeen. Left unset on
      //      purpose: unset is what makes the one-time prompt appear, and it
      //      only appears at all for someone who owns a watch and has sessions
      //      that would benefit, so an existing user sees it exactly once.
      // v18: additive — Preferences.settingsSections, which Settings section
      //      is expanded. Absent opens the plan section, so nothing to
      //      backfill; an empty array means everything closed, which is why
      //      absent and empty are not the same thing.
      // v19: additive — `activities`, the imported training history. Absent
      //      means nobody has imported one, which is the correct reading for
      //      every existing user, so there is nothing to backfill. It is
      //      persisted rather than kept in the wizard because the same history
      //      feeds the next plan and the one after it.
      version: 19,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        plans: state.plans,
        activePlanId: state.activePlanId,
        activities: state.activities,
        preferences: state.preferences,
        lastModified: state.lastModified,
      }),
      migrate: (persisted, version) => {
        let state = persisted as Record<string, unknown> | undefined;

        // v0: a single `plan` + race metadata living in `preferences`.
        if (version === 0 && state && state.plan) {
          const p = state.plan as TrainingPlan;
          const prefs = (state.preferences ?? {}) as Record<string, string>;
          const id = p.id ?? newId();
          const plan: TrainingPlan = {
            ...DEFAULT_PLAN_META,
            ...p,
            id,
            name: DEFAULT_PLAN_META.name,
            raceName: prefs.raceName ?? DEFAULT_PLAN_META.raceName,
            raceDate: p.raceDate ?? prefs.raceDate ?? DEFAULT_PLAN_META.raceDate,
            goalPace: prefs.goalPace ?? DEFAULT_PLAN_META.goalPace,
            goalLabel: prefs.goalLabel ?? DEFAULT_PLAN_META.goalLabel,
          };
          state = {
            plans: { [id]: plan },
            activePlanId: id,
            preferences: { theme: (prefs.theme as Preferences["theme"]) ?? "system" },
            lastModified: (state.lastModified as string) ?? nowISO(),
          };
        }

        // Ensure newer per-plan fields exist, without touching workouts:
        //  - v2: `offDays` (only pre-v2 state can be missing it; every other
        //        path goes through normalizePlan, which guarantees `[]`)
        //  - v3: `raceDistanceKm`
        if (state && state.plans) {
          const plans = { ...(state.plans as Record<string, TrainingPlan>) };
          for (const [key, plan] of Object.entries(plans)) {
            let next = plan;
            if (!Array.isArray(plan.offDays)) {
              next = { ...next, offDays: [] };
            }
            if (typeof plan.raceDistanceKm !== "number") {
              next = { ...next, raceDistanceKm: DEFAULT_PLAN_META.raceDistanceKm };
            }
            plans[key] = next;
          }
          state = { ...state, plans };
        }

        // v4: anyone with persisted data is an existing user — skip onboarding.
        if (state) {
          state = {
            ...state,
            preferences: {
              ...((state.preferences as Record<string, unknown>) ?? {}),
              onboardingSeen: true,
            },
          };
        }

        // v6: rename the old `finishTime` (finish) to `startTime` (start),
        // deriving the start from the finish minus the run's duration.
        if (state && state.plans) {
          const plans = { ...(state.plans as Record<string, TrainingPlan>) };
          for (const [key, plan] of Object.entries(plans)) {
            let touched = false;
            const workouts: Record<string, Workout> = { ...plan.workouts };
            for (const [wid, w] of Object.entries(workouts)) {
              const legacy = w as Workout & { finishTime?: string };
              if (legacy.finishTime === undefined) continue;
              const { finishTime, ...rest } = legacy;
              workouts[wid] = {
                ...rest,
                startTime:
                  rest.startTime ??
                  deriveStartTime(finishTime, rest.durationMin),
              };
              touched = true;
            }
            if (touched) plans[key] = { ...plan, workouts };
          }
          state = { ...state, plans };
        }

        return state;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        void state?.initializePlan();
      },
    },
  ),
);
