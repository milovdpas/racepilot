"use client";

import { Download, ScanText, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AthleteTypePicker } from "@/components/common/athlete-type-picker";
import { InstallInstructions } from "@/components/common/install-instructions";
import { OnboardingStep } from "@/components/common/onboarding-step";
import { SplitsExample } from "@/components/common/splits-example";
import { useInstallApp } from "@/hooks/use-install-app";
import { isLegacyHost } from "@/lib/legacy-host";
import type { AthleteType } from "@/lib/types";
import { useTrainingStore } from "@/store/use-training-store";

interface Step {
  key: string;
  applies: boolean;
  render: (next: () => void) => React.ReactNode;
}

/**
 * Announcements, shown one at a time.
 *
 * First-run prompts used to live here too; they moved to the full-page flow at
 * `/welcome`. What's left is the channel for telling *existing* users about
 * something new — each step declares when it applies, the gate renders the
 * first applicable one from the cursor onward, and both buttons advance past
 * it, so a step is only ever shown once.
 *
 * A step's `applies` may flip from false to true after mount (the install
 * prompt only becomes available when Chrome fires `beforeinstallprompt`), so
 * the list is recomputed on every render rather than snapshotted.
 */
function useWhatsNewSteps(): Step[] {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { mode, install } = useInstallApp();

  const hydrated = useTrainingStore((s) => s.hydrated);
  const onboardingSeen = useTrainingStore((s) => s.preferences.onboardingSeen);
  const splitsSeen = useTrainingStore(
    (s) => s.preferences.splitScannerOnboardingSeen,
  );
  const athleteTypes = useTrainingStore((s) => s.preferences.athleteTypes);
  const installSeen = useTrainingStore((s) => s.preferences.installPromptSeen);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

  const [picked, setPicked] = useState<AthleteType[]>([]);

  // Nothing is announced to someone who hasn't finished the welcome flow —
  // they're seeing all of it there already. Nor on the retired deployment,
  // where the only message worth showing is "the app has moved" and stacking
  // anything on top of it would bury the way out.
  const ready = hydrated && onboardingSeen === true && !isLegacyHost();

  return [
    {
      key: "splits",
      applies: ready && !splitsSeen,
      render: (next) => (
        <OnboardingStep
          icon={ScanText}
          title={t("onboarding.splitsTitle")}
          body={t("onboarding.splitsBody")}
          skipLabel={t("onboarding.notNow")}
          confirmLabel={t("onboarding.enableSplits")}
          className="max-h-[90dvh] overflow-y-auto"
          onSkip={() => {
            setPreferences({ splitScannerOnboardingSeen: true });
            next();
          }}
          onConfirm={() => {
            setPreferences({
              splitScannerOnboardingSeen: true,
              splitScannerEnabled: true,
            });
            next();
          }}
        >
          <SplitsExample />
        </OnboardingStep>
      ),
    },
    {
      key: "athlete",
      // `undefined` means never asked. Testing emptiness instead would re-ask
      // someone who declined, on every single load, forever.
      applies: ready && athleteTypes === undefined,
      render: (next) => (
        <OnboardingStep
          icon={Users}
          title={t("athlete.promptTitle")}
          body={t("athlete.promptBody")}
          skipLabel={t("onboarding.notNow")}
          confirmLabel={t("common.save")}
          className="max-h-[90dvh] overflow-y-auto"
          // Skipping still records an answer — the empty array — so the app
          // stops asking and simply keeps showing everything.
          onSkip={() => {
            setPreferences({ athleteTypes: [] });
            next();
          }}
          onConfirm={() => {
            setPreferences({ athleteTypes: picked });
            next();
          }}
        >
          <AthleteTypePicker value={picked} onChange={setPicked} />
        </OnboardingStep>
      ),
    },
    {
      key: "install",
      applies:
        ready &&
        !installSeen &&
        mode !== "installed" &&
        mode !== "unavailable" &&
        // The wizard is a form; a dialog over step 1 of it is hostile. Anyone
        // who came from "create a plan" sees this on their next page instead.
        !pathname.startsWith("/app/plan/new"),
      render: (next) => (
        <OnboardingStep
          icon={Download}
          title={t("install.title")}
          body={t("install.body")}
          skipLabel={t("onboarding.notNow")}
          confirmLabel={
            mode === "prompt" ? t("install.action") : t("common.gotIt")
          }
          onSkip={() => {
            setPreferences({ installPromptSeen: true });
            next();
          }}
          onConfirm={() => {
            setPreferences({ installPromptSeen: true });
            if (mode === "prompt") void install();
            next();
          }}
        >
          {mode === "ios-manual" ? <InstallInstructions /> : null}
        </OnboardingStep>
      ),
    },
  ];
}

/**
 * Whether an announcement is waiting. Other global dialogs call this instead of
 * hand-listing the flags they must not stack on top of — so adding a step here
 * never means remembering to edit them.
 */
export function useWhatsNewPending(): boolean {
  return useWhatsNewSteps().some((s) => s.applies);
}

export function WhatsNewGate() {
  const steps = useWhatsNewSteps();
  const [cursor, setCursor] = useState(0);

  const i = steps.findIndex((s, idx) => idx >= cursor && s.applies);
  if (i === -1) return null;
  return steps[i].render(() => setCursor(i + 1));
}
