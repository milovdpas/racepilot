"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import {
  NO_FEATURES,
  StepFeatures,
  type FeatureChoices,
} from "@/components/onboarding/step-features";
import { StepFinish } from "@/components/onboarding/step-finish";
import { StepPrivacy } from "@/components/onboarding/step-privacy";
import { StepProfile } from "@/components/onboarding/step-profile";
import { StepWatch } from "@/components/onboarding/step-watch";
import { StepTour } from "@/components/onboarding/step-tour";
import { Button } from "@/components/ui/button";
import { defaultExampleFor } from "@/lib/plan/examples";
import type { AthleteType, WatchBrand } from "@/lib/types";
import { enableWeather } from "@/lib/weather/sync";
import { useSyncStore } from "@/store/use-sync-store";
import { useTrainingStore } from "@/store/use-training-store";

const STEPS = ["privacy", "tour", "profile", "watch", "features", "finish"] as const;

/**
 * The first-run flow, as a page rather than a stack of dialogs.
 *
 * Two rules hold this together, and both are load-bearing:
 *
 *  1. **Nothing here may call `useHydrated()` or `useActivePlan()`.** A user
 *     part-way through this flow has no plan yet — `initializePlan` waits for
 *     `onboardingSeen` — and `useHydrated` carries a seeding side effect that
 *     would pre-empt the choice this flow exists to offer. Read
 *     `useTrainingStore(s => s.hydrated)` directly instead.
 *  2. **Connecting Drive happens last, in the terminal action.** `connect()` is
 *     a full-page redirect to Google; doing it mid-flow would throw away the
 *     cursor and everything the user has answered.
 */
export function OnboardingFlow() {
  const { t } = useTranslation();
  const router = useRouter();

  const setPreferences = useTrainingStore((s) => s.setPreferences);
  const seedExamplePlan = useTrainingStore((s) => s.seedExamplePlan);
  const connect = useSyncStore((s) => s.connect);

  const [step, setStep] = useState(0);
  const [athleteTypes, setAthleteTypes] = useState<AthleteType[]>([]);
  const [watch, setWatch] = useState<WatchBrand | undefined>(undefined);
  const [features, setFeatures] = useState<FeatureChoices>(NO_FEATURES);
  const [busy, setBusy] = useState(false);

  const current = STEPS[step];
  const back = () => setStep((s) => Math.max(0, s - 1));
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));

  /**
   * Write everything the user chose, in an order that can't lose an answer:
   * preferences first, then the plan, and only then the redirect to Google.
   */
  async function finish(mode: "create" | "explore") {
    setBusy(true);
    setPreferences({
      onboardingSeen: true,
      athleteTypes,
      // Only when they picked one. Leaving it unset is what keeps the
      // one-time prompt available later, and unset already offers every
      // export rather than none.
      ...(watch ? { watch } : {}),
      ...(features.weather ? { weatherCalendar: true } : {}),
      ...(features.splits
        ? { splitScannerEnabled: true, splitScannerOnboardingSeen: true }
        : {}),
    });

    if (features.weather) {
      // Best effort: a denied location permission must not strand the user in
      // the flow, and the Settings card can always turn it on later.
      await enableWeather().catch(() => undefined);
    }

    if (mode === "explore") {
      // Awaited on purpose — the example plan is a dynamic import, so
      // navigating first would show the empty state for a beat.
      await seedExamplePlan();
    }

    if (features.drive) {
      // Full-page redirect. Everything above is already persisted, so the round
      // trip through Google is safe from here.
      //
      // The explicit target matters: `connect()` defaults to the current path,
      // and coming back to /welcome would replay the flow the user has just
      // finished.
      connect(mode === "create" ? "/app/plan/new" : "/app");
      return;
    }

    // No explicit seed on the "create" path: `useHydrated`'s safety net covers
    // it, deliberately, so the app is never planless. Don't "simplify" that
    // away — the wizard would show an empty state if the user backs out.
    router.replace(mode === "create" ? "/app/plan/new" : "/app");
  }

  const exampleKey = defaultExampleFor(athleteTypes).key;

  return (
    <OnboardingShell
      step={step}
      total={STEPS.length}
      title={t(`welcome.${current}Title`)}
      subtitle={t(`welcome.${current}Subtitle`)}
      footer={
        current === "finish" ? (
          <>
            <Button disabled={busy} onClick={() => void finish("create")}>
              {t("onboarding.createPlan")}
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void finish("explore")}
            >
              {t("welcome.exploreWith", { plan: t(`examples.${exampleKey}`) })}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={next}>{t("welcome.continue")}</Button>
            {step > 0 ? (
              <Button variant="ghost" onClick={back}>
                {t("welcome.back")}
              </Button>
            ) : null}
          </>
        )
      }
    >
      {current === "privacy" ? <StepPrivacy /> : null}
      {current === "tour" ? <StepTour /> : null}
      {current === "profile" ? (
        <StepProfile value={athleteTypes} onChange={setAthleteTypes} />
      ) : null}
      {current === "watch" ? (
        <StepWatch value={watch} onChange={setWatch} />
      ) : null}
      {current === "features" ? (
        <StepFeatures value={features} onChange={setFeatures} />
      ) : null}
      {current === "finish" ? <StepFinish /> : null}
    </OnboardingShell>
  );
}
