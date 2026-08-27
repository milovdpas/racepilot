"use client";

import { Check, Download, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { downloadJSON } from "@/lib/plan/storage";

/**
 * Hand the plan request to an AI, then bring its answer back. Owns only the
 * paste box and the copy buttons; building the request and importing the
 * result stay with the parent.
 */
export function StepAi({
  requestJson,
  filename,
  onComplete,
  error,
  onClearError,
}: {
  /** Built lazily — the draft can change right up until the button is hit. */
  requestJson: () => string;
  /** Named after the race, so two exports don't collide in Downloads. */
  filename: string;
  onComplete: (json: string) => void;
  error: string | null;
  onClearError: () => void;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importText, setImportText] = useState("");
  const { copied: promptCopied, copy: copyPrompt } = useCopyToClipboard();

  return (
    <Card className="gap-0 space-y-3 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-semibold">{t("wizard.stepAi")}</p>
      </div>
      <p className="text-xs text-muted-foreground">{t("wizard.aiIntro")}</p>
      <ol className="space-y-1 text-xs text-muted-foreground">
        <li>{t("wizard.aiStep1")}</li>
        <li>{t("wizard.aiStep2")}</li>
        <li>{t("wizard.aiStep3")}</li>
        <li>{t("wizard.aiStep4")}</li>
      </ol>

      {/* Ordered as the job is done: get the prompt into the chat, then give
          it the file. They are sequential, not alternatives, so no "or".

          There used to be a "Copy request" beside the download, which put the
          same JSON on the clipboard. Two buttons for one thing read as two
          things to do, and people did both. */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => void copyPrompt(t("wizard.aiPrompt"))}
        >
          {promptCopied ? (
            <Check className="size-4" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {promptCopied ? t("wizard.copied") : t("wizard.copyPrompt")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadJSON(filename, requestJson())}
        >
          <Download className="size-4" /> {t("wizard.exportRequest")}
        </Button>
      </div>

      <div>
        {/* One line, because these are two ways to do the same thing. As a
            label above the box and a button below it they read as separate
            steps, and "Attach" was the wrong verb inbound: attaching is what
            you do to the AI, importing is what this app does. */}
        <div className="flex flex-wrap items-center gap-2">
          <Label className="text-xs text-muted-foreground">
            {t("wizard.importLabel")}
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> {t("wizard.importFile")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) onComplete(await f.text());
              e.target.value = "";
            }}
          />
        </div>
        <Textarea
          className="mt-1.5 h-28 resize-y font-mono text-xs"
          placeholder='{"plans": …}'
          value={importText}
          onChange={(e) => {
            setImportText(e.target.value);
            onClearError();
          }}
        />
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            disabled={!importText.trim()}
            onClick={() => onComplete(importText)}
          >
            {t("wizard.completePlan")}
          </Button>
        </div>
        {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </Card>
  );
}
