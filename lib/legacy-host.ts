/**
 * Temporary, and dated: this whole file goes when the Vercel project is retired
 * (planned December 2026). See docs/tech-debt.md for the full removal list —
 * there are five other touch points.
 *
 * Where RacePilot actually lives.
 *
 * Hardcoded, and deliberately NOT derived from `SITE_URL`. `SITE_URL` comes
 * from `NEXT_PUBLIC_SITE_URL`, which each deployment sets to *its own* origin,
 * so on the retired Vercel build it is the vercel.app address. Deriving from it
 * meant the notice never fired there (the hostname matched), and worse, the
 * "go to the new site" button would have pointed straight back at the old one.
 *
 * A migration banner has to know its destination as a fact, not infer it from
 * the environment it is trying to escape.
 */
export const NEW_HOME = "https://racepilot.milovanderpas.nl";

/**
 * The one deployment that has actually moved: the original Vercel project,
 * still up because people are using it.
 *
 * An allowlist, not "anything that isn't the new domain". RacePilot is open
 * source and self-hostable, and matching by exclusion would greet every
 * self-hoster with a popup telling them to abandon their own install for
 * someone else's domain. Only hosts on this list ever see the notice, so a
 * fork, a fresh Vercel project or a private instance is silently unaffected.
 */
const LEGACY_HOST = "marathon-schema.vercel.app";

/**
 * Preview deployments of that same project: `marathon-schema-<hash>-<scope>`.
 *
 * Included because they serve the same stale build to the same people from a
 * link that still works, and scoped by prefix so it cannot reach a different
 * project that merely happens to be on vercel.app.
 */
const LEGACY_PREVIEW = /^marathon-schema-[a-z0-9-]+\.vercel\.app$/;

/**
 * Whether this page is being served from the retired deployment.
 *
 * Client-only: it reads `window.location`. On the server it returns false, so
 * the notice is never part of the prerendered HTML and never has to be
 * un-rendered on hydration.
 */
export function isLegacyHost(): boolean {
  if (typeof window === "undefined") return false;

  const here = window.location.hostname;
  return here === LEGACY_HOST || LEGACY_PREVIEW.test(here);
}
