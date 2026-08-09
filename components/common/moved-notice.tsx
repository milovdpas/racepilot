"use client";

import { lazy, Suspense } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { isLegacyHost } from "@/lib/legacy-host";

/**
 * The gate for the "this has moved" dialog, and deliberately nothing more.
 *
 * This mounts in the root layout, so it is on every page including the two
 * static marketing pages — but it only ever *renders* on the retired Vercel
 * deployment. Importing the dialog directly would have made every visitor to
 * the real site download a dialog, the training store, the export path and
 * i18n in order to render null. `lazy` keeps all of that behind the host
 * check, so the cost on the live site is this file and nothing else.
 *
 * Plain `React.lazy` rather than `next/dynamic`: this is a client component
 * either way, and lazy has no framework-specific behaviour to get wrong.
 *
 * Scheduled for deletion with the rest of the migration notice in December
 * 2026 — see docs/tech-debt.md.
 */
const MovedDialog = lazy(() =>
  import("@/components/common/moved-dialog").then((m) => ({
    default: m.MovedDialog,
  })),
);

export function MovedNotice() {
  // `useMounted` keeps the server and first client render identical; the host
  // check reads `window`, so it cannot run before that.
  const mounted = useMounted();
  if (!mounted || !isLegacyHost()) return null;

  // No fallback: a migration notice appearing a beat late is invisible, and a
  // spinner on top of the page would be worse than nothing.
  return (
    <Suspense fallback={null}>
      <MovedDialog />
    </Suspense>
  );
}
