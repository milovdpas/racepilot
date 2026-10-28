// Google Calendar events, reduced to what an off day needs. No client- or
// server-only imports: the server maps with it and the picker filters with it.

import { addDays, differenceInCalendarDays, isValid } from "date-fns";
import { fromISO, toISO } from "@/lib/date";
import type { OffDay } from "@/lib/types";

/** The fields requested from events.list (`fields` in lib/server/google-calendar.ts). */
export interface GoogleEvent {
  id?: string;
  summary?: string;
  status?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
}

/** An event as the picker shows it: local calendar dates, end inclusive. */
export interface CalendarEvent {
  id: string;
  /** "" when the event has no title. */
  title: string;
  start: string; // yyyy-mm-dd
  end: string; // yyyy-mm-dd, inclusive
  allDay: boolean;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const shiftISO = (iso: string, days: number) =>
  toISO(addDays(fromISO(iso), days));

/** Two real yyyy-mm-dd dates, in order, at most `maxDays` apart. */
export function isValidRange(from: string, to: string, maxDays: number): boolean {
  if (!ISO_DATE.test(from) || !ISO_DATE.test(to)) return false;
  const a = fromISO(from);
  const b = fromISO(to);
  if (!isValid(a) || !isValid(b)) return false;
  const span = differenceInCalendarDays(b, a);
  return span >= 0 && span <= maxDays;
}

export function toCalendarEvent(raw: GoogleEvent): CalendarEvent | null {
  if (!raw.id || raw.status === "cancelled") return null;
  const allDay = !!raw.start?.date;
  let start: string | undefined;
  let end: string | undefined;

  if (allDay) {
    start = raw.start!.date;
    // Google's all-day end is exclusive: a day off on the 7th ends on the 8th.
    end = raw.end?.date && ISO_DATE.test(raw.end.date)
      ? shiftISO(raw.end.date, -1)
      : start;
  } else {
    // Requested in the browser's time zone, so the date part is the local day.
    start = raw.start?.dateTime?.slice(0, 10);
    const endTime = raw.end?.dateTime;
    end = endTime?.slice(0, 10);
    // A party that ends at midnight belongs to the evening it started on.
    if (start && end && end > start && endTime!.slice(11, 19) === "00:00:00") {
      end = shiftISO(end, -1);
    }
  }

  if (!start || !ISO_DATE.test(start)) return null;
  if (!end || !ISO_DATE.test(end) || end < start) end = start;
  return { id: raw.id, title: raw.summary?.trim() ?? "", start, end, allDay };
}

/**
 * The events that touch `[from, to]`, earliest first. The server asks Google
 * for a day of slack either side, because its bounds are instants and these
 * dates are local; this is where the range becomes exact.
 */
export function mapEvents(
  raws: GoogleEvent[],
  from: string,
  to: string,
): CalendarEvent[] {
  const seen = new Set<string>();
  const out: CalendarEvent[] = [];
  for (const raw of raws) {
    const e = toCalendarEvent(raw);
    if (!e || seen.has(e.id) || e.start > to || e.end < from) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out.sort((a, b) =>
    a.start !== b.start ? (a.start < b.start ? -1 : 1) : a.end < b.end ? -1 : 1,
  );
}

/**
 * All-day and multi-day events: holidays, trips, out of office. A meeting is
 * not an off day, so single-day timed events wait behind a toggle.
 */
export function isSuggested(e: CalendarEvent): boolean {
  return e.allDay || e.end > e.start;
}

export function toOffDay(
  e: CalendarEvent,
  fallbackTitle: string,
): Omit<OffDay, "id"> {
  return { title: e.title || fallbackTitle, start: e.start, end: e.end };
}

/**
 * Whether an off day already matches this event, so opening the picker twice
 * can't add the same trip twice. Matched on what was copied, since an off day
 * keeps no reference to the event it came from.
 */
export function isAdded(
  e: CalendarEvent,
  offDays: readonly Pick<OffDay, "title" | "start" | "end">[],
  fallbackTitle: string,
): boolean {
  const title = e.title || fallbackTitle;
  return offDays.some(
    (o) => o.start === e.start && o.end === e.end && o.title === title,
  );
}
