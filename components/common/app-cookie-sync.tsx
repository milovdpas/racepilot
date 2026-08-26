"use client";

import { useEffect } from "react";
import { APP_COOKIE, APP_COOKIE_MAX_AGE, MARK_COOKIE } from "@/lib/app-cookie";
import { markForAthlete } from "@/lib/athlete";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * Mirrors "this browser has training data" into a cookie so `proxy.ts` can skip
 * the landing page for returning users without a flash.
 *
 * Kept in sync in both directions: clearing your plans clears the cookie too,
 * or someone who wiped their data would be bounced into an empty app instead of
 * seeing the landing page they should.
 *
 * `SameSite=Lax` because the only thing it does is choose which of our own
 * pages to show; it is deliberately not `HttpOnly`, since it has to be written
 * from here.
 */
export function AppCookieSync() {
  const hydrated = useTrainingStore((s) => s.hydrated);
  const hasPlans = useTrainingStore((s) => Object.keys(s.plans).length > 0);
  const athleteTypes = useTrainingStore((s) => s.preferences.athleteTypes);

  useEffect(() => {
    if (!hydrated) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const set = (name: string, value: string) => {
      document.cookie = value
        ? `${name}=${value}; Path=/; Max-Age=${APP_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
        : `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    };
    set(APP_COOKIE, hasPlans ? "1" : "");
    // Written even before they have a plan: the install prompt fires right
    // after onboarding, which is exactly when the sport is known and a plan
    // may not exist yet.
    set(MARK_COOKIE, athleteTypes?.length ? markForAthlete(athleteTypes) : "");
  }, [hydrated, hasPlans, athleteTypes]);

  return null;
}
