"use client";

import { AppCookieSync } from "@/components/common/app-cookie-sync";
import { OnboardingRedirect } from "@/components/common/onboarding-redirect";
import { RegionDetect } from "@/components/common/region-detect";
import { SyncInitializer } from "@/components/common/sync-initializer";
import { Toaster } from "@/components/common/toaster";
import { I18nProvider } from "@/components/layout/i18n-provider";

/**
 * Everything the *app* needs running, mounted only where the app runs.
 *
 * All of this used to live in the root layout, which meant `/` and `/privacy`
 * — two static, English, server-rendered marketing pages — downloaded the
 * whole client runtime: both i18n dictionaries, the sync and weather stores,
 * the toast layer. Measured, the landing page pulled the same ~950 KB of
 * JavaScript as the dashboard, and `SyncInitializer` fired an auth-session and
 * a weather request for a visitor who has no account and has opted into
 * nothing. On the page whose entire pitch is that the app does not do that,
 * the request log was the wrong thing to hand a curious visitor.
 *
 * Mounted in two places, because the app is served from two roots: everything
 * under `/app`, and `/welcome`, which is the first-run flow and needs
 * translations, the store and the country detection that writes
 * `preferences.country`.
 *
 * `MovedNotice` deliberately stays in the root layout instead: on the retired
 * deployment a returning bookmark lands on `/`, and that is exactly the person
 * the notice exists for.
 */
export function AppRuntime({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SyncInitializer />
      <OnboardingRedirect />
      <AppCookieSync />
      <RegionDetect />
      <Toaster />
      {children}
    </I18nProvider>
  );
}
