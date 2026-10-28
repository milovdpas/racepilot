import "server-only";
import {
  type CalendarEvent,
  type GoogleEvent,
  mapEvents,
  shiftISO,
} from "@/lib/google-calendar/events";

const EVENTS_URL =
  "https://www.googleapis.com/calendar/v3/calendars/primary/events";
// 2500 is Google's page cap. Four pages covers a busy work calendar across a
// year of training; past that the picker is not the right tool anyway.
const MAX_PAGES = 4;

/** Thrown on a Calendar 401 → caller returns HTTP 401 so the client re-auths. */
export class CalendarUnauthorizedError extends Error {
  constructor() {
    super("UNAUTHORIZED");
    this.name = "CalendarUnauthorizedError";
  }
}

/** Events on the primary calendar that touch `[from, to]` (local dates). */
export async function listEvents(
  token: string,
  { from, to, timeZone }: { from: string; to: string; timeZone?: string },
): Promise<CalendarEvent[]> {
  const params = new URLSearchParams({
    // A day of slack either side; `mapEvents` makes the range exact.
    timeMin: `${shiftISO(from, -1)}T00:00:00Z`,
    timeMax: `${shiftISO(to, 2)}T00:00:00Z`,
    singleEvents: "true", // expand recurring events into their instances
    orderBy: "startTime",
    maxResults: "2500",
    // Titles and dates only: descriptions, locations and attendees never
    // reach this server.
    fields: "items(id,summary,status,start,end),nextPageToken",
  });
  // Birthdays, focus time and working location are calendar furniture, not
  // plans that could keep anyone from training.
  for (const type of ["default", "outOfOffice", "fromGmail"]) {
    params.append("eventTypes", type);
  }
  if (timeZone) params.set("timeZone", timeZone);

  const items: GoogleEvent[] = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(`${EVENTS_URL}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 401) throw new CalendarUnauthorizedError();
    if (!res.ok) throw new Error(`Calendar list failed (${res.status})`);
    const data = (await res.json()) as {
      items?: GoogleEvent[];
      nextPageToken?: string;
    };
    items.push(...(data.items ?? []));
    if (!data.nextPageToken) break;
    params.set("pageToken", data.nextPageToken);
  }
  return mapEvents(items, from, to);
}
