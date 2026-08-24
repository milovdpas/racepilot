"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrainingPrefsFields } from "@/components/common/training-prefs-fields";
import { AppearanceCard } from "@/components/settings/appearance-card";
import { AthleteCard } from "@/components/settings/athlete-card";
import { CloudSyncCard } from "@/components/settings/cloud-sync-card";
import { DataCard } from "@/components/settings/data-card";
import { DebugPanel } from "@/components/settings/debug-panel";
import { ExamplePlansCard } from "@/components/settings/example-plans-card";
import { FeaturesCard } from "@/components/settings/features-card";
import { InstallAppCard } from "@/components/settings/install-app-card";
import { PlansCard } from "@/components/settings/plans-card";
import { RaceDetailsCard } from "@/components/settings/race-details-card";
import { SupportCard } from "@/components/settings/support-card";
import { WatchCard } from "@/components/settings/watch-card";
import { Card } from "@/components/ui/card";
import { useActivePlan } from "@/hooks/use-active-plan";
import { DEFAULT_TRAINING_PREFS } from "@/lib/plan/defaults";
import { useTrainingStore } from "@/store/use-training-store";

export function SettingsView() {
  const { t } = useTranslation();
  const activePlan = useActivePlan();
  const updateTrainingPrefs = useTrainingStore((s) => s.updateTrainingPrefs);
  // Import results and "plan deleted" both report here, so the message lives
  // in the parent rather than in whichever card produced it.
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );

  return (
    <div className="space-y-5">
      <PlansCard
        onDeleted={() => setStatus({ ok: true, msg: t("settings.planDeleted") })}
      />

      <ExamplePlansCard />

      <RaceDetailsCard />

      {activePlan ? (
        <Card className="gap-0 p-4">
          <h3 className="mb-3 text-sm font-semibold">
            {t("settings.trainingPrefs")}
          </h3>
          <TrainingPrefsFields
            prefs={activePlan.trainingPrefs ?? DEFAULT_TRAINING_PREFS}
            onChange={(patch) => updateTrainingPrefs(patch)}
          />
        </Card>
      ) : null}

      <AthleteCard />

      <WatchCard />

      <FeaturesCard />

      <CloudSyncCard />

      <DataCard status={status} onStatus={setStatus} />

      <AppearanceCard />

      <InstallAppCard />

      <SupportCard />

      <DebugPanel />
    </div>
  );
}
