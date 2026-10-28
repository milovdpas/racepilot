import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeReturnTo } from "@/lib/server/api";
import {
  buildAuthUrl,
  isOauthConfigured,
  parseFeature,
} from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isOauthConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("returnTo"), url.origin);
  const feature = parseFeature(url.searchParams.get("feature"));
  const state = randomUUID();

  const jar = await cookies();
  jar.set("oauth_state", JSON.stringify({ state, returnTo, feature }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes to complete the flow
  });

  // Adding the calendar to an account that is already connected: preselect
  // it, so the grant extends that account instead of switching to another.
  let loginHint: string | undefined;
  if (feature === "calendar") {
    const session = await getSession();
    if (session.refreshToken) loginHint = session.user?.email || undefined;
  }

  return NextResponse.redirect(buildAuthUrl(state, feature, loginHint));
}
