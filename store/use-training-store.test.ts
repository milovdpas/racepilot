import { beforeEach, describe, expect, it } from "vitest";
import { serializeExport } from "@/lib/plan/storage";
import { makePlan, makeWorkout } from "@/lib/test/factories";
import type { TrainingPlan } from "@/lib/types";
import { useTrainingStore } from "./use-training-store";

const s = () => useTrainingStore.getState();

/** A file as Settings → Export (or an AI round trip of one) produces it. */
const file = (plans: TrainingPlan[], activePlanId = plans[0].id) =>
  serializeExport(
    Object.fromEntries(plans.map((p) => [p.id, p])),
    activePlanId,
    s().preferences,
  );

const season = makePlan({
  id: "season",
  name: "Milo's Marathon",
  workouts: {
    "w1-mon": makeWorkout({
      id: "w1-mon",
      completed: true,
      actualDistanceKm: 10.2,
      actualPace: "4:58",
    }),
    "w1-wed": makeWorkout({ id: "w1-wed", date: "2026-06-24" }),
  },
});

beforeEach(() => {
  useTrainingStore.setState({
    plans: { [season.id]: season },
    activePlanId: season.id,
    lastModified: "",
  });
});

describe("importData", () => {
  it("keeps every plan the file doesn't mention", () => {
    // The incident: a file holding one new plan, imported in Settings,
    // replaced the whole season with it.
    const next = makePlan({ id: "maasdijk", name: "Maasdijk marathon" });

    s().importData(file([next]));

    expect(Object.keys(s().plans).sort()).toEqual(["maasdijk", "season"]);
    expect(s().plans.season.workouts["w1-mon"].completed).toBe(true);
    expect(s().activePlanId).toBe("maasdijk");
  });

  it("updates a plan with the same id, keeping its logged runs", () => {
    // An AI round trip from a stale export: the run logged since is missing
    // from the file, and must survive.
    const edited = makePlan({
      id: "season",
      name: "Milo's Marathon (edited)",
      workouts: {
        "w1-mon": makeWorkout({ id: "w1-mon", completed: false }),
        "w1-wed": makeWorkout({ id: "w1-wed", title: "Tempo", type: "tempo" }),
      },
    });

    s().importData(file([edited]));

    expect(Object.keys(s().plans)).toEqual(["season"]);
    expect(s().plans.season.name).toBe("Milo's Marathon (edited)");
    expect(s().plans.season.workouts["w1-mon"]).toMatchObject({
      completed: true,
      actualDistanceKm: 10.2,
    });
    expect(s().plans.season.workouts["w1-wed"].title).toBe("Tempo");
  });

  it("adds a plan that only shares workout ids, without touching the other", () => {
    // AI-written ids repeat across unrelated plans; matching on them once
    // read a brand-new plan as an update of an old one.
    const stranger = makePlan({
      id: "half",
      name: "Half marathon",
      workouts: { "w1-mon": makeWorkout({ id: "w1-mon", plannedDistanceKm: 5 }) },
    });

    s().importData(file([stranger]));

    expect(s().plans.season.workouts["w1-mon"]).toMatchObject({
      completed: true,
      actualDistanceKm: 10.2,
    });
    const half = s().plans.half;
    const [id] = Object.keys(half.workouts);
    expect(id).not.toBe("w1-mon"); // re-keyed, so ids stay unique
    expect(half.workouts[id]).toMatchObject({ id, plannedDistanceKm: 5 });
    expect(half.weeks[0].workoutIds).toEqual([id]);
  });

  it("restores a lost plan next to the current one", () => {
    // The recovery path: current export plus the missing plan, in one file.
    useTrainingStore.setState({
      plans: { maasdijk: makePlan({ id: "maasdijk" }) },
      activePlanId: "maasdijk",
    });

    s().importData(file([season, makePlan({ id: "maasdijk" })], "maasdijk"));

    expect(Object.keys(s().plans).sort()).toEqual(["maasdijk", "season"]);
    expect(s().activePlanId).toBe("maasdijk");
  });
});

describe("applyRemote", () => {
  it("still replaces local plans with Drive's", () => {
    // Sync is a mirror, not an import: a plan deleted on the phone has to
    // disappear here too, so this must not adopt importData's merge.
    useTrainingStore.setState({
      plans: { season, other: makePlan({ id: "other" }) },
    });

    s().applyRemote(file([season]), "2026-10-29T10:00:00.000Z");

    expect(Object.keys(s().plans)).toEqual(["season"]);
  });
});
