"use client";

import { HelpCircle, ScanText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SplitsExample } from "@/components/common/splits-example";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useMounted } from "@/hooks/use-mounted";
import { useTrainingStore } from "@/store/use-training-store";

export function SplitScannerCard() {
  const { t } = useTranslation();
  const enabled = useTrainingStore((s) => s.preferences.splitScannerEnabled);
  const setPreferences = useTrainingStore((s) => s.setPreferences);
  const mounted = useMounted();

  return (
    <Card className="gap-0 p-4">
      <div className="mb-1 flex items-center gap-2">
        <ScanText className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{t("splitScanner.title")}</h3>

        <Dialog>
          <DialogTrigger
            render={
              <button
                type="button"
                aria-label={t("splitScanner.helpTitle")}
                className="ml-auto grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
              />
            }
          >
            <HelpCircle className="size-4" />
          </DialogTrigger>
          <DialogContent className="overflow-y-auto sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>{t("splitScanner.helpTitle")}</DialogTitle>
              <DialogDescription>
                {t("splitScanner.helpBody")}
              </DialogDescription>
            </DialogHeader>
            <SplitsExample />
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              <li>{t("splitScanner.tip1")}</li>
              <li>{t("splitScanner.tip2")}</li>
              <li>{t("splitScanner.tip3")}</li>
              <li>{t("splitScanner.tip4")}</li>
              <li>{t("splitScanner.tip5")}</li>
            </ul>
          </DialogContent>
        </Dialog>
      </div>

      {!mounted ? (
        <div className="mt-2 h-9 w-40 animate-pulse rounded-md bg-muted" />
      ) : (
        <label className="mt-2 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
          <span className="min-w-0">
            <span className="block text-sm font-medium">
              {t("splitScanner.enable")}
            </span>
            <span className="block text-xs text-muted-foreground">
              {t("splitScanner.enableBody")}
            </span>
          </span>
          <Switch
            checked={!!enabled}
            onCheckedChange={(v) => setPreferences({ splitScannerEnabled: v })}
          />
        </label>
      )}
    </Card>
  );
}
