import "server-only";
import { NextResponse } from "next/server";

/**
 * Reduce a caller-supplied `returnTo` to a same-origin path, or "/".
 *
 * Resolve-then-verify rather than string sniffing, because it has to agree
 * with the parser the redirect itself will use. A prefix check does not:
 * `/\evil.com` starts with "/" and not "//", yet `new URL()` reads the
 * backslash as a slash and resolves it to `https://evil.com/` — an open
 * redirect handed a user who has just completed a real Google login.
 */
/**
 * A redirect to a path on this site, as a **relative** Location.
 *
 * Deliberately not `NextResponse.redirect`, which demands an absolute URL and
 * would force us to name our own origin. Behind a reverse proxy the server has
 * no reliable idea what that is: `request.url` is built from the container's
 * bind address, so a self-hosted deploy sent users to `http://0.0.0.0:80/…`
 * after signing in with Google. A relative Location sidesteps the question
 * entirely — the browser resolves it against the URL it actually asked for.
 *
 * RFC 7231 has allowed relative Location since 2014 and every browser follows
 * it. `safeReturnTo` already guarantees the path is same-origin.
 */
export function redirectTo(path: string): Response {
  return new Response(null, { status: 302, headers: { Location: path } });
}

export function safeReturnTo(
  value: string | null | undefined,
  origin: string,
): string {
  if (!value) return "/";
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

/** `path` with one query parameter set, keeping its other params and hash. */
export function withSearchParam(path: string, key: string, value: string): string {
  const url = new URL(path, "http://x");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

const UNAUTHORIZED = new Set([
  "RefreshError",
  "DriveUnauthorizedError",
  "CalendarUnauthorizedError",
]);

/**
 * Map a Google API/OAuth error to an HTTP response. Auth failures (refresh
 * expired, or a 401 from Drive or Calendar) become 401 so the client shows
 * "Reconnect"; everything else 500.
 */
export function googleErrorResponse(e: unknown): NextResponse {
  const name = e instanceof Error ? e.name : "";
  if (UNAUTHORIZED.has(name)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  console.error("Google request failed:", e);
  return NextResponse.json({ error: "server_error" }, { status: 500 });
}
