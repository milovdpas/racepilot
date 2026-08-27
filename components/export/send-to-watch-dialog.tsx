"use client";

import { CalendarPlus, Loader2, Watch } from "lucide-react";
import { useEffect, useState } from "react";
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
import { useExportFormat } from "@/hooks/use-export-format";
import {
  availableTargets,
  type ExportTarget,
  type ExportTargetId,
} from "@/lib/export/target";
import type { TrainingPlan, WatchBrand, Workout } from "@/lib/types";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";

const ICON: Record<ExportTargetId, typeof Watch> = {
  "fit-file": Watch,
  "ics-file": CalendarPlus,
  intervals: Watch,
  garmin: Watch,
};

/**
 * The follow-up copy is per *brand*, not per target: the file is the same
 * bytes for a Garmin and a COROS, and only the instructions differ. A brand we
 * have no instructions for falls back to the generic line rather than inventing
 * steps that might not exist on that device.
 */
function followUpKey(target: ExportTarget, watch: WatchBrand | undefined) {
  if (target.followUp === "calendar") return "export.followUp.calendar";
  if (target.followUp !== "usb") return null;
  const known: WatchBrand[] = ["garmin", "coros", "wahoo", "apple"];
  return watch && known.includes(watch)
    ? `export.followUp.${watch}`
    : "export.followUp.generic";
}

/**
 * Offers the ways this athlete can get a workout onto their watch.
 *
 * The list comes from `availableTargets`, so a Polar owner is never shown a
 * `.fit` button that leads nowhere. Deciding that here, rather than in each
 * caller, is the point of the factory.
 */
export function SendToWatchDialog({
  workouts,
  plan,
  open,
  onOpenChange,
}: {
  workouts: Workout[];
  plan: TrainingPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const format = useExportFormat(plan);
  const preferences = useTrainingStore((s) => s.preferences);
  const [targets, setTargets] = useState<ExportTarget[] | null>(null);
  const [busy, setBusy] = useState<ExportTargetId | null>(null);

  useEffect(() => {
    if (!open) return;
    let live = true;
    // Workout scope only. A calendar file is the whole block, which is a plan
    // action offered on the plan and calendar pages; beside one session it is
    // just a second button asking which one you meant.
    void availableTargets(preferences, "workout").then((next) => {
      if (live) setTargets(next);
    });
    return () => {
      live = false;
    };
  }, [open, preferences]);

  const run = async (target: ExportTarget) => {
    if (!plan) return;
    setBusy(target.id);
    try {
      const result = await target.deliver({
        plan,
        workouts,
        format,
        now: new Date(),
      });
      if (result.ok) toast.success(t("export.done"));
      else toast.error(t("export.failed"));
    } catch (e) {
      // A target is contracted to return { ok: false } rather than throw, but
      // a throw must not leave the dialog spinning with every button disabled
      // and nothing said. The finally is the part that matters.
      console.error("Export failed:", e);
      toast.error(t("export.failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("export.title")}</DialogTitle>
          <DialogDescription>
            {t("export.desc", { count: workouts.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {targets === null ? (
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          ) : (
            targets.map((target) => {
              const Icon = ICON[target.id];
              const hint = followUpKey(target, preferences.watch);
              return (
                <button
                  key={target.id}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void run(target)}
                  className="grid gap-1 rounded-lg border p-3 text-left hover:bg-accent disabled:opacity-60"
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {busy === target.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Icon className="size-4 text-muted-foreground" />
                    )}
                    {t(`export.${target.id}`)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(`export.${target.id}Body`)}
                  </span>
                  {hint ? (
                    <span className="mt-1 text-xs text-muted-foreground">
                      {t(hint)}
                    </span>
                  ) : null}
                </button>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
