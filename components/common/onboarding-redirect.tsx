"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTrainingStore } from "@/store/use-training-store";

/** Pages that must never bounce a first-time visitor away. */
const PUBLIC_PREFIXES = ["/welcome", "/privacy", "/terms_of_service"];

/**
 * Sends a brand-new visitor to the full-page welcome flow.
 *
 * Mounted in the root layout so it covers `/app/*` and any deep link into it.
 *
 * The `hydrated` guard is what stops every returning user flashing through
 * `/welcome` on load: it is false on first paint for everyone, so the decision
 * is only ever made once the store knows what's in localStorage.
 *
 * There is deliberately no redirect the other way — a user who has finished
 * onboarding can still open `/welcome` and replay the tour, which is what makes
 * "replay" possible from Settings without any extra state.
 */
export function OnboardingRedirect() {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useTrainingStore((s) => s.hydrated);
  const onboardingSeen = useTrainingStore((s) => s.preferences.onboardingSeen);

  const isPublic =
    pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
  const needsWelcome = hydrated && !onboardingSeen && !isPublic;

  useEffect(() => {
    // `replace`, not `push`: Back must not land on a chromeless half-state.
    if (needsWelcome) router.replace("/welcome");
  }, [needsWelcome, router]);

  return null;
}
