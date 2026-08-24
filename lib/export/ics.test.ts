import { describe, expect, it } from "vitest";
import { buildIcs, foldLine, type IcsWorkout } from "@/lib/export/ics";
import type { Workout } from "@/lib/types";

const NOW = new Date("2026-08-09T17:00:00Z");
const PLAN = { id: "plan1", name: "Autumn marathon" };

const workout = (o: Partial<Workout> = {}): Workout =>
  ({
    id: "w1",
    date: "2026-08-12",
    type: "long",
    title: "Long run",
    weekNumber: 1,
    plannedDistanceKm: 20,
    completed: false,
    ...o,
  }) as Workout;

const event = (o: Partial<IcsWorkout> = {}): IcsWorkout => ({
  workout: workout(),
  summary: "Long run 20 km",
  description: "",
  ...o,
});

/** Unfold, so assertions can look at logical lines. */
const lines = (ics: string) => ics.replace(/\r\n /g, "").split("\r\n");

describe("buildIcs", () => {
  it("wraps events in a valid calendar", () => {
    const out = lines(buildIcs([event()], PLAN, NOW));
    expect(out[0]).toBe("BEGIN:VCALENDAR");
    expect(out).toContain("VERSION:2.0");
    expect(out).toContain("CALSCALE:GREGORIAN");
    expect(out).toContain("X-WR-CALNAME:Autumn marathon");
    expect(out.at(-2)).toBe("END:VCALENDAR");
  });

  it("terminates every line with CRLF, including the last", () => {
    const ics = buildIcs([event()], PLAN, NOW);
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.includes("\n") && !/[^\r]\n/.test(ics)).toBe(true);
  });

  it("gives a workout with no start time an all-day entry", () => {
    // No start time means no claim about when. DTEND is exclusive, so the day
    // after is what makes it a single day rather than two.
    const out = lines(buildIcs([event()], PLAN, NOW));
    expect(out).toContain("DTSTART;VALUE=DATE:20260812");
    expect(out).toContain("DTEND;VALUE=DATE:20260813");
  });

  it("gives a timed workout a floating local start", () => {
    // Floating on purpose: 07:00 is 07:00 wherever the athlete is that week.
    const out = lines(
      buildIcs(
        [event({ workout: workout({ startTime: "07:30" }), durationMin: 90 })],
        PLAN,
        NOW,
      ),
    );
    expect(out).toContain("DTSTART:20260812T073000");
    expect(out).toContain("DTEND:20260812T090000");
    expect(out.some((l) => /DTSTART.*Z$/.test(l))).toBe(false);
  });

  it("falls back to an hour when there is no estimate", () => {
    const out = lines(
      buildIcs([event({ workout: workout({ startTime: "06:00" }) })], PLAN, NOW),
    );
    expect(out).toContain("DTEND:20260812T070000");
  });

  it("clamps an end time to the same day", () => {
    // A six-hour ultra long run starting at 21:00 must not emit 03:00, which
    // would land the event before its own start.
    const out = lines(
      buildIcs(
        [event({ workout: workout({ startTime: "21:00" }), durationMin: 360 })],
        PLAN,
        NOW,
      ),
    );
    expect(out).toContain("DTEND:20260812T235900");
  });

  it("gives each event a stable, plan-scoped UID", () => {
    // Stable so re-importing updates rather than duplicates; plan-scoped
    // because two plans can hold workouts with the same id after an import.
    const out = lines(buildIcs([event()], PLAN, NOW));
    expect(out).toContain("UID:w1.plan1@racepilot");
  });

  it("stamps DTSTAMP in UTC from the injected clock", () => {
    expect(lines(buildIcs([event()], PLAN, NOW))).toContain(
      "DTSTAMP:20260809T170000Z",
    );
  });

  it("omits an empty description rather than emitting a blank one", () => {
    const out = lines(buildIcs([event({ description: "   " })], PLAN, NOW));
    expect(out.some((l) => l.startsWith("DESCRIPTION"))).toBe(false);
  });

  it("writes one VEVENT per workout", () => {
    const ics = buildIcs(
      [event(), event({ workout: workout({ id: "w2", date: "2026-08-13" }) })],
      PLAN,
      NOW,
    );
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});

describe("escaping", () => {
  it("escapes the four characters that would break a field", () => {
    const out = lines(
      buildIcs(
        [event({ summary: "6x800m; hard, fast\\slow", description: "a\nb" })],
        PLAN,
        NOW,
      ),
    );
    expect(out).toContain("SUMMARY:6x800m\\; hard\\, fast\\\\slow");
    expect(out).toContain("DESCRIPTION:a\\nb");
  });

  it("escapes backslashes before the escapes it adds", () => {
    // Otherwise the backslash in "\;" would itself be escaped afterwards.
    const out = lines(buildIcs([event({ summary: "a\\b" })], PLAN, NOW));
    expect(out).toContain("SUMMARY:a\\\\b");
  });
});

describe("foldLine", () => {
  it("leaves a short line alone", () => {
    expect(foldLine("SUMMARY:Easy run")).toBe("SUMMARY:Easy run");
  });

  it("folds a long line with a leading space on continuations", () => {
    const folded = foldLine(`SUMMARY:${"a".repeat(200)}`);
    const parts = folded.split("\r\n");
    expect(parts.length).toBeGreaterThan(1);
    expect(parts.slice(1).every((p) => p.startsWith(" "))).toBe(true);
    // Unfolding gives back exactly what went in.
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"a".repeat(200)}`);
  });

  it("counts octets, not characters", () => {
    // The multiplication sign is 2 bytes in UTF-8, so 50 of them exceed the
    // 75-octet limit even though the string is well under 75 characters.
    const line = `SUMMARY:${"×".repeat(50)}`;
    expect(line.length).toBeLessThan(75);
    const folded = foldLine(line);
    expect(folded).toContain("\r\n");
    for (const part of folded.split("\r\n")) {
      expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    }
  });

  it("never splits a multi-byte character", () => {
    // Splitting mid-sequence would corrupt it, so every fragment must decode.
    const folded = foldLine(`DESCRIPTION:${"é×→".repeat(40)}`);
    for (const part of folded.split("\r\n")) {
      expect(part).not.toContain("�");
    }
    expect(folded.replace(/\r\n /g, "")).toBe(`DESCRIPTION:${"é×→".repeat(40)}`);
  });
});
