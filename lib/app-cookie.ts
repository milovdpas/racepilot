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
 * Which app mark this browser should be offered, readable on the server.
 *
 * Exists for one job: `app/manifest.ts` decides the installed app's icon, and
 * it runs before any client code, so it cannot read `athleteTypes` out of
 * `localStorage`. A swimmer installing the app should not get a runner on
 * their home screen.
 *
 * Same nature as `APP_COOKIE`: a hint, not state. `localStorage` remains the
 * source of truth, and a missing or unrecognised value simply means the
 * running mark.
 *
 * Note this only helps at *install* time. Both Android and iOS capture the
 * icon when the app is installed, so an athlete who changes sport afterwards
 * keeps the icon they installed with. Nothing we can do about that from here.
 */
export const MARK_COOKIE = "rp_mark";
