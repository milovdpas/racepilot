import { describe, expect, it } from "vitest";
import {
  type CalendarEvent,
  isAdded,
  isSuggested,
  isValidRange,
  mapEvents,
  toCalendarEvent,
  toOffDay,
} from "./events";

const ev = (over: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: "e1",
  title: "Ghent",
  start: "2026-11-07",
  end: "2026-11-09",
  allDay: true,
  ...over,
});

describe("toCalendarEvent", () => {
  it("makes Google's exclusive all-day end inclusive", () => {
    // A three-day trip, 7th to 9th, arrives as end.date = the 10th.
    expect(
      toCalendarEvent({
        id: "a",
        summary: "Ghent",
        start: { date: "2026-11-07" },
        end: { date: "2026-11-10" },
      }),
    ).toEqual({
      id: "a",
      title: "Ghent",
      start: "2026-11-07",
      end: "2026-11-09",
      allDay: true,
    });
  });

  it("keeps a single all-day event on its one day", () => {
    const e = toCalendarEvent({
      id: "a",
      start: { date: "2026-12-25" },
      end: { date: "2026-12-26" },
    });
    expect(e).toMatchObject({ start: "2026-12-25", end: "2026-12-25" });
  });

  it("crosses a month and year boundary", () => {
    const e = toCalendarEvent({
      id: "a",
      start: { date: "2026-12-30" },
      end: { date: "2027-01-02" },
    });
    expect(e).toMatchObject({ start: "2026-12-30", end: "2027-01-01" });
  });

  it("dates a timed event by its local calendar day", () => {
    const e = toCalendarEvent({
      id: "a",
      summary: "Wedding",
      start: { dateTime: "2026-11-07T14:00:00+01:00" },
      end: { dateTime: "2026-11-08T02:00:00+01:00" },
    });
    expect(e).toEqual({
      id: "a",
      title: "Wedding",
      start: "2026-11-07",
      end: "2026-11-08",
      allDay: false,
    });
  });

  it("gives an event ending at midnight to the day it started", () => {
    // 19:00 to 00:00 is an evening, not two days.
    const e = toCalendarEvent({
      id: "a",
      start: { dateTime: "2026-11-07T19:00:00+01:00" },
      end: { dateTime: "2026-11-08T00:00:00+01:00" },
    });
    expect(e).toMatchObject({ start: "2026-11-07", end: "2026-11-07" });
  });

  it("drops cancelled and malformed events", () => {
    expect(toCalendarEvent({ id: "a", status: "cancelled", start: { date: "2026-11-07" } })).toBeNull();
    expect(toCalendarEvent({ start: { date: "2026-11-07" } })).toBeNull();
    expect(toCalendarEvent({ id: "a" })).toBeNull();
    expect(toCalendarEvent({ id: "a", start: { dateTime: "garbage" } })).toBeNull();
  });

  it("falls back to a one-day event when the end is missing or before the start", () => {
    expect(
      toCalendarEvent({ id: "a", start: { date: "2026-11-07" } }),
    ).toMatchObject({ start: "2026-11-07", end: "2026-11-07" });
    expect(
      toCalendarEvent({
        id: "a",
        start: { dateTime: "2026-11-07T10:00:00Z" },
        end: { dateTime: "2026-11-06T10:00:00Z" },
      }),
    ).toMatchObject({ start: "2026-11-07", end: "2026-11-07" });
  });

  it("trims the title and leaves it empty when there is none", () => {
    expect(
      toCalendarEvent({ id: "a", summary: "  Trip  ", start: { date: "2026-11-07" } })?.title,
    ).toBe("Trip");
    expect(toCalendarEvent({ id: "a", start: { date: "2026-11-07" } })?.title).toBe("");
  });
});

describe("mapEvents", () => {
  const all = (start: string, endExclusive: string, id = start) => ({
    id,
    start: { date: start },
    end: { date: endExclusive },
  });

  it("keeps only events touching the range, including ones straddling an edge", () => {
    const out = mapEvents(
      [
        all("2026-10-20", "2026-10-22", "before"), // ends the 21st
        all("2026-10-30", "2026-11-03", "straddles-start"),
        all("2026-11-10", "2026-11-11", "inside"),
        all("2026-11-30", "2026-12-05", "straddles-end"),
        all("2026-12-02", "2026-12-03", "after"),
      ],
      "2026-11-01",
      "2026-11-30",
    );
    expect(out.map((e) => e.id)).toEqual([
      "straddles-start",
      "inside",
      "straddles-end",
    ]);
  });

  it("sorts by start and drops duplicate ids", () => {
    const out = mapEvents(
      [
        all("2026-11-10", "2026-11-11", "b"),
        all("2026-11-05", "2026-11-06", "a"),
        all("2026-11-10", "2026-11-11", "b"),
      ],
      "2026-11-01",
      "2026-11-30",
    );
    expect(out.map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("isSuggested", () => {
  it("suggests all-day and multi-day events, not a one-day meeting", () => {
    expect(isSuggested(ev())).toBe(true);
    expect(isSuggested(ev({ allDay: false, end: "2026-11-08" }))).toBe(true);
    expect(isSuggested(ev({ allDay: false, end: "2026-11-07" }))).toBe(false);
  });
});

describe("toOffDay / isAdded", () => {
  it("copies title and dates, with a fallback for an untitled event", () => {
    expect(toOffDay(ev(), "Busy")).toEqual({
      title: "Ghent",
      start: "2026-11-07",
      end: "2026-11-09",
    });
    expect(toOffDay(ev({ title: "" }), "Busy").title).toBe("Busy");
  });

  it("recognises an event already added, by what was copied", () => {
    const offDays = [{ title: "Ghent", start: "2026-11-07", end: "2026-11-09" }];
    expect(isAdded(ev(), offDays, "Busy")).toBe(true);
    expect(isAdded(ev({ end: "2026-11-10" }), offDays, "Busy")).toBe(false);
    expect(isAdded(ev({ title: "Paris" }), offDays, "Busy")).toBe(false);
    expect(
      isAdded(ev({ title: "" }), [{ ...offDays[0], title: "Busy" }], "Busy"),
    ).toBe(true);
  });
});

describe("isValidRange", () => {
  it("accepts an ordered range within the limit", () => {
    expect(isValidRange("2026-11-01", "2026-11-01", 10)).toBe(true);
    expect(isValidRange("2026-11-01", "2026-11-11", 10)).toBe(true);
  });

  it("rejects reversed, too long and malformed ranges", () => {
    expect(isValidRange("2026-11-02", "2026-11-01", 10)).toBe(false);
    expect(isValidRange("2026-11-01", "2026-11-12", 10)).toBe(false);
    expect(isValidRange("2026-13-45", "2026-11-12", 10)).toBe(false);
    expect(isValidRange("yesterday", "2026-11-12", 10)).toBe(false);
  });
});
