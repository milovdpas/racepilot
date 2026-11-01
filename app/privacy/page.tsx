import type { Metadata } from "next";
import {
  CONTACT_URL,
  ExternalLink,
  LegalPage,
  Section,
  SubSection,
} from "@/components/marketing/legal-page";
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
 * sections describe things that genuinely leave the device, because a privacy
 * page that overstates the case is worse than not having one. Keep it in step
 * with the code: any new network call, cookie or Google scope belongs here.
 *
 * It is also the policy Google's OAuth verification reviews, which is why the
 * Google section names each scope, says what is read, stored and shared, and
 * carries the Limited Use statement word for word. Don't paraphrase that one.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      updated="1 November 2026"
      intro={
        <>
          The short version: there is no account, no database and no tracking.{" "}
          {SITE_NAME} keeps your training in your own browser. A few optional
          features talk to other services. Each one stays off until you turn it
          on, and each is described below.
        </>
      }
    >
      <Section title="Who runs RacePilot">
        <p>
          {SITE_NAME} is a free, open-source project built and run by Milo van
          der Pas. For a question about this policy or about your data,{" "}
          <ExternalLink href={CONTACT_URL}>open an issue on GitHub</ExternalLink>
          .
        </p>
      </Section>

      <Section title="Where your training is stored">
        <p>
          In your browser&apos;s <code>localStorage</code>, on the device
          you&apos;re using, together with your settings such as language and
          units. It is not sent to a server, because there is no server to send
          it to. {SITE_NAME} has no database and no user accounts. Clearing
          your browser data deletes it, so export a backup from Settings if that
          matters to you.
        </p>
      </Section>

      <Section title="Your Google account (optional, off by default)">
        <p>
          Two features use your Google account: Google Drive sync and picking
          off days from Google Calendar. Each asks Google for its own permission
          when you turn it on, and the app only uses a feature in a browser
          where you turned that feature on.
        </p>
        <p>
          When you connect, Google shares your name, email address and profile
          picture with the app, so Settings can show which account is
          connected. The connection is kept in an encrypted cookie in your
          browser rather than in a database. That cookie holds the tokens Google
          issues (an access token and a refresh token) and your name, email
          address and picture. The
          name, email address and picture are also kept in your browser&apos;s
          storage so Settings can show them straight away.
        </p>

        <SubSection title="Google Drive">
          <p>
            Permission requested: <code>drive.appdata</code>. The app keeps one
            file in a hidden app folder in your Drive that only {SITE_NAME} can
            see. It cannot see, open or change any of your other files. The file
            holds the same data as an export from Settings. On its way to and
            from Drive it passes through this site&apos;s server, which does not
            store or log it.
          </p>
        </SubSection>

        <SubSection title="Google Calendar">
          <p>
            Permission requested: <code>calendar.events.owned.readonly</code>,
            which is read-only. The app reads your calendar only when you open
            the off-day picker, and then only the title, start and end of
            upcoming events on your primary calendar, from today until race
            day of the plan you&apos;re working on, or over the next twelve
            months for a plan whose race has passed. It does not read
            descriptions, locations,
            guests or any other calendar, and it never creates, changes or
            deletes anything in your calendar.
          </p>
          <p>
            The events pass through this site&apos;s server to your browser
            without being stored or logged. The ones you select are saved as
            off days in your plan: in your browser, and in your Drive file if
            sync is on. The rest are discarded when you close the picker.
          </p>
          <p>
            Because picked off days are part of your plan, their titles and
            dates are included when you export your plan, or when you hand the
            plan wizard&apos;s request to an AI service yourself. {SITE_NAME}{" "}
            never sends them to an AI service or anyone else on its own, and
            you can rename or delete an off day before you do.
          </p>
        </SubSection>

        <SubSection title="How your Google data is protected">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <strong>Encrypted in transit.</strong> Everything between your
              browser, this site and Google travels over HTTPS.
            </li>
            <li>
              <strong>Tokens stay out of reach.</strong> Google&apos;s tokens
              are kept only in a cookie that is encrypted and signed with a
              secret key that exists only on the server. The cookie is marked
              HttpOnly, so no script on the page can read it, and Secure, so it
              is only ever sent over HTTPS. Your browser stores it but cannot
              read the tokens inside: they are decrypted and used only on the
              server, and never handed to the page.
            </li>
            <li>
              <strong>Nothing is stored on the server.</strong> There is no
              database. Calendar events and the contents of your Drive file
              are relayed during the request that needs them and are not
              written to disk or to logs. Error logs record what failed, never
              your data.
            </li>
            <li>
              <strong>The least access that works.</strong> Drive access covers
              only the app&apos;s own hidden file, and Calendar access is
              read-only and limited to calendars you own. From each event the
              app requests only its title, start and end.
            </li>
            <li>
              <strong>Secrets stay on the server.</strong> The keys the app
              uses with Google are kept in the server&apos;s configuration,
              never in the source code or the browser. Only the developer can
              access the server.
            </li>
            <li>
              <strong>In your browser.</strong> What the app saves, including
              off days picked from your calendar, is kept in your browser&apos;s
              storage for this site, which other websites cannot read.
            </li>
          </ul>
        </SubSection>

        <SubSection title="How Google data is used">
          <p>
            Google user data is used only to provide the two features above,
            which you can see working in the app. It is not sold, not used for
            advertising, and not shared with anyone else. Nobody reads it
            unless you send it to us yourself, for example in a bug report.
          </p>
          <p>
            {SITE_NAME} does not use data obtained through Google Workspace
            APIs, including Google Calendar and Google Drive, to develop,
            improve or train generalized artificial intelligence or machine
            learning models.
          </p>
          <p>
            {SITE_NAME}&apos;s use and transfer to any other app of information
            received from Google APIs will adhere to the{" "}
            <ExternalLink href="https://developers.google.com/terms/api-services-user-data-policy">
              Google API Services User Data Policy
            </ExternalLink>
            , including the Limited Use requirements.
          </p>
        </SubSection>

        <SubSection title="Removing access">
          <p>
            Settings → Cloud sync → Disconnect revokes {SITE_NAME}&apos;s access
            at Google and deletes the cookie. Drive and Calendar share one
            connection, so this removes both. You can also remove access from
            your{" "}
            <ExternalLink href="https://myaccount.google.com/connections">
              Google Account&apos;s third-party connections
            </ExternalLink>
            , and clearing your cookies ends the connection on that device. The
            Drive file stays in your Drive until you delete it, under Settings →
            Manage apps → {SITE_NAME} → Delete hidden app data in Google Drive.
          </p>
        </SubSection>
      </Section>

      <Section title="Weather (optional, off by default)">
        <p>
          This is the one feature that shares something about you. To show a
          forecast for a run, the app sends the coordinates your browser gives
          it, after you grant location permission, through this site to a
          third-party weather service (OpenWeatherMap), which returns the
          forecast. The coordinates are stored alongside the run in your own
          browser so the weather doesn&apos;t have to be fetched twice. Leave
          the feature off and no location is ever requested or sent.
        </p>
      </Section>

      <Section title="Split scanning (optional, off by default)">
        <p>
          Reading the splits off a screenshot runs entirely in your browser. The
          image is never uploaded anywhere. The first scan downloads the
          text-recognition engine from the jsDelivr network, which, like any
          site you load a file from, sees your IP address. Nothing from the
          image is sent.
        </p>
      </Section>

      <Section title="Importing a Strava export">
        <p>
          The export you choose is read in your browser. Neither the file nor
          anything in it is uploaded.
        </p>
      </Section>

      <Section title="Building a plan with AI">
        <p>
          The plan wizard gives you a prompt and a file to paste into an AI
          service of your choice. {SITE_NAME} sends nothing to that service
          itself. What you share with it is covered by that service&apos;s own
          terms and privacy policy.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          There are no tracking or advertising cookies. These are the only
          ones, and each is needed for the app to work:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <code>rp_has_plans</code> and <code>rp_mark</code> tell the server
            that this browser already uses the app, so it opens the app instead
            of the front page, and which app icon to draw. They contain no
            personal data.
          </li>
          <li>
            <code>marathon-session</code> is the encrypted Google connection
            described above. It exists only if you connect Google.
          </li>
          <li>
            <code>oauth_state</code> is a random value that protects the Google
            sign-in against forgery. It is deleted when sign-in finishes, or
            after ten minutes.
          </li>
        </ul>
      </Section>

      <Section title="Analytics and advertising">
        <p>
          There are none. No analytics script, no tag manager, no advertising,
          no cookies for either, which is why you have never seen a consent
          banner here. The only thing measured is how often the site appears in
          Google search results, which Google reports from its own side and
          which involves nothing running in your browser.
        </p>
        <p>
          The site runs on a rented server, whose web server keeps standard
          access logs (IP address, request time, the page requested) for
          operational reasons, as every web server does.
        </p>
      </Section>

      <Section title="Your data, your control">
        <p>
          Settings → Data exports everything as a single JSON file you can keep,
          re-import, or hand to an AI to rework your plan. Deleting a plan
          removes it from your browser immediately. Because {SITE_NAME} holds no
          copy of your data on its own servers, there is nothing for us to hand
          over or erase on request: it is all in your browser and, if you use
          sync, in your own Drive, and you can delete it from either at any
          time.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          When this policy changes, the date at the top changes with it.
        </p>
      </Section>
    </LegalPage>
  );
}
