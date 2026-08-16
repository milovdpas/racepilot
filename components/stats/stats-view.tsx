"use client";

import { Maximize2 } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { NoPlanState } from "@/components/common/no-plan-state";
import { LongRunProgressChart } from "@/components/stats/longrun-progress-chart";
import { SplitPaceChart } from "@/components/stats/split-pace-chart";
import { SportBreakdown } from "@/components/stats/sport-breakdown";
import { StatGrid } from "@/components/stats/stat-grid";
import { WeeklyHistoryChart } from "@/components/stats/weekly-history-chart";
import { WeeklyTrendChart } from "@/components/stats/weekly-trend-chart";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useFormat } from "@/hooks/use-format";
import { isMultiSport } from "@/lib/plan/workout";
import { DEFAULT_SPORT } from "@/lib/sport";
import { useStats } from "@/hooks/use-stats";
import { formatDayLabel } from "@/lib/date";
import { latestSplitRun, statsBySport, weeklyHistory } from "@/lib/plan/stats";
import { useTrainingStore } from "@/store/use-training-store";

export function StatsView() {
  const { t } = useTranslation();
  const fmt = useFormat();
  const plan = useActivePlan();
  const stats = useStats(plan);
  const plans = useTrainingStore((s) => s.plans);

  // Every logged run across all plans, bucketed by calendar week.
  const history = useMemo(
    () =>
      weeklyHistory(
        Object.values(plans).flatMap((p) => Object.values(p.workouts)),
      ),
    [plans],
  );

  if (!plan || !stats) return <NoPlanState />;
  const { overall } = stats;
  // Most recent run that has scanned splits (null until one is scanned).
  const splitRun = latestSplitRun(plan);
  const bySport = statsBySport(plan);
  const mixed = isMultiSport(plan);
  // A single-sport plan's totals belong to that sport, so the pace card has to
  // speak its language: km/h for a cycling plan, not min/km.
  const planSport = plan.sport ?? DEFAULT_SPORT;

  return (
    <div className="space-y-5">
      {/* A single-sport plan gets one grid over everything; a mixed plan gets
          the same grid per sport, then the totals that can honestly be summed.
          Neither ever adds a swim to a bike ride. */}
      {mixed ? (
        <SportBreakdown bySport={bySport} overall={overall} />
      ) : (
        <StatGrid stats={overall} sport={planSport} />
      )}

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">{t("stats.weeklyMileage")}</h3>
          <Dialog>
            <DialogTrigger
              render={
                <button
                  type="button"
                  aria-label={t("stats.historyTitle")}
                  className="grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
                />
              }
            >
              <Maximize2 className="size-4" />
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("stats.historyTitle")}</DialogTitle>
                <DialogDescription>{t("stats.historySub")}</DialogDescription>
              </DialogHeader>
              <WeeklyHistoryChart data={history} />
            </DialogContent>
          </Dialog>
        </div>
        <WeeklyTrendChart data={stats.weekly} />
      </Card>

      {splitRun ? (
        <Card className="p-4">
          <h3 className="mb-1 text-sm font-semibold">{t("stats.splitPaces")}</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            {t("stats.splitPacesSub", {
              title: splitRun.title,
              date: formatDayLabel(splitRun.date),
              // Splits come from the run scanner, so they are always run paces.
              fastest: fmt.pace(splitRun.fastestPace, "run"),
              slowest: fmt.pace(splitRun.slowestPace, "run"),
            })}
          </p>
          <SplitPaceChart splits={splitRun.splits} />
        </Card>
      ) : null}

      <Card className="p-4">
        <h3 className="mb-1 text-sm font-semibold">
          {t("stats.longRunProgression")}
        </h3>
        <p className="mb-3 text-xs text-muted-foreground">
          {t("stats.longRunHint")}
        </p>
        <LongRunProgressChart data={stats.longRuns} />
      </Card>
    </div>
  );
}
