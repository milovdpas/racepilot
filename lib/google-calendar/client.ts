// Client side of the off-day picker: one same-origin call. The server holds the
// Google token and talks to the Calendar API; no token reaches the browser.

import type { CalendarEvent } from "@/lib/google-calendar/events";

/** The session is gone, or never covered the calendar: (re)connect needed. */
export class CalendarAuthError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "CalendarAuthError";
  }
}

/** Primary-calendar events touching `[from, to]`, in the browser's time zone. */
export async function fetchCalendarEvents(
  from: string,
  to: string,
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    from,
    to,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const res = await fetch(`/api/calendar/events?${params.toString()}`, {
    cache: "no-store",
  });
  if (res.status === 401 || res.status === 403) throw new CalendarAuthError();
  if (!res.ok) throw new Error(`Calendar events failed (${res.status})`);
  const data = (await res.json()) as { events?: CalendarEvent[] };
  return data.events ?? [];
}
