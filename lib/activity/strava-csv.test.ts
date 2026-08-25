import { describe, expect, it } from "vitest";
import {
  mergeActivities,
  parseActivityDate,
  parseStravaCsv,
} from "@/lib/activity/strava-csv";
import type { ActivitySummary } from "@/lib/types";

/**
 * A header carrying the duplicates a real export has: `Distance` twice (display
 * unit, then metres) and `Elapsed Time` twice. Synthetic on purpose - the real
 * export is someone's private data and must never become a fixture.
 */
const HEADER =
  "Activity ID,Activity Date,Activity Name,Activity Type,Elapsed Time,Distance," +
  "Elapsed Time,Moving Time,Distance,Average Speed,Elevation Gain,Average Heart Rate";

/** id, date, name, type, elapsed(display), distance(display), elapsed, moving, distance(m), speed, elev, hr */
const row = (cells: string) => `${HEADER}\n${cells}`;

const RUN = `1,"Aug 23, 2026, 9:17:44 AM",Hoogte meterkes,Run,7099,18.16,7099.0,6666.0,18164.8,2.725,514.5,`;

describe("parseStravaCsv", () => {
  it("reads a run into a summary", () => {
    const { activities, skipped } = parseStravaCsv(row(RUN));
    expect(skipped).toEqual({});
    expect(activities).toEqual([
      {
        id: "1",
        date: "2026-08-23",
        sport: "run",
        name: "Hoogte meterkes",
        distanceKm: 18.16,
        movingSec: 6666,
        pace: "6:07",
        elevGainM: 515,
      },
    ]);
  });

  it("picks the metres column, not the first one", () => {
    // The trap: for an imperial athlete the first `Distance` is 11.29 MILES.
    // Taking it by name or by position turns an 18 km run into 11 km, which is
    // wrong in a way nothing downstream could ever notice.
    const imperial = `1,"Aug 23, 2026, 9:17:44 AM",x,Run,7099,11.29,7099.0,6666.0,18164.8,2.725,0,`;
    expect(parseStravaCsv(row(imperial)).activities[0].distanceKm).toBe(18.16);
  });

  it("uses moving time for pace, not elapsed", () => {
    // Elapsed includes standing at traffic lights. 18.16 km in 7099 s would be
    // 6:31/km; the athlete actually ran 6:07.
    expect(parseStravaCsv(row(RUN)).activities[0].pace).toBe("6:07");
  });

  it("reads a Dutch date", () => {
    // Strava writes Activity Date in the account's language, and this app ships
    // English and Dutch.
    const nl = `2,"23 mrt 2026, 09:17:44",Duinen,Run,3600,10,3600,3600,10000,2.777,0,`;
    expect(parseStravaCsv(row(nl)).activities[0].date).toBe("2026-03-23");
  });

  it("maps Strava's sport vocabulary", () => {
    const csv = [
      HEADER,
      `1,"Jan 1, 2026, 8:00:00 AM",a,TrailRun,3600,10,3600,3600,10000,2.777,0,`,
      `2,"Jan 2, 2026, 8:00:00 AM",b,GravelRide,3600,40,3600,3600,40000,11.11,0,`,
      `3,"Jan 3, 2026, 8:00:00 AM",c,Swim,3600,2,3600,3600,2000,0.555,0,`,
    ].join("\n");
    expect(parseStravaCsv(csv).activities.map((a) => a.sport)).toEqual([
      "swim",
      "bike",
      "run",
    ]);
  });

  it("skips and counts what it will not guess at", () => {
    // A hike is not a slow run. Filing it as one would corrupt the pace picture
    // the import exists to produce, so it is dropped and reported.
    const csv = [
      HEADER,
      `1,"Jan 1, 2026, 8:00:00 AM",a,Hike,3600,10,3600,3600,10000,2.777,0,`,
      `2,"Jan 2, 2026, 8:00:00 AM",b,WeightTraining,3600,0,3600,3600,0,0,0,`,
      `3,not a date,c,Run,3600,10,3600,3600,10000,2.777,0,`,
      `4,"Jan 4, 2026, 8:00:00 AM",d,Run,,,,,,,,`,
    ].join("\n");
    const { activities, skipped } = parseStravaCsv(csv);
    expect(activities).toEqual([]);
    expect(skipped).toEqual({
      "unsupported-sport": 2,
      "unreadable-date": 1,
      "no-distance": 1,
    });
  });

  it("keeps heart rate when the export has it", () => {
    const withHr = `1,"Aug 23, 2026, 9:17:44 AM",x,Run,7099,18.16,7099.0,6666.0,18164.8,2.725,514.5,148`;
    expect(parseStravaCsv(row(withHr)).activities[0].avgHr).toBe(148);
    // ...and omits the key entirely when it does not, rather than writing 0.
    expect(parseStravaCsv(row(RUN)).activities[0]).not.toHaveProperty("avgHr");
  });

  it("returns newest first", () => {
    const csv = [
      HEADER,
      `1,"Jan 1, 2026, 8:00:00 AM",old,Run,3600,10,3600,3600,10000,2.777,0,`,
      `2,"Jun 1, 2026, 8:00:00 AM",new,Run,3600,10,3600,3600,10000,2.777,0,`,
    ].join("\n");
    expect(parseStravaCsv(csv).activities.map((a) => a.name)).toEqual([
      "new",
      "old",
    ]);
  });

  it("survives an empty or header-only file", () => {
    expect(parseStravaCsv("")).toEqual({ activities: [], skipped: {} });
    expect(parseStravaCsv(HEADER)).toEqual({ activities: [], skipped: {} });
  });

  it("carries no coordinate anywhere in its output", () => {
    // The whole reason only activities.csv is read. This is the same
    // belt-and-braces check scrub-example-plan.mjs applies before writing.
    const blob = JSON.stringify(parseStravaCsv(row(RUN)).activities);
    expect(blob).not.toMatch(/lat/i);
    expect(blob).not.toMatch(/lon/i);
  });
});

describe("parseActivityDate", () => {
  it.each([
    ["Aug 23, 2026, 9:17:44 AM", "2026-08-23"],
    ["August 23, 2026", "2026-08-23"],
    ["23 mrt 2026, 09:17:44", "2026-03-23"],
    ["1 mei 2025", "2025-05-01"],
    ["5 okt 2024", "2024-10-05"],
  ])("reads %s", (raw, iso) => {
    expect(parseActivityDate(raw)).toBe(iso);
  });

  it("returns null rather than inventing a day", () => {
    expect(parseActivityDate("")).toBeNull();
    expect(parseActivityDate("last Tuesday")).toBeNull();
  });
});

describe("mergeActivities", () => {
  const a = (id: string, date: string): ActivitySummary => ({
    id,
    date,
    sport: "run",
    name: id,
    distanceKm: 10,
    movingSec: 3000,
    pace: "5:00",
  });

  it("dedupes on id, with the newer import winning", () => {
    // Re-importing a later export should correct an activity the athlete has
    // since renamed, not append a second copy of it.
    const merged = mergeActivities(
      [a("1", "2026-01-01")],
      [{ ...a("1", "2026-01-01"), name: "renamed" }],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe("renamed");
  });

  it("keeps both histories, newest first", () => {
    expect(
      mergeActivities([a("1", "2026-01-01")], [a("2", "2026-06-01")]).map(
        (x) => x.id,
      ),
    ).toEqual(["2", "1"]);
  });

  it("caps the history by dropping the oldest", () => {
    const many = Array.from({ length: 5 }, (_, i) =>
      a(String(i), `2026-01-0${i + 1}`),
    );
    expect(mergeActivities([], many, 3).map((x) => x.id)).toEqual(["4", "3", "2"]);
  });
});
