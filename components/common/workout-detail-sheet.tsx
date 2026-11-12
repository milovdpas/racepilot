"use client";

import { Check, Pencil, Undo2, Watch } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { WeatherIcon } from "@/components/calendar/weather-badge";
import { SplitsList } from "@/components/common/splits-list";
import { WorkoutTypeBadge } from "@/components/common/workout-type-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SheetContent } from "@/components/ui/sheet";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useDuration } from "@/hooks/use-duration";
import { useFormat } from "@/hooks/use-format";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatDayLabel, formatRange } from "@/lib/date";
import { secondsToPace } from "@/lib/pace";
import { describeStep, type StepFormat } from "@/lib/plan/workout-steps";
import { isMultiSport, workoutSport } from "@/lib/plan/workout";
import type { Sport } from "@/lib/sport";
import type { StepRole, Workout, WorkoutBlock } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface WorkoutDetailActions {
  onToggle?: (id: string) => void;
  onEdit?: (workout: Workout) => void;
  onSendToWatch?: (workout: Workout) => void;
}

/**
 * State for one detail sheet per view. The workout is kept after closing so
 * the sheet doesn't empty out while it animates away.
 */
export function useWorkoutDetail() {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [open, setOpen] = useState(false);
  return {
    show: (w: Workout) => {
      setWorkout(w);
      setOpen(true);
    },
    sheet: { workout, open, onOpenChange: setOpen },
  };
}

/**
 * Everything about one workout, opened by tapping its row: the full title
 * (which a row can only truncate), the structure, and what was logged.
 *
 * A bottom sheet on a phone, a centred dialog from `sm` up. The actions are
 * whatever the view passes, the same handlers its row buttons use, so a view
 * that can't edit doesn't offer Edit here either. Each closes the sheet first:
 * they open dialogs of their own, and two modals fight over focus.
 */
export function WorkoutDetailSheet({
  workout,
  open,
  onOpenChange,
  ...actions
}: WorkoutDetailActions & {
  workout: Workout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {workout ? (
        <DetailFrame
          workout={workout}
          close={() => onOpenChange(false)}
          {...actions}
        />
      ) : null}
    </Dialog>
  );
}

function DetailFrame({
  workout,
  close,
  onToggle,
  onEdit,
  onSendToWatch,
}: WorkoutDetailActions & { workout: Workout; close: () => void }) {
  const { t } = useTranslation();
  const wide = useMediaQuery("(min-width: 40rem)");
  const plan = useActivePlan();
  // The live copy, so a run logged or re-dated from here shows straight away.
  const w = plan?.workouts[workout.id] ?? workout;
  const sport = workoutSport(w, plan);

  const act = (fn: () => void) => () => {
    close();
    fn();
  };
  const hasActions = !!(onToggle || onEdit || onSendToWatch);

  const header = (
    <div className="space-y-2 p-4 pr-12">
      <div className="flex flex-wrap items-center gap-2">
        <WorkoutTypeBadge
          type={w.type}
          sport={plan && isMultiSport(plan) ? sport : undefined}
        />
        {w.completed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
            <Check className="size-3" strokeWidth={3} />
            {t("workoutDetail.done")}
          </span>
        ) : null}
      </div>
      <DialogTitle className="text-base leading-snug font-semibold">
        {w.title}
      </DialogTitle>
      <DialogDescription className="text-xs">
        {formatDayLabel(w.date)}
        {w.flexible && w.windowStart && w.windowEnd
          ? ` · ${t("workoutRow.flexible")} ${formatRange(w.windowStart, w.windowEnd)}`
          : null}
      </DialogDescription>
    </div>
  );

  const footer = hasActions ? (
    <div
      className={cn(
        "flex flex-wrap gap-2 border-t bg-muted/50 p-4",
        "[&>button]:h-11 [&>button]:flex-auto sm:[&>button]:h-9",
        !wide && "pb-[max(1rem,env(safe-area-inset-bottom))]",
      )}
    >
      {onToggle ? (
        w.completed ? (
          <Button variant="outline" onClick={act(() => onToggle(w.id))}>
            <Undo2 className="size-4" /> {t("workoutDetail.markIncomplete")}
          </Button>
        ) : (
          <Button onClick={act(() => onToggle(w.id))}>
            <Check className="size-4" /> {t("workoutDetail.markComplete")}
          </Button>
        )
      ) : null}
      {onEdit ? (
        <Button variant="outline" onClick={act(() => onEdit(w))}>
          <Pencil className="size-4" /> {t("common.edit")}
        </Button>
      ) : null}
      {onSendToWatch ? (
        <Button variant="outline" onClick={act(() => onSendToWatch(w))}>
          <Watch className="size-4" /> {t("export.sendToWatch")}
        </Button>
      ) : null}
    </div>
  ) : null;

  // Only the middle scrolls, so the title and the actions stay in reach of a
  // marathon's worth of splits.
  const body = (
    <div className="min-h-0 overflow-y-auto px-4 pb-4">
      <DetailBody workout={w} />
    </div>
  );

  return wide ? (
    <DialogContent className="grid grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-md">
      {header}
      {body}
      {footer}
    </DialogContent>
  ) : (
    <SheetContent
      side="bottom"
      className="max-h-[85dvh] gap-0 overflow-hidden rounded-t-2xl"
    >
      {header}
      {body}
      {footer}
    </SheetContent>
  );
}

function DetailBody({ workout: w }: { workout: Workout }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const duration = useDuration();
  const plan = useActivePlan();
  const sport = workoutSport(w, plan);
  const hasActual =
    w.actualDistanceKm != null || w.actualPace != null || w.durationMin != null;

  const logged = [
    fmt.pace(w.actualPace ?? w.plannedPace, sport),
    w.durationMin != null ? duration(w.durationMin) : null,
    w.startTime ? t("workoutDetail.startedAt", { time: w.startTime }) : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <Fact
          label={t("workoutDetail.planned")}
          value={fmt.distance(w.plannedDistanceKm)}
          sub={fmt.pace(w.plannedPace, sport)}
        />
        {hasActual ? (
          <Fact
            label={t("workoutDetail.logged")}
            value={fmt.distance(w.actualDistanceKm ?? w.plannedDistanceKm)}
            sub={logged.join(" · ")}
            highlight
          />
        ) : null}
      </div>

      {w.steps && w.steps.length > 0 ? (
        <Section title={t("steps.title")}>
          <StepList steps={w.steps} sport={sport} />
        </Section>
      ) : null}

      {w.weather ? (
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <WeatherIcon id={w.weather.conditionId} className="size-5" />
          {w.weather.tempC != null ? (
            <span className="text-sm font-semibold tabular-nums">
              {fmt.temp(w.weather.tempC)}
            </span>
          ) : null}
          {w.weather.condition ? (
            <span className="text-xs text-muted-foreground">
              {w.weather.condition}
            </span>
          ) : null}
        </div>
      ) : null}

      {w.notes ? (
        <Section title={t("workoutForm.notes")}>
          <p className="text-sm whitespace-pre-wrap">{w.notes}</p>
        </Section>
      ) : null}

      {w.splits && w.splits.length > 0 ? (
        <Section title={t("workoutDetail.splits")}>
          <SplitsList splits={w.splits} />
        </Section>
      ) : null}
    </div>
  );
}

/** Warm-up, repeats and cool-down, one block per line. */
function StepList({
  steps,
  sport,
}: {
  steps: WorkoutBlock[];
  sport: Sport;
}) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const role = (r: StepRole) => t(`steps.role.${r}`);

  const stepFmt: StepFormat = {
    // "800 m" rather than "0.8 km": that is how a track session is written.
    distance: (km) => {
      if (fmt.units === "metric" && km < 1) return `${Math.round(km * 1000)} m`;
      const n = fmt.distanceNumber(km);
      return fmt.distance(km, Number.isInteger(n) ? 0 : n < 1 ? 2 : 1);
    },
    duration: (sec) =>
      sec % 60 === 0
        ? t("steps.minutesShort", { count: sec / 60 })
        : `${secondsToPace(sec)} min`,
    pace: (p) => fmt.pace(p, sport),
    role,
  };

  return (
    <ol className="space-y-2 text-sm">
      {steps.map((block, i) =>
        block.kind === "step" ? (
          <li key={i} className="flex gap-3">
            <span className="w-20 shrink-0 text-xs leading-5 text-muted-foreground">
              {role(block.role)}
            </span>
            <span className="min-w-0">
              {describeStep(block, stepFmt)}
              {block.note ? (
                <span className="block text-xs text-muted-foreground">
                  {block.note}
                </span>
              ) : null}
            </span>
          </li>
        ) : (
          <li key={i} className="flex gap-3">
            <span className="w-20 shrink-0 text-xs leading-5 font-semibold tabular-nums">
              {block.times} ×
            </span>
            <ol className="min-w-0 space-y-0.5">
              {block.steps.map((s, j) => (
                <li key={j}>
                  {describeStep(s, stepFmt)}
                  {/* "Work" is the default and adds nothing. */}
                  {s.role !== "work" ? (
                    <span className="text-muted-foreground"> · {role(s.role)}</span>
                  ) : null}
                  {s.note ? (
                    <span className="block text-xs text-muted-foreground">
                      {s.note}
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          </li>
        ),
      )}
    </ol>
  );
}

function Fact({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        highlight && "border-primary/30 bg-primary/[0.04]",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}
