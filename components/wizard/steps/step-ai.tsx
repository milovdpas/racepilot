"use client";

import { Check, Copy, Download, Sparkles, Upload } from "lucide-react";
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
  const { copied: requestCopied, copy: copyRequest } = useCopyToClipboard();
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

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            downloadJSON(filename, requestJson())
          }
        >
          <Download className="size-4" /> {t("wizard.exportRequest")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void copyRequest(requestJson())}
        >
          {requestCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {requestCopied ? t("wizard.copied") : t("wizard.copyRequest")}
        </Button>
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
      </div>

      <div>
        <Label className="text-xs text-muted-foreground">
          {t("wizard.importLabel")}
        </Label>
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
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" /> {t("wizard.attachFile")}
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
