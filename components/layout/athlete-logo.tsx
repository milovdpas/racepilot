"use client";

import { AppLogo } from "@/components/layout/app-logo";
import { markForAthlete } from "@/lib/athlete";
import { useTrainingStore } from "@/store/use-training-store";

/**
 * The app mark, wearing the athlete's own sport.
 *
 * Falls back to the running mark before hydration and for anyone who hasn't
 * said what they do, which keeps the server and first client render identical.
 */
export function AthleteLogo({
  size,
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hydrated = useTrainingStore((s) => s.hydrated);
  const types = useTrainingStore((s) => s.preferences.athleteTypes);

  return (
    <AppLogo
      size={size}
      className={className}
      mark={hydrated ? markForAthlete(types) : "run"}
    />
  );
}
