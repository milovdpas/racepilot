import { describe, expect, it } from "vitest";
import { trainingPicture } from "@/lib/activity/summary";
import type { ActivitySummary } from "@/lib/types";

const run = (
  date: string,
  distanceKm: number,
  pace = "5:00",
  sport: ActivitySummary["sport"] = "run",
): ActivitySummary => ({
  id: `${date}-${distanceKm}`,
  date,
  sport,
  name: "run",
  distanceKm,
  movingSec: 3000,
  pace,
});

// 2026-08-24 is a Monday, so the current week starts that day.
const TODAY = "2026-08-24";

describe("trainingPicture", () => {
  it("says nothing rather than nothing-happened when there is no data", () => {
    // null and a picture of zeroes are different claims, and only one of them
    // is ours to make: an athlete who has not imported has not rested.
    expect(trainingPicture([], TODAY)).toBeNull();
    // Everything older than the window is also "nothing to say".
    expect(trainingPicture([run("2020-01-01", 10)], TODAY)).toBeNull();
  });

  it("totals volume across the window", () => {
    const p = trainingPicture(
      [run("2026-08-18", 10), run("2026-08-20", 12), run("2026-08-23", 20)],
      TODAY,
    )!;
    expect(p.sessions).toBe(3);
    expect(p.longestKm).toBe(20);
    expect(p.from).toBe("2026-08-18");
    expect(p.to).toBe("2026-08-23");
    // 42 km spread over the 16-week window, not over the days actually trained.
    expect(p.avgWeeklyKm).toBe(2.6);
  });

  it("groups into weeks starting Monday", () => {
    // Sun 2026-08-23 and Mon 2026-08-24 are different weeks. Getting this wrong
    // would merge a peak week into a taper.
    const p = trainingPicture([run("2026-08-23", 20), run("2026-08-24", 5)], TODAY)!;
    expect(p.peakWeeklyKm).toBe(20);
    expect(p.recentWeeklyKm.slice(-2)).toEqual([20, 5]);
  });

  it("keeps empty weeks in the trend", () => {
    // A week off is information. Dropping the zeros would flatten an injury gap
    // into a straight line and the AI would plan straight over it.
    const p = trainingPicture([run("2026-08-03", 30), run("2026-08-17", 40)], TODAY)!;
    expect(p.recentWeeklyKm).toEqual([0, 0, 0, 0, 30, 0, 40, 0]);
    expect(p.peakWeeklyKm).toBe(40);
  });

  it("takes the median pace, not the mean", () => {
    // One 9:00 walk-jog with the dog should not drag the number the whole plan
    // is built on. Mean here is 5:40; median is 5:00.
    const p = trainingPicture(
      [
        run("2026-08-17", 10, "4:50"),
        run("2026-08-18", 10, "5:00"),
        run("2026-08-19", 10, "9:00"),
      ],
      TODAY,
    )!;
    expect(p.bySport[0].typicalPace).toBe("5:00");
  });

  it("splits by sport", () => {
    const p = trainingPicture(
      [
        run("2026-08-17", 10, "5:00"),
        run("2026-08-18", 40, "1:52", "bike"),
        run("2026-08-19", 2, "17:30", "swim"),
      ],
      TODAY,
    )!;
    expect(p.bySport.map((s) => [s.sport, s.totalKm])).toEqual(
      expect.arrayContaining([
        ["run", 10],
        ["bike", 40],
        ["swim", 2],
      ]),
    );
  });

  it("ignores anything after today", () => {
    // A plan's own future workouts must never be read back as training done.
    expect(trainingPicture([run("2026-12-01", 42)], TODAY)).toBeNull();
  });

  it("sends the last ten sessions in full, newest first", () => {
    // The aggregates say what the block looked like; these say what a week
    // actually contains - which of them was the long run and which the intervals.
    const many = Array.from({ length: 30 }, (_, i) =>
      run(`2026-08-${String(i + 1).padStart(2, "0")}`, 5 + i),
    );
    const p = trainingPicture(many, TODAY)!;
    expect(p.recentSessions).toHaveLength(10);
    expect(p.recentSessions[0].date).toBe("2026-08-24");
    expect(p.recentSessions[0].km).toBe(28);
    expect(p.recentSessions.at(-1)!.date).toBe("2026-08-15");
  });

  it("sends every session when there are fewer than ten", () => {
    const p = trainingPicture([run("2026-08-20", 10), run("2026-08-22", 12)], TODAY)!;
    expect(p.recentSessions.map((s) => s.km)).toEqual([12, 10]);
  });

  it("stays small enough to send", () => {
    // It goes into the AI request beside the plan itself, so the shape has to
    // stay flat however long the history is: ten sessions and eight weekly
    // totals, never the whole log.
    const many = Array.from({ length: 300 }, (_, i) =>
      run(`2026-0${(i % 8) + 1}-1${i % 9}`, 10 + (i % 20)),
    );
    expect(JSON.stringify(trainingPicture(many, TODAY)).length).toBeLessThan(1400);
  });
});
