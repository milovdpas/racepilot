"use client";

import { CalendarPlus, ChevronDown, Flag, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CompleteWorkoutDialog } from "@/components/common/complete-workout-dialog";
import { SendToWatchDialog } from "@/components/export/send-to-watch-dialog";
import { availableTargets, targetFor } from "@/lib/export/target";
import { FlexibleDayPicker } from "@/components/common/flexible-day-picker";
import { NoPlanState } from "@/components/common/no-plan-state";
import { WorkoutRow } from "@/components/common/workout-row";
import { WorkoutFormDialog } from "@/components/plan/workout-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRange, todayISO } from "@/lib/date";
import { isPlanFinished } from "@/lib/plan/context";
import { overallStats } from "@/lib/plan/stats";
import { type WeekPhase, type Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useExportFormat } from "@/hooks/use-export-format";
import { useFormat } from "@/hooks/use-format";
import { toast } from "@/store/use-toast-store";
import { upcomingWorkouts } from "@/lib/plan/workout";
import { useTrainingStore } from "@/store/use-training-store";

const PHASE_BADGE: Record<WeekPhase, string> = {
  base: "bg-muted text-muted-foreground",
  build: "bg-long/15 text-long",
  peak: "bg-primary/15 text-primary",
  taper: "bg-tempo/15 text-tempo",
  race: "bg-primary text-primary-foreground",
  reduced: "bg-recovery/15 text-recovery",
};

export function PlanView() {
  const { t } = useTranslation();
  const fmt = useFormat();
  const router = useRouter();
  const plan = useActivePlan();
  const toggleComplete = useTrainingStore((s) => s.toggleComplete);
  const updateWorkout = useTrainingStore((s) => s.updateWorkout);

  const today = todayISO();
  const currentWeek = plan?.weeks.find(
    (w) => today >= w.startDate && today <= w.endDate,
  );
  const [open, setOpen] = useState<Set<number>>(
    new Set(currentWeek ? [currentWeek.weekNumber] : [1]),
  );
  const [editing, setEditing] = useState<Workout | null>(null);
  const [adding, setAdding] = useState(false);
  const [completing, setCompleting] = useState<Workout | null>(null);
  const [sending, setSending] = useState<Workout | null>(null);
  const exportFormat = useExportFormat(plan);
  // Whether "send to watch" is worth offering at all. A Polar owner has no
  // workout-scope target, and a button that opens an empty dialog is worse than
  // no button. The factory decides, not this view.
  const [canSend, setCanSend] = useState(false);
  const preferences = useTrainingStore((s) => s.preferences);
  useEffect(() => {
    let live = true;
    void availableTargets(preferences, "workout").then((targets) => {
      if (live) setCanSend(targets.length > 0);
    });
    return () => {
      live = false;
    };
  }, [preferences]);

  if (!plan) return <NoPlanState />;

  const finishedStats = overallStats(plan);

  // Completing opens the quick-log dialog (prefilled); un-checking just flips it.
  /** Every session from today onwards: what the athlete still has to do. */
  const upcoming = upcomingWorkouts(Object.values(plan.workouts), today);

  /**
   * The plan as a calendar file: every session from today onwards, not the
   * visible week and not the ones already behind them.
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

  const handleToggle = (id: string) => {
    const w = plan.workouts[id];
    if (!w) return;
    if (w.completed) toggleComplete(id);
    else setCompleting(w);
  };

  const toggleWeek = (n: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });

  return (
    <div className="space-y-3">
      {isPlanFinished(plan) ? (
        <div className="rounded-xl border border-primary/30 bg-primary/[0.06] p-4">
          <div className="flex items-center gap-2">
            <Flag className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">{t("plan.finishedTitle")}</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("plan.finishedBody", {
              race: plan.raceName,
              distance: fmt.distance(finishedStats.totalKm),
              runs: finishedStats.completedCount,
            })}
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => router.push(`/app/plan/new?from=${plan.id}`)}
          >
            <Flag className="size-4" /> {t("plan.createNext")}
          </Button>
        </div>
      ) : null}

      <div className="flex justify-between gap-2">
        {/* The whole block, not a single session: that is what a calendar is
            for, and it is why this sits here and on the calendar rather than
            beside one workout. */}
        <Button
          variant="outline"
          size="sm"
          disabled={upcoming.length === 0}
          onClick={() => void exportCalendar()}
        >
          <CalendarPlus className="size-4" /> {t("calendar.exportIcs")}
        </Button>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus className="size-4" /> {t("plan.addWorkout")}
        </Button>
      </div>

      {plan.weeks.map((week) => {
        const workouts = (
          week.workoutIds.map((id) => plan.workouts[id]).filter(Boolean) as Workout[]
        ).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        const planned = workouts.reduce((s, w) => s + w.plannedDistanceKm, 0);
        const done = workouts.filter((w) => w.completed).length;
        const isOpen = open.has(week.weekNumber);
        const isCurrent = week.weekNumber === currentWeek?.weekNumber;

        return (
          <div
            key={week.weekNumber}
            className={cn(
              "overflow-hidden rounded-xl border bg-card",
              isCurrent && "ring-1 ring-primary/40",
            )}
          >
            <button
              type="button"
              onClick={() => toggleWeek(week.weekNumber)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">
                    {t("plan.week", { n: week.weekNumber })}
                  </span>
                  <Badge
                    className={cn(
                      "border-transparent text-[10px]",
                      PHASE_BADGE[week.phase],
                    )}
                  >
                    {t(`phase.${week.phase}`)}
                  </Badge>
                  {week.label ? (
                    <span className="text-xs text-muted-foreground">
                      · {week.label}
                    </span>
                  ) : null}
                  {isCurrent ? (
                    <span className="text-[10px] font-semibold uppercase text-primary">
                      {t("plan.thisWeek")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("plan.weekMeta", {
                    range: formatRange(week.startDate, week.endDate),
                    distance: fmt.distance(planned, 0),
                    done,
                    total: workouts.length,
                  })}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "size-5 shrink-0 text-muted-foreground transition-transform",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {isOpen ? (
              <div className="space-y-2 border-t bg-muted/30 p-3">
                {workouts.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-muted-foreground">
                    {t("plan.restWeek")}
                  </p>
                ) : (
                  workouts.map((w) => {
                    const isFlexible =
                      w.flexible && w.windowStart && w.windowEnd;
                    if (isFlexible) {
                      // Row + day-picker read as one card with an orange tint.
                      return (
                        <div
                          key={w.id}
                          className={cn(
                            "overflow-hidden rounded-xl border bg-card",
                            w.completed
                              ? "border-primary/30 bg-primary/[0.04]"
                              : "border-tempo/40 bg-tempo/[0.05]",
                          )}
                        >
                          <WorkoutRow
                            workout={w}
                            onToggle={handleToggle}
                            onEdit={setEditing}
                            onSendToWatch={canSend ? setSending : undefined}
                            className="rounded-none border-0 bg-transparent"
                          />
                          <div
                            className={cn(
                              "border-t px-3 py-2",
                              w.completed
                                ? "border-primary/20"
                                : "border-tempo/20",
                            )}
                          >
                            <FlexibleDayPicker
                              workout={w}
                              onPick={(iso) =>
                                updateWorkout(w.id, { date: iso })
                              }
                            />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <WorkoutRow
                        key={w.id}
                        workout={w}
                        onToggle={handleToggle}
                        onEdit={setEditing}
                        onSendToWatch={canSend ? setSending : undefined}
                      />
                    );
                  })
                )}
              </div>
            ) : null}
          </div>
        );
      })}

      <WorkoutFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        workout={editing}
      />
      <WorkoutFormDialog
        open={adding}
        onOpenChange={setAdding}
        defaultDate={today}
      />
      <SendToWatchDialog
        open={!!sending}
        onOpenChange={(o) => !o && setSending(null)}
        plan={plan}
        workouts={sending ? [sending] : []}
      />

      <CompleteWorkoutDialog
        workout={completing}
        open={!!completing}
        onOpenChange={(o) => !o && setCompleting(null)}
      />
    </div>
  );
}
