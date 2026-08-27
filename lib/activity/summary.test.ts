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

  // Five weekly 40 km runs. The first is Sun 2026-07-19, whose week starts
  // Mon 07-13, so seven calendar weeks reach Mon 08-24: 200 km over 7.
  const SIX_WEEKS = [
    "2026-08-23", "2026-08-16", "2026-08-09", "2026-07-26", "2026-07-19",
  ].map((d) => run(d, 40));

  it("averages over the weeks the history covers, not always sixteen", () => {
    // Divided by the fixed 16-week window this read 12.5 km/week, and the plan
    // prompt tells the model to open near avgWeeklyKm - so a 40 km/week athlete
    // would have been handed a 12 km plan.
    const p = trainingPicture(SIX_WEEKS, TODAY)!;
    expect(p.weeks).toBe(7);
    expect(p.avgWeeklyKm).toBe(28.6);
  });

  it.each(["2026-08-24", "2026-08-26", "2026-08-28", "2026-08-29", "2026-08-30"])(
    "gives the same answer whichever day the wizard is opened (%s)",
    (today) => {
      // Counting by dividing milliseconds rounded a partial week up from Friday
      // onward, so this same history read 28.6 km/week on the Thursday and 25
      // on the Friday. Nobody's plan should depend on that.
      const p = trainingPicture(SIX_WEEKS, today)!;
      expect(p.weeks).toBe(7);
      expect(p.avgWeeklyKm).toBe(28.6);
    },
  );

  it("does not reach the trend back past the first ever activity", () => {
    // A zero before the athlete started is absent data, not a rest week, and
    // the AI reads this array as a ramp. Seven entries, not eight, and the
    // first is the week their history begins.
    const p = trainingPicture(SIX_WEEKS, TODAY)!;
    expect(p.recentWeeklyKm).toEqual([40, 40, 0, 40, 40, 40, 0]);
  });

  it("still counts rest weeks inside a longer history", () => {
    // A week off *after* the athlete started is real rest and must drag the
    // average down; only weeks before their first ever activity are absent data.
    const long = [run("2026-05-11", 40), run("2026-08-23", 40)];
    const p = trainingPicture(long, TODAY)!;
    expect(p.weeks).toBe(16);
    expect(p.avgWeeklyKm).toBe(5);
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
    // 42 km over the two calendar weeks since the first session, not over the
    // days actually trained and not over the whole 16-week window.
    expect(p.weeks).toBe(2);
    expect(p.avgWeeklyKm).toBe(21);
  });

  it("groups into weeks starting Monday", () => {
    // Sun 2026-08-23 and Mon 2026-08-24 are different weeks. Getting this wrong
    // would merge a peak week into a taper.
    const p = trainingPicture([run("2026-08-23", 20), run("2026-08-24", 5)], TODAY)!;
    expect(p.peakWeeklyKm).toBe(20);
    expect(p.recentWeeklyKm.slice(-2)).toEqual([20, 5]);
  });

  it("keeps empty weeks inside the history", () => {
    // A week off is information. Dropping the zeros would flatten an injury gap
    // into a straight line and the AI would plan straight over it.
    //
    // Mon 08-03 is the first activity, so the trend starts there: trained,
    // rested, trained, and the current week still to come. The weeks before
    // 08-03 are absent data and no longer appear at all.
    const p = trainingPicture([run("2026-08-03", 30), run("2026-08-17", 40)], TODAY)!;
    expect(p.recentWeeklyKm).toEqual([30, 0, 40, 0]);
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
