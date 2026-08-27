"use client";

import { format } from "date-fns";
import { Check, Copy, Download, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useActivePlan } from "@/hooks/use-active-plan";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { todayISO } from "@/lib/date";
import { downloadJSON } from "@/lib/plan/storage";
import { upcomingWorkouts } from "@/lib/plan/workout";
import { needsSteps } from "@/lib/plan/workout-steps";
import type { Workout } from "@/lib/types";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * The upcoming sessions that would be better on a watch with steps than
 * without, and whether it is worth saying so.
 *
 * Exported because two places need the *question* and only one renders the
 * answer: the what's-new gate has to decide whether its step applies before it
 * renders anything, and duplicating the rule there is how the two drift apart.
 */
export function usePendingStructure(): {
  pending: Workout[];
  shouldOffer: boolean;
} {
  const plan = useActivePlan();
  const watch = useTrainingStore((s) => s.preferences.watch);

  // Upcoming by date, matching the calendar export and the word in the copy.
  // And only the session types that *have* structure: counting every stepless
  // workout meant counting easy, long and recovery runs, which the prompt
  // deliberately leaves alone. On a real 17-week plan that read "43 sessions
  // have no step breakdown", an athlete fixed all of them and it still said 27,
  // because 25 of those were correct as they were. A number that cannot reach
  // zero is not a nudge, it is a permanent complaint.
  const pending = plan
    ? upcomingWorkouts(Object.values(plan.workouts), todayISO()).filter(needsSteps)
    : [];

  // "none" and unset are both "no watch": this is advice about getting a
  // session onto a device, not general plan hygiene.
  const hasWatch = watch !== undefined && watch !== "none";
  return { pending, shouldOffer: hasWatch && pending.length > 0 };
}

/**
 * How to give an existing plan the structure a watch needs.
 *
 * Every plan written before `Workout.steps` has its intervals only in the
 * title: `"6×800m @ 4:10"` is prose, and nothing parses it. Those athletes get
 * the least from a watch export on precisely the days it would help most.
 *
 * The route is the AI round trip the app already has, rather than a title
 * parser. A parser would have to guess at every way a human writes an interval
 * session and would be wrong often enough to matter — and wrong here means a
 * wrong target on someone's wrist. A model reading the whole plan does this
 * well, and `normalizeSteps()` discards anything it invents that a step cannot
 * be.
 *
 * All three steps of the round trip are here: export, copy, import. Sending
 * someone elsewhere for two of them and back here for the third is how a
 * three-step job becomes a six-step one. It reuses the same `exportData` and
 * `importData` the Data card does, so there is one import path and not two.
 *
 * Rendered in two places, which is why the chrome is a prop: inside the watch
 * settings card, and inside the one-time prompt that fires the moment someone
 * picks a watch. That second one is the teachable moment — it is exactly when
 * "your intervals will export as one flat block" stops being abstract.
 */
export function PlanStepsUpgrade({ chrome = true }: { chrome?: boolean }) {
  const { t } = useTranslation();
  const { pending, shouldOffer } = usePendingStructure();
  const exportData = useTrainingStore((s) => s.exportData);
  const importData = useTrainingStore((s) => s.importData);
  const { copied, copy } = useCopyToClipboard();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");

  if (!shouldOffer) return null;
  const count = pending.length;

  /**
   * The prompt, with the exact workouts appended.
   *
   * Naming them does two jobs. It saves the model scanning sixty workouts to
   * decide which have structure, and it puts the *numbers* beside each title,
   * which is what the "the stored values are the truth" rule needs to be
   * actionable: seeing `6x800m` next to `5 km total` is how it knows to scale
   * the session rather than overflow it.
   */
  const promptWithTargets = () => {
    const lines = pending.map((w) => {
      const title = w.title.trim() || t(`workoutType.${w.type}`);
      const pace = w.plannedPace ? ` at ${w.plannedPace}/km` : "";
      return `- "${w.id}": ${title} (${w.plannedDistanceKm} km total${pace})`;
    });
    return [t("upgradePlan.prompt"), "", t("upgradePlan.only"), ...lines].join("\n");
  };

  const handleExport = () => {
    const json = exportData();
    // Empty when there are no plans; a blank file would look like a successful
    // export of nothing.
    if (!json) return;
    downloadJSON(`racepilot-plans-${format(new Date(), "yyyy-MM-dd")}.json`, json);
  };

  const runImport = (json: string) => {
    try {
      importData(json);
      setError(null);
      setPasted("");
      toast.success(t("settings.importedOk"));
    } catch (e) {
      console.error("Import failed:", e);
      setError(t("settings.importFailed"));
    }
  };

  const body = (
    <>
      <p className="mb-2 text-xs text-muted-foreground">
        {t("upgradePlan.body", { count })}
      </p>

      {/* Naming them is the difference between a number and a task. "2 sessions
          need structure" means hunting through seventeen weeks; two names mean
          opening two workouts. Capped, because a fresh plan can have a dozen
          and a wall of titles is a number again. */}
      <ul className="mb-3 grid gap-0.5 text-xs text-muted-foreground">
        {pending.slice(0, 3).map((w) => (
          <li key={w.id} className="truncate">
            &middot; {w.title.trim() || t(`workoutType.${w.type}`)}
          </li>
        ))}
        {count > 3 ? (
          <li>&middot; {t("upgradePlan.andMore", { count: count - 3 })}</li>
        ) : null}
      </ul>

      <ol className="mb-3 grid gap-2">
        <Step n={1} label={t("upgradePlan.stepExport")}>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" /> {t("upgradePlan.export")}
          </Button>
        </Step>
        <Step n={2} label={t("upgradePlan.stepPrompt")}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void copy(promptWithTargets())}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? t("settings.copied") : t("upgradePlan.copy")}
          </Button>
        </Step>
        <Step n={3} label={t("upgradePlan.stepImport")}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> {t("upgradePlan.import")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) runImport(await file.text());
              // Cleared so re-picking the same file fires change again.
              e.target.value = "";
            }}
          />
        </Step>
      </ol>

      {/* Pasting is the commoner path, not the fallback: most models answer in
          the chat window and only offer a file if you ask for one. The text is
          repaired by `sanitizeImportJson`, so a reply wrapped in prose or a
          code fence still imports. */}
      <div className="mt-1">
        <p className="mb-1.5 text-xs text-muted-foreground">
          {t("upgradePlan.orPaste")}
        </p>
        <Textarea
          className="h-20 resize-y font-mono text-xs"
          placeholder='{"plans": …}'
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
        />
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={!pasted.trim()}
          onClick={() => runImport(pasted)}
        >
          <Upload className="size-4" /> {t("upgradePlan.importPasted")}
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </>
  );

  // Bare inside a dialog, which supplies its own heading and border. A second
  // title under the dialog's own would just be the same sentence twice.
  if (!chrome) return <div className="grid">{body}</div>;

  return (
    <div className="mt-4 rounded-lg border border-dashed p-3">
      <div className="mb-1 flex items-center gap-2">
        <Sparkles className="size-4 text-muted-foreground" />
        <h4 className="text-sm font-medium">{t("upgradePlan.title")}</h4>
      </div>
      {body}
    </div>
  );
}

/** A numbered step, so the order of the three buttons is not left to guesswork. */
function Step({
  n,
  label,
  children,
}: {
  n: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-wrap items-center gap-2">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-medium">
        {n}
      </span>
      <span className="min-w-0 flex-1 text-xs text-muted-foreground">
        {label}
      </span>
      {children}
    </li>
  );
}
