// A training plan as an iCalendar file (RFC 5545).
//
// What this is and is not: a calendar entry is **a label with a date**, not a
// workout a watch can guide you through. What it buys is that the label reaches
// the wrist with no cable and no computer, since Garmin has a calendar glance
// and Apple Watch and Wear OS show events natively — and that it is the only
// route open to Polar and Suunto owners, or to anyone whose only device is a
// phone. The `.fit` export is the one that produces a real workout.
//
// Pure string generation: no dependency, no DOM, and `now` is injected so the
// output is deterministic and testable.

import { SITE_NAME } from "@/lib/site";
import type { TrainingPlan, Workout } from "@/lib/types";

/**
 * Escape a value for a text field.
 *
 * Order matters: backslashes first, or the escapes we add would themselves be
 * escaped. Newlines become a literal `\n`, which is how RFC 5545 carries a
 * multi-line description.
 */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/**
 * Fold a content line to 75 **octets**, not characters.
 *
 * The distinction is the whole point: "6×800m" and a café name are multi-byte
 * in UTF-8, so counting characters would emit lines a strict parser rejects,
 * and splitting mid-sequence would corrupt them. Continuations begin with a
 * single space, which the reader strips.
 */
export function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const out: string[] = [];
  let start = 0;
  // 75 for the first line, 74 for continuations, which spend one octet on the
  // leading space.
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Never split a UTF-8 sequence: continuation bytes are 10xxxxxx, so walk
    // back to the start of the character.
    while (end > start && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    const chunk = new TextDecoder().decode(bytes.slice(start, end));
    out.push(out.length === 0 ? chunk : ` ${chunk}`);
    start = end;
    limit = 74;
  }
  return out.join("\r\n");
}

/** "2026-08-09" -> "20260809". */
function dateValue(iso: string): string {
  return iso.replace(/-/g, "");
}

/** The day after an ISO date, since an all-day DTEND is exclusive. */
function nextDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** A UTC stamp, "20260809T170000Z". */
function utcStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
}

/**
 * A local, floating date-time: "20260809T091700".
 *
 * Deliberately floating, with no timezone and no Z. A session at 07:00 is at
 * 07:00 wherever the athlete happens to be that week, which is what someone
 * travelling to a race actually wants — pinning it to a zone would move every
 * run in their calendar the moment they landed.
 */
function localStamp(iso: string, hhmm: string): string {
  return `${dateValue(iso)}T${hhmm.replace(":", "")}00`;
}

/** Add `minutes` to "HH:mm", clamped to the same day. */
function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = Math.min(h * 60 + m + Math.round(minutes), 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export interface IcsWorkout {
  workout: Workout;
  /** The one-line title, already formatted in the reader's units. */
  summary: string;
  /** The body: structure, targets, notes. Newlines are fine. */
  description: string;
  /** Estimated length in minutes; only used when the workout has a start time. */
  durationMin?: number;
}

/**
 * Build the calendar. `now` is injected rather than read, so the same input
 * always produces the same file.
 */
export function buildIcs(
  events: readonly IcsWorkout[],
  plan: Pick<TrainingPlan, "id" | "name">,
  now: Date,
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_NAME}//Training plan//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(plan.name)}`,
  ];

  for (const { workout, summary, description, durationMin } of events) {
    lines.push(
      "BEGIN:VEVENT",
      // Stable across exports, so re-importing updates the entry rather than
      // duplicating it. The plan id is in there because two plans can hold
      // workouts with the same id after an import.
      `UID:${workout.id}.${plan.id}@racepilot`,
      `DTSTAMP:${utcStamp(now)}`,
    );

    if (workout.startTime) {
      lines.push(
        `DTSTART:${localStamp(workout.date, workout.startTime)}`,
        `DTEND:${localStamp(workout.date, addMinutes(workout.startTime, durationMin && durationMin > 0 ? durationMin : 60))}`,
      );
    } else {
      // No start time means no claim about when: an all-day entry says "today"
      // without inventing an hour the athlete never chose.
      lines.push(
        `DTSTART;VALUE=DATE:${dateValue(workout.date)}`,
        `DTEND;VALUE=DATE:${dateValue(nextDay(workout.date))}`,
      );
    }

    lines.push(`SUMMARY:${escapeText(summary)}`);
    if (description.trim()) {
      lines.push(`DESCRIPTION:${escapeText(description)}`);
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  // CRLF throughout, and a trailing one: RFC 5545 wants every line terminated,
  // and some parsers drop a final line that is not.
  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}
