"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Field } from "@/components/common/field";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  type ScannedFields,
  ScannedSplits,
  ScreenshotScanField,
} from "@/components/common/screenshot-scan-field";
import { TimeField } from "@/components/common/time-field";
import { formatClock, num, resolveLoggedRun } from "@/lib/pace";
import {
  WORKOUT_TYPES,
  type TrainingPlan,
  type Workout,
  type WorkoutSplit,
  type WorkoutType,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { SportIcon } from "@/components/common/sport-icon";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useFormat, type Format } from "@/hooks/use-format";
import { workoutSport } from "@/lib/plan/workout";
import { DEFAULT_SPORT, SPORTS, type Sport } from "@/lib/sport";
import { attachWeather } from "@/lib/weather/sync";
import { useTrainingStore } from "@/store/use-training-store";

interface FormState {
  date: string;
  sport: Sport;
  type: WorkoutType;
  title: string;
  plannedDistanceKm: string;
  plannedPace: string;
  actualDistanceKm: string;
  durationMin: string;
  actualPace: string;
  startTime: string;
  notes: string;
  completed: boolean;
  flexible: boolean;
  windowStart: string;
  windowEnd: string;
}

function blankForm(defaultDate: string): FormState {
  return {
    date: defaultDate,
    sport: DEFAULT_SPORT,
    type: "easy",
    title: "",
    plannedDistanceKm: "",
    plannedPace: "",
    actualDistanceKm: "",
    durationMin: "",
    actualPace: "",
    startTime: "",
    notes: "",
    completed: false,
    flexible: false,
    windowStart: "",
    windowEnd: "",
  };
}

/**
 * Every distance and pace field in this form holds a value in the user's
 * DISPLAY units; `handleSave` converts back to canonical km + seconds-per-km.
 * The two boundaries are here and there, and nowhere else.
 */
function fromWorkout(
  w: Workout,
  fmt: Format,
  plan: TrainingPlan | null,
): FormState {
  return {
    date: w.date,
    sport: workoutSport(w, plan),
    type: w.type,
    title: w.title,
    plannedDistanceKm:
      w.plannedDistanceKm == null ? "" : fmt.distanceValue(w.plannedDistanceKm, 2),
    plannedPace: w.plannedPace
      ? fmt.paceValue(w.plannedPace, workoutSport(w, plan))
      : "",
    actualDistanceKm:
      w.actualDistanceKm == null ? "" : fmt.distanceValue(w.actualDistanceKm, 2),
    durationMin: formatClock(w.durationMin),
    actualPace: w.actualPace
      ? fmt.paceValue(w.actualPace, workoutSport(w, plan))
      : "",
    startTime: w.startTime ?? "",
    notes: w.notes ?? "",
    completed: w.completed,
    flexible: w.flexible ?? false,
    windowStart: w.windowStart ?? "",
    windowEnd: w.windowEnd ?? "",
  };
}

export function WorkoutFormDialog({
  open,
  onOpenChange,
  workout,
  defaultDate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workout?: Workout | null;
  defaultDate?: string;
}) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const plan = useActivePlan();
  const updateWorkout = useTrainingStore((s) => s.updateWorkout);
  const addWorkout = useTrainingStore((s) => s.addWorkout);
  const deleteWorkout = useTrainingStore((s) => s.deleteWorkout);

  const isEdit = !!workout;
  const [form, setForm] = useState<FormState>(blankForm(defaultDate ?? ""));
  // "plan" = schedule a future workout; "log" = record one you've done.
  const [mode, setMode] = useState<"plan" | "log">("plan");
  // Splits are an array, so they live beside the string-based FormState.
  const [splits, setSplits] = useState<WorkoutSplit[]>([]);

  // Reset the form to the target workout whenever the dialog opens (adjusting
  // state during render — the recommended alternative to a reset-in-effect).
  const [wasOpen, setWasOpen] = useState(false);
  if (open && !wasOpen) {
    setWasOpen(true);
    setForm(
      workout
        ? fromWorkout(workout, fmt, plan)
        : { ...blankForm(defaultDate ?? ""), sport: plan?.sport ?? DEFAULT_SPORT },
    );
    setMode(workout?.completed ? "log" : "plan");
    setSplits(workout?.splits ?? []);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // A scan fills only what it actually read, so a screenshot missing one value
  // never clears what the user already typed there.
  const applyScan = (s: ScannedFields) =>
    setForm((f) => ({
      ...f,
      ...(s.distance != null ? { actualDistanceKm: s.distance } : {}),
      ...(s.pace != null ? { actualPace: s.pace } : {}),
      ...(s.duration != null ? { durationMin: s.duration } : {}),
      ...(s.startTime != null ? { startTime: s.startTime } : {}),
    }));

  // Log mode: distance + (duration OR pace) computes & locks the third field.
  // The same call drives what is displayed and what is saved.
  const resolved = resolveLoggedRun({
    distance: form.actualDistanceKm,
    duration: form.durationMin,
    pace: form.actualPace,
  });
  const paceComputed = resolved.computed === "pace";
  const durationComputed = resolved.computed === "duration";
  const { paceFieldValue, durationFieldValue } = resolved;

  const handleSave = () => {
    const title = form.title.trim() || t(`workoutType.${form.type}`);
    let payload: Partial<Workout> & { type: Workout["type"]; date: string };

    if (mode === "log") {
      // Logging something you did: record the actuals, mark it complete.
      const { actualDistanceKm, durationMin, actualPace } = resolved;
      payload = {
        date: form.date,
        type: form.type,
        title,
        actualDistanceKm:
          actualDistanceKm == null
            ? undefined
            : fmt.toStoredDistance(actualDistanceKm),
        durationMin,
        actualPace:
          actualPace == null
            ? undefined
            : fmt.toStoredPaceFor(actualPace, form.sport),
        sport: form.sport,
        startTime: form.startTime.trim() || undefined,
        splits: splits.length > 0 ? splits : undefined,
        notes: form.notes.trim() || undefined,
        completed: form.completed,
        // A logged activity has a concrete date.
        flexible: undefined,
        windowStart: undefined,
        windowEnd: undefined,
      };
    } else {
      // Planning a workout: only planned targets + scheduling.
      const flexible = form.flexible;
      payload = {
        date: flexible ? form.windowStart || form.date : form.date,
        type: form.type,
        title,
        plannedDistanceKm: fmt.toStoredDistance(num(form.plannedDistanceKm) ?? 0),
        plannedPace: form.plannedPace.trim()
          ? fmt.toStoredPaceFor(form.plannedPace.trim(), form.sport)
          : undefined,
        sport: form.sport,
        completed: false,
        flexible: flexible || undefined,
        windowStart: flexible ? form.windowStart || undefined : undefined,
        windowEnd: flexible ? form.windowEnd || undefined : undefined,
      };
    }

    let targetId: string;
    if (isEdit && workout) {
      updateWorkout(workout.id, payload);
      targetId = workout.id;
    } else {
      targetId = addWorkout(payload as Parameters<typeof addWorkout>[0]);
    }
    if (mode === "log") {
      void attachWeather(targetId, payload.date, form.startTime.trim() || undefined);
    }
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (workout) deleteWorkout(workout.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("workoutForm.editTitle") : t("workoutForm.addTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("workoutForm.editDesc") : t("workoutForm.addDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-1">
          {/* Mode: plan a future workout vs. log one you've done */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
            {(["plan", "log"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  if (m === "log" && !form.completed) set("completed", true);
                }}
                className={cn(
                  "rounded-md py-1.5 text-sm font-medium transition-colors",
                  mode === m
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "plan" ? t("workoutForm.modePlan") : t("workoutForm.modeLog")}
              </button>
            ))}
          </div>

          <Field label={t("workoutForm.type")}>
            <Select
              value={form.type}
              onValueChange={(v) => set("type", v as WorkoutType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty}>
                    {t(`workoutType.${ty}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Sport and type are separate axes: a tempo effort is a tempo
              effort on a bike too. */}
          <Field label={t("workoutForm.sport")}>
            <div className="grid grid-cols-3 gap-2">
              {SPORTS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  aria-pressed={form.sport === sp}
                  onClick={() => set("sport", sp)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border py-2 text-sm font-medium transition-colors",
                    form.sport === sp
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-accent",
                  )}
                >
                  <SportIcon sport={sp} className="text-current" />
                  {t(`sport.${sp}`)}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t("workoutForm.titleLabel")}>
            <Input
              placeholder={t("workoutForm.titlePlaceholder")}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </Field>

          {mode === "plan" ? (
            <>
              {/* Scheduling: a single day, or a flexible window */}
              <label className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <span className="text-sm font-medium">
                  {t("workoutForm.flexible")}
                </span>
                <Switch
                  checked={form.flexible}
                  onCheckedChange={(v) => set("flexible", v)}
                />
              </label>
              {form.flexible ? (
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t("workoutForm.windowStart")}>
                    <Input
                      type="date"
                      value={form.windowStart}
                      onChange={(e) => set("windowStart", e.target.value)}
                    />
                  </Field>
                  <Field label={t("workoutForm.windowEnd")}>
                    <Input
                      type="date"
                      value={form.windowEnd}
                      onChange={(e) => set("windowEnd", e.target.value)}
                    />
                  </Field>
                </div>
              ) : (
                <Field label={t("workoutForm.date")}>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => set("date", e.target.value)}
                  />
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("workoutForm.distance", { unit: fmt.distanceUnit })}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={form.plannedDistanceKm}
                    onChange={(e) => set("plannedDistanceKm", e.target.value)}
                  />
                </Field>
                <Field label={t("workoutForm.paceLabel", { unit: fmt.speedUnitFor(form.sport) })}>
                  <Input
                    placeholder="4:58"
                    value={form.plannedPace}
                    onChange={(e) => set("plannedPace", e.target.value)}
                  />
                </Field>
              </div>
            </>
          ) : (
            <>
              <Field label={t("workoutForm.date")}>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <ScreenshotScanField
                splits={splits}
                onSplits={setSplits}
                onScanned={applyScan}
                sport={form.sport}
              />
              <Field label={t("workoutForm.distance", { unit: fmt.distanceUnit })}>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={form.actualDistanceKm}
                  onChange={(e) => set("actualDistanceKm", e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("workoutForm.durationMin")}>
                  <Input
                    inputMode="text"
                    placeholder="mm:ss"
                    readOnly={durationComputed}
                    aria-readonly={durationComputed}
                    className={durationComputed ? "bg-muted text-muted-foreground" : undefined}
                    value={durationFieldValue}
                    onChange={(e) => set("durationMin", e.target.value)}
                  />
                </Field>
                <Field label={t("workoutForm.paceLabel", { unit: fmt.speedUnitFor(form.sport) })}>
                  <Input
                    placeholder="4:58"
                    readOnly={paceComputed}
                    aria-readonly={paceComputed}
                    className={paceComputed ? "bg-muted text-muted-foreground" : undefined}
                    value={paceFieldValue}
                    onChange={(e) => set("actualPace", e.target.value)}
                  />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("workoutForm.computeHint")}
              </p>
              <Field label={t("workoutForm.startTime")}>
                <TimeField
                  value={form.startTime}
                  onChange={(v) => set("startTime", v)}
                />
              </Field>
              <ScannedSplits splits={splits} onClear={() => setSplits([])} />
              <Field label={t("workoutForm.notes")}>
                <Textarea
                  className="resize-y"
                  placeholder={t("workoutForm.notesPlaceholder")}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </Field>
              <label className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                <span className="text-sm font-medium">
                  {t("workoutForm.completed")}
                </span>
                <Switch
                  checked={form.completed}
                  onCheckedChange={(v) => set("completed", v)}
                />
              </label>
            </>
          )}
        </div>

        {/* Flat children so each button stacks full-width on mobile. The
            footer reverses on mobile, so DOM order puts Save on top and the
            destructive Delete furthest from it; on desktop `mr-auto` pushes
            Delete back to the left. */}
        <DialogFooter className="sm:justify-end">
          {isEdit ? (
            <Button
              type="button"
              variant="ghost"
              className="mt-1 text-destructive hover:text-destructive sm:mt-0 sm:mr-auto"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" /> {t("common.delete")}
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("common.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

