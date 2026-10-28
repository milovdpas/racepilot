import { describe, expect, it, vi } from "vitest";
import {
  googleErrorResponse,
  redirectTo,
  safeReturnTo,
  withSearchParam,
} from "./api";

const ORIGIN = "https://app.example";
/** What the redirect will actually resolve to — the thing that matters. */
const resolved = (value: string | null | undefined) =>
  new URL(safeReturnTo(value, ORIGIN), ORIGIN).href;

describe("safeReturnTo", () => {
  it("keeps a same-origin path, with query and hash", () => {
    expect(safeReturnTo("/app/plan", ORIGIN)).toBe("/app/plan");
    expect(safeReturnTo("/app/settings?sync=ok#data", ORIGIN)).toBe(
      "/app/settings?sync=ok#data",
    );
  });

  it("reduces an absolute same-origin URL to its path", () => {
    expect(safeReturnTo(`${ORIGIN}/app/stats`, ORIGIN)).toBe("/app/stats");
  });

  it("falls back to / for anything missing", () => {
    expect(safeReturnTo(null, ORIGIN)).toBe("/");
    expect(safeReturnTo(undefined, ORIGIN)).toBe("/");
    expect(safeReturnTo("", ORIGIN)).toBe("/");
  });

  it.each([
    ["protocol-relative", "//evil.com"],
    ["absolute http", "http://evil.com"],
    ["absolute https", "https://evil.com/path"],
    // The bypass a startsWith("//") check misses: the URL parser reads a
    // backslash as a slash, so this used to resolve to https://evil.com/.
    ["backslash authority", "/\\evil.com"],
    ["mixed slash authority", "/\\/evil.com"],
    ["backslash pair", "\\\\evil.com"],
    ["uppercase scheme", "HTTPS://evil.com"],
    ["scheme with whitespace", " https://evil.com"],
    ["javascript scheme", "javascript:alert(1)"],
    ["data scheme", "data:text/html,<script>alert(1)</script>"],
    ["userinfo trick", "https://app.example@evil.com"],
  ])("never leaves the origin: %s", (_label, value) => {
    expect(resolved(value)).toMatch(/^https:\/\/app\.example\//);
  });

  it("is not fooled by a lookalike host", () => {
    expect(resolved("https://app.example.evil.com/x")).toBe(`${ORIGIN}/`);
  });
});

describe("googleErrorResponse", () => {
  const named = (name: string) => {
    const e = new Error("boom");
    e.name = name;
    return e;
  };

  it("maps auth failures to 401 so the client offers Reconnect", async () => {
    for (const name of [
      "RefreshError",
      "DriveUnauthorizedError",
      "CalendarUnauthorizedError",
    ]) {
      const res = googleErrorResponse(named(name));
      expect(res.status).toBe(401);
      await expect(res.json()).resolves.toEqual({ error: "unauthorized" });
    }
  });

  it("maps anything else to 500 and logs it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = googleErrorResponse(new Error("disk on fire"));
    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "server_error" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("handles a non-Error throw without crashing", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = googleErrorResponse("just a string");
    expect(res.status).toBe(500);
    spy.mockRestore();
  });
});

describe("redirectTo", () => {
  it("emits a RELATIVE Location, never an absolute one", () => {
    // Behind a reverse proxy the server cannot know its own public origin:
    // `request.url` is built from the container's bind address, which sent
    // self-hosted users to http://0.0.0.0:80/... after signing in with Google.
    // A relative Location lets the browser resolve it against the URL it
    // actually requested.
    const res = redirectTo("/app/settings?sync=error");
    expect(res.status).toBe(302);
    const location = res.headers.get("Location");
    expect(location).toBe("/app/settings?sync=error");
    expect(location?.startsWith("/")).toBe(true);
    expect(location).not.toMatch(/^https?:/);
    expect(location).not.toContain("0.0.0.0");
  });

  it("carries the whole path, query and all", () => {
    expect(
      redirectTo("/api/auth/google/login?returnTo=%2Fapp").headers.get("Location"),
    ).toBe("/api/auth/google/login?returnTo=%2Fapp");
  });
});

describe("withSearchParam", () => {
  it("adds a flag to a bare path", () => {
    expect(withSearchParam("/app/off-days", "calendar", "error")).toBe(
      "/app/off-days?calendar=error",
    );
  });

  it("keeps the existing query and hash, and replaces a stale flag", () => {
    // The wizard's return path can carry `?from=<planId>`; losing it would
    // drop the plan the user was continuing from.
    expect(
      withSearchParam("/app/plan/new?from=p1&calendar=old#x", "calendar", "account"),
    ).toBe("/app/plan/new?from=p1&calendar=account#x");
  });
});
