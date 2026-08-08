"use client";

import { useTranslation } from "react-i18next";

/**
 * Formats a duration in minutes as "2h 13m", or "45m" under the hour.
 *
 * A hook rather than a plain function so callers don't have to thread `t`
 * through their signatures — which fights i18next's generics as soon as the
 * parameter is typed by hand.
 */
export function useDuration(): (minutes: number) => string {
  const { t } = useTranslation();
  return (minutes: number) => {
    const total = Math.max(0, Math.round(minutes));
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h > 0 ? t("stats.hours", { h, m }) : `${m}m`;
  };
}
