"use client";

import { format } from "date-fns";
import { Check, Copy, Download, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { downloadJSON } from "@/lib/plan/storage";
import { cn } from "@/lib/utils";
import { toast } from "@/store/use-toast-store";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Export / import the whole store, plus the copyable "edit with AI" prompt.
 *
 * The status message is local again. It used to be lifted into the settings
 * page and shared with PlansCard, so "plan deleted" reported here; once the
 * page became an accordion that put the confirmation for an action in one
 * section inside a different, probably collapsed one. Deleting a plan is a
 * transient event and now says so in a toast, which leaves this message about
 * importing, right next to the controls that produce it.
 */
export function DataCard() {
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null,
  );
  const { t } = useTranslation();
  const exportData = useTrainingStore((s) => s.exportData);
  const importData = useTrainingStore((s) => s.importData);

  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState("");
  const { copied: promptCopied, copy: copyPrompt } = useCopyToClipboard();

  const aiPrompt = t("settings.aiPrompt");

  const handleExport = () => {
    const json = exportData();
    if (!json) return;
    // Both this name and the old marathon-plans-* are gitignored: a raw export
    // carries the exporter's home coordinates in every weather snapshot, and
    // this repo is public.
    downloadJSON(`racepilot-plans-${format(new Date(), "yyyy-MM-dd")}.json`, json);
  };

  const runImport = (json: string) => {
    try {
      importData(json);
      setStatus({ ok: true, msg: t("settings.importedOk") });
      toast.success(t("settings.importedOk"));
      setImportText("");
    } catch (e) {
      console.error("Import failed:", e);
      setStatus({ ok: false, msg: t("settings.importFailed") });
    }
  };

  return (
    <Card className="gap-0 p-4">
      <h3 className="mb-1 text-sm font-semibold">{t("settings.data")}</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        {t("settings.dataIntro")}
      </p>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="size-4" /> {t("settings.exportJson")}
        </Button>
      </div>

      {/* Between the two, because that is the order the job happens in:
          export your plan, hand it to an AI, bring the answer back. It used
          to sit below the import box, so the middle step of the workflow was
          the last thing on the card. */}
      <div className="mt-3 rounded-lg border bg-muted/40 p-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <p className="text-xs font-semibold">{t("settings.aiTitle")}</p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("settings.aiIntro")}
        </p>
        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-md border bg-background p-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {aiPrompt}
        </pre>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => void copyPrompt(aiPrompt)}
        >
          {promptCopied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}
          {promptCopied ? t("settings.copied") : t("settings.copyPrompt")}
        </Button>
      </div>


      {/* Out above, in below. "Import file" used to sit in the export row, so a
          button that overwrites your plans lived next to the two that only read
          them. Paired with the paste box instead, since those are two ways to do
          one thing rather than two separate steps. */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs text-muted-foreground">
            {t("settings.pasteJson")}
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> {t("settings.importFile")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) runImport(await f.text());
              e.target.value = "";
            }}
          />
        </div>
        <Textarea
          className="mt-1.5 h-24 resize-y font-mono text-xs"
          placeholder='{"plans": …}'
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <Button
          size="sm"
          className="mt-2"
          disabled={!importText.trim()}
          onClick={() => runImport(importText)}
        >
          {t("settings.importPasted")}
        </Button>
      </div>

      {status ? (
        <p
          className={cn(
            "mt-3 text-xs",
            status.ok ? "text-easy" : "text-destructive",
          )}
        >
          {status.msg}
        </p>
      ) : null}
    </Card>
  );
}
