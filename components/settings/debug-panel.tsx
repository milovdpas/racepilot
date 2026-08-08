"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { useUnits } from "@/hooks/use-units";
import {
  type DiagSection,
  diagnosticsText,
  formatBytes,
  registerTap,
  shown,
} from "@/lib/diagnostics";
import { isLegacyHost } from "@/lib/legacy-host";
import { STORAGE_KEY } from "@/lib/plan/storage";
import {
  countryName,
  countrySource,
  detectCountry,
  unitsForCountry,
} from "@/lib/region";
import { SITE_URL } from "@/lib/site";
import { useSyncStore } from "@/store/use-sync-store";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Hidden diagnostics, opened by tapping the version line ten times.
 *
 * It exists because several things the app decides for you are invisible once
 * they have been decided. Country detection is the motivating one: it is
 * inferred from the browser, it silently picks your units, and no screen will
 * tell you what it concluded or which of its two sources answered. "Kilometers
 * look right" is not the same as "detection works", and without this the only
 * way to tell them apart is to read the source.
 *
 * It earned its keep immediately: the first run of this panel showed a Dutch
 * device reporting `US`, from an `en-US` locale sitting next to an
 * `Europe/Amsterdam` timezone, which is what led to `detectCountry` asking the
 * timezone first.
 *
 * Deliberately not gated to development builds. The question is always asked
 * about the *installed* app on a real phone, which is a production build by
 * definition; a panel that only exists in `next dev` could not answer it.
 *
 * The field names below are technical identifiers (`navigator.language`,
 * `localStorage`), not prose, so they stay in English while the panel's own
 * chrome is translated. Translating "navigator.language" would make the value
 * harder to match against the API it came from, not easier.
 */
function useDiagnostics(): DiagSection[] {
  const { i18n } = useTranslation();
  const units = useUnits();
  const store = useTrainingStore();
  const sync = useSyncStore();

  const detected = detectCountry();
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  const tz = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return undefined;
    }
  })();

  // Which source answered, since the two disagree in exactly the cases that
  // prompt someone to open this panel.
  const source = countrySource();

  const raw =
    typeof localStorage === "undefined" ? null : localStorage.getItem(STORAGE_KEY);
  const persistVersion = (() => {
    try {
      return raw ? String(JSON.parse(raw).version) : undefined;
    } catch {
      return "unreadable";
    }
  })();

  const activePlan = store.activePlanId ? store.plans[store.activePlanId] : null;

  const standalone =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS predates the media query and still reports it this way only.
      (navigator as unknown as { standalone?: boolean }).standalone === true);

  return [
    {
      title: "Region and units",
      rows: [
        { label: "navigator.language", value: shown(nav?.language) },
        { label: "navigator.languages", value: shown(nav?.languages) },
        { label: "Intl timezone", value: shown(tz) },
        {
          label: "Detected country",
          value: detected
            ? `${detected} (${countryName(detected, i18n.language)})`
            : "not set",
          hint:
            source === "timezone"
              ? "from the timezone, which tracks where the device is"
              : source === "locale"
                ? "from the locale's region subtag, because the timezone is not in the table. The locale says which conventions you want, not where you are"
                : "neither source gave a region; defaults to metric",
        },
        {
          label: "Units that country implies",
          value: unitsForCountry(detected),
        },
        {
          label: "Saved country",
          value: shown(store.preferences.country),
          hint:
            store.preferences.country && detected &&
            store.preferences.country !== detected
              ? "differs from what is detected now. It is written once and never overwritten, so change it in Settings if this one is wrong"
              : "what onboarding wrote, and what Settings edits",
        },
        {
          label: "Saved units",
          value: shown(store.preferences.units),
          hint: "an explicit choice here overrides the country outright",
        },
        { label: "Units in effect", value: units },
      ],
    },
    {
      title: "Training data",
      rows: [
        { label: "Hydrated", value: shown(store.hydrated) },
        { label: "Persist version", value: shown(persistVersion) },
        { label: "Plans", value: String(Object.keys(store.plans).length) },
        { label: "Active plan", value: shown(store.activePlanId) },
        {
          label: "Workouts in active plan",
          value: activePlan ? String(Object.keys(activePlan.workouts).length) : "0",
        },
        { label: "Example plan", value: shown(activePlan?.isExample) },
        { label: "Last modified", value: shown(store.lastModified) },
        { label: "Stored size", value: formatBytes(raw?.length ?? 0) },
      ],
    },
    {
      title: "Preferences",
      rows: [
        { label: "Athlete types", value: shown(store.preferences.athleteTypes) },
        { label: "Locale", value: shown(i18n.language) },
        { label: "Theme", value: shown(store.preferences.theme) },
        { label: "Weather", value: shown(store.preferences.weatherEnabled) },
        {
          label: "Screenshot scanner",
          value: shown(store.preferences.splitScannerEnabled),
        },
      ],
    },
    {
      title: "Cloud sync",
      rows: [
        { label: "Configured", value: shown(sync.configured) },
        { label: "Connected", value: shown(sync.connected) },
        { label: "Status", value: shown(sync.status) },
        { label: "Needs re-auth", value: shown(sync.needsReauth) },
        { label: "Last synced", value: shown(sync.lastSyncedAt) },
        { label: "Error", value: shown(sync.error) },
      ],
    },
    {
      title: "Environment",
      rows: [
        {
          label: "Host",
          value:
            typeof window === "undefined" ? "not set" : window.location.hostname,
        },
        { label: "Configured site URL", value: shown(SITE_URL) },
        {
          label: "Retired deployment",
          value: shown(isLegacyHost()),
          hint: "whether the 'we have moved' notice applies here",
        },
        { label: "Installed (standalone)", value: shown(standalone) },
        {
          label: "Service worker",
          value: shown(
            typeof navigator !== "undefined" && "serviceWorker" in navigator
              ? navigator.serviceWorker.controller
                ? "controlling"
                : "registered but not controlling"
              : undefined,
          ),
        },
        { label: "Online", value: shown(nav?.onLine) },
        {
          label: "Viewport",
          value:
            typeof window === "undefined"
              ? "not set"
              : `${window.innerWidth}x${window.innerHeight} @${window.devicePixelRatio}x`,
        },
        { label: "User agent", value: shown(nav?.userAgent) },
      ],
    },
  ];
}

function DebugDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  const sections = useDiagnostics();
  const { copied, copy } = useCopyToClipboard();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("debug.title")}</DialogTitle>
          <DialogDescription>{t("debug.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section.title}
              </h4>
              <dl className="divide-y rounded-lg border text-sm">
                {section.rows.map((row) => (
                  <div key={row.label} className="grid gap-0.5 px-3 py-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <dt className="text-xs text-muted-foreground">
                        {row.label}
                      </dt>
                      {/* Values run long (a user agent, a plan id) and are the
                          point of the panel, so they wrap rather than truncate. */}
                      <dd className="min-w-0 break-all text-right font-mono text-xs">
                        {row.value}
                      </dd>
                    </div>
                    {row.hint ? (
                      <p className="text-[11px] text-muted-foreground">
                        {row.hint}
                      </p>
                    ) : null}
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => void copy(diagnosticsText(sections))}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? t("common.copied") : t("debug.copy")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/**
 * The tap target: the version line at the very bottom of Settings.
 *
 * A visible, unremarkable element rather than an invisible hotspot. Someone
 * looking for this can find it, nobody trips over it, and it has an honest
 * reason to be on the page — "which build am I running" is worth answering on
 * its own.
 */
export function DebugPanel() {
  const { t } = useTranslation();
  const [taps, setTaps] = useState<number[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [open, setOpen] = useState(false);

  const handleTap = () => {
    const result = registerTap(taps, Date.now());
    setTaps(result.taps);
    // Stay quiet until they are clearly not tapping by accident.
    setRemaining(result.remaining <= 4 ? result.remaining : 0);
    if (result.unlocked) {
      setRemaining(0);
      setOpen(true);
    }
  };

  return (
    <div className="flex justify-end px-1 pb-2">
      <button
        type="button"
        onClick={handleTap}
        className="rounded-md px-2 py-1 text-right text-[11px] text-muted-foreground/60 select-none"
      >
        {t("debug.version", { version: process.env.NEXT_PUBLIC_APP_VERSION })}
        {remaining > 0 ? (
          <span className="ml-1">{t("debug.tapsToGo", { count: remaining })}</span>
        ) : null}
      </button>
      <DebugDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
