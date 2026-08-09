import type { Metadata } from "next";
import Link from "next/link";
import { ReturningUserRedirect } from "@/components/marketing/returning-user-redirect";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

/**
 * The landing page — the only substantial indexable content on the site.
 *
 * Everything under /app renders behind `HydrationGate`, which shows a skeleton
 * until Zustand rehydrates from localStorage. A crawler's localStorage is
 * empty, so it never sees past the skeleton no matter how long it waits. That
 * is the whole reason this page exists as a server component with its copy
 * written into the markup.
 *
 * The copy is hardcoded English rather than i18n: `lib/i18n` is a client-side
 * singleton the server can't read, and page titles are a different job from UI
 * labels anyway.
 */
export const metadata: Metadata = {
  title: `${SITE_NAME}: ${SITE_TAGLINE}`,
  description:
    "Free training plans for marathon, ultra, trail and backyard ultra. Build a plan, log every run with your splits, and watch the numbers. No account, no ads, and your data stays on your device.",
  alternates: { canonical: "/" },
};

const RACE_TYPES = [
  { emoji: "🏃", name: "Marathon", body: "Road blocks from 10K to the full distance, built around the days you can actually train." },
  { emoji: "♾️", name: "Ultra", body: "Back-to-back long runs and the volume that gets you to 50K, 100K and beyond." },
  { emoji: "🔁", name: "Backyard ultra", body: "The yard-by-yard format, planned in loops and hours instead of a finish time." },
  { emoji: "🏔️", name: "Trail", body: "Elevation-first weeks, with the climbing tracked alongside the kilometers." },
];

const FEATURES = [
  {
    title: "A plan built around your week",
    body: "Say which days you can train and how far you want to go. Export the brief, hand it to any AI, and import the plan it writes back, or build it by hand.",
  },
  {
    title: "Log a run in seconds",
    body: "Distance, duration and pace solve for each other, so you only ever type the two you know. Upload your Strava splits screenshot and every kilometer is read off it on your device.",
  },
  {
    title: "A calendar that fits a phone",
    body: "Month, week, day, or a scrolling agenda of just the days you train. Weather for every session, if you want it.",
  },
  {
    title: "Numbers that mean something",
    body: "Weekly volume, long-run progression, pace trends and per-kilometer splits, for the block you're in rather than a lifetime average.",
  },
];

const PROMISES = [
  ["No account", "There's nothing to sign up for. Open it and start."],
  ["No database", "Your training is stored by your browser, on your device."],
  ["Your Drive, not ours", "Turn on sync and the file goes to your own Google Drive. We never hold a copy."],
  ["No ads, no trackers", "No analytics scripts, no advertising, nothing to opt out of."],
];

export default function LandingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "HealthApplication",
    operatingSystem: "Any",
    description:
      "Free training planner and tracker for marathon, ultra, trail and backyard ultra runners.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  };

  return (
    <>
      <ReturningUserRedirect />
      <script
        type="application/ld+json"
        // Static object built above — no user input reaches this.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* A landmark, not a div: the app chrome has one and these two pages
          sit outside it, so without this a screen reader has no "skip to the
          content" target on the only pages a search visitor ever lands on. */}
      <main className="mx-auto w-full max-w-3xl px-5 py-12 md:py-20">
        <header className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-lg text-primary-foreground"
          >
            🏃
          </span>
          <span className="text-sm font-semibold">{SITE_NAME}</span>
        </header>

        <section className="mt-12 md:mt-16">
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Plan your race. Track every kilometer.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            {SITE_NAME} is a free training planner for marathon, ultra, trail
            and backyard races. No account, no ads, and your training data never
            leaves your device unless you ask it to.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/welcome"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Get started, it&apos;s free
            </Link>
            <Link
              href="/app"
              className="rounded-lg border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              Open the app
            </Link>
          </div>
        </section>

        <section className="mt-16 md:mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            Built for the races you actually run
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {RACE_TYPES.map((r) => (
              <div key={r.name} className="rounded-xl border p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span aria-hidden>{r.emoji}</span>
                  {r.name}
                </h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{r.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Cycling, swimming and triathlon are next.
          </p>
        </section>

        <section className="mt-16 md:mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            What it does
          </h2>
          <div className="mt-6 space-y-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 md:mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            Your training is yours
          </h2>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {PROMISES.map(([title, body]) => (
              <div key={title} className="rounded-xl border p-4">
                <dt className="text-sm font-semibold">{title}</dt>
                <dd className="mt-1.5 text-sm text-muted-foreground">{body}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted-foreground">
            The one exception is the optional weather feature, which sends the
            coordinates you allow to a weather service to fetch a forecast.{" "}
            <Link href="/privacy" className="underline underline-offset-2">
              Read the details
            </Link>
            .
          </p>
        </section>

        <section className="mt-16 md:mt-20">
          <h2 className="text-2xl font-semibold tracking-tight">
            Start your block
          </h2>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground">
            Nothing to install and nothing to sign up for. Add it to your home
            screen afterwards if you want it to open like an app.
          </p>
          <Link
            href="/welcome"
            className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </section>

        <footer className="mt-20 flex flex-wrap gap-x-5 gap-y-2 border-t pt-6 text-sm text-muted-foreground">
          <Link href="/app" className="hover:text-foreground">
            Open the app
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <a
            href="https://github.com/milovdpas/racepilot"
            className="hover:text-foreground"
          >
            Source
          </a>
        </footer>
      </main>
    </>
  );
}
