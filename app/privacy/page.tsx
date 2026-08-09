import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `What ${SITE_NAME} does and doesn't do with your data: no account, no database, no trackers. Your training is stored by your browser, or in your own Google Drive.`,
  alternates: { canonical: "/privacy" },
};

/**
 * The data promise, in full and in plain language.
 *
 * Written to be *accurate* rather than reassuring — the weather and Google
 * Drive sections describe things that genuinely leave the device, because a
 * privacy page that overstates the case is worse than not having one. Keep it
 * in step with the code: any new network call belongs here.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 md:py-16">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {SITE_NAME}
      </Link>

      <h1 className="mt-8 text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-3 text-muted-foreground">
        The short version: there is no account, no database and no tracking.{" "}
        {SITE_NAME} keeps your training in your own browser. Below is the longer
        version, including the two things that do leave your device, both of
        which stay off until you turn them on.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Where your training is stored
        </h2>
        <p className="text-sm text-muted-foreground">
          In your browser&apos;s <code>localStorage</code>, on the device
          you&apos;re using. It is not sent to a server, because there is no
          server to send it to. {SITE_NAME} has no database and no user
          accounts. Clearing your browser data deletes it, so export a backup
          from Settings if that matters to you.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Google Drive sync (optional, off by default)
        </h2>
        <p className="text-sm text-muted-foreground">
          If you connect Google Drive, your plan is written to a file in{" "}
          <em>your</em> Drive. We never receive a copy and never store your
          training on our side. The connection itself needs a token, which is
          held in an encrypted, HTTP-only cookie in your browser rather than in
          a database, so disconnecting or clearing your cookies ends it. The
          app only asks for permission to manage the file it creates, not your
          whole Drive.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Weather (optional, off by default)
        </h2>
        <p className="text-sm text-muted-foreground">
          This is the one feature that shares something about you. To show a
          forecast for a run, the app sends the coordinates your browser gives
          it, after you grant location permission, through this site to a
          third-party weather service, which returns the forecast. The
          coordinates are stored alongside the run in your own browser so the
          weather doesn&apos;t have to be fetched twice. Leave the feature off
          and no location is ever requested or sent.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Split scanning (optional, off by default)
        </h2>
        <p className="text-sm text-muted-foreground">
          Reading the splits off a screenshot runs entirely in your browser. The
          image is never uploaded anywhere.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Analytics and advertising
        </h2>
        <p className="text-sm text-muted-foreground">
          There are none. No analytics script, no tag manager, no advertising,
          no cookies for either, which is why you have never seen a consent
          banner here. The only thing measured is how often the site appears in
          Google search results, which Google reports from its own side and
          which involves nothing running in your browser.
        </p>
        <p className="text-sm text-muted-foreground">
          The site is hosted on Vercel, which keeps standard server logs (IP
          address, request time) for operational reasons, as every web host
          does.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">
          Getting your data out
        </h2>
        <p className="text-sm text-muted-foreground">
          Settings → Data exports everything as a single JSON file you can keep,
          re-import, or hand to an AI to rework your plan. Deleting a plan
          removes it from your browser immediately.
        </p>
      </section>

      <footer className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Back to {SITE_NAME}
        </Link>
      </footer>
    </main>
  );
}
