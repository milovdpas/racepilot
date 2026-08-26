"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatRange } from "@/lib/date";
import { newId } from "@/lib/id";
import type { Draft } from "@/lib/plan/request";
import type { SetDraft } from "@/components/wizard/steps/types";

const BLANK = { title: "", start: "", end: "", note: "" };

/** Vacations and trips that limit training, collected as plan context. */
export function StepOffDays({ draft, set }: { draft: Draft; set: SetDraft }) {
  const { t } = useTranslation();
  const [off, setOff] = useState(BLANK);

  const canAdd =
    !!off.title.trim() && !!off.start && !!off.end && off.start <= off.end;

  const add = () => {
    if (!canAdd) return;
    set("offDays", [
      ...draft.offDays,
      {
        id: newId(),
        title: off.title.trim(),
        start: off.start,
        end: off.end,
        note: off.note.trim() || undefined,
      },
    ]);
    setOff(BLANK);
  };

  return (
    <Card className="gap-0 space-y-3 p-4">
      <p className="text-xs text-muted-foreground">{t("wizard.offDaysIntro")}</p>

      {draft.offDays.length > 0 ? (
        <div className="space-y-2">
          {draft.offDays.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-2 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRange(o.start, o.end)}
                  {o.note ? ` · ${o.note}` : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label={t("common.remove")}
                onClick={() =>
                  set(
                    "offDays",
                    draft.offDays.filter((x) => x.id !== o.id),
                  )
                }
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-2 rounded-lg border p-3">
        <Input
          placeholder={t("offDays.titlePlaceholder")}
          value={off.title}
          onChange={(e) => setOff((o) => ({ ...o, title: e.target.value }))}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="date"
            value={off.start}
            onChange={(e) => setOff((o) => ({ ...o, start: e.target.value }))}
          />
          <Input
            type="date"
            value={off.end}
            onChange={(e) => setOff((o) => ({ ...o, end: e.target.value }))}
          />
        </div>
        <Input
          placeholder={t("offDays.notePlaceholder")}
          value={off.note}
          onChange={(e) => setOff((o) => ({ ...o, note: e.target.value }))}
        />
        <Button
          variant="outline"
          size="sm"
          className="self-start"
          disabled={!canAdd}
          onClick={add}
        >
          <Plus className="size-4" /> {t("common.add")}
        </Button>
      </div>

      <Button variant="ghost" size="sm" disabled className="self-start">
        {t("wizard.calendarSoon")}
      </Button>
    </Card>
  );
}
