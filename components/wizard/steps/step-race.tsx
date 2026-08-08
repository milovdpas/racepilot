"use client";

import { useTranslation } from "react-i18next";
import { Field } from "@/components/common/field";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SportIcon } from "@/components/common/sport-icon";
import { LegEditor } from "@/components/wizard/steps/leg-editor";
import { useFormat } from "@/hooks/use-format";
import { SPORTS } from "@/lib/sport";
import { type AthleteCapabilities, capabilitiesFor } from "@/lib/athlete";
import { BACKYARD_LOOP_KM, backyardDistanceKm } from "@/lib/plan/backyard";
import type { Draft } from "@/lib/plan/request";
import { cn } from "@/lib/utils";
import { useTrainingStore } from "@/store/use-training-store";
import type { SetDraft } from "@/components/wizard/steps/types";

const ROAD_PRESETS = [
  { km: 42.2, label: "Marathon" },
  { km: 21.1, label: "½ Marathon" },
  { km: 10, label: "10K" },
  { km: 5, label: "5K" },
];

const ULTRA_PRESETS = [
  { km: 50, label: "50K" },
  { km: 80, label: "50 mi" },
  { km: 100, label: "100K" },
  { km: 161, label: "100 mi" },
];

/** The distances worth one tap. Someone racing 100K shouldn't have to type it. */
function presetsFor(caps: AthleteCapabilities) {
  return caps.ultraFormats ? [...ROAD_PRESETS, ...ULTRA_PRESETS] : ROAD_PRESETS;
}

/** Everything about the race itself: name, format, distance, dates, goal. */
export function StepRace({ draft, set }: { draft: Draft; set: SetDraft }) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const athleteTypes = useTrainingStore((s) => s.preferences.athleteTypes);
  const caps = capabilitiesFor(athleteTypes);
  const isBackyard = draft.raceType === "backyard";
  const isMultisport = draft.raceType === "multisport";

  // A road runner has no use for the backyard format, and until they say
  // otherwise every user has been shown a card they will never click.
  // Backyard is a running format; multisport is only offered to someone who
  // races more than one sport.
  const raceTypes = [
    "standard" as const,
    ...(caps.ultraFormats && draft.sport === "run"
      ? (["backyard"] as const)
      : []),
    ...(caps.multiSport ? (["multisport"] as const) : []),
  ];
  const presets = presetsFor(caps);
  // Only the sports this athlete says they do, in canonical order.
  const offeredSports = SPORTS.filter((sp) => caps.sports.has(sp));

  return (
    <Card className="gap-0 space-y-3 p-4">
      <Field label={t("wizard.planName")}>
        <Input
          placeholder={t("wizard.planNamePlaceholder")}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>
      <Field label={t("wizard.raceName")}>
        <Input
          placeholder={t("wizard.raceNamePlaceholder")}
          value={draft.raceName}
          onChange={(e) => set("raceName", e.target.value)}
        />
      </Field>

      {/* Race format decides what the distance and goal fields mean. With only
          one format left there is nothing to choose, so the picker goes. */}
      <div className={cn(raceTypes.length < 2 && "hidden")}>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.raceTypeQ")}
        </Label>
        <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
          {raceTypes.map((rt) => (
            <button
              key={rt}
              type="button"
              onClick={() => set("raceType", rt)}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                draft.raceType === rt
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent",
              )}
            >
              <p className="text-sm font-medium">{t(`wizard.raceType.${rt}`)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t(`wizard.raceType.${rt}Desc`)}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Which sport the race is. Also the default for every workout in the
          plan, so a cycling plan needn't stamp each session. Hidden when the
          athlete only does one sport: nothing to choose. */}
      <div className={cn((offeredSports.length < 2 || isMultisport) && "hidden")}>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.sportQ")}
        </Label>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {offeredSports.map((sp) => (
            <button
              key={sp}
              type="button"
              aria-pressed={draft.sport === sp}
              onClick={() => set("sport", sp)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors",
                draft.sport === sp
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              <SportIcon sport={sp} className="text-current" />
              {t(`sport.${sp}`)}
            </button>
          ))}
        </div>
      </div>

      {isMultisport ? (
        <LegEditor legs={draft.legs} onChange={(legs) => set("legs", legs)} />
      ) : isBackyard ? (
        <div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("wizard.loopKm", { unit: fmt.distanceUnit })}>
              <Input
                type="number"
                inputMode="decimal"
                step="0.001"
                value={fmt.distanceValue(draft.loopKm, 3)}
                onChange={(e) =>
                  set(
                    "loopKm",
                    fmt.toStoredDistance(Number(e.target.value)) ||
                    BACKYARD_LOOP_KM,
                  )
                }
              />
            </Field>
            <Field label={t("wizard.targetYards")}>
              <Input
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                value={draft.targetYards}
                onChange={(e) =>
                  set("targetYards", Math.max(1, Number(e.target.value) || 0))
                }
              />
            </Field>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("wizard.backyardDerived", {
              hours: draft.targetYards,
              distance: fmt.distance(
                backyardDistanceKm(draft.loopKm, draft.targetYards),
              ),
            })}
          </p>
        </div>
      ) : (
        <div>
          <Label className="text-xs text-muted-foreground">
            {t("wizard.raceDistance", { unit: fmt.distanceUnit })}
          </Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.km}
                type="button"
                onClick={() => set("raceDistanceKm", p.km)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                  draft.raceDistanceKm === p.km
                    ? "border-primary bg-primary/10 text-primary"
                    : "hover:bg-accent",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Input
            type="number"
            inputMode="decimal"
            step="0.1"
            className="mt-2"
            aria-label={t("wizard.distanceCustom")}
            value={fmt.distanceValue(draft.raceDistanceKm, 2)}
            onChange={(e) =>
              set("raceDistanceKm", fmt.toStoredDistance(Number(e.target.value) || 0))
            }
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("wizard.startDate")}>
          <Input
            type="date"
            value={draft.startDate}
            onChange={(e) => set("startDate", e.target.value)}
          />
        </Field>
        <Field label={t("wizard.raceDate")}>
          <Input
            type="date"
            value={draft.raceDate}
            onChange={(e) => set("raceDate", e.target.value)}
          />
        </Field>
      </div>
      <p className="-mt-1 text-xs text-muted-foreground">
        {t("wizard.startDateHint")}
      </p>

      {/* A backyard ultra's goal IS the target yards set above, so the
          finish/time/pace choice doesn't apply. */}
      <div className={cn(isBackyard && "hidden")}>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.goalQ")}
        </Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {/* A triathlon has no single pace: three sports, three units. A
              target finish time still means something, so that stays. */}
          {(isMultisport
            ? (["finish", "time"] as const)
            : (["finish", "time", "pace"] as const)
          ).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => set("goalType", g)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                draft.goalType === g
                  ? "border-primary bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              {t(
                `wizard.goal${g === "finish" ? "Finish" : g === "time" ? "Time" : "Pace"}`,
              )}
            </button>
          ))}
        </div>
        {draft.goalType !== "finish" ? (
          <Input
            className="mt-2"
            placeholder={
              draft.goalType === "time"
                ? t("wizard.goalTimePlaceholder")
                : t("wizard.goalPacePlaceholder", {
                  unit: fmt.speedUnitFor(draft.sport),
                })
            }
            // A finish TIME is unit-free; only a pace needs converting.
            value={
              draft.goalType === "pace"
                ? fmt.paceValue(draft.goalValue, draft.sport)
                : draft.goalValue
            }
            onChange={(e) =>
              set(
                "goalValue",
                draft.goalType === "pace"
                  ? (fmt.toStoredPaceFor(e.target.value, draft.sport) ?? "")
                  : e.target.value,
              )
            }
          />
        ) : null}
      </div>
    </Card>
  );
}
