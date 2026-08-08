import { describe, expect, it } from "vitest";
import {
  type Draft,
  buildPlanRequest,
  defaultRaceName,
  planRequestFilename,
} from "@/lib/plan/request";
import { makePlan, makeWorkout } from "@/lib/test/factories";

const draft = (patch: Partial<Draft> = {}): Draft => ({
  name: "Autumn block",
  raceName: "Marathon",
  sport: "run",
  raceDistanceKm: 42.2,
  raceDate: "2026-10-11",
  startDate: "2026-06-22",
  raceType: "standard",
  loopKm: 6.706,
  legs: [],
  targetYards: 24,
  goalType: "finish",
  goalValue: "",
  offDays: [],
  latestRuns: [],
  contextPlanIds: [],
  prefs: {
    daysPerWeek: 4,
    flexibleDays: false,
    trainingDays: [true, false, true, true, false, false, true],
    planningMode: "exact",
    targetDistanceKm: 30,
  },
  ...patch,
});

describe("buildPlanRequest", () => {
  it("emits the versioned envelope", () => {
    const r = buildPlanRequest(draft(), {});
    expect(r.app).toBe("marathon-tracker-plan-request");
    expect(r.version).toBe(2);
  });

  it("sends the chosen distance for a standard race", () => {
    const r = buildPlanRequest(draft({ raceDistanceKm: 21.1 }), {});
    expect(r.race).toMatchObject({ type: "standard", distanceKm: 21.1 });
    expect(r.race).not.toHaveProperty("loopKm");
    expect(r.goal).toEqual({ type: "finish", value: null });
  });

  it("derives distance and a yards goal for a backyard", () => {
    const r = buildPlanRequest(
      draft({ raceType: "backyard", targetYards: 24, loopKm: 6.706 }),
      {},
    );
    expect(r.race).toMatchObject({
      type: "backyard",
      distanceKm: 160.9, // 24 x 6.706, rounded to 1dp
      loopKm: 6.706,
      targetYards: 24,
    });
    expect(r.goal).toEqual({ type: "yards", value: "24" });
  });

  it("nulls an empty goal value but keeps a real one", () => {
    expect(buildPlanRequest(draft({ goalType: "time", goalValue: "  " }), {}).goal)
      .toEqual({ type: "time", value: null });
    expect(buildPlanRequest(draft({ goalType: "time", goalValue: "3:30" }), {}).goal)
      .toEqual({ type: "time", value: "3:30" });
  });

  it("converts latest runs to distance + minutes + pace, skipping blanks", () => {
    const r = buildPlanRequest(
      draft({
        latestRuns: [
          { distanceKm: "10", time: "50:00", date: "2026-06-20" },
          { distanceKm: "", time: "40:00", date: "2026-06-18" }, // no distance
        ],
      }),
      {},
    );
    expect(r.latestRuns).toEqual([
      {
        sport: "run",
        distanceKm: 10,
        durationMin: 50,
        pace: "5:00",
        date: "2026-06-20",
      },
    ]);
  });

  it("sends weekday names, or null when days are flexible", () => {
    expect(buildPlanRequest(draft(), {}).training.trainingDays).toEqual([
      "Monday",
      "Wednesday",
      "Thursday",
      "Sunday",
    ]);
    const flex = draft();
    flex.prefs = { ...flex.prefs, flexibleDays: true };
    expect(buildPlanRequest(flex, {}).training.trainingDays).toBeNull();
  });

  it("attaches selected previous plans as context", () => {
    const plans = {
      old: makePlan({
        id: "old",
        name: "Spring",
        workouts: { w1: makeWorkout({ id: "w1", completed: true, actualDistanceKm: 10 }) },
      }),
    };
    const r = buildPlanRequest(draft({ contextPlanIds: ["old"] }), plans);
    expect(r.previousPlans).toHaveLength(1);
    expect(r.previousPlans[0].name).toBe("Spring");
  });

  it("survives a context plan deleted while the wizard was open", () => {
    const r = buildPlanRequest(draft({ contextPlanIds: ["gone"] }), {});
    expect(r.previousPlans).toEqual([]);
  });
});

describe("buildPlanRequest for a multi-sport race", () => {
  const legs = [
    { sport: "swim" as const, distanceKm: 1.5, transitionMin: 3 },
    { sport: "bike" as const, distanceKm: 40, transitionMin: 2 },
    { sport: "run" as const, distanceKm: 10 },
  ];

  it("derives the total distance from the legs", () => {
    const r = buildPlanRequest(draft({ raceType: "multisport", legs }), {});
    expect(r.race).toMatchObject({ type: "multisport", distanceKm: 51.5, legs });
  });

  it("sends the legs so the AI can plan bricks and transitions", () => {
    // Without them the AI sees one 51.5 km race and no idea which sports.
    const r = buildPlanRequest(draft({ raceType: "multisport", legs }), {});
    expect(r.race.legs?.map((l) => l.sport)).toEqual(["swim", "bike", "run"]);
    expect(r.race.legs?.at(-1)?.transitionMin).toBeUndefined();
  });

  it("omits legs entirely for a single-sport race", () => {
    expect(buildPlanRequest(draft({ raceType: "standard" }), {}).race).not.toHaveProperty(
      "legs",
    );
  });
});

describe("recent sessions", () => {
  const runs = [
    { sport: "bike" as const, distanceKm: "40", time: "1:20:00", date: "2026-08-01" },
    { distanceKm: "10", time: "50:00", date: "2026-08-03" },
  ];

  it("keeps a session's own sport, and inherits the plan's otherwise", () => {
    // 40 km means something very different on a bike than on foot, so the AI
    // must never have to guess.
    const r = buildPlanRequest(draft({ sport: "run", latestRuns: runs }), {});
    expect(r.latestRuns.map((x) => x.sport)).toEqual(["bike", "run"]);
  });

  it("inherits a non-running plan's sport", () => {
    const r = buildPlanRequest(
      draft({ sport: "swim", latestRuns: [runs[1]] }),
      {},
    );
    expect(r.latestRuns[0].sport).toBe("swim");
  });

  it("reports pace in min/km for every sport", () => {
    // The wire format, not the display: 40 km in 1:20 is 2:00/km, which the UI
    // will show as 30 km/h.
    const r = buildPlanRequest(draft({ latestRuns: [runs[0]] }), {});
    expect(r.latestRuns[0].pace).toBe("2:00");
  });
});

describe("planRequestFilename", () => {
  it("names the file after the race", () => {
    expect(planRequestFilename(draft({ raceName: "Berlin Marathon" }))).toBe(
      "berlin-marathon-plan-request.json",
    );
  });

  it("strips accents rather than mangling them", () => {
    expect(planRequestFilename(draft({ raceName: "Marathon de Paris" }))).toBe(
      "marathon-de-paris-plan-request.json",
    );
    expect(planRequestFilename(draft({ raceName: "Zürich Triathlon" }))).toBe(
      "zurich-triathlon-plan-request.json",
    );
  });

  it("names the format when the race is unnamed", () => {
    // The field starts empty now, so this is the common path, not the edge.
    expect(planRequestFilename(draft({ raceName: "", raceType: "backyard" }))).toBe(
      "backyard-ultra-plan-request.json",
    );
    expect(
      planRequestFilename(
        draft({
          raceName: "",
          raceType: "multisport",
          legs: [{ sport: "swim", distanceKm: 1.5 }],
        }),
      ),
    ).toBe("triathlon-plan-request.json");
    expect(planRequestFilename(draft({ raceName: "  ", sport: "bike" }))).toBe(
      "cycling-race-plan-request.json",
    );
  });

  it("never emits a name that is only punctuation", () => {
    expect(planRequestFilename(draft({ raceName: "!!!", sport: "swim" }))).toBe(
      "swim-plan-request.json",
    );
  });
});

describe("defaultRaceName", () => {
  it("no longer calls every race a marathon", () => {
    // A triathlete who never retyped the field used to tell the AI they were
    // running a marathon.
    expect(
      defaultRaceName({
        raceType: "multisport",
        sport: "run",
        legs: [{ sport: "swim", distanceKm: 1.5 }],
      }),
    ).toBe("Triathlon");
  });

  it("calls a swim-less multi-sport race a duathlon", () => {
    expect(
      defaultRaceName({
        raceType: "multisport",
        sport: "run",
        legs: [
          { sport: "run", distanceKm: 10 },
          { sport: "bike", distanceKm: 40 },
        ],
      }),
    ).toBe("Duathlon");
  });

  it("names single-sport races by their sport", () => {
    const base = { raceType: "standard" as const, legs: [] };
    expect(defaultRaceName({ ...base, sport: "run" })).toBe("Marathon");
    expect(defaultRaceName({ ...base, sport: "bike" })).toBe("Cycling race");
    expect(defaultRaceName({ ...base, sport: "swim" })).toBe("Open water swim");
  });

  it("fills the request when the field is left blank", () => {
    const r = buildPlanRequest(draft({ raceName: "  ", sport: "bike" }), {});
    expect(r.race.raceName).toBe("Cycling race");
  });
});
