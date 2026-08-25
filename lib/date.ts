import { format, parseISO } from "date-fns";
import { getDateLocale } from "@/lib/date-locale";
import type { OffDay } from "@/lib/types";

/** Canonical ISO (yyyy-mm-dd) string for a Date, in local time. */
export function toISO(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Parse a yyyy-mm-dd string as a local Date (midnight). */
export function fromISO(iso: string): Date {
  return parseISO(iso);
}

/** Today as a yyyy-mm-dd string (local). */
export function todayISO(): string {
  return toISO(new Date());
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Human label like "Mon 22 Jun". */
export function formatDayLabel(iso: string): string {
  return format(parseISO(iso), "EEE d MMM", { locale: getDateLocale() });
}

/**
 * Month and year, like "Feb 2024".
 *
 * For spans measured in years, where `formatDayLabel` is the wrong tool: it
 * omits the year, so an imported history running from Feb 2024 to Aug 2026
 * would read "Tue 6 Feb to Sun 23 Aug" and look like six months.
 */
export function formatMonthYear(iso: string): string {
  return format(parseISO(iso), "MMM yyyy", { locale: getDateLocale() });
}

/** Human range like "22–28 Jun" / "29 Jun – 5 Jul". */
export function formatRange(startISO: string, endISO: string): string {
  const s = parseISO(startISO);
  const e = parseISO(endISO);
  const locale = getDateLocale();
  const sameMonth = s.getMonth() === e.getMonth();
  return sameMonth
    ? `${format(s, "d")}–${format(e, "d MMM", { locale })}`
    : `${format(s, "d MMM", { locale })} – ${format(e, "d MMM", { locale })}`;
}

/**
 * Split a day list into weeks of 7. Both the calendar grid and the weather
 * fetcher need this, and both assume the input is Monday-aligned and a whole
 * number of weeks (see `visibleDays`).
 */
export function chunkWeeks<T>(days: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7));
  return out;
}

/** The off-day period covering a given ISO date, if any. */
export function offDayForDate(
  offDays: OffDay[] | undefined,
  iso: string,
): OffDay | undefined {
  if (!offDays) return undefined;
  return offDays.find((o) => iso >= o.start && iso <= o.end);
}
