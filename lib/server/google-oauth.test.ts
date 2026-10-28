import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IronSession } from "iron-session";
import {
  CALENDAR_SCOPE,
  DRIVE_SCOPE,
  RefreshError,
  buildAuthUrl,
  getValidAccessToken,
  hasScope,
  isOauthConfigured,
  parseFeature,
} from "./google-oauth";
import type { SessionData } from "./session";

const HOUR = 3_600_000;

/** A session stub that records saves, standing in for the iron-session cookie. */
function makeSession(data: Partial<SessionData> = {}) {
  const save = vi.fn(async () => {});
  return Object.assign({ save }, data) as unknown as IronSession<SessionData> & {
    save: ReturnType<typeof vi.fn>;
  };
}

const okJson = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as Response;

beforeEach(() => {
  vi.stubEnv("GOOGLE_CLIENT_ID", "cid");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret");
  vi.stubEnv("SESSION_SECRET", "x".repeat(32));
  vi.stubEnv("GOOGLE_REDIRECT_URI", "https://app.example/api/auth/google/callback");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("isOauthConfigured", () => {
  it("needs all three secrets", () => {
    expect(isOauthConfigured()).toBe(true);
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    expect(isOauthConfigured()).toBe(false);
  });

  it("rejects a SESSION_SECRET shorter than 32 chars", () => {
    // iron-session refuses to encrypt below this, so a short secret would fail
    // at runtime instead of being reported as "not configured".
    vi.stubEnv("SESSION_SECRET", "x".repeat(31));
    expect(isOauthConfigured()).toBe(false);
  });
});

describe("buildAuthUrl", () => {
  it("asks for offline access and forced consent", () => {
    // Without both of these Google returns no refresh token, and the whole
    // server-side sync design collapses back to hourly re-auth.
    const url = new URL(buildAuthUrl("state-123"));
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("prompt")).toBe("consent");
    expect(url.searchParams.get("state")).toBe("state-123");
    expect(url.searchParams.get("scope")).toContain("drive.appdata");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://app.example/api/auth/google/callback",
    );
  });

  it("asks only for the feature being turned on", () => {
    // Incremental consent: connecting Drive must not ask for the calendar,
    // and the calendar must not ask for Drive.
    const drive = new URL(buildAuthUrl("s")).searchParams.get("scope")!;
    const cal = new URL(buildAuthUrl("s", "calendar")).searchParams.get("scope")!;
    expect(drive).toContain(DRIVE_SCOPE);
    expect(drive).not.toContain("calendar");
    expect(cal).toContain(CALENDAR_SCOPE);
    expect(cal).not.toContain("drive");
    // Earlier grants are folded in, so the calendar extends Drive sync.
    expect(new URL(buildAuthUrl("s", "calendar")).searchParams.get("include_granted_scopes")).toBe("true");
  });

  it("asks for read-only access to owned calendars, nothing wider", () => {
    expect(CALENDAR_SCOPE).toBe(
      "https://www.googleapis.com/auth/calendar.events.owned.readonly",
    );
  });

  it("passes a login hint only when given one", () => {
    expect(new URL(buildAuthUrl("s")).searchParams.has("login_hint")).toBe(false);
    expect(
      new URL(buildAuthUrl("s", "calendar", "a@b.c")).searchParams.get("login_hint"),
    ).toBe("a@b.c");
  });
});

describe("parseFeature", () => {
  it("defaults anything unknown to Drive", () => {
    expect(parseFeature("calendar")).toBe("calendar");
    expect(parseFeature("drive")).toBe("drive");
    expect(parseFeature(null)).toBe("drive");
    expect(parseFeature("gmail")).toBe("drive");
  });
});

describe("hasScope", () => {
  it("reads a session from before scopes were recorded as Drive-only", () => {
    // Every pre-Calendar session came from the Drive consent.
    const legacy = { refreshToken: "r" };
    expect(hasScope(legacy, DRIVE_SCOPE)).toBe(true);
    expect(hasScope(legacy, CALENDAR_SCOPE)).toBe(false);
  });

  it("trusts the recorded scopes once they exist", () => {
    const calendarOnly = { refreshToken: "r", scopes: ["openid", CALENDAR_SCOPE] };
    expect(hasScope(calendarOnly, DRIVE_SCOPE)).toBe(false);
    expect(hasScope(calendarOnly, CALENDAR_SCOPE)).toBe(true);
  });

  it("grants nothing without a refresh token", () => {
    expect(hasScope({ scopes: [DRIVE_SCOPE] }, DRIVE_SCOPE)).toBe(false);
  });
});

describe("getValidAccessToken", () => {
  it("reuses a cached token that is comfortably fresh", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const session = makeSession({
      accessToken: "cached",
      accessTokenExpiry: Date.now() + HOUR,
      refreshToken: "r1",
    });

    expect(await getValidAccessToken(session)).toBe("cached");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(session.save).not.toHaveBeenCalled();
  });

  it("refreshes when the token is expired", async () => {
    const fetchMock = vi.fn(async () =>
      okJson({ access_token: "fresh", expires_in: 3600 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const session = makeSession({
      accessToken: "stale",
      accessTokenExpiry: Date.now() - 1000,
      refreshToken: "r1",
    });

    expect(await getValidAccessToken(session)).toBe("fresh");
    expect(session.accessToken).toBe("fresh");
    expect(session.accessTokenExpiry).toBeGreaterThan(Date.now() + HOUR - 5000);
    expect(session.save).toHaveBeenCalledOnce();
  });

  it("refreshes inside the 60s skew window, before the token actually expires", async () => {
    // A token valid for another 30s would expire mid-request otherwise.
    const fetchMock = vi.fn(async () => okJson({ access_token: "fresh" }));
    vi.stubGlobal("fetch", fetchMock);
    const session = makeSession({
      accessToken: "nearly-stale",
      accessTokenExpiry: Date.now() + 30_000,
      refreshToken: "r1",
    });

    expect(await getValidAccessToken(session)).toBe("fresh");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps the stored refresh token when Google omits it", async () => {
    // Google returns refresh_token only on the first grant. Overwriting with
    // undefined here would silently log the user out at the next refresh —
    // the exact 3am failure this test exists for.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okJson({ access_token: "fresh", expires_in: 3600 })),
    );
    const session = makeSession({ refreshToken: "original", accessToken: undefined });

    await getValidAccessToken(session);
    expect(session.refreshToken).toBe("original");
  });

  it("records the scopes Google reports on refresh", async () => {
    // How a pre-Calendar session learns what it really covers.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        okJson({ access_token: "fresh", scope: `openid ${DRIVE_SCOPE}` }),
      ),
    );
    const session = makeSession({ refreshToken: "r1" });

    await getValidAccessToken(session);
    expect(session.scopes).toEqual(["openid", DRIVE_SCOPE]);
  });

  it("adopts a rotated refresh token when one is returned", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        okJson({ access_token: "fresh", refresh_token: "rotated", expires_in: 3600 }),
      ),
    );
    const session = makeSession({ refreshToken: "original" });

    await getValidAccessToken(session);
    expect(session.refreshToken).toBe("rotated");
  });

  it("defaults the expiry to an hour when expires_in is absent", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okJson({ access_token: "fresh" })),
    );
    const session = makeSession({ refreshToken: "r1" });

    const before = Date.now();
    await getValidAccessToken(session);
    expect(session.accessTokenExpiry).toBeGreaterThanOrEqual(before + HOUR - 1000);
  });

  it("throws RefreshError when there is no refresh token", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(getValidAccessToken(makeSession())).rejects.toBeInstanceOf(
      RefreshError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws RefreshError when the refresh is rejected (revoked access)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 400 }) as Response),
    );
    const session = makeSession({ refreshToken: "revoked" });
    await expect(getValidAccessToken(session)).rejects.toBeInstanceOf(RefreshError);
    expect(session.save).not.toHaveBeenCalled();
  });

  it("throws RefreshError on a 200 that carries no access token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => okJson({ expires_in: 3600 })),
    );
    await expect(
      getValidAccessToken(makeSession({ refreshToken: "r1" })),
    ).rejects.toBeInstanceOf(RefreshError);
  });

  it("posts the refresh grant with the client credentials", async () => {
    const fetchMock = vi.fn(async () => okJson({ access_token: "fresh" }));
    vi.stubGlobal("fetch", fetchMock);
    await getValidAccessToken(makeSession({ refreshToken: "r1" }));

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    const body = new URLSearchParams(init.body as string);
    expect(Object.fromEntries(body)).toMatchObject({
      grant_type: "refresh_token",
      refresh_token: "r1",
      client_id: "cid",
      client_secret: "secret",
    });
  });
});
