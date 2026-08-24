"use client";

import { useTranslation } from "react-i18next";
import { WatchPicker } from "@/components/common/watch-picker";
import type { WatchBrand } from "@/lib/types";

/**
 * Which watch the athlete trains with.
 *
 * Optional, like the profile step: skipping leaves `watch` unset, which offers
 * every export rather than none. The answer only ever changes the instructions
 * an export shows, never the file, so getting it wrong costs nothing but a
 * paragraph of the wrong advice.
 */
export function StepWatch({
  value,
  onChange,
}: {
  value: WatchBrand | undefined;
  onChange: (next: WatchBrand) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <WatchPicker value={value} onChange={onChange} />
      <p className="text-xs text-muted-foreground">{t("welcome.watchHint")}</p>
    </div>
  );
}
