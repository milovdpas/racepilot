"use client";

import { Watch } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PlanStepsUpgrade } from "@/components/common/plan-steps-upgrade";
import { WatchPicker } from "@/components/common/watch-picker";
import { Card } from "@/components/ui/card";
import type { WatchBrand } from "@/lib/types";
import { useTrainingStore } from "@/store/use-training-store";


/**
 * Identity, not an opt-in feature, so this sits beside the athlete card rather
 * than inside `FeaturesCard`. Nothing here switches anything on: it decides
 * which instructions an export shows and which targets are offered.
 *
 * Writes on every pick, like the athlete card. There is no save button because
 * there is nothing to confirm — and `"none"` is a real option, so "I do not
 * have one" is expressible without an escape hatch.
 */
export function WatchCard() {
  const { t } = useTranslation();
  const watch = useTrainingStore((s) => s.preferences.watch);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

  return (
    <Card className="gap-0 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Watch className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t("watch.title")}</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{t("watch.body")}</p>

      <WatchPicker
        value={watch}
        onChange={(next: WatchBrand) => setPreferences({ watch: next })}
      />

      {watch === undefined ? (
        <p className="mt-3 text-xs text-muted-foreground">{t("watch.notSet")}</p>
      ) : null}

      <PlanStepsUpgrade />
    </Card>
  );
}
