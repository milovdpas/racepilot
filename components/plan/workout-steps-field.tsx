"use client";

import { ChevronDown, ChevronUp, Plus, Repeat, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormat } from "@/hooks/use-format";
import { newId } from "@/lib/id";
import { stepsDistanceKm } from "@/lib/plan/workout-steps";
import type { Sport } from "@/lib/sport";
import type { StepRole, WorkoutBlock, WorkoutStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLES: StepRole[] = ["warmup", "work", "recovery", "cooldown"];

/**
 * The editor's own state: DISPLAY units, held as raw strings.
 *
 * Deliberately not the canonical `WorkoutBlock[]`. Round-tripping through
 * numbers on every keystroke eats a half-typed "1." the moment it is
 * reformatted, and converting km to miles and back on each character would
 * drift. So the rows are text the user owns, and `toBlocks()` is the single
 * place they become data.
 */
interface StepRow {
  id: string;
  role: StepRole;
  /** Distance-based or time-based. A step is one or the other, never both. */
  mode: "distance" | "time";
  /** A distance in display units, or a number of minutes. */
  amount: string;
  /** Pace in this sport's display convention. */
  pace: string;
}

type Row =
  | { id: string; kind: "step"; step: StepRow }
  | { id: string; kind: "repeat"; times: string; steps: StepRow[] };

const blankStep = (role: StepRole = "work"): StepRow => ({
  id: newId(),
  role,
  mode: "distance",
  amount: "",
  pace: "",
});

interface Converters {
  toStoredDistance: (value: number) => number;
  toStoredPace: (input: string) => string | undefined;
  distanceValue: (km: number, decimals?: number) => string;
  paceValue: (pace?: string | null) => string;
}

function rowsFromBlocks(blocks: WorkoutBlock[], c: Converters): Row[] {
  const toRow = (s: WorkoutStep): StepRow => ({
    id: newId(),
    role: s.role,
    mode: s.durationSec != null ? "time" : "distance",
    amount:
      s.durationSec != null
        ? String(Math.round(s.durationSec / 60))
        : s.distanceKm != null
          ? c.distanceValue(s.distanceKm, 2)
          : "",
    pace: s.pace ? c.paceValue(s.pace) : "",
  });

  return blocks.map((block) =>
    block.kind === "step"
      ? { id: newId(), kind: "step" as const, step: toRow(block) }
      : {
          id: newId(),
          kind: "repeat" as const,
          times: String(block.times),
          steps: block.steps.map(toRow),
        },
  );
}

/**
 * Rows back to canonical blocks, dropping anything not yet usable.
 *
 * A half-finished row is normal while typing, so it is skipped rather than
 * treated as an error: the same tolerance `resolveLoggedRun` shows the three
 * fields above this section.
 */
function toBlocks(rows: Row[], c: Converters): WorkoutBlock[] {
  const toStep = (r: StepRow): WorkoutStep | null => {
    const n = Number.parseFloat(r.amount.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return null;
    const pace = r.pace.trim() ? c.toStoredPace(r.pace.trim()) : undefined;
    return {
      role: r.role,
      ...(r.mode === "time"
        ? { durationSec: Math.round(n * 60) }
        : { distanceKm: c.toStoredDistance(n) }),
      ...(pace ? { pace } : {}),
    };
  };

  const out: WorkoutBlock[] = [];
  for (const row of rows) {
    if (row.kind === "step") {
      const step = toStep(row.step);
      if (step) out.push({ kind: "step", ...step });
      continue;
    }
    const times = Number.parseInt(row.times, 10);
    const steps = row.steps
      .map(toStep)
      .filter((s): s is WorkoutStep => s !== null);
    if (Number.isFinite(times) && times >= 1 && steps.length > 0) {
      out.push({ kind: "repeat", times, steps });
    }
  }
  return out;
}

/**
 * Break a session into steps, so a watch can guide the athlete through it.
 *
 * Collapsed unless the workout already has structure: most sessions are a plain
 * distance at a pace, and this would be noise on all of them.
 */
export function WorkoutStepsField({
  value,
  onChange,
  sport,
  plannedDistance,
  onUseStepTotal,
}: {
  value: WorkoutBlock[];
  onChange: (blocks: WorkoutBlock[]) => void;
  sport: Sport;
  /** The workout's own total, in display units, to compare against. */
  plannedDistance: string;
  onUseStepTotal: (displayValue: string) => void;
}) {
  const { t } = useTranslation();
  const fmt = useFormat();

  const c: Converters = {
    toStoredDistance: fmt.toStoredDistance,
    toStoredPace: (input) => fmt.toStoredPaceFor(input, sport),
    distanceValue: fmt.distanceValue,
    paceValue: (p) => fmt.paceValue(p, sport),
  };

  const [rows, setRows] = useState<Row[]>(() => rowsFromBlocks(value, c));
  const [open, setOpen] = useState(value.length > 0);

  const commit = (next: Row[]) => {
    setRows(next);
    onChange(toBlocks(next, c));
  };

  const patchStep = (rowId: string, stepId: string, patch: Partial<StepRow>) =>
    commit(
      rows.map((row) => {
        if (row.id !== rowId) return row;
        if (row.kind === "step") {
          return row.step.id === stepId
            ? { ...row, step: { ...row.step, ...patch } }
            : row;
        }
        return {
          ...row,
          steps: row.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
        };
      }),
    );

  const move = (index: number, by: number) => {
    const to = index + by;
    if (to < 0 || to >= rows.length) return;
    const next = [...rows];
    [next[index], next[to]] = [next[to], next[index]];
    commit(next);
  };

  const total = stepsDistanceKm(toBlocks(rows, c));
  const totalDisplay = fmt.distanceValue(total, 2);
  const planned = Number.parseFloat(plannedDistance.replace(",", "."));
  // Only worth raising once there is something to compare and the gap is large
  // enough to be a mistake rather than rounding.
  const mismatch =
    total > 0 &&
    Number.isFinite(planned) &&
    Math.abs(Number.parseFloat(totalDisplay) - planned) > 0.05;

  const stepEditor = (rowId: string, s: StepRow, nested: boolean) => (
    <div key={s.id} className={cn("grid gap-2", nested && "pl-3")}>
      <div className="flex items-center gap-2">
        <Select
          value={s.role}
          onValueChange={(v) => patchStep(rowId, s.id, { role: v as StepRole })}
        >
          <SelectTrigger className="h-9 w-28 shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((role) => (
              <SelectItem key={role} value={role}>
                {t(`steps.role.${role}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          inputMode="decimal"
          className="h-9 min-w-0 flex-1"
          placeholder={s.mode === "time" ? t("steps.min") : fmt.distanceUnit}
          value={s.amount}
          onChange={(e) => patchStep(rowId, s.id, { amount: e.target.value })}
        />

        {/* Distance or time, never both. The model rejects a step that is
            somehow both, so the input must not be able to express it. */}
        <div className="flex shrink-0 rounded-lg border p-0.5">
          {(["distance", "time"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              aria-pressed={s.mode === mode}
              className={cn(
                "rounded-md px-2 py-1 text-xs",
                s.mode === mode
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
              onClick={() => patchStep(rowId, s.id, { mode })}
            >
              {mode === "distance" ? fmt.distanceUnit : t("steps.min")}
            </button>
          ))}
        </div>
      </div>

      <Input
        className="h-9"
        placeholder={t("steps.pacePlaceholder", {
          unit: fmt.speedUnitFor(sport),
        })}
        value={s.pace}
        onChange={(e) => patchStep(rowId, s.id, { pace: e.target.value })}
      />
    </div>
  );

  return (
    <div className="grid gap-2 rounded-lg border p-3">
      <button
        type="button"
        className="flex items-center justify-between gap-2 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="text-sm font-medium">{t("steps.title")}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {rows.length > 0
            ? t("steps.count", { count: rows.length })
            : t("steps.optional")}
          {open ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </span>
      </button>

      {open ? (
        <>
          <p className="text-xs text-muted-foreground">{t("steps.hint")}</p>

          {rows.map((row, i) => (
            <div key={row.id} className="grid gap-2 rounded-lg border p-2">
              <div className="flex items-center gap-1">
                {row.kind === "repeat" ? (
                  <>
                    <Repeat className="size-4 shrink-0 text-muted-foreground" />
                    <Input
                      inputMode="numeric"
                      aria-label={t("steps.times")}
                      className="h-8 w-14"
                      value={row.times}
                      onChange={(e) =>
                        commit(
                          rows.map((r) =>
                            r.id === row.id && r.kind === "repeat"
                              ? { ...r, times: e.target.value }
                              : r,
                          ),
                        )
                      }
                    />
                    <span className="text-xs text-muted-foreground">x</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {t("steps.step")}
                  </span>
                )}

                <div className="ml-auto flex items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("steps.moveUp")}
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("steps.moveDown")}
                    disabled={i === rows.length - 1}
                    onClick={() => move(i, 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("steps.remove")}
                    onClick={() => commit(rows.filter((r) => r.id !== row.id))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>

              {row.kind === "step"
                ? stepEditor(row.id, row.step, false)
                : row.steps.map((s) => stepEditor(row.id, s, true))}

              {row.kind === "repeat" ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="justify-start text-muted-foreground"
                  onClick={() =>
                    commit(
                      rows.map((r) =>
                        r.id === row.id && r.kind === "repeat"
                          ? { ...r, steps: [...r.steps, blankStep("recovery")] }
                          : r,
                      ),
                    )
                  }
                >
                  <Plus className="size-4" /> {t("steps.addToRepeat")}
                </Button>
              ) : null}
            </div>
          ))}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                commit([
                  ...rows,
                  { id: newId(), kind: "step", step: blankStep() },
                ])
              }
            >
              <Plus className="size-4" /> {t("steps.addStep")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                commit([
                  ...rows,
                  {
                    id: newId(),
                    kind: "repeat",
                    times: "6",
                    steps: [blankStep("work"), blankStep("recovery")],
                  },
                ])
              }
            >
              <Repeat className="size-4" /> {t("steps.addRepeat")}
            </Button>
          </div>

          {total > 0 ? (
            <p className="text-xs text-muted-foreground">
              {t("steps.total", {
                total: totalDisplay,
                unit: fmt.distanceUnit,
              })}
              {mismatch ? (
                <>
                  {" "}
                  {t("steps.mismatch", { planned: plannedDistance })}{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => onUseStepTotal(totalDisplay)}
                  >
                    {t("steps.useTotal")}
                  </button>
                </>
              ) : null}
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
