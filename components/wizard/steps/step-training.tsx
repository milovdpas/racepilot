"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TrainingPrefsFields } from "@/components/common/training-prefs-fields";
import { PreviousPlansPicker } from "@/components/wizard/previous-plans-picker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SportIcon } from "@/components/common/sport-icon";
import { SPORTS, type Sport } from "@/lib/sport";
import { useFormat } from "@/hooks/use-format";
import { Label } from "@/components/ui/label";
import type { Draft, LatestRun } from "@/lib/plan/request";
import type { TrainingPlan, TrainingPrefs } from "@/lib/types";
import type { SetDraft } from "@/components/wizard/steps/types";

/** Current fitness: past plans as context, recent runs, and weekly habits. */
export function StepTraining({
  draft,
  set,
  plans,
  onPrefsChange,
}: {
  draft: Draft;
  set: SetDraft;
  /** All plans, most recent race first — the picker filters them itself. */
  plans: TrainingPlan[];
  onPrefsChange: (patch: Partial<TrainingPrefs>) => void;
}) {
  const { t } = useTranslation();
  const fmt = useFormat();
  // Only a multi-sport plan needs to say which sport each session was: for a
  // single-sport plan every row inherits the plan's, and a picker on each line
  // would be three taps of noise per row.
  const perRowSport = draft.raceType === "multisport";

  /** Patch one run in the list, leaving the others alone. */
  const updateRun = (i: number, patch: Partial<LatestRun>) =>
    set(
      "latestRuns",
      draft.latestRuns.map((r, j) => (j === i ? { ...r, ...patch } : r)),
    );

  return (
    <Card className="gap-0 space-y-4 p-4">
      <PreviousPlansPicker
        plans={plans}
        selectedIds={draft.contextPlanIds}
        onChange={(ids) => set("contextPlanIds", ids)}
      />

      <div>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.latestRuns")}
        </Label>
        <p className="mb-2 mt-0.5 text-xs text-muted-foreground">
          {t("wizard.latestRunsHint")}
        </p>
        <div className="space-y-2">
          {draft.latestRuns.map((r, i) => (
            // Index keys are fine here: rows have no identity beyond position
            // and are only ever appended or removed.
            <div key={i} className="flex items-center gap-2">
              {perRowSport ? (
                <Select
                  value={r.sport ?? draft.sport}
                  onValueChange={(v) => updateRun(i, { sport: v as Sport })}
                >
                  <SelectTrigger
                    className="w-28 shrink-0"
                    aria-label={t("wizard.runSport")}
                  >
                    <SelectValue>
                      {(value) => (
                        <span className="flex items-center gap-1.5">
                          <SportIcon sport={value as Sport} />
                          {t(`sport.${value as Sport}`)}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((sp) => (
                      <SelectItem key={sp} value={sp}>
                        <span className="flex items-center gap-1.5">
                          <SportIcon sport={sp} />
                          {t(`sport.${sp}`)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Input
                type="number"
                inputMode="decimal"
                placeholder={t("wizard.runDistance", { unit: fmt.distanceUnit })}
                value={r.distanceKm}
                onChange={(e) => updateRun(i, { distanceKm: e.target.value })}
              />
              <Input
                placeholder={t("wizard.runTimePlaceholder")}
                value={r.time}
                onChange={(e) => updateRun(i, { time: e.target.value })}
              />
              <Input
                type="date"
                value={r.date}
                onChange={(e) => updateRun(i, { date: e.target.value })}
              />
              <button
                type="button"
                aria-label="remove run"
                onClick={() =>
                  set(
                    "latestRuns",
                    draft.latestRuns.filter((_, j) => j !== i),
                  )
                }
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() =>
            set("latestRuns", [
              ...draft.latestRuns,
              {
                // Stamped for a multi-sport plan, where draft.sport is not a
                // meaningful default; inherited otherwise.
                ...(perRowSport
                  ? { sport: draft.legs[0]?.sport ?? draft.sport }
                  : {}),
                distanceKm: "",
                time: "",
                date: "",
              },
            ])
          }
        >
          <Plus className="size-4" /> {t("wizard.addRun")}
        </Button>
      </div>

      <TrainingPrefsFields prefs={draft.prefs} onChange={onPrefsChange} />
    </Card>
  );
}
