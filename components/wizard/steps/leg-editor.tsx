"use client";

import { useTranslation } from "react-i18next";
import { SportIcon } from "@/components/common/sport-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFormat } from "@/hooks/use-format";
import {
  MULTISPORT_PRESETS,
  matchingPresetKey,
  multisportDistanceKm,
  totalTransitionMin,
} from "@/lib/plan/multisport";
import type { RaceLeg } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The legs of a multi-sport race: a distance per leg, plus the transition after
 * each one.
 *
 * Presets do the real work — nobody remembers that a 70.3 is 1.9 / 90 / 21.1 km
 * — but the fields stay editable, because local races rarely match a standard
 * exactly and rounding someone's race to the nearest brand is worse than making
 * them type three numbers.
 */
export function LegEditor({
  legs,
  onChange,
}: {
  legs: RaceLeg[];
  onChange: (next: RaceLeg[]) => void;
}) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const selected = matchingPresetKey(legs);

  const setLeg = (i: number, patch: Partial<RaceLeg>) =>
    onChange(legs.map((l, j) => (i === j ? { ...l, ...patch } : l)));

  return (
    <div>
      <Label className="text-xs text-muted-foreground">
        {t("wizard.raceFormat")}
      </Label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {MULTISPORT_PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            aria-pressed={selected === p.key}
            onClick={() => onChange(p.legs.map((l) => ({ ...l })))}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              selected === p.key
                ? "border-primary bg-primary/10 text-primary"
                : "hover:bg-accent",
            )}
          >
            {t(`wizard.preset.${p.key}`)}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-2">
        {legs.map((leg, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="flex w-24 shrink-0 items-center gap-1.5 text-sm">
              <SportIcon sport={leg.sport} />
              {t(`sport.${leg.sport}`)}
            </span>
            <Input
              type="number"
              inputMode="decimal"
              step="0.1"
              aria-label={t("wizard.legDistance", {
                sport: t(`sport.${leg.sport}`),
                unit: fmt.distanceUnit,
              })}
              value={fmt.distanceValue(leg.distanceKm, 2)}
              onChange={(e) =>
                setLeg(i, {
                  distanceKm: fmt.toStoredDistance(Number(e.target.value) || 0),
                })
              }
            />
            <span className="w-6 shrink-0 text-xs text-muted-foreground">
              {fmt.distanceUnit}
            </span>
            {/* The last leg has no transition after it: you finish. */}
            {i < legs.length - 1 ? (
              <>
                <Input
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  className="w-20"
                  aria-label={t("wizard.legTransition", { n: i + 1 })}
                  value={leg.transitionMin ?? 0}
                  onChange={(e) =>
                    setLeg(i, {
                      transitionMin: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                />
                <span className="w-12 shrink-0 text-xs text-muted-foreground">
                  {t("wizard.transitionShort", { n: i + 1 })}
                </span>
              </>
            ) : (
              <span className="w-[8.5rem] shrink-0" />
            )}
          </div>
        ))}
      </div>

      <p className="mt-1.5 text-xs text-muted-foreground">
        {t("wizard.legsTotal", {
          distance: fmt.distance(multisportDistanceKm(legs)),
          transition: totalTransitionMin(legs),
        })}
      </p>
    </div>
  );
}
