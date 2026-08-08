"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useFormat } from "@/hooks/use-format";
import { workoutSport } from "@/lib/plan/workout";
import { formatClock, resolveLoggedRun } from "@/lib/pace";
import type { Workout, WorkoutSplit } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  type ScannedFields,
  ScannedSplits,
  ScreenshotScanField,
} from "@/components/common/screenshot-scan-field";
import { TimeField } from "@/components/common/time-field";
import { attachWeather } from "@/lib/weather/sync";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Quick "I finished this run" flow: prefills the planned distance + pace so the
 * user can tweak what they actually ran in one tap, then logs & completes.
 */
export function CompleteWorkoutDialog({
  workout,
  open,
  onOpenChange,
}: {
  workout: Workout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const plan = useActivePlan();
  const updateWorkout = useTrainingStore((s) => s.updateWorkout);
  // Resolved from the workout, so a cross-training ride in a running plan is
  // still logged in km/h.
  const sport = workoutSport(workout ?? {}, plan);

  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [pace, setPace] = useState("");
  const [startTime, setStartTime] = useState("");
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);

  // Prefill from the planned target when the dialog opens (reset during render).
  const [wasOpen, setWasOpen] = useState(false);
  if (open && workout && !wasOpen) {
    setWasOpen(true);
    // Fields hold DISPLAY units throughout, and convert back on save. Two
    // decimals is ~16 m on a marathon in miles, well below the precision anyone
    // logs a run at; metric users convert by identity and never round at all.
    const km = workout.actualDistanceKm ?? workout.plannedDistanceKm;
    setDistance(km == null ? "" : fmt.distanceValue(km, 2));
    setPace(
      fmt.paceValue(workout.actualPace ?? workout.plannedPace, sport) || "",
    );
    setDuration(formatClock(workout.durationMin));
    setStartTime(workout.startTime ?? "");
    setSplits(workout.splits ?? []);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  // distance + (duration OR pace) computes & locks the third field. The same
  // call drives what is displayed and what is saved, so they cannot disagree.
  //
  // Run entirely in display units: the solver only needs distance and pace to
  // share a unit (min/mi × mi = minutes, just as min/km × km does), so nothing
  // here has to know which system is active.
  const resolved = resolveLoggedRun({ distance, duration, pace });
  const paceComputed = resolved.computed === "pace";
  const durationComputed = resolved.computed === "duration";
  const { paceFieldValue, durationFieldValue } = resolved;

  // A scan fills only what it actually read: a screenshot showing distance but
  // no start time must not wipe a start time the user already typed.
  const applyScan = (f: ScannedFields) => {
    if (f.distance != null) setDistance(f.distance);
    if (f.pace != null) setPace(f.pace);
    if (f.duration != null) setDuration(f.duration);
    if (f.startTime != null) setStartTime(f.startTime);
  };

  const handleConfirm = () => {
    if (!workout) return;
    const { actualDistanceKm, durationMin, actualPace } = resolved;
    const start = startTime.trim() || undefined;
    updateWorkout(workout.id, {
      // Back to canonical km + seconds-per-km on the way into the store.
      actualDistanceKm:
        actualDistanceKm == null ? undefined : fmt.toStoredDistance(actualDistanceKm),
      durationMin,
      actualPace:
        actualPace == null ? undefined : fmt.toStoredPaceFor(actualPace, sport),
      startTime: start,
      splits: splits.length > 0 ? splits : undefined,
      completed: true,
    });
    void attachWeather(workout.id, workout.date, start);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{workout?.title || t("completeWorkout.title")}</DialogTitle>
          <DialogDescription>{t("completeWorkout.desc")}</DialogDescription>
        </DialogHeader>

        {workout ? (
          <div className="grid gap-4 py-1">
            <p className="text-xs text-muted-foreground">
              {t("completeWorkout.planned", {
                distance: fmt.distance(workout.plannedDistanceKm),
                pace: fmt.pace(workout.plannedPace, sport),
              })}
            </p>

            <ScreenshotScanField
              splits={splits}
              onSplits={setSplits}
              onScanned={applyScan}
              sport={sport}
            />

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("workoutForm.distance", { unit: fmt.distanceUnit })}
              </Label>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("workoutForm.durationMin")}
                </Label>
                <Input
                  inputMode="text"
                  placeholder="mm:ss"
                  readOnly={durationComputed}
                  aria-readonly={durationComputed}
                  className={cn(
                    durationComputed && "bg-muted text-muted-foreground",
                  )}
                  value={durationFieldValue}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t("workoutForm.paceLabel", {
                    unit: fmt.speedUnitFor(sport),
                  })}
                </Label>
                <Input
                  placeholder="4:58"
                  readOnly={paceComputed}
                  aria-readonly={paceComputed}
                  className={cn(paceComputed && "bg-muted text-muted-foreground")}
                  value={paceFieldValue}
                  onChange={(e) => setPace(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("workoutForm.computeHint")}
            </p>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                {t("workoutForm.startTime")}
              </Label>
              <TimeField value={startTime} onChange={setStartTime} />
            </div>

            <ScannedSplits splits={splits} onClear={() => setSplits([])} />
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleConfirm}>{t("completeWorkout.confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
