"use client";

import { Flag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWhatsNewPending } from "@/components/common/whats-new-gate";
import { useActivePlan } from "@/hooks/use-active-plan";
import { todayISO } from "@/lib/date";
import { isRaceComplete } from "@/lib/plan/context";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Once the race run is logged, offer to start the next plan carrying this one
 * as context. Mounted globally because a run can be completed from the Plan
 * page, the Dashboard or the calendar day sheet — watching state covers all
 * three without touching the logging dialogs.
 */
export function NextPlanGate() {
  const { t } = useTranslation();
  const router = useRouter();
  const hydrated = useTrainingStore((s) => s.hydrated);
  const plan = useActivePlan();
  const seen = useTrainingStore((s) => s.preferences.nextPlanPromptSeen);
  const onboardingSeen = useTrainingStore((s) => s.preferences.onboardingSeen);
  const setPreferences = useTrainingStore((s) => s.setPreferences);
  // Structural rather than a hand-listed set of flags: a new announcement can
  // be added to the what's-new gate without anyone remembering to edit this.
  const whatsNewPending = useWhatsNewPending();

  if (!hydrated || !plan) return null;
  // Never stack on top of an announcement dialog.
  if (!onboardingSeen || whatsNewPending) return null;
  if (seen?.includes(plan.id)) return null;
  // Race day must have arrived and the race itself must be logged.
  if (todayISO() < plan.raceDate) return null;
  // Every leg, not just the longest one — see isRaceComplete.
  if (!isRaceComplete(plan)) return null;

  // Recording the id on both paths means it never asks twice, even if the race
  // is un-completed and completed again.
  const dismiss = () =>
    setPreferences({ nextPlanPromptSeen: [...(seen ?? []), plan.id] });

  return (
    <Dialog open onOpenChange={dismiss}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="size-5 text-primary" /> {t("nextPlan.title")}
          </DialogTitle>
          <DialogDescription>
            {t("nextPlan.body", { name: plan.raceName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={dismiss}>
            {t("onboarding.notNow")}
          </Button>
          <Button
            onClick={() => {
              dismiss();
              router.push(`/app/plan/new?from=${plan.id}`);
            }}
          >
            <Flag className="size-4" /> {t("nextPlan.create")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
