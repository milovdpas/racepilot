import { NextResponse } from "next/server";
import { driveFileName, PRODUCTION_FILE_NAME } from "@/lib/server/drive";
import { isEnabled, isOauthConfigured } from "@/lib/server/google-oauth";
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
      // `connected` means Drive sync, and only where it was connected: a
      // browser that only connected the calendar must not start syncing.
      connected: isEnabled(session, "drive"),
      calendar: isEnabled(session, "calendar"),
      user: session.user ?? null,
      // Sync reaches a separate file here (see driveFileName), so say so.
      devSync: driveFileName() !== PRODUCTION_FILE_NAME,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
