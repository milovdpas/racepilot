import { NextResponse } from "next/server";
import { googleErrorResponse } from "@/lib/server/api";
import { createFile, downloadFile, updateFile } from "@/lib/server/drive";
import {
  getValidAccessToken,
  isEnabled,
  isOauthConfigured,
} from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notConfigured = () =>
  NextResponse.json({ error: "not_configured" }, { status: 503 });
// A browser that only connected the calendar holds a token Google also
// granted Drive on (see enabledFeatures). It must still never touch the file.
const notEnabled = () =>
  NextResponse.json({ error: "not_enabled" }, { status: 403 });

/** GET ?id=<fileId> — download the file contents. */
export async function GET(request: Request) {
  if (!isOauthConfigured()) return notConfigured();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  try {
    const session = await getSession();
    if (!isEnabled(session, "drive")) return notEnabled();
    const token = await getValidAccessToken(session);
    const content = await downloadFile(token, id);
    return new NextResponse(content, {
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (e) {
    return googleErrorResponse(e);
  }
}

/** POST — create the file (body = JSON). */
export async function POST(request: Request) {
  if (!isOauthConfigured()) return notConfigured();
  try {
    const json = await request.text();
    const session = await getSession();
    if (!isEnabled(session, "drive")) return notEnabled();
    const token = await getValidAccessToken(session);
    const meta = await createFile(token, json);
    return NextResponse.json(meta, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return googleErrorResponse(e);
  }
}

/** PATCH ?id=<fileId> — overwrite the file (body = JSON). */
export async function PATCH(request: Request) {
  if (!isOauthConfigured()) return notConfigured();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  try {
    const json = await request.text();
    const session = await getSession();
    if (!isEnabled(session, "drive")) return notEnabled();
    const token = await getValidAccessToken(session);
    const meta = await updateFile(token, id, json);
    return NextResponse.json(meta, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return googleErrorResponse(e);
  }
}
