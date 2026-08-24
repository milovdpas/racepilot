"use client";

import { Droplet } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DONATE_ENABLED } from "@/lib/site";

/**
 * Opt-in per deployment: see `DONATE_ENABLED`. Rendering nothing rather than a
 * disabled card, because a card explaining that donations are switched off is
 * not information anyone wants.
 */
export function SupportCard() {
  const { t } = useTranslation();
  if (!DONATE_ENABLED) return null;
  return (
    <Card className="gap-0 p-4">
      <h3 className="mb-1 text-sm font-semibold">{t("settings.support")}</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        {t("settings.supportDesc")}
      </p>
      <Button
        size="sm"
        nativeButton={false}
        className="self-start bg-[#1CA3EC] text-white transition-[filter] hover:brightness-95"
        render={
          <a
            href="https://buymeacoffee.com/milovanderpas"
            target="_blank"
            rel="noreferrer noopener"
          />
        }
      >
        <Droplet className="size-4" /> {t("settings.buyMeAWater")}
      </Button>
    </Card>
  );
}
