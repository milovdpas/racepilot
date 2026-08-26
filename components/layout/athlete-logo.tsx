"use client";

import { AppLogo } from "@/components/layout/app-logo";
import { markForAthlete, type MarkId } from "@/lib/athlete";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * The app mark, wearing the athlete's own sport.
 *
 * `initial` is what the server already worked out from `MARK_COOKIE`, and it is
 * what both the server render and the first client render use - so a triathlete
 * sees their own mark immediately instead of watching a runner turn into it.
 * Before that cookie exists it is the running mark, which is the right answer
 * for a first visit anyway.
 *
 * After hydration the store takes over, so a sport changed in another tab still
 * corrects itself.
 */
export function AthleteLogo({
  size,
  className,
  initial = "run",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  initial?: MarkId;
}) {
  const hydrated = useTrainingStore((s) => s.hydrated);
  const types = useTrainingStore((s) => s.preferences.athleteTypes);

  return (
    <AppLogo
      size={size}
      className={className}
      mark={hydrated ? markForAthlete(types) : initial}
    />
  );
}
