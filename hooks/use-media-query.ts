"use client";

import { useSyncExternalStore } from "react";

/**
 * Whether a CSS media query matches, kept live as the window resizes.
 *
 * For the rare component whose *structure* depends on the screen, not just its
 * styling: a bottom sheet on a phone and a centred dialog on a desktop are
 * different parts, which a responsive class cannot swap. `false` on the
 * server; every app page renders under `HydrationGate` anyway.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
