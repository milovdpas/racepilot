"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { StepAi } from "@/components/wizard/steps/step-ai";
import { StepOffDays } from "@/components/wizard/steps/step-off-days";
import { StepRace } from "@/components/wizard/steps/step-race";
import { StepTraining } from "@/components/wizard/steps/step-training";
import { WizardStepper } from "@/components/wizard/wizard-stepper";
import { BACKYARD_LOOP_KM } from "@/lib/plan/backyard";
import { toISO } from "@/lib/date";
import { canBeContext } from "@/lib/plan/context";
import { useFormat } from "@/hooks/use-format";
import { capabilitiesFor, soleSport } from "@/lib/athlete";
import { presetByKey } from "@/lib/plan/multisport";
import { DEFAULT_SPORT } from "@/lib/sport";
import {
  type Draft,
  buildPlanRequest,
  planRequestFilename,
} from "@/lib/plan/request";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";

export function AddPlanWizard({ fromPlanId }: { fromPlanId?: string }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const country = useTrainingStore((s) => s.preferences.country);
  const athleteTypes = useTrainingStore((s) => s.preferences.athleteTypes);
  const caps = capabilitiesFor(athleteTypes);
  const router = useRouter();
  const addPlanFromImport = useTrainingStore((s) => s.addPlanFromImport);
  const plans = useTrainingStore((s) => s.plans);

  // Previous plans, most recent race first.
  const planList = useMemo(
    () =>
      Object.values(plans).sort((a, b) =>
        a.raceDate > b.raceDate ? -1 : a.raceDate < b.raceDate ? 1 : 0,
      ),
    [plans],
  );

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(() => {
    // Arriving from a finished plan: attach it and carry its training
    // preferences over, since those rarely change race to race.
    const from = fromPlanId ? plans[fromPlanId] : undefined;
    return {
      name: "",
      // Empty, not "Marathon": the placeholder guides, and a pre-filled
      // running name is wrong for six of the seven race types.
      raceName: "",
      // The plan's sport, and the default for every workout in it.
      sport: from?.sport ?? soleSport(caps) ?? DEFAULT_SPORT,
      raceDistanceKm: 42.2,
      raceDate: "",
      startDate: toISO(new Date()),
      raceType: "standard",
      loopKm: BACKYARD_LOOP_KM,
      legs: presetByKey("olympic")!.legs,
      targetYards: 24, // 24 yards = 24 hours = 100 miles, the classic benchmark
      goalType: "finish",
      goalValue: "",
      offDays: [],
      latestRuns: [],
      // Only preselect a plan the picker would actually show.
      contextPlanIds: from && canBeContext(from) ? [from.id] : [],
      prefs: from?.trainingPrefs ?? {
        daysPerWeek: 4,
        flexibleDays: false,
        trainingDays: [true, false, true, true, false, false, true],
        planningMode: "exact",
        targetDistanceKm: null,
      },
    };
  });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const STEPS = [
    t("wizard.stepRace"),
    t("wizard.stepOffDays"),
    t("wizard.stepTraining"),
    t("wizard.stepAi"),
  ];

  const complete = (json: string) => {
    try {
      addPlanFromImport(json, {
        trainingPrefs: draft.prefs,
        startDate: draft.startDate,
        // The AI saw previous plans and may echo their ids; force a new plan so
        // it can never overwrite the history it was given as context.
        asNewPlan: draft.contextPlanIds.length > 0,
      });
      toast.success(t("wizard.created"));
      router.push("/app");
    } catch (e) {
      console.error("Plan import failed:", e);
      setError(t("wizard.completeError"));
    }
  };

  const step1Valid = draft.name.trim() && draft.raceDate && draft.startDate;

  return (
    <div className="space-y-5">
      <WizardStepper steps={STEPS} current={step} />

      {step === 1 ? <StepRace draft={draft} set={set} /> : null}
      {step === 2 ? <StepOffDays draft={draft} set={set} /> : null}
      {step === 3 ? (
        <StepTraining
          draft={draft}
          set={set}
          plans={planList}
          onPrefsChange={(patch) =>
            setDraft((d) => ({ ...d, prefs: { ...d.prefs, ...patch } }))
          }
        />
      ) : null}
      {step === 4 ? (
        <StepAi
          filename={planRequestFilename(draft)}
          // Built lazily so it always reflects the latest draft.
          requestJson={() =>
            JSON.stringify(
              buildPlanRequest(draft, plans, { country, units: fmt.units }),
              null,
              2,
            )
          }
          onComplete={complete}
          error={error}
          onClearError={() => setError(null)}
        />
      ) : null}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => (step === 1 ? router.push("/app") : setStep(step - 1))}
        >
          <ArrowLeft className="size-4" /> {t("wizard.back")}
        </Button>
        {step < 4 ? (
          <Button
            disabled={step === 1 && !step1Valid}
            onClick={() => setStep(step + 1)}
          >
            {t("wizard.next")} <ArrowRight className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
