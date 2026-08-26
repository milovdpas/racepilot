import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextPlanGate } from "@/components/common/next-plan-gate";
import { WhatsNewGate } from "@/components/common/whats-new-gate";
import { AppNav } from "@/components/layout/app-nav";
import { AppRuntime } from "@/components/layout/app-runtime";
import { AthleteLogo } from "@/components/layout/athlete-logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { MARK_COOKIE } from "@/lib/app-cookie";
import { markFromCookie } from "@/lib/athlete";
import { SITE_NAME } from "@/lib/site";

/**
 * Every page under here renders behind `HydrationGate`, so a crawler sees a
 * skeleton and nothing else — there is nothing to index and never will be. One
 * export covers the whole section, including routes added later.
 *
 * Note this is `noindex`, not a robots.txt `Disallow`: Google has to be able to
 * fetch these pages in order to see the directive.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Reading a cookie makes this segment render on demand rather than being
 * prerendered. That is a real cost and a small one here: every page under it
 * sits behind `HydrationGate` and renders a skeleton until `localStorage`
 * arrives, so the prerendered HTML was never the useful part. What it buys is
 * the app badge being right in the first paint instead of visibly changing
 * from a runner once the store loads.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mark = markFromCookie((await cookies()).get(MARK_COOKIE)?.value);

  return (
    <AppRuntime>
      <WhatsNewGate />
      <NextPlanGate />
      <div className="flex min-h-dvh">
        <AppNav initialMark={mark} />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile top bar */}
          <header className="sticky top-0 z-(--z-topbar) flex h-(--h-topbar) items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:hidden">
            <div className="flex items-center gap-2">
              <AthleteLogo size="sm" initial={mark} />
              <span className="text-sm font-semibold">{SITE_NAME}</span>
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-12 md:pt-8">
            <div className="mx-auto w-full max-w-3xl">{children}</div>
          </main>
        </div>
      </div>
    </AppRuntime>
  );
}
