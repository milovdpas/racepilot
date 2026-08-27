"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFormat } from "@/hooks/use-format";
import type { ExportFormat } from "@/lib/export/target";
import { workoutSport } from "@/lib/plan/workout";
import {
  describeSteps,
  type StepFormat,
  stepsDurationSec,
} from "@/lib/plan/workout-steps";
import { paceToSeconds } from "@/lib/pace";
import type { TrainingPlan, Workout } from "@/lib/types";

/**
 * How a workout reads, in the athlete's own units, for anything being exported.
 *
 * The export targets run outside React and take these as data, so this is the
 * one place that decides what a session says in a calendar entry or a file
 * name. It exists as a hook because units are a user preference.
 */
export function useExportFormat(plan: TrainingPlan | null): ExportFormat {
  const { t } = useTranslation();
  const fmt = useFormat();

  return useMemo<ExportFormat>(() => {
    const stepFormat = (workout: Workout): StepFormat => {
      const sport = workoutSport(workout, plan);
      return {
        // Metres below a kilometre, because "800 m" is how an interval is
        // written and "0.8 km" is not. Imperial keeps miles throughout: there
        // is no equivalent short unit anyone trains in.
        distance: (km) =>
          fmt.units === "metric" && km < 1
            ? `${Math.round(km * 1000)} m`
            : fmt.distance(km, 2),
        duration: (sec) => t("steps.minutesShort", { count: Math.round(sec / 60) }),
        pace: (pace) => fmt.pace(pace, sport),
        role: (role) => t(`steps.role.${role}`),
      };
    };

    return {
      summary: (workout) => {
        const name = workout.title.trim() || t(`workoutType.${workout.type}`);
        return workout.plannedDistanceKm > 0
          ? `${name} · ${fmt.distance(workout.plannedDistanceKm)}`
          : name;
      },

      describe: (workout) => {
        const sport = workoutSport(workout, plan);
        const parts: string[] = [];

        if (workout.steps?.length) {
          parts.push(describeSteps(workout.steps, stepFormat(workout)));
        } else if (workout.plannedPace) {
          // A flat session still has something worth carrying to the wrist.
          parts.push(
            t("export.target", { pace: fmt.pace(workout.plannedPace, sport) }),
          );
        }
        if (workout.notes?.trim()) parts.push(workout.notes.trim());
        return parts.join("\n\n");
      },

      durationMin: (workout) => {
        if (workout.steps?.length) {
          const sec = stepsDurationSec(workout.steps, workout.plannedPace);
          return sec > 0 ? sec / 60 : undefined;
        }
        const secPerKm = paceToSeconds(workout.plannedPace);
        return secPerKm && workout.plannedDistanceKm > 0
          ? (secPerKm * workout.plannedDistanceKm) / 60
          : undefined;
      },
    };
  }, [fmt, plan, t]);
}
