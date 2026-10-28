import { cookies } from "next/headers";
import { redirectTo, safeReturnTo, withSearchParam } from "@/lib/server/api";
import {
  CALENDAR_SCOPE,
  type OauthFeature,
  exchangeCode,
  fetchUserInfo,
  hasScope,
  isOauthConfigured,
  parseFeature,
  withFeature,
} from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  // Relative, and pointing at the real settings path: `request.url`'s origin is
  // the container's bind address behind a proxy, and /settings has been
  // /app/settings since the routing move.
  const settingsError = redirectTo("/app/settings?sync=error");

  if (!isOauthConfigured()) return settingsError;

  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");

  const jar = await cookies();
  const stateCookie = jar.get("oauth_state")?.value;
  jar.delete("oauth_state");

  if (!stateCookie) return settingsError;

  let returnTo = "/";
  let feature: OauthFeature = "drive";
  // Drive failures land on Settings, where the sync card is. A calendar
  // failure goes back to the picker it started from, flagged, so a wizard the
  // user was halfway through isn't swapped for the Settings page.
  const fail = (reason = "error") =>
    feature === "calendar"
      ? redirectTo(withSearchParam(returnTo, "calendar", reason))
      : settingsError;

  try {
    const parsed = JSON.parse(stateCookie) as {
      state: string;
      returnTo: string;
      feature?: string;
    };
    // Re-validated even though the login route already did: the cookie is
    // ours, but this is the hop that actually performs the redirect.
    returnTo = safeReturnTo(parsed.returnTo, url.origin);
    feature = parseFeature(parsed.feature);
    // A cancelled consent comes back with `error=access_denied` and no code.
    if (!code || !stateParam || parsed.state !== stateParam) return fail();

    const tokens = await exchangeCode(code);
    const user = await fetchUserInfo(tokens.access_token!);
    const session = await getSession();

    // The calendar extends the account that is already connected. Granting it
    // from another account would swap Drive sync over to that account, whose
    // newest-wins reconcile could then pull its data over this browser's.
    if (
      feature === "calendar" &&
      session.refreshToken &&
      session.user?.email &&
      session.user.email !== user.email
    ) {
      return fail("account");
    }

    // Read before the session changes below: it depends on the old account.
    const features = withFeature(session, feature, user.email);

    if (tokens.refresh_token) session.refreshToken = tokens.refresh_token;

    // No refresh token returned and none stored — re-run consent to obtain one.
    if (!session.refreshToken) {
      return redirectTo(
        `/api/auth/google/login?returnTo=${encodeURIComponent(returnTo)}&feature=${feature}`,
      );
    }

    session.accessToken = tokens.access_token;
    session.accessTokenExpiry = Date.now() + (tokens.expires_in ?? 3600) * 1000;
    if (tokens.scope) session.scopes = tokens.scope.split(" ");
    session.features = features;
    session.user = user;
    await session.save();

    // Granular consent lets the user untick the calendar box. The session is
    // still good for whatever else was granted, but the picker should say why
    // nothing changed.
    if (feature === "calendar" && !hasScope(session, CALENDAR_SCOPE)) {
      return fail();
    }
    return redirectTo(returnTo);
  } catch (e) {
    console.error("OAuth callback failed:", e);
    return fail();
  }
}
