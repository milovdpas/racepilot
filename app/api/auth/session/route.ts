import { NextResponse } from "next/server";
import {
  CALENDAR_SCOPE,
  DRIVE_SCOPE,
  hasScope,
  isOauthConfigured,
} from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isOauthConfigured()) {
    return NextResponse.json({
      configured: false,
      connected: false,
      calendar: false,
      user: null,
    });
  }
  const session = await getSession();
  return NextResponse.json(
    {
      configured: true,
      // `connected` means Drive sync: a session that only granted the
      // calendar must not start syncing.
      connected: hasScope(session, DRIVE_SCOPE),
      calendar: hasScope(session, CALENDAR_SCOPE),
      user: session.user ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
