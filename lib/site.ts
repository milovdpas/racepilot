// Site-level identity, in one place. Read by the root metadata, the sitemap,
// robots.txt and the OG image — all of which must agree on the origin, or
// canonical URLs and social previews point at the wrong host.

export const SITE_NAME = "RacePilot";
export const SITE_TAGLINE = "Plan your race, track your training";

/** The path the app itself lives under. `/` is the marketing page. */
export const APP_PATH = "/app";

/**
 * Whether the deployment has been *told* its own public origin.
 *
 * `NEXT_PUBLIC_SITE_URL` is the answer everywhere except Vercel, which can
 * supply its own production hostname. Self-hosting without it is the one case
 * worth guarding: nothing crashes, the site just quietly advertises
 * `http://localhost:3000` as its canonical URL.
 */
const explicitOrigin =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined);

/**
 * The canonical origin, with no trailing slash.
 *
 * `VERCEL_URL` is a per-deployment hostname, so it is only a last-resort
 * fallback: using it for canonicals would point every preview at itself.
 */
export const SITE_URL = (
  explicitOrigin ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000"
).replace(/\/$/, "");

/**
 * Whether this deployment may be indexed.
 *
 * Two ways to fail, both covered: a Vercel preview (a real public URL that
 * would compete with production for the same terms), and any deployment that
 * doesn't know its own origin — indexing a site whose canonical URLs say
 * `localhost` is worse than not being indexed at all, so this fails closed.
 *
 * Self-hosted: set `NEXT_PUBLIC_SITE_URL` to go live. Leave it unset on a
 * staging box and that box stays out of the index for free.
 */
export const IS_PRODUCTION_DEPLOY =
  Boolean(explicitOrigin) &&
  process.env.VERCEL_ENV !== "preview" &&
  process.env.VERCEL_ENV !== "development";

/**
 * Read a deployment flag that is on only when explicitly switched on.
 *
 * A bare truthiness check is wrong here and quietly so: in JavaScript the
 * *string* "0" is truthy, so `Boolean(process.env.FLAG)` treats FLAG=0 as
 * enabled, which is the opposite of what anyone writing it means. Only "1" and
 * "true" count, whitespace and case are forgiven, and everything else --
 * "0", "", unset, a typo -- is off.
 */
export function isFlagEnabled(value?: string): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true";
}

/**
 * Whether to show the "buy me a water" button in Settings.
 *
 * Off unless a deployment turns it on, which is the right default for an app
 * anyone can self-host: a fork should not ship a donate button pointing at
 * someone else's account, and it certainly should not do so silently.
 *
 * **Build time, not runtime**, and the `NEXT_PUBLIC_` prefix is the warning
 * label: it is what makes Next inline the value into the client bundle, which
 * is also what makes it un-editable afterwards. Toggling means rebuilding the
 * image, not editing the container's environment. Same deal as
 * `NEXT_PUBLIC_SITE_URL`, and named the same way so it reads that way.
 */
export const DONATE_ENABLED = isFlagEnabled(
  process.env.NEXT_PUBLIC_DONATE_LINK_ENABLED,
);
