"use client";

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
import {
  Accordion,
  AccordionItem,
  AccordionPanel,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { useActivePlan } from "@/hooks/use-active-plan";
import { DEFAULT_TRAINING_PREFS } from "@/lib/plan/defaults";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";

/** The sections, in order. Also the persisted values, so keep them stable. */
const SECTIONS = ["plan", "data", "profile", "features", "app"] as const;
type Section = (typeof SECTIONS)[number];

/**
 * Settings, grouped.
 *
 * It reached fifteen cards in one column, which is a list you scroll rather
 * than a page you read: finding the weather toggle meant knowing roughly how
 * far down it lived. Four groups make the shape visible from the top.
 *
 * Sections open independently rather than exclusively. Someone comparing two
 * settings should not have to close one to see the other, and the accordion
 * has no reason to enforce a rule the page does not need.
 *
 * Two things stay *outside* at the bottom. The debug panel, because its whole
 * interface is ten taps on the version line and a tap target behind a collapsed
 * section is one nobody can reach. And the support card, for the opposite
 * reason: an ask you have to go looking for is an ask nobody answers.
 */
export function SettingsView() {
  const { t } = useTranslation();
  const activePlan = useActivePlan();
  const updateTrainingPrefs = useTrainingStore((s) => s.updateTrainingPrefs);
  const open = useTrainingStore((s) => s.preferences.settingsSections);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

  return (
    <div className="space-y-5">
      <Accordion
        // Absent means never touched, which opens the first section: the plan
        // is what most visits are about. An empty array is a real answer,
        // everything closed, so the two must stay distinguishable.
        value={open ?? [SECTIONS[0]]}
        onValueChange={(next) =>
          setPreferences({ settingsSections: next as Section[] })
        }
      >
        <AccordionItem value="plan">
          <AccordionTrigger>{t("settings.groupPlan")}</AccordionTrigger>
          <AccordionPanel>
            <div className="space-y-5">
              <PlansCard
                onDeleted={() => toast.success(t("settings.planDeleted"))}
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
            </div>
          </AccordionPanel>
        </AccordionItem>

        {/* Its own section rather than a card inside "Your plan". Filed under
            "App" nobody found it, and buried among race details and training
            preferences it is still something you have to already know is
            there. The heading names the two jobs people actually come for. */}
        <AccordionItem value="data">
          <AccordionTrigger>{t("settings.groupData")}</AccordionTrigger>
          <AccordionPanel>
            <DataCard />
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="profile">
          <AccordionTrigger>{t("settings.groupProfile")}</AccordionTrigger>
          <AccordionPanel>
            <div className="space-y-5">
              <AthleteCard />
              <WatchCard />
            </div>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="features">
          <AccordionTrigger>{t("settings.groupFeatures")}</AccordionTrigger>
          <AccordionPanel>
            <div className="space-y-5">
              <FeaturesCard />
              <CloudSyncCard />
            </div>
          </AccordionPanel>
        </AccordionItem>

        <AccordionItem value="app">
          <AccordionTrigger>{t("settings.groupApp")}</AccordionTrigger>
          <AccordionPanel>
            <div className="space-y-5">
              <AppearanceCard />
            </div>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* Both outside, and for the same reason as each other: they are offers,
          not settings. An offer you have to go looking for is one nobody takes,
          and neither renders anything at all when it does not apply - the
          install card hides once installed, and support hides unless the
          deployment enables it. */}
      <InstallAppCard />

      <SupportCard />

      <DebugPanel />
    </div>
  );
}
