import { NextResponse } from "next/server";
import { isValidRange } from "@/lib/google-calendar/events";
import { googleErrorResponse } from "@/lib/server/api";
import { listEvents } from "@/lib/server/google-calendar";
import {
  getValidAccessToken,
  isEnabled,
  isOauthConfigured,
} from "@/lib/server/google-oauth";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A plan rarely runs past a year; two is the ceiling on what we'll page through.
const MAX_SPAN_DAYS = 731;

function validTimeZone(tz: string | null): string | undefined {
  if (!tz) return undefined;
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return undefined;
  }
}

/** GET ?from=yyyy-mm-dd&to=yyyy-mm-dd&tz=Area/City → `{ events }`. */
export async function GET(request: Request) {
  if (!isOauthConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const params = new URL(request.url).searchParams;
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  if (!isValidRange(from, to, MAX_SPAN_DAYS)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    const session = await getSession();
    if (!isEnabled(session, "calendar")) {
      return NextResponse.json({ error: "not_granted" }, { status: 403 });
    }
    const token = await getValidAccessToken(session);
    const events = await listEvents(token, {
      from,
      to,
      timeZone: validTimeZone(params.get("tz")),
    });
    return NextResponse.json(
      { events },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return googleErrorResponse(e);
  }
}
