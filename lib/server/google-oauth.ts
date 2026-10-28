import "server-only";
import type { IronSession } from "iron-session";
import type { SessionData } from "./session";
import type { SyncUser } from "@/lib/drive/types";

export const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
/**
 * Read-only, and only calendars the user owns: the narrowest scope that can
 * list events on `primary`. `calendar.readonly` would also expose every shared
 * calendar and the user's settings, none of which picking off days needs.
 */
export const CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events.owned.readonly";

/**
 * Each feature asks for its own scope when the user turns it on (incremental
 * authorization), so connecting Drive never asks for the calendar and the
 * calendar works without Drive. `include_granted_scopes` folds earlier grants
 * into the new token, so a second consent extends the first rather than
 * replacing it.
 */
export type OauthFeature = "drive" | "calendar";

const FEATURE_SCOPES: Record<OauthFeature, string> = {
  drive: DRIVE_SCOPE,
  calendar: CALENDAR_SCOPE,
};

export function parseFeature(value: unknown): OauthFeature {
  return value === "calendar" ? "calendar" : "drive";
}

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo";

/** Thrown when a refresh fails (revoked/expired) → caller returns HTTP 401. */
export class RefreshError extends Error {
  constructor() {
    super("REFRESH_FAILED");
    this.name = "RefreshError";
  }
}

/** Server-side sync is usable only when all three secrets are present. */
export function isOauthConfigured(): boolean {
  return (
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET &&
    (process.env.SESSION_SECRET?.length ?? 0) >= 32
  );
}

export function getRedirectUri(): string {
  return (
    process.env.GOOGLE_REDIRECT_URI ??
    "http://localhost:3000/api/auth/google/callback"
  );
}

export function buildAuthUrl(
  state: string,
  feature: OauthFeature = "drive",
  loginHint?: string,
): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: `openid email profile ${FEATURE_SCOPES[feature]}`,
    access_type: "offline", // ask for a refresh token
    prompt: "consent", // force consent so a refresh token is actually returned
    include_granted_scopes: "true",
    state,
  });
  if (loginHint) params.set("login_hint", loginHint);
  return `${AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Whether the session's grant covers `scope`. A session saved before scopes
 * were recorded came from the Drive-only consent, so it has Drive and nothing
 * else; the next token refresh replaces the guess with Google's answer.
 */
export function hasScope(session: SessionData, scope: string): boolean {
  if (!session.refreshToken) return false;
  if (!session.scopes) return scope === DRIVE_SCOPE;
  return session.scopes.includes(scope);
}

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  /** Space-separated; every scope the grant covers, earlier ones included. */
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

export async function exchangeCode(code: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: getRedirectUri(),
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  return res.json();
}

async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new RefreshError();
  const data = (await res.json()) as TokenResponse;
  if (!data.access_token) throw new RefreshError();
  return data;
}

/**
 * Return a valid access token, refreshing via the refresh token and persisting
 * the result back to the session when the cached one is missing/near-expiry.
 */
export async function getValidAccessToken(
  session: IronSession<SessionData>,
): Promise<string> {
  if (
    session.accessToken &&
    session.accessTokenExpiry &&
    Date.now() < session.accessTokenExpiry - 60_000
  ) {
    return session.accessToken;
  }
  if (!session.refreshToken) throw new RefreshError();

  const data = await refreshAccessToken(session.refreshToken);
  session.accessToken = data.access_token!;
  session.accessTokenExpiry = Date.now() + (data.expires_in ?? 3600) * 1000;
  // Google usually omits refresh_token on refresh; only overwrite if rotated.
  if (data.refresh_token) session.refreshToken = data.refresh_token;
  if (data.scope) session.scopes = data.scope.split(" ");
  await session.save();
  return session.accessToken;
}

export async function fetchUserInfo(accessToken: string): Promise<SyncUser> {
  const res = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`userinfo failed (${res.status})`);
  const data = await res.json();
  return {
    email: data.email ?? "",
    name: data.name ?? data.email ?? "Google account",
    picture: data.picture ?? "",
  };
}

export async function revoke(token: string): Promise<void> {
  try {
    await fetch(`${REVOKE_ENDPOINT}?token=${encodeURIComponent(token)}`, {
      method: "POST",
      cache: "no-store",
    });
  } catch {
    // best effort — local session is destroyed regardless
  }
}
