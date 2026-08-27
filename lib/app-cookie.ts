/**
 * A hint, readable on the server, that this browser already has training data.
 *
 * The store lives in `localStorage`, which the server cannot see, so without
 * this the "you already use the app" redirect can only run after hydration and
 * the landing page flashes first. The cookie carries no data beyond its own
 * existence — it is a signal, not state, and `localStorage` remains the source
 * of truth.
 *
 * A crawler never has it, so `/` still serves the marketing page to Google.
 */
export const APP_COOKIE = "rp_has_plans";

/** A year. Refreshed on every app load, so an active user never loses it. */
export const APP_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Which app mark this browser should render, readable on the server.
 *
 * The badge is drawn from `athleteTypes`, which lives in `localStorage`, so the
 * server has no way to know it. Rendering the runner and correcting after
 * hydration meant a triathlete watched their icon change on every load.
 *
 * Same nature as `APP_COOKIE`: a hint, not state. `localStorage` stays the
 * source of truth, and a missing or unrecognised value simply means the running
 * mark - which is also the right answer for a first visit.
 *
 * This is emphatically NOT for the web app manifest. A manifest linked without
 * `crossorigin="use-credentials"` is fetched with credentials omitted, so no
 * cookie reaches it; see docs/racepilot.md.
 */
export const MARK_COOKIE = "rp_mark";
