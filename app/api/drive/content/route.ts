import { NextResponse } from "next/server";
import { googleErrorResponse } from "@/lib/server/api";
import { createFile, downloadFile, updateFile } from "@/lib/server/drive";
import { getValidAccessToken, isOauthConfigured } from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notConfigured = () =>
  NextResponse.json({ error: "not_configured" }, { status: 503 });

/** GET ?id=<fileId> — download the file contents. */
export async function GET(request: Request) {
  if (!isOauthConfigured()) return notConfigured();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });
  try {
    const session = await getSession();
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
    const token = await getValidAccessToken(session);
    const meta = await updateFile(token, id, json);
    return NextResponse.json(meta, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return googleErrorResponse(e);
  }
}
