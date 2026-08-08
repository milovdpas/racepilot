"use client";

import { CheckCheck, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SportIcon } from "@/components/common/sport-icon";
import { StatCard } from "@/components/common/stat-card";
import { StatGrid } from "@/components/stats/stat-grid";
import { useDuration } from "@/hooks/use-duration";
import type { OverallStats, SportStats } from "@/lib/plan/stats";

/**
 * A multi-sport plan's figures: one full section per sport, then the totals
 * that survive being added across them.
 *
 * This used to be a single summary row per sport, which told a triathlete less
 * than a runner gets on the same page. Now each sport shows exactly what a
 * single-sport plan shows, in its own units — and the overall section carries
 * only the two figures that can honestly be summed, because distance and pace
 * cannot be.
 */
export function SportBreakdown({
  bySport,
  overall,
}: {
  bySport: SportStats[];
  overall: OverallStats;
}) {
  const { t } = useTranslation();
  const duration = useDuration();

  if (bySport.length < 2) return null;

  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold">{t("stats.overall")}</h3>
        <p className="text-xs text-muted-foreground">{t("stats.overallSub")}</p>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label={t("stats.totalTime")}
            value={duration(overall.totalTimeMin)}
            icon={<Timer className="size-4" />}
          />
          <StatCard
            label={t("stats.runsCompleted")}
            value={overall.completedCount}
            sub={t("stats.pctOfPlan", { pct: overall.completionPct })}
            icon={<CheckCheck className="size-4" />}
          />
        </div>
      </section>
      {bySport.map((s) => (
        <section key={s.sport} className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <SportIcon sport={s.sport} className="size-4 text-primary" />
            {t(`sport.${s.sport}Plural`)}
          </h3>
          <StatGrid stats={s} sport={s.sport} />
        </section>
      ))}
    </div>
  );
}
