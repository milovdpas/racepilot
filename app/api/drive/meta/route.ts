import { NextResponse } from "next/server";
import { googleErrorResponse } from "@/lib/server/api";
import { findFile } from "@/lib/server/drive";
import {
  getValidAccessToken,
  isEnabled,
  isOauthConfigured,
} from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A browser that only connected the calendar holds a token Google also
// granted Drive on (see enabledFeatures). It must still never touch the file.
const notEnabled = () =>
  NextResponse.json({ error: "not_enabled" }, { status: 403 });

export async function GET() {
  if (!isOauthConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  try {
    const session = await getSession();
    if (!isEnabled(session, "drive")) return notEnabled();
    const token = await getValidAccessToken(session);
    const meta = await findFile(token);
    return NextResponse.json(meta, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return googleErrorResponse(e);
  }
}
