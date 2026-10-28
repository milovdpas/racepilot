import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarUnauthorizedError, listEvents } from "./google-calendar";

const okJson = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

const RANGE = { from: "2026-11-01", to: "2026-11-30" };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("listEvents", () => {
  it("asks the primary calendar for titles and dates only", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) =>
      okJson({ items: [] }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listEvents("tok", { ...RANGE, timeZone: "Europe/Amsterdam" });

    const [url, init] = fetchMock.mock.calls[0];
    const u = new URL(url);
    expect(u.pathname).toBe("/calendar/v3/calendars/primary/events");
    // The privacy page promises exactly this: no description, location or
    // attendees ever requested.
    expect(u.searchParams.get("fields")).toBe(
      "items(id,summary,status,start,end),nextPageToken",
    );
    expect(u.searchParams.get("singleEvents")).toBe("true");
    expect(u.searchParams.get("timeZone")).toBe("Europe/Amsterdam");
    expect(u.searchParams.getAll("eventTypes")).toEqual([
      "default",
      "outOfOffice",
      "fromGmail",
    ]);
    // A day of slack either side of the local range.
    expect(u.searchParams.get("timeMin")).toBe("2026-10-31T00:00:00Z");
    expect(u.searchParams.get("timeMax")).toBe("2026-12-02T00:00:00Z");
    expect(
      (init?.headers as Record<string, string>).Authorization,
    ).toBe("Bearer tok");
  });

  it("follows page tokens and maps the result to the exact range", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        okJson({
          items: [{ id: "a", start: { date: "2026-11-05" }, end: { date: "2026-11-06" } }],
          nextPageToken: "p2",
        }),
      )
      .mockResolvedValueOnce(
        okJson({
          items: [
            { id: "b", start: { date: "2026-11-20" }, end: { date: "2026-11-21" } },
            // Inside Google's slack, outside the plan: dropped.
            { id: "c", start: { date: "2026-12-01" }, end: { date: "2026-12-02" } },
          ],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const events = await listEvents("tok", RANGE);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(new URL(fetchMock.mock.calls[1][0]).searchParams.get("pageToken")).toBe("p2");
    expect(events.map((e) => e.id)).toEqual(["a", "b"]);
  });

  it("stops paging at the cap", async () => {
    const fetchMock = vi.fn(async () =>
      okJson({ items: [], nextPageToken: "more" }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await listEvents("tok", RANGE);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("turns a 401 into the error the route maps to Reconnect", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 401 }) as Response),
    );
    await expect(listEvents("tok", RANGE)).rejects.toBeInstanceOf(
      CalendarUnauthorizedError,
    );
  });

  it("reports any other failure with its status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403 }) as Response),
    );
    await expect(listEvents("tok", RANGE)).rejects.toThrow("403");
  });
});
