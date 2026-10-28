import type { Metadata } from "next";
import Link from "next/link";
import {
  CONTACT_URL,
  ExternalLink,
  LegalPage,
  Section,
} from "@/components/marketing/legal-page";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: `The terms for using ${SITE_NAME}: a free training planner, provided as is, that is not medical advice.`,
  alternates: { canonical: "/terms_of_service" },
};

/**
 * Linked from Google's OAuth consent screen (branding), next to /privacy.
 * Plain language on purpose, and kept consistent with the privacy page: this
 * one says what you may expect from the service, that one says what happens to
 * your data.
 */
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of service"
      updated="28 October 2026"
      intro={
        <>
          {SITE_NAME} is a free web app for planning and tracking endurance
          training. By using it you agree to these terms. They are short,
          because there is no account, no payment and no data of yours on our
          servers.
        </>
      }
    >
      <Section title="Who provides it">
        <p>
          {SITE_NAME} is built and run by Milo van der Pas as a free,
          open-source project. Questions about these terms go to{" "}
          <ExternalLink href={CONTACT_URL}>GitHub issues</ExternalLink>.
        </p>
      </Section>

      <Section title="Not medical advice">
        <p>
          Training plans, paces, targets and statistics in {SITE_NAME},
          including plans written by an AI service and imported into the app,
          are general information. They are not medical, health or coaching
          advice and do not take your health into account. Check with a doctor
          before starting a new training programme, especially if you have a
          medical condition, an injury or have not trained in a while. Stop and
          get advice if something hurts or feels wrong. You train at your own
          risk.
        </p>
      </Section>

      <Section title="Your data">
        <p>
          Your training is stored in your own browser, and in your own Google
          Drive if you turn sync on. We cannot see it and cannot recover it, so
          export a backup from Settings if losing it would matter to you. The{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            privacy page
          </Link>{" "}
          describes exactly what leaves your device and when.
        </p>
      </Section>

      <Section title="Google services">
        <p>
          Connecting Google Drive or Google Calendar is optional. When you do,
          you authorise {SITE_NAME} to use that service on your behalf, only as
          described on the privacy page, and your use of it remains subject to
          Google&apos;s own terms. You can remove that access at any time from
          Settings or from your Google Account.
        </p>
      </Section>

      <Section title="AI services">
        <p>
          The plan wizard prepares a prompt and a file for an AI service of your
          choice. Using that service is between you and its provider, under its
          terms. Review what it produces before you train by it: an AI can
          suggest a plan that is too hard, too easy or simply wrong.
        </p>
      </Section>

      <Section title="Fair use">
        <p>
          Use {SITE_NAME} for your own training. Don&apos;t try to disrupt the
          site, overload it, or use its server endpoints for anything other
          than the app itself.
        </p>
      </Section>

      <Section title="Open source">
        <p>
          The source code is available on{" "}
          <ExternalLink href="https://github.com/milovdpas/racepilot">
            GitHub
          </ExternalLink>{" "}
          under the Apache License 2.0, which governs your use of the code
          itself.
        </p>
      </Section>

      <Section title="Provided as is">
        <p>
          {SITE_NAME} is free and provided as is, without any warranty. It may
          change, be unavailable for a while, or be discontinued, and features
          may be added or removed without notice.
        </p>
      </Section>

      <Section title="Liability">
        <p>
          To the extent the law allows, {SITE_NAME} and its maker are not
          liable for injury, lost data or any other damage arising from using
          the app or following a plan made with it. Nothing in these terms
          limits liability that cannot be limited by law, or takes away rights
          you have as a consumer.
        </p>
      </Section>

      <Section title="Changes and governing law">
        <p>
          These terms may be updated. When they are, the date at the top
          changes, and using {SITE_NAME} afterwards means you accept the new
          version. Dutch law applies, without affecting the consumer
          protection of the country you live in.
        </p>
      </Section>
    </LegalPage>
  );
}
