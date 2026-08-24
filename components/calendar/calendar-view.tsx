"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AgendaView } from "@/components/calendar/agenda-view";
import { CalendarFooter } from "@/components/calendar/calendar-footer";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarViewTabs } from "@/components/calendar/calendar-view-tabs";
import { DayDetail } from "@/components/calendar/day-detail";
import { DayDetailSheet } from "@/components/calendar/day-detail-sheet";
import {
  useCalendarRange,
  useCalendarViewMode,
} from "@/components/calendar/use-calendar-nav";
import { useCalendarWeather } from "@/components/calendar/use-calendar-weather";
import { NoPlanState } from "@/components/common/no-plan-state";
import { useExportFormat } from "@/hooks/use-export-format";
import { targetFor } from "@/lib/export/target";
import { toast } from "@/store/use-toast-store";
import { WorkoutFormDialog } from "@/components/plan/workout-form-dialog";
import { Card } from "@/components/ui/card";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useWeekdayLabels } from "@/hooks/use-weekday-labels";
import { buildBarEvents } from "@/lib/calendar/layout";
import { offDayForDate, toISO, todayISO } from "@/lib/date";
import type { Workout } from "@/lib/types";
import { flexibleWindowIndex, groupByDate, upcomingWorkouts } from "@/lib/plan/workout";
import { useTrainingStore } from "@/store/use-training-store";

export function CalendarView() {
  const { t } = useTranslation();
  const plan = useActivePlan();
  const toggleComplete = useTrainingStore((s) => s.toggleComplete);
  const updateWorkout = useTrainingStore((s) => s.updateWorkout);

  const [view, setView] = useCalendarViewMode();
  const range = useCalendarRange(view);
  const weather = useCalendarWeather(range.days);
  const weekdays = useWeekdayLabels();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [addDate, setAddDate] = useState<string | null>(null);


  const workouts = useMemo(
    () => (plan ? Object.values(plan.workouts) : []),
    [plan],
  );
  const byDate = useMemo(() => groupByDate(workouts), [workouts]);
  const flexByWindow = useMemo(() => flexibleWindowIndex(workouts), [workouts]);
  const exportFormat = useExportFormat(plan);
  // Recomputed per render rather than memoised on a date: the app can sit open
  // across midnight, and an export offering yesterday would be a small lie.
  const upcoming = upcomingWorkouts(workouts, todayISO());
  const barEvents = useMemo(
    () => buildBarEvents(plan?.offDays ?? [], workouts),
    [plan, workouts],
  );

  // Below every hook: React's rules don't allow bailing out before them, and a
  // plan can disappear at runtime when the last one is deleted.
  if (!plan) return <NoPlanState />;

  /**
   * The whole plan from today onwards, not the visible range: someone putting
   * their training in a calendar wants the block ahead of them, not the
   * fortnight they happen to be looking at, and not a record of runs they have
   * already done.
   *
   * No dialog. There is exactly one thing this button does, and a dialog that
   * offers a single option is a dialog asking you to confirm you meant to click.
   */
  const exportCalendar = async () => {
    const target = targetFor("ics-file");
    if (!target) return;
    const result = await target.deliver({
      plan,
      workouts: upcoming,
      format: exportFormat,
      now: new Date(),
    });
    if (result.ok) toast.success(t("calendar.exported"));
    else toast.error(t("export.failed"));
  };

  const offDays = plan.offDays ?? [];
  const anchorIso = toISO(range.anchor);

  /** Flexible workouts whose window covers a day but that sit elsewhere, so
   *  the day view and sheet can offer to move them here. */
  const movableTo = (iso: string) =>
    (flexByWindow.get(iso) ?? []).filter((w) => w.date !== iso);

  const reschedule = (id: string, date: string) => updateWorkout(id, { date });

  return (
    <div className="space-y-4">
      <CalendarHeader
        title={range.rangeTitle}
        paged={range.paged}
        onToday={range.goToday}
        onPrev={range.goPrev}
        onNext={range.goNext}
        onExport={upcoming.length > 0 ? exportCalendar : undefined}
      />

      <CalendarViewTabs value={view} onChange={setView} />

      {view === "agenda" ? (
        // overflow-visible so the month headers inside can actually stick.
        <Card className="overflow-visible p-3">
          <AgendaView
            workouts={workouts}
            offDays={offDays}
            weather={weather}
            onToggle={toggleComplete}
            onEdit={setEditing}
          />
        </Card>
      ) : view === "day" ? (
        <Card className="p-4">
          <DayDetail
            date={anchorIso}
            workouts={byDate.get(anchorIso) ?? []}
            flexibleInWindow={movableTo(anchorIso)}
            offDay={offDayForDate(offDays, anchorIso)}
            onToggle={toggleComplete}
            onEdit={setEditing}
            onAdd={setAddDate}
            onReschedule={reschedule}
          />
        </Card>
      ) : (
        <CalendarGrid
          weeks={range.weeks}
          weekdays={weekdays}
          mode={view}
          anchor={range.anchor}
          byDate={byDate}
          barEvents={barEvents}
          weather={weather}
          onSelectDate={setSelectedDate}
        />
      )}

      <CalendarFooter view={view} />

      {/* Tapping a date in the grid opens a sheet, so you can peek at a day
          without losing your place. Same content as the day view. */}
      <DayDetailSheet
        date={selectedDate}
        workouts={selectedDate ? (byDate.get(selectedDate) ?? []) : []}
        flexibleInWindow={selectedDate ? movableTo(selectedDate) : []}
        offDay={selectedDate ? offDayForDate(offDays, selectedDate) : undefined}
        onReschedule={reschedule}
        onOpenChange={(o) => !o && setSelectedDate(null)}
        onToggle={toggleComplete}
        onEdit={(w) => {
          setSelectedDate(null);
          setEditing(w);
        }}
        onAdd={(d) => {
          setSelectedDate(null);
          setAddDate(d);
        }}
      />

      <WorkoutFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        workout={editing}
      />
      <WorkoutFormDialog
        open={!!addDate}
        onOpenChange={(o) => !o && setAddDate(null)}
        defaultDate={addDate ?? undefined}
      />
    </div>
  );
}
