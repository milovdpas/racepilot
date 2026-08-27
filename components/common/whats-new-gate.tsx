"use client";

import { Download, ScanText, Sparkles, Users, Watch } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AthleteTypePicker } from "@/components/common/athlete-type-picker";
import {
  PlanStepsUpgrade,
  usePendingStructure,
} from "@/components/common/plan-steps-upgrade";
import { WatchPicker } from "@/components/common/watch-picker";
import { InstallInstructions } from "@/components/common/install-instructions";
import { OnboardingStep } from "@/components/common/onboarding-step";
import { SplitsExample } from "@/components/common/splits-example";
import { useInstallApp } from "@/hooks/use-install-app";
import { isLegacyHost } from "@/lib/legacy-host";
import type { AthleteType, Preferences, WatchBrand } from "@/lib/types";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * The preference keys that record "this prompt has been answered".
 *
 * Exported so the debug panel's replay action can clear them without keeping
 * its own copy of the list. It kept one, and the moment a fifth prompt was
 * added the button silently stopped resetting everything — which is the worst
 * kind of broken for a testing aid, because it looks like it worked.
 *
 * **Add a step below, add its key here.** They are the same change.
 */
export const ONE_TIME_PROMPT_KEYS = [
  "splitScannerOnboardingSeen",
  "athleteTypes",
  "watch",
  "stepsUpgradePromptSeen",
  "installPromptSeen",
] as const satisfies readonly (keyof Preferences)[];

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
  const watch = useTrainingStore((s) => s.preferences.watch);
  const upgradeSeen = useTrainingStore((s) => s.preferences.stepsUpgradePromptSeen);
  const { shouldOffer } = usePendingStructure();
  const installSeen = useTrainingStore((s) => s.preferences.installPromptSeen);
  const setPreferences = useTrainingStore((s) => s.setPreferences);

  const [picked, setPicked] = useState<AthleteType[]>([]);
  const [watchPick, setWatchPick] = useState<WatchBrand | undefined>(undefined);

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
          className="overflow-y-auto"
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
          confirmDisabled={picked.length === 0}
          className="overflow-y-auto"
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
      key: "watch",
      // Same tri-state as the athlete question: `undefined` is never asked.
      // Testing for a falsy value instead would re-ask anyone who answered
      // "none", forever.
      applies: ready && watch === undefined,
      render: (next) => (
        <OnboardingStep
          icon={Watch}
          title={t("watch.promptTitle")}
          body={t("watch.promptBody")}
          skipLabel={t("onboarding.notNow")}
          confirmLabel={t("common.save")}
          // Nothing picked means there is nothing to save, and the fallback
          // below would quietly record "no watch" for someone who believed
          // they had chosen one. "Not now" is the way past this prompt.
          confirmDisabled={watchPick === undefined}
          className="max-h-[90dvh] overflow-y-auto"
          // Skipping records "none", which is an answer and stops the asking.
          // Leaving it unset would bring the prompt back on the next load.
          onSkip={() => {
            setPreferences({ watch: "none" });
            next();
          }}
          onConfirm={() => {
            setPreferences({ watch: watchPick ?? "none" });
            next();
          }}
        >
          <WatchPicker value={watchPick} onChange={setWatchPick} />
        </OnboardingStep>
      ),
    },
    {
      key: "steps-upgrade",
      // Deliberately *after* the watch step. `applies` is recomputed every
      // render, so the moment that step writes a real brand this one becomes
      // eligible and the gate shows it next — which is the teachable moment:
      // "your intervals will export as one flat block" is abstract until you
      // have just said which watch you own.
      applies: ready && shouldOffer && !upgradeSeen,
      render: (next) => (
        <OnboardingStep
          icon={Sparkles}
          title={t("upgradePlan.promptTitle")}
          body={t("upgradePlan.promptBody")}
          skipLabel={t("onboarding.notNow")}
          confirmLabel={t("common.gotIt")}
          className="max-h-[90dvh] overflow-y-auto"
          // Both exits record it. The offer stays permanently available in the
          // watch settings card, so this flag only stops the popup returning on
          // every load; it does not take the feature away.
          onSkip={() => {
            setPreferences({ stepsUpgradePromptSeen: true });
            next();
          }}
          onConfirm={() => {
            setPreferences({ stepsUpgradePromptSeen: true });
            next();
          }}
        >
          <PlanStepsUpgrade chrome={false} />
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
