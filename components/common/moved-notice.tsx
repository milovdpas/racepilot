"use client";

import { Download, ExternalLink } from "lucide-react";
import { useState } from "react";
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
import { useMounted } from "@/hooks/use-mounted";
import { NEW_HOME, isLegacyHost } from "@/lib/legacy-host";
import { downloadJSON } from "@/lib/plan/storage";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Tells anyone still on the retired deployment that the app has moved, and
 * hands them their data on the way out.
 *
 * Written to be deleted: this goes when the Vercel project is retired (planned
 * December 2026), along with `lib/legacy-host.ts`, the `moved:` locale section
 * and two call sites. docs/tech-debt.md has the checklist.
 *
 * Scoped to that one deployment by an allowlist, not to "every host that isn't
 * the new one": this app is self-hostable, and a popup telling someone running
 * their own instance to leave for a domain they don't control would be
 * user-hostile at best. See `lib/legacy-host.ts`.
 *
 * The export button is the point of this dialog. Training lives in
 * `localStorage`, which is scoped per origin, so nothing follows them to the
 * new domain automatically — telling someone to "go here instead" without
 * giving them their plan first would strand a training block behind a link
 * they are about to stop visiting.
 *
 * Dismissal is per page load rather than remembered. That is deliberate for a
 * migration: the whole reason this deployment is still up is to move people off
 * it, and a permanently dismissed notice quietly defeats that. Nobody outside
 * that one deployment ever sees it, so the nagging is contained.
 */
export function MovedNotice() {
  const { t } = useTranslation();
  const mounted = useMounted();
  const hydrated = useTrainingStore((s) => s.hydrated);
  const exportData = useTrainingStore((s) => s.exportData);
  const hasPlans = useTrainingStore((s) => Object.keys(s.plans).length > 0);
  const [dismissed, setDismissed] = useState(false);

  // `useMounted` keeps the server and first client render identical; the host
  // check reads `window`, so it cannot run before that.
  if (!mounted || dismissed || !isLegacyHost()) return null;

  const handleExport = () => {
    const json = exportData();
    // Empty when there are no plans — writing a blank file would look like a
    // successful backup of nothing.
    if (!json) return;
    downloadJSON(
      `racepilot-plans-${new Date().toISOString().slice(0, 10)}.json`,
      json,
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && setDismissed(true)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("moved.title")}</DialogTitle>
          <DialogDescription>
            {t("moved.body", { url: new URL(NEW_HOME).hostname })}
          </DialogDescription>
        </DialogHeader>

        {hydrated && hasPlans ? (
          <div className="rounded-xl border p-3">
            <p className="text-sm font-medium">{t("moved.dataTitle")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("moved.dataBody")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleExport}
            >
              <Download className="size-4" /> {t("moved.export")}
            </Button>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-end">
          <Button variant="ghost" onClick={() => setDismissed(true)}>
            {t("moved.stay")}
          </Button>
          <Button
            render={
              // A plain anchor, so it works with middle-click and "open in new
              // tab" like any other link to another site.
              <a href={NEW_HOME} rel="noopener" />
            }
          >
            <ExternalLink className="size-4" /> {t("moved.go")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
