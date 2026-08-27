"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { parseStravaCsv, type SkipReason } from "@/lib/activity/strava-csv";
import {
  isActivitiesCsv,
  readZipEntry,
  UnreadableZipError,
} from "@/lib/activity/zip";
import type { ActivitySummary } from "@/lib/types";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Pick up an `activities.csv` from a Strava data export.
 *
 * Rendered in two places from one component - the Create plan wizard and the
 * Settings card - because the file, the parsing and the failure modes are
 * identical and only the surrounding copy differs.
 *
 * Deliberately **not** an API integration. Strava's API needs a paid
 * subscription and caps an app at 10 connected athletes without review, neither
 * of which works for something you self-host for free. A data export costs
 * nothing, needs no account linking, and any athlete can request one.
 *
 * Takes the export **zip** as downloaded, or a loose `activities.csv`. Asking
 * someone to unzip a 21 MB archive and go find one file inside it is where most
 * people would stop, and on a phone it is worse than tedious.
 *
 * Only `activities.csv` is read, out of either. The archive's `activities/*.gpx`
 * files are GPS traces starting at the athlete's front door, and the zip reader
 * is targeted rather than a general unpacker, so they are never inflated at
 * all. The CSV itself has no coordinate column of any kind, which is what makes
 * "location data never enters the app" a property of the design rather than a
 * promise about how carefully it is handled.
 */
export function ActivityImportField({
  label,
  onImported,
}: {
  /** The button's text. The two callers frame the same action differently. */
  label: string;
  /** The parsed activities, already merged into the store before this fires. */
  onImported?: (activities: ActivitySummary[]) => void;
}) {
  const { t } = useTranslation();
  const addActivities = useTrainingStore((s) => s.addActivities);
  const hasHistory = useTrainingStore((s) => s.activities.length > 0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{
    added: number;
    skipped: Partial<Record<SkipReason, number>>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * The CSV text, out of a zip or straight from the file.
   *
   * Sniffed rather than taken from the extension: a browser or a download
   * manager will happily hand over `activities.csv.zip` or a `.zip` renamed by
   * someone trying to be helpful, and the first four bytes settle it either way.
   */
  const readCsvText = async (file: File): Promise<string | null> => {
    const magic = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const isZip =
      magic[0] === 0x50 && magic[1] === 0x4b && magic[2] === 0x03 && magic[3] === 0x04;
    if (!isZip) return file.text();

    const entry = await readZipEntry(file, isActivitiesCsv);
    return entry?.text ?? null;
  };

  const handle = async (file: File) => {
    setError(null);
    try {
      const text = await readCsvText(file);
      if (text === null) {
        setResult(null);
        setError(t("activityImport.zipNoCsv"));
        return;
      }
      const { activities, skipped } = parseStravaCsv(text);
      if (activities.length === 0) {
        // A CSV that parsed but yielded nothing is almost always the wrong file
        // out of the archive, so say which one rather than "0 imported".
        setResult(null);
        setError(t("activityImport.nothingFound"));
        return;
      }
      addActivities(activities);
      setResult({ added: activities.length, skipped });
      onImported?.(activities);
    } catch (e) {
      console.error("Activity import failed:", e);
      setResult(null);
      // A zip we can describe but not open gets its own line, because the fix
      // is different: unzip it yourself and hand over the CSV.
      setError(
        e instanceof UnreadableZipError
          ? t("activityImport.zipUnreadable")
          : t("activityImport.failed"),
      );
    }
  };

  const skippedTotal = Object.values(result?.skipped ?? {}).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-4" /> {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".zip,.csv,application/zip,text/csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) await handle(file);
          // Cleared so re-picking the same file fires change again.
          e.target.value = "";
        }}
      />

      <p className="mt-2 text-xs text-muted-foreground">
        {t("activityImport.hint")}
      </p>

      {/* Where the file comes from, spelled out. Without this the button is
          useless to anyone who has not done it before, and the one fact people
          get stuck on is that Strava's mobile app cannot do it at all: the
          export lives only on the website.

          Collapsed once a history exists, because by then the athlete has
          plainly managed it and five permanent lines of instructions is exactly
          the clutter the settings accordion was meant to remove. Still one tap
          away, rather than gone. */}
      <details
        open={!hasHistory}
        className="mt-3 rounded-lg border border-dashed p-3"
      >
        <summary className="cursor-pointer text-xs font-medium marker:text-muted-foreground">
          {t("activityImport.howToTitle")}
        </summary>
        <p className="mb-2 mt-1.5 text-xs text-muted-foreground">
          {t("activityImport.howToWeb")}
        </p>
        <ol className="grid gap-1 text-xs text-muted-foreground">
          <li>
            1. {t("activityImport.howToStep1")}{" "}
            <a
              href="https://www.strava.com/account"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2 hover:text-foreground"
            >
              strava.com/account
            </a>
          </li>
          <li>2. {t("activityImport.howToStep2")}</li>
          <li>3. {t("activityImport.howToStep3")}</li>
        </ol>
      </details>

      {result ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("activityImport.added", { count: result.added })}
          {/* Named, not hidden. Someone who exported 300 activities and sees
              101 imported deserves to know the other 199 were walks and hikes
              rather than wondering what went wrong. */}
          {skippedTotal > 0
            ? ` ${t("activityImport.skipped", { count: skippedTotal })}`
            : null}
        </p>
      ) : null}

      {error ? <p className="mt-1.5 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
