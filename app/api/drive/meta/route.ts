import { NextResponse } from "next/server";
import { googleErrorResponse } from "@/lib/server/api";
import { findFile } from "@/lib/server/drive";
import { getValidAccessToken, isOauthConfigured } from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isOauthConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  try {
    const session = await getSession();
    const token = await getValidAccessToken(session);
    const meta = await findFile(token);
    return NextResponse.json(meta, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return googleErrorResponse(e);
  }
}
