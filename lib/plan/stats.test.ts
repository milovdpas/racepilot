import { describe, expect, it } from "vitest";
import { longRunProgression, statsBySport } from "@/lib/plan/stats";
import { makeWorkout } from "@/lib/test/factories";
import type { TrainingPlan, Workout } from "@/lib/types";

describe("longRunProgression", () => {
  const TODAY = "2026-02-01";
  // Weeks 1-2 are in the past, week 3 is the current one, week 4 is ahead.
  const RANGES = [
    ["2026-01-05", "2026-01-11"],
    ["2026-01-12", "2026-01-18"],
    ["2026-01-26", "2026-02-01"],
    ["2026-02-02", "2026-02-08"],
  ];

  const plan = (
    weeks: { long?: number; ran?: number; type?: Workout["type"] }[],
  ) => {
    const workouts: Record<string, Workout> = {};
    const planWeeks = weeks.map((w, i) => {
      const ids: string[] = [];
      if (w.long != null) {
        const id = `w${i}`;
        workouts[id] = makeWorkout({
          id,
          date: RANGES[i][0],
          type: w.type ?? "long",
          plannedDistanceKm: w.long,
          ...(w.ran != null ? { actualDistanceKm: w.ran, completed: true } : {}),
        });
        ids.push(id);
      }
      return {
        weekNumber: i + 1,
        startDate: RANGES[i][0],
        endDate: RANGES[i][1],
        phase: "build" as const,
        workoutIds: ids,
      };
    });
    return { weeks: planWeeks, workouts } as unknown as TrainingPlan;
  };

  it("keeps a planned 0 visible, because a cutback week is real information", () => {
    const points = longRunProgression(
      plan([{ long: 20, ran: 20 }, {}, { long: 26 }, { long: 30 }]),
      TODAY,
    );
    expect(points.map((p) => p.planned)).toEqual([20, 0, 26, 30]);
  });

  it("carries actual through a past week where nothing was run", () => {
    // Week 2 is behind us with nothing logged: that is a genuine zero, and the
    // line should pass through it rather than stop.
    const points = longRunProgression(
      plan([{ long: 20, ran: 21 }, { long: 22 }, { long: 26 }, { long: 30 }]),
      TODAY,
    );
    expect(points.map((p) => p.actual)).toEqual([21, 0, null, null]);
  });

  it("leaves the current week open, since there is still time to run it", () => {
    // Week 3 ends on TODAY, so it is not yet "past".
    expect(
      longRunProgression(plan([{}, {}, { long: 26 }, { long: 30 }]), TODAY)[2]
        .actual,
    ).toBeNull();
  });

  it("never draws a future week as 0, which would flatline every plan", () => {
    const points = longRunProgression(
      plan([{ long: 20, ran: 20 }, { long: 22, ran: 22 }, { long: 26 }, { long: 30 }]),
      TODAY,
    );
    expect(points[3].actual).toBeNull();
  });

  it("counts a logged run that was never typed as a long run", () => {
    // The reported bug: nothing planned in the week, a 10 km logged, and the
    // chart drew 0 and 0. `type` is an effort hint, not an index of which run
    // was longest.
    const p = plan([{ long: 20, ran: 20 }, { long: 0, ran: 10, type: "easy" }]);
    const points = longRunProgression(p, TODAY);
    expect(points[1].actual).toBe(10);
  });

  it("counts a workout the week's workoutIds never got told about", () => {
    // `addWorkout` only files a workout under a week when its date lands inside
    // one, and a date edit never re-files it. Selecting by date instead means
    // the charts and the dashboard can't disagree.
    const p = plan([{ long: 20, ran: 20 }, {}]);
    p.workouts.orphan = makeWorkout({
      id: "orphan",
      date: RANGES[1][0],
      type: "easy",
      plannedDistanceKm: 0,
      actualDistanceKm: 12,
      completed: true,
    });
    // Deliberately NOT pushed into p.weeks[1].workoutIds.
    expect(longRunProgression(p, TODAY)[1].actual).toBe(12);
  });

  it("takes the longest when a week has several long runs", () => {
    const p = plan([{ long: 20 }]);
    p.workouts.extra = makeWorkout({
      id: "extra",
      date: RANGES[0][0],
      type: "long",
      plannedDistanceKm: 30,
    });
    p.weeks[0].workoutIds.push("extra");
    expect(longRunProgression(p, TODAY)[0].planned).toBe(30);
  });
});

describe("statsBySport", () => {
  const mixed = () =>
    ({
      sport: undefined,
      weeks: [],
      workouts: {
        r1: makeWorkout({
          id: "r1",
          actualDistanceKm: 10,
          durationMin: 50,
          actualPace: "5:00",
          completed: true,
        }),
        b1: makeWorkout({
          id: "b1",
          sport: "bike",
          actualDistanceKm: 40,
          durationMin: 80,
          // Stored per km like every sport: 2:00 is 30 km/h. The log dialog
          // always writes this alongside the duration.
          actualPace: "2:00",
          completed: true,
        }),
      },
    }) as unknown as TrainingPlan;

  it("keeps distance per sport and never sums it across them", () => {
    // 40 km on a bike plus 10 km running is not 50 km of anything.
    const stats = statsBySport(mixed());
    expect(stats.map((s) => [s.sport, s.totalKm])).toEqual([
      ["run", 10],
      ["bike", 40],
    ]);
  });

  it("reports time, which IS comparable across sports", () => {
    expect(statsBySport(mixed()).map((s) => s.totalTimeMin)).toEqual([50, 80]);
  });

  it("gives each sport the FULL stat set, not a summary", () => {
    // A triathlete should see what a runner sees, three times over — longest
    // session and average pace included, in that sport's own terms.
    const bike = statsBySport(mixed()).find((s) => s.sport === "bike")!;
    expect(bike.longestRunKm).toBe(40);
    expect(bike.completedCount).toBe(1);
    expect(bike.completionPct).toBe(100);
    expect(bike.averagePace).toBe("2:00"); // 40 km in 80 min
    expect(bike.plannedTotalKm).toBeGreaterThan(0);
  });

  it("counts each sport's sessions separately", () => {
    const stats = statsBySport(mixed());
    expect(stats.map((s) => s.totalCount)).toEqual([1, 1]);
  });

  it("puts a plain running plan in a single bucket", () => {
    const plan = {
      weeks: [],
      workouts: { a: makeWorkout({ id: "a", completed: true }) },
    } as unknown as TrainingPlan;
    expect(statsBySport(plan).map((s) => s.sport)).toEqual(["run"]);
  });
});
