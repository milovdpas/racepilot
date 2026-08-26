"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useToastStore } from "@/store/use-toast-store";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** Renders transient toast notifications stacked at the bottom of the screen. */
export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    // Above dialogs/sheets (both z-50) so a toast fired from inside one is seen.
    <div className="pointer-events-none fixed inset-x-0 bottom-20 z-(--z-toast) flex flex-col items-center gap-2 px-4 md:bottom-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg",
            "animate-in fade-in slide-in-from-bottom-2",
            toast.variant === "success" && "border-easy/40",
            toast.variant === "error" && "border-destructive/40",
          )}
        >
          {toast.variant === "success" ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-easy" />
          ) : toast.variant === "error" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          ) : null}
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            aria-label={t("common.dismiss")}
            onClick={() => dismiss(toast.id)}
            className="-mr-1 grid size-5 shrink-0 place-items-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
