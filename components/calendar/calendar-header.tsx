"use client";

import { CalendarPlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

/**
 * The range title, plus Today/prev/next when the view is pageable, plus the
 * calendar export.
 *
 * The export lives here rather than in Settings because this is where someone
 * already is when they think "I want this in my calendar". It is deliberately
 * not framed as a watch feature: it produces calendar entries, which reach the
 * wrist through the phone, not a workout the watch guides you through.
 */
export function CalendarHeader({
  title,
  paged,
  onToday,
  onPrev,
  onNext,
  onExport,
}: {
  title: string;
  paged: boolean;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onExport?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-1">
        {onExport ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            aria-label={t("calendar.exportIcs")}
            title={t("calendar.exportIcs")}
          >
            <CalendarPlus className="size-4" />
          </Button>
        ) : null}
        {paged ? (
          <>
            <Button variant="outline" size="sm" onClick={onToday}>
              {t("calendar.today")}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("calendar.prev")}
              onClick={onPrev}
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("calendar.next")}
              onClick={onNext}
            >
              <ChevronRight className="size-5" />
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
