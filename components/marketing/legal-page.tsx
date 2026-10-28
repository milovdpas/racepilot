import Link from "next/link";
import type { ReactNode } from "react";
import { SITE_NAME } from "@/lib/site";

/**
 * The frame shared by /privacy and /terms_of_service: server-rendered, outside
 * the app chrome, and linked from Google's OAuth consent screen, so both must
 * stay reachable without JavaScript or an account.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  /** Shown as "Last updated …". Bump it whenever the content changes. */
  updated: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 md:py-16">
      <Link
        href="/"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {SITE_NAME}
      </Link>

      <h1 className="mt-8 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated {updated}</p>
      <p className="mt-3 text-muted-foreground">{intro}</p>

      {children}

      <footer className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t pt-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Back to {SITE_NAME}
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <Link href="/terms_of_service" className="hover:text-foreground">
          Terms of service
        </Link>
      </footer>
    </main>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8 space-y-3 text-sm text-muted-foreground">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function SubSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 pt-1">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="underline underline-offset-2 hover:text-foreground"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

export const CONTACT_URL = "https://github.com/milovdpas/racepilot/issues";
