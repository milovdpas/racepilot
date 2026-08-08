"use client";

import { Check, Circle, Loader2, ScanText, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { SplitsList } from "@/components/common/splits-list";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useFormat } from "@/hooks/use-format";
import { formatClock, secondsToPace } from "@/lib/pace";
import { hasSummary, type ScanSummary, scanScreenshot } from "@/lib/scanner";
import type { Sport } from "@/lib/sport";
import type { WorkoutSplit } from "@/lib/types";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";

/** One line of "have we got this yet", for the two things a scan can yield. */
function ScanStatus({
  label,
  done,
  doneText,
  pendingText,
}: {
  label: string;
  done: boolean;
  doneText: string;
  pendingText: string;
}) {
  return (
    <li className="flex items-center gap-2">
      {done ? (
        <Check className="size-3.5 shrink-0 text-brand" />
      ) : (
        <Circle className="size-3.5 shrink-0 text-muted-foreground/40" />
      )}
      <span className={done ? "font-medium" : "text-muted-foreground"}>
        {label}
      </span>
      <span className="text-muted-foreground">{done ? doneText : pendingText}</span>
    </li>
  );
}

/** Values for the log form's text inputs, already in the user's own units. */
export interface ScannedFields {
  distance?: string;
  duration?: string;
  pace?: string;
  startTime?: string;
}

/**
 * "Scan screenshot" control for the log dialogs. OCR runs on-device and the
 * image is discarded; nothing is uploaded.
 *
 * One button reads either kind of Strava screenshot: the splits table, or the
 * activity summary with the totals and the start time. Which one the user
 * picked is not a question worth asking them, so it isn't asked — the scanner
 * works it out.
 *
 * What the user *does* need to know is that those are two different
 * screenshots and both are welcome, one after the other. A single button with
 * no feedback reads as "upload the screenshot", singular, and a form that has
 * just filled itself in looks done. So the two things a scan can produce are
 * listed with their state, and stay listed while empty.
 *
 * The names here still say "split" in the persisted places — the preference key
 * `splitScannerEnabled` and the `splitScanner` translation namespace — because
 * renaming a persisted key costs a migration and renaming a namespace touches
 * every key in two dictionaries, neither of which buys the user anything.
 */
export function ScreenshotScanField({
  splits,
  onSplits,
  onScanned,
  sport,
}: {
  splits: WorkoutSplit[];
  onSplits: (splits: WorkoutSplit[]) => void;
  /** Called with whatever the summary yielded, in display units. */
  onScanned?: (fields: ScannedFields) => void;
  sport: Sport;
}) {
  const { t } = useTranslation();
  const fmt = useFormat();
  const enabled = useTrainingStore((s) => s.preferences.splitScannerEnabled);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState<{ at: number; of: number } | null>(
    null,
  );
  // A screenshot holds the totals *or* the splits, never both, so scanning is
  // a two-step job. Tracking what has landed is what makes the second step
  // discoverable: without it, a filled-in form looks finished.
  const [gotDetails, setGotDetails] = useState(false);

  if (!enabled) return null;

  const handleFiles = async (files: File[]) => {
    try {
      let found: WorkoutSplit[] = [];
      let summary: ScanSummary = {};

      for (const [i, file] of files.entries()) {
        setScanning({ at: i + 1, of: files.length });
        // One at a time. Each scan stands up a WASM worker and holds a canvas
        // several times the size of the screenshot; running a handful of those
        // at once is how a phone runs out of memory mid-log.
        const result = await scanScreenshot(file);
        // The longest splits table wins rather than the last: re-scanning the
        // same run should never quietly shorten the list.
        if (result.splits.length > found.length) found = result.splits;
        // Fields merge, first answer per field, since a summary screenshot and
        // a splits screenshot of one run contribute different things.
        summary = { ...result.summary, ...summary };
      }

      const gotSummary = hasSummary(summary) && !!onScanned;

      if (found.length === 0 && !gotSummary) {
        toast.error(t("splitScanner.scanFailed"));
        return;
      }

      if (found.length > 0) onSplits(found);
      if (gotSummary) {
        setGotDetails(true);
        // The scan returns canonical km and seconds per km; the form holds
        // display units. Converting here keeps a Strava account set to miles
        // working in a kilometer app, and every sport in its own convention.
        onScanned({
          ...(summary.distanceKm != null
            ? { distance: fmt.distanceValue(summary.distanceKm, 2) }
            : {}),
          ...(summary.paceSecPerKm != null
            ? { pace: fmt.paceValue(secondsToPace(summary.paceSecPerKm), sport) }
            : {}),
          ...(summary.durationMin != null
            ? { duration: formatClock(summary.durationMin) }
            : {}),
          ...(summary.startTime != null
            ? { startTime: summary.startTime }
            : {}),
        });
      }

      // A single screenshot can only be one or the other; a selection of them
      // can be both, so the toast reports what the batch as a whole produced.
      toast.success(
        gotSummary && found.length > 0
          ? t("splitScanner.scannedBoth", { count: found.length })
          : gotSummary
            ? t("splitScanner.scannedSummary")
            : t("splitScanner.scanned", { count: found.length }),
      );
    } catch (e) {
      console.error("Screenshot scan failed:", e);
      toast.error(t("splitScanner.scanFailed"));
    } finally {
      setScanning(null);
    }
  };

  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {t("splitScanner.fieldLabel")}
      </Label>

      <p className="text-xs text-muted-foreground">
        {t("splitScanner.hint")}
      </p>

      <ul className="grid gap-1 text-xs">
        <ScanStatus
          label={t("splitScanner.statusDetails")}
          done={gotDetails}
          doneText={t("splitScanner.statusDetailsDone")}
          pendingText={t("splitScanner.statusPending")}
        />
        <ScanStatus
          label={t("splitScanner.statusSplits")}
          done={splits.length > 0}
          doneText={t("splitScanner.statusSplitsDone", {
            count: splits.length,
          })}
          pendingText={t("splitScanner.statusPending")}
        />
      </ul>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!!scanning}
          onClick={() => fileRef.current?.click()}
        >
          {scanning ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ScanText className="size-4" />
          )}
          {!scanning
            ? t("splitScanner.scanButton")
            : scanning.of > 1
              ? // Each screenshot is several seconds of OCR, so a batch has to
                // say how far along it is rather than sit on "Scanning...".
                t("splitScanner.scanningOf", scanning)
              : t("splitScanner.scanning")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length > 0) void handleFiles(files);
            e.target.value = "";
          }}
        />
      </div>

    </div>
  );
}

/**
 * The scanned splits, rendered wherever the dialog wants them.
 *
 * Separate from the control that produces them because a list of 17 rows sits
 * between the scan button and the fields it fills, which pushes the actual
 * form off the screen on a phone. The dialogs put this last instead.
 */
export function ScannedSplits({
  splits,
  onClear,
}: {
  splits: WorkoutSplit[];
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const enabled = useTrainingStore((s) => s.preferences.splitScannerEnabled);
  if (!enabled || splits.length === 0) return null;

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">
          {t("splitScanner.splitsTitle")}
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-muted-foreground"
          onClick={onClear}
        >
          <X className="size-4" /> {t("splitScanner.clear")}
        </Button>
      </div>
      <SplitsList splits={splits} />
    </div>
  );
}
