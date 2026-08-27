"use client";

import { useTranslation } from "react-i18next";
import { WATCH_BRANDS, type WatchBrand } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Single-select, unlike the athlete picker: people train for several things at
 * once, but they run with one watch. Picking a second would only raise "which
 * one do these instructions mean?".
 *
 * There is no "clear" affordance, because `"none"` is on the list. Saying "I do
 * not have one" is an answer, and an answer is what stops the app asking again
 * — see the tri-state on `Preferences.watch`.
 */
export function WatchPicker({
  value,
  onChange,
}: {
  value: WatchBrand | undefined;
  onChange: (next: WatchBrand) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-2">
      {WATCH_BRANDS.map((brand) => {
        const selected = value === brand;
        return (
          <button
            key={brand}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(brand)}
            className={cn(
              "flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-colors",
              selected ? "border-primary bg-primary/10" : "hover:bg-accent",
            )}
          >
            <span className="text-sm font-medium leading-tight">
              {t(`watch.${brand}`)}
            </span>
            <span className="text-xs leading-tight text-muted-foreground">
              {t(`watch.${brand}Desc`)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
