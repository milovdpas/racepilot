"use client";

import { CalendarRange, Check, Pencil, Watch } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useFormat } from "@/hooks/use-format";
import { isMultiSport, workoutSport } from "@/lib/plan/workout";
import { formatDayLabel, formatRange } from "@/lib/date";
import type { Workout } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WorkoutTypeBadge } from "@/components/common/workout-type-badge";

export function WorkoutRow({
  workout,
  onToggle,
  onEdit,
  onSendToWatch,
  showDate = true,
  className,
}: {
  workout: Workout;
  onToggle?: (id: string) => void;
  onEdit?: (workout: Workout) => void;
  /** Offered only where a usable export target exists; see `availableTargets`. */
  onSendToWatch?: (workout: Workout) => void;
  showDate?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const plan = useActivePlan();
  const sport = workoutSport(workout, plan);
  // Labelled only when the plan actually mixes sports; otherwise the icon just
  // repeats what every other row already says.
  const showSport = plan ? isMultiSport(plan) : false;
  const { completed } = workout;
  const hasActual =
    workout.actualDistanceKm != null || workout.actualPace != null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5 transition-colors",
        completed && "border-primary/30 bg-primary/[0.04]",
        className,
      )}
    >
      {onToggle ? (
        <button
          type="button"
          aria-label={completed ? "Mark incomplete" : "Mark complete"}
          onClick={() => onToggle(workout.id)}
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full border transition-colors",
            completed
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 text-transparent hover:border-primary",
          )}
        >
          <Check className="size-4" strokeWidth={3} />
        </button>
      ) : null}

      <div className="min-w-0 flex-1">
        {/* One line of pills. The flexible pill is the only one that can
            shrink, and it truncates rather than wrapping the row. */}
        <div className="flex min-w-0 items-center gap-2">
          <WorkoutTypeBadge
            type={workout.type}
            sport={showSport ? sport : undefined}
          />
          {workout.flexible && workout.windowStart && workout.windowEnd ? (
            /* Just the window: spelling out "Flexible" as well pushed the pill
               past the available width and truncated it to "Flexibl…". The
               icon carries the meaning and the legend maps it. */
            <span
              title={`${t("workoutRow.flexible")} · ${formatRange(workout.windowStart, workout.windowEnd)}`}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-tempo/15 px-2 py-0.5 text-[10px] font-medium text-tempo"
            >
              <CalendarRange className="size-3 shrink-0" />
              {formatRange(workout.windowStart, workout.windowEnd)}
            </span>
          ) : null}
          {workout.isCustom ? (
            <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {t("workoutRow.custom")}
            </span>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-1 truncate text-sm font-medium",
            completed && "text-muted-foreground line-through",
          )}
        >
          {workout.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {showDate ? <>{formatDayLabel(workout.date)} · </> : null}
          {hasActual && completed
            ? `${fmt.distance(
                workout.actualDistanceKm ?? workout.plannedDistanceKm,
              )} · ${fmt.pace(workout.actualPace ?? workout.plannedPace, sport)}`
            : `${fmt.distance(workout.plannedDistanceKm)} · ${fmt.pace(
                workout.plannedPace,
                sport,
              )}`}
        </p>
      </div>

      {onSendToWatch ? (
        <button
          type="button"
          aria-label="Send to watch"
          onClick={() => onSendToWatch(workout)}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Watch className="size-4" />
        </button>
      ) : null}

      {onEdit ? (
        <button
          type="button"
          aria-label="Edit workout"
          onClick={() => onEdit(workout)}
          className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Pencil className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
