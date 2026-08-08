"use client";

import { Gauge, Mountain, Route, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { StatCard } from "@/components/common/stat-card";
import { useFormat } from "@/hooks/use-format";
import type { OverallStats } from "@/lib/plan/stats";
import { PACE_STYLE, type Sport } from "@/lib/sport";

/**
 * The four headline figures for one sport.
 *
 * Shared between a single-sport plan (one grid over everything) and a
 * multi-sport plan (one grid per sport), so a triathlete sees exactly what a
 * runner sees — just three times, each in its own units. Nothing here is ever
 * summed across sports: 40 km on a bike and 10 km running is not 50 km of
 * anything.
 */
export function StatGrid({
  stats,
  sport,
}: {
  stats: OverallStats;
  sport: Sport;
}) {
  const { t } = useTranslation();
  const fmt = useFormat();

  return (
    <div className="grid grid-cols-2 gap-3">
      <StatCard
        label={t("stats.totalDistance")}
        value={fmt.distanceNumber(stats.totalKm)}
        unit={fmt.distanceUnit}
        sub={t("stats.ofPlanned", {
          distance: fmt.distance(stats.plannedTotalKm),
        })}
        icon={<Route className="size-4" />}
      />
      <StatCard
        label={t("stats.longestRun")}
        value={fmt.distanceNumber(stats.longestRunKm)}
        unit={fmt.distanceUnit}
        icon={<Mountain className="size-4" />}
      />
      <StatCard
        // A cyclist's average is a speed, not a pace: 29 km/h under a label
        // reading "Avg pace" is simply the wrong word.
        label={t(
          PACE_STYLE[sport] === "speed" ? "stats.avgSpeed" : "stats.avgPace",
        )}
        value={fmt.paceValue(stats.averagePace, sport)}
        unit={fmt.speedUnitFor(sport)}
        icon={<Gauge className="size-4" />}
      />
      <StatCard
        label={t("stats.runsCompleted")}
        value={stats.completedCount}
        sub={t("stats.pctOfPlan", { pct: stats.completionPct })}
        icon={<Timer className="size-4" />}
      />
    </div>
  );
}
