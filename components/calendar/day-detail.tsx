"use client";

import { Plus, Umbrella } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { WeatherIcon } from "@/components/calendar/weather-badge";
import { FlexibleDayPicker } from "@/components/common/flexible-day-picker";
import { SplitsList } from "@/components/common/splits-list";
import { WorkoutRow } from "@/components/common/workout-row";
import { Button } from "@/components/ui/button";
import type { OffDay, WeatherSnapshot, Workout } from "@/lib/types";
import { getDayWeather } from "@/lib/weather/client";
import { useFormat } from "@/hooks/use-format";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/use-training-store";
import { useWeatherStore } from "@/store/use-weather-store";

export interface DayDetailProps {
  date: string | null;
  workouts: Workout[];
  flexibleInWindow?: Workout[];
  offDay?: OffDay;
  onToggle: (id: string) => void;
  onEdit: (w: Workout) => void;
  onOpen?: (w: Workout) => void;
  onAdd: (date: string) => void;
  onReschedule: (id: string, date: string) => void;
}

/** Workouts scheduled on the day plus flexible ones whose window covers it. */
export function dayItems(
  workouts: Workout[],
  flexibleInWindow: Workout[] = [],
): Workout[] {
  return [
    ...workouts,
    ...flexibleInWindow.filter((w) => !workouts.some((x) => x.id === w.id)),
  ];
}

/**
 * Everything about one day. Shared by the tap-a-date sheet and the full Day
 * view so the two can never drift apart.
 */
export function DayDetail({
  date,
  workouts,
  flexibleInWindow = [],
  offDay,
  onToggle,
  onEdit,
  onOpen,
  onAdd,
  onReschedule,
  className,
}: DayDetailProps & { className?: string }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const items = dayItems(workouts, flexibleInWindow);

  // Day weather (when the feature is enabled — independent of the calendar toggle).
  const weatherEnabled = useTrainingStore((s) => s.preferences.weatherEnabled);
  const weatherConfigured = useWeatherStore((s) => s.configured);
  // Primitives, not the `lastCoords` object: an optional-chained dep can't be
  // verified by the lint rule, and the object's identity changes every render.
  const lat = useWeatherStore((s) => s.lastCoords?.lat);
  const lon = useWeatherStore((s) => s.lastCoords?.lon);
  // Keyed by date so a stale snapshot never shows against a different day.
  const [weather, setWeather] = useState<{
    iso: string;
    snap: WeatherSnapshot;
  } | null>(null);

  useEffect(() => {
    if (!date || !weatherEnabled || !weatherConfigured) return;
    if (lat == null || lon == null) return;
    let cancelled = false;
    (async () => {
      const snap = await getDayWeather(lat, lon, date).catch(() => null);
      if (!cancelled && snap) setWeather({ iso: date, snap });
    })();
    return () => {
      cancelled = true;
    };
  }, [date, weatherEnabled, weatherConfigured, lat, lon]);

  const dayWeather = weather && weather.iso === date ? weather.snap : null;

  return (
    <div className={cn("space-y-2", className)}>
      {dayWeather ? (
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
          <WeatherIcon id={dayWeather.conditionId} className="size-5" />
          {dayWeather.tempC != null ? (
            <span className="text-sm font-semibold tabular-nums">
              {fmt.temp(dayWeather.tempC)}
            </span>
          ) : null}
          {dayWeather.condition ? (
            <span className="text-xs text-muted-foreground">
              {dayWeather.condition}
            </span>
          ) : null}
        </div>
      ) : null}

      {offDay ? (
        <div className="flex items-start gap-2 rounded-lg border border-tempo/30 bg-tempo/10 px-3 py-2">
          <Umbrella className="mt-0.5 size-4 shrink-0 text-tempo" />
          <div className="min-w-0">
            <p className="text-sm font-medium">{offDay.title}</p>
            {offDay.note ? (
              <p className="text-xs text-muted-foreground">{offDay.note}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("calendar.nothingScheduled")}
        </p>
      ) : (
        items.map((w) => (
          <div key={w.id} className="space-y-1.5">
            <WorkoutRow
              workout={w}
              onToggle={onToggle}
              onEdit={onEdit}
              onOpen={onOpen}
              showDate={false}
            />
            {w.splits && w.splits.length > 0 ? (
              <SplitsList splits={w.splits} className="pl-10" />
            ) : null}
            {w.flexible ? (
              <FlexibleDayPicker
                workout={w}
                onPick={(d) => onReschedule(w.id, d)}
              />
            ) : null}
          </div>
        ))
      )}

      {date ? (
        <Button variant="outline" className="w-full" onClick={() => onAdd(date)}>
          <Plus className="size-4" /> {t("calendar.addWorkout")}
        </Button>
      ) : null}
    </div>
  );
}
