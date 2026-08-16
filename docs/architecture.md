# Architecture & developer guide

This is the authoritative guide for working on this codebase. Read it before
making changes. (`README.md` is user-facing and may lag behind features.)

## What this app is

**RacePilot** — an endurance training planner and tracker (marathon, ultra,
backyard ultra and trail today; cycling, swimming and triathlon are planned, see
[`racepilot.md`](racepilot.md)). Almost entirely a **client-side SPA on
Next.js (App Router)** — **no database**. All data lives in the browser's
`localStorage`. The **only** server code is a thin set of Route Handlers under
`app/api/*` that implement **server-side Google OAuth** for the optional Drive
sync (refresh token in an encrypted session cookie; no DB). Deploys to Vercel
(Route Handlers run as Functions). Mobile-first, dark mode, English + Dutch.

## Tech stack & non-obvious gotchas

- **Next.js 16 + React 19**, App Router, no `src/` dir, import alias `@/*`.
- **Tailwind CSS v4** — CSS-based config in `app/globals.css` (`@theme`), no `tailwind.config`. Dynamic class names are NOT generated: workout-type colors use a **static class map** (`TYPE_STYLE` in `components/common/workout-type-badge.tsx`), never `bg-${type}`.
- **shadcn/ui on Base UI (`@base-ui/react`), NOT Radix.** Compose with the **`render` prop**, not `asChild`. e.g. `<DialogTrigger render={<Button/>}>…`. `Select.Value` shows the raw value unless given a function child for the label.
- **Zustand + `persist`** for state. **react-i18next** for i18n. **Recharts** for charts. **date-fns** for dates. **next-themes** for dark mode. **lucide-react** icons.
- Everything interactive is a client component (`"use client"`). Pages in `app/*` are thin server components that render a client `*View` inside `<HydrationGate>`.
- `Date.now()`/`Math.random()`/`new Date()` are fine here (browser runtime) — the no-`Date` restriction only applies to Workflow scripts, not app code.

## Routing — `/` is not the app

```
app/layout.tsx        theme + service worker + root metadata. No chrome.
app/page.tsx          marketing landing. Server-rendered, indexable.
app/privacy/          the data promise. Indexable.
app/welcome/          the first-run flow. Full-bleed, no chrome. Its layout
                      mounts <AppRuntime>, because it *is* the app.
app/app/layout.tsx    the app chrome (AppNav, mobile top bar, <main>) + the
                      global dialog gates + `robots: noindex`.
app/app/**            dashboard, plan, calendar, off-days, stats, settings.
app/api/**            Route Handlers (OAuth, Drive, weather).
```

Why the app sits under a real `/app` prefix rather than a route group: every app
page renders behind `<HydrationGate>`, which shows a skeleton until Zustand
rehydrates from `localStorage`. A crawler's `localStorage` is empty, so it never
sees past the skeleton — before this split, the entire indexable body of `/` was
six words. A real segment also lets one `metadata` export in `app/app/layout.tsx`
mark the whole section `noindex`, including routes added later.

**The client runtime is mounted per-section, not at the root.**
`components/layout/app-runtime.tsx` holds `I18nProvider`, `SyncInitializer`,
`OnboardingRedirect`, `AppCookieSync`, `RegionDetect` and `Toaster`, and is
mounted by `app/app/layout.tsx` and `app/welcome/layout.tsx` only. It all used
to sit in the root layout, which meant the two static English marketing pages
downloaded both i18n dictionaries, the sync and weather stores and the toast
layer, and fired an auth-session plus a weather request for a visitor with no
account. Measured: blocking JS on `/` went 826 KB → 567 KB and on `/privacy`
699 KB → 516 KB, with the dictionaries no longer in the blocking set at all.
Only `ThemeProvider` (the marketing pages are themed too), `ServiceWorker` (it
has to register wherever the visitor first lands) and the `MovedNotice` gate
stay at the root. `MovedNotice` is a `React.lazy` boundary behind a hostname
check, so the live site ships the check and nothing else.

If you add something global, put it in `AppRuntime` unless `/` genuinely needs
it — the landing page is the one page whose weight is a product concern.

Consequences worth knowing:

- `next.config.ts` holds **308 redirects** from the old top-level paths
  (`/plan/*`, `/calendar`, `/off-days`, `/stats`, `/settings`).
- `app/manifest.ts` uses `start_url: "/app"`. **`id` stays `"/"`** — Chrome keys
  the installed Android WebAPK on it, so changing it mints a *second* icon on
  every home screen that already has the app. `scope` stays `"/"` too, since
  narrowing it would put `id` outside the scope.
- `public/sw.js` caches the app shell under `/app`, and only `/app*` navigations
  may refresh it — caching the marketing page under that key would serve the
  wrong page to an offline user.
- Returning users skip the landing page **twice over**. `proxy.ts` (matcher
  `/` only) redirects when the `rp_has_plans` cookie is present, which is what
  stops the marketing page flashing before hydration — `localStorage` is
  invisible to the server, so a client-only redirect always paints first. The
  cookie is a *signal*, not state: `components/common/app-cookie-sync.tsx`
  mirrors "this browser has plans" into it in both directions, so wiping your
  data hands you the landing page back rather than an empty app.
  `components/marketing/returning-user-redirect.tsx` stays as the fallback, and
  covers what the server can't see (an installed PWA, or a cleared cookie with
  surviving `localStorage`). It is a separate client component so the landing
  page module never imports the store.
- A crawler has no cookie, so `/` still prerenders and still serves the
  marketing page. The narrow matcher is deliberate: a broader one would put
  the proxy in front of every static page for no gain.

**Dialogs are sized against the *visual* viewport, not `dvh`.**
`components/ui/dialog.tsx` mirrors `visualViewport.height`/`offsetTop` into
`--vv-h`/`--vv-top` while a dialog is open, and `[data-slot="dialog-content"]`
in `globals.css` uses them for `top` and `max-height` (falling back to `100dvh`
/ `0px`, which is the old behaviour). An on-screen keyboard does not shrink the
layout viewport on either platform: Android Chrome defaults to
`interactive-widget=resizes-visual` and iOS Safari overlays. So a dialog capped
at `90dvh` and centred at `top: 50%` stayed centred in the full screen height
while the keyboard covered the bottom half of it. Measured on the deployed
build at 412x915 with a 380px keyboard, the "Log & complete" button sat 266px
below the visible area: logging a 20 km run was impossible, because the splits
make the dialog tall and every field wants the keyboard. Do not reintroduce
`max-h-[90dvh]` on individual dialogs; the primitive owns it.

**`--primary` is not `--brand`.** They carry the same hue and chroma but
different lightness on purpose: `--brand` is the identity (app mark, theme
colour, manifest, OG image) and never moves, while `--primary` is whatever text
has to be legible against. White on the brand orange is 3.55:1, under the 4.5:1
AA needs for body text, so light mode darkens `--primary` to 0.58 (4.53:1
measured in-browser). Dark mode can't do the same — white-on-button wants
lightness ≤ 0.585 and `text-primary`-on-background wants ≥ 0.605, and those
don't overlap — so it inverts `--primary-foreground` to near-black instead
(5.84:1). Change one, re-measure both.

## Data model — `lib/types.ts` (read this first)

- **`TrainingPlan`** = `PlanMeta` + `{ id, version, createdAt, weeks[], workouts{}, offDays[], trainingPrefs? }`.
- **`PlanMeta`** = `{ name, raceName, raceDistanceKm, raceDate, startDate?, goalPace, goalLabel }`.
- **`Workout`** = `{ id, date, type, title, weekNumber, plannedDistanceKm, plannedPace?, actualDistanceKm?, actualPace?, durationMin?, notes?, completed, isCustom?, flexible?, windowStart?, windowEnd? }`. A **flexible** workout may be done any day in `[windowStart, windowEnd]`; `date` is its current placement.
- **`TrainingWeek`** = `{ weekNumber, startDate(Mon), endDate(Sun), phase, label?, workoutIds[] }`.
- **`OffDay`** = `{ id, start, end, title, note? }` — vacations/trips; context + calendar display.
- **`TrainingPrefs`** = `{ daysPerWeek, flexibleDays, trainingDays[7 Mon→Sun], planningMode: "exact"|"flexible", targetDistanceKm|null }`.
- **`Preferences`** = `{ theme, locale?, onboardingSeen?, athleteTypes?, ... }` (app-wide, not per-plan).
- **`AthleteType`** = `"runner"|"trail"|"ultra"|"triathlete"|"cyclist"|"swimmer"`. `preferences.athleteTypes` is **tri-state**: `undefined` = never asked (so the one-time prompt still fires), `[]` = asked and declined. UI must branch on `capabilitiesFor(types)` from `lib/athlete.ts`, never on the raw list; both `undefined` and `[]` return every capability, because hiding features from someone who told us nothing is how an app looks broken.

## State & persistence — `store/use-training-store.ts`

The single source of truth. Shape: `{ plans: Record<id,TrainingPlan>, activePlanId, preferences, hydrated, lastModified }`.

- **Active plan** is read via the `useActivePlan()` hook (`hooks/use-active-plan.ts`) — components select it, not `s.plan` (there is no `s.plan`).
- **Actions:** plan mgmt (`addPlanFromImport`, `selectPlan`, `deletePlan`, `updatePlanMeta`, `updateTrainingPrefs`, `seedExamplePlan`, `addExamplePlan`, `initializePlan`), off days (`add/update/deleteOffDay`), workouts (`toggleComplete`, `updateWorkout`, `addWorkout`, `deleteWorkout`), data (`exportData`, `importData`, `applyRemote`), and `setPreferences`. Mutations bump `lastModified` (used for sync conflict resolution).
- **persist**: key `marathon-training-v1`, **`version: 14`**, `partialize` persists `{plans, activePlanId, preferences, lastModified}`. The **`migrate`** fn is additive & idempotent — bump the version and backfill new fields without touching workouts (see how `offDays`, `raceDistanceKm`, `onboardingSeen` were added). `onRehydrateStorage` sets `hydrated` + calls `initializePlan` (async — it dynamic-imports the example plan, and a module-level `seedInFlight` guard stops it racing the `useHydrated` safety net).
- **Hydration**: `<HydrationGate>` (`hooks/use-hydrated.ts`) renders a skeleton until rehydrated, avoiding SSR/client mismatch. `useMounted()` is used where a value differs server vs client.

## Example plans — `lib/plan/examples.ts`

The demo plan is **data, not a generator**: `lib/plan/example-plan.json` is a real 17-week export (17 logged runs with splits, weather and off days), produced by `scripts/scrub-example-plan.mjs`. `loadExamplePlan()` dynamic-imports it (so the ~26 KB isn't in every route's chunk), runs it through `normalizeBundle` from `lib/plan/storage.ts` — the same path a user's import takes — rebases every date by a whole number of weeks onto the current week, and stamps `id: DEFAULT_PLAN_ID` + `isExample: true`.

Two rules the loader enforces, both load-bearing:

- **It returns only the plan.** The export's `preferences` block would mark onboarding seen and switch weather + the split scanner on for a brand-new user.
- **`isExample` is applied at load time, not baked into the JSON.** The flag describes the plan's role in *this* installation: the identical bytes imported by a user via Settings are *their* plan and must stay eligible as AI context (`lib/plan-context.ts` reads the flag).

Raw exports carry the exporter's home coordinates in every weather snapshot. `marathon-plans-*.json` is gitignored and the scrub script strips `lat`/`lon`; the loader strips them again on the way in. **This repo is public — don't weaken any of those three.**

`lib/plan/examples.ts` is the **catalogue**: one entry per kind of athlete
(`marathon`, `trail`, `ultra`, `backyard`), each with a fixed id and its **own**
`import()`. Do not collapse those into one template-literal import — the bundler
would emit a single chunk containing every demo. `examplesFor(caps)` filters by
athlete capabilities and `defaultExampleFor(caps)` picks the one to seed, matching
the athlete's *primary* type rather than the first they merely qualify for.

Only the marathon entry is a real export. The other three are generated from a
small spec (`example-specs.ts` → `example-builder.ts`), deterministically, so a
reload never changes a demo's stats. **Cycling, swimming and triathlon demos are
absent on purpose**: `Workout` has no `sport` field yet, so they are
unrepresentable rather than unwritten, and faking them by relabelling running
workouts would make the demo lie about the one thing it exists to show.

`lib/plan-defaults.ts` keeps what survived the old generator: `DEFAULT_PLAN_META` (fallback metadata for partial imports and migrations), `DEFAULT_PLAN_ID`, `DEFAULT_TRAINING_PREFS`, `PLAN_VERSION`.

## Sports — `lib/sport.ts`

`Sport` (`run`/`bike`/`swim`) is **orthogonal to `WorkoutType`**, which is an
intensity axis: a tempo effort is a tempo effort on a bike. Sport picks the
icon, intensity picks the colour, so the two multiply instead of becoming a
15-entry enum.

- **Resolution:** `workoutSport(workout, plan)` — absent on a workout means the
  plan's sport, absent on a plan means running. Nothing was backfilled, and an
  absent sport is never stamped at import: a cycling plan declares
  `plan.sport: "bike"` once and its sessions inherit it.
- **Pace is stored as seconds per km for every sport.** Display converts:
  runners see min/km, cyclists see **km/h** (faster is a bigger number — the
  single inversion in the system, pinned by a test), swimmers see min/100m or
  min/100yd. `fmt.pace(stored, sport)` is the only correct way to render one;
  calling it without a sport silently shows running units, which is exactly the
  bug the browser smoke test caught twice.
- `isMultiSport(plan)` gates sport labelling and the stats breakdown, so a
  running plan isn't decorated with running icons.
- **Enums are coerced at the import boundary** (`normalizePlan`), not guarded at
  each of the five sites that index `TYPE_STYLE`.

## Units — `lib/units.ts` + `useFormat()`

**Everything is stored metric, always**: distances in km, elevation in metres,
temperature in °C, pace as seconds per km. `preferences.units` is a *display*
choice and nothing more, so switching it can never rewrite training data (a
browser test asserts `plans` is byte-identical after a round trip).

- `lib/units.ts` is pure conversion + formatting. `lib/region.ts` derives a
  default from the **IANA timezone first** (`ZONES_BY_COUNTRY`, inverted lazily
  into a zone→country map), falling back to `navigator.language`'s region
  subtag — **never IP geolocation or the weather feature's coordinates**, both
  of which would contradict the promise onboarding makes. The order matters and
  was originally the other way round: the region subtag says which *conventions*
  you want, not where you are, and "English (United States)" is the default
  English option on most devices, so a Dutch athlete on `en-US` was detected as
  American and shown miles. The timezone comes from the device's own clock
  setting and tracks the place it is in. `countrySource()` reports which one
  answered, for the debug panel. `RegionDetect` writes `preferences.country`
  **once and never overwrites it**, so anyone who was detected wrongly before
  this keeps the old value until they change it in Settings.
- Components use **`useFormat()`** (`hooks/use-format.ts`) rather than
  converting themselves: `fmt.distance(km)`, `fmt.pace(stored)`,
  `fmt.temp(c)`, and `fmt.toStoredDistance` / `fmt.toStoredPace` on the way
  back in. A site that hand-rolls `${km} km` is a site that silently stays
  metric.
- **Input fields hold display units** and convert on save. `resolveLoggedRun`
  needs no unit awareness at all: it only requires distance and pace to share a
  unit, and min/mi × mi = minutes exactly as min/km × km does.
- `formatPace` was split into a bare `formatPaceValue` (no suffix) plus
  `fmt.pace()`. Baking "/km" into the formatter is what forced
  `complete-workout-dialog` to `.replace("/km", "")` to get a value back out.
- Not converted, deliberately: **workout titles** (free text) and **split
  bucketing** (scanned per km; re-bucketing would invent data).

## Key flows

- **Onboarding** — a *page*, not a dialog stack. `components/common/onboarding-redirect.tsx` (mounted in the root layout) sends `hydrated && !onboardingSeen` to **`/welcome`**, where `components/onboarding/onboarding-flow.tsx` runs privacy → tour → athlete profile → feature opt-ins → finish. Two rules hold it together: nothing under `components/onboarding/` may call `useHydrated()` (it carries a seeding side effect) or `useActivePlan()` (there is no plan yet), and **Drive connect happens last**, in the terminal action, because `connect()` is a full-page redirect that would discard the flow. "Look around" calls `seedExamplePlan()` (awaited, so the dynamic import lands before navigating); "Create my plan" goes to `/app/plan/new` and lets `useHydrated`'s safety net seed. `initializePlan` is now just `onboardingSeen ? seedExamplePlan() : noop`, which is what un-tangled "first-run UI done" from "seeding permitted".
- **What's new** (`components/common/whats-new-gate.tsx`): the popup mechanism that survived, now only for *existing* users — currently the split scanner, the athlete-type question and the install prompt. Each step declares when it `applies`; the gate shows the first applicable one from the cursor onward. It exports **`useWhatsNewPending()`**, which `next-plan-gate.tsx` uses instead of hand-listing the flags it must not stack on, so adding a step never means editing that file. A step's `applies` may flip true *after* mount (the install prompt waits for `beforeinstallprompt`), so the list is recomputed each render rather than snapshotted.
- **AI Add-Plan wizard** (`app/app/plan/new`, `components/wizard/add-plan-wizard.tsx`): 4 steps collect a `PlanDraft` → step 4 exports a **plan-request JSON** + a localized **prompt** (`wizard.aiPrompt` in the dictionaries, which documents the importable plan schema). User pastes/attaches the AI's plan → `addPlanFromImport(json, trainingPrefs, startDate)` validates via `parseImport` and inserts it as a new active plan. The importable schema == what `parseImport` accepts.
- **Google Drive sync** — **server-side OAuth**:
  - **Server** (`lib/server/*` + `app/api/*`): `google-oauth.ts` (auth URL, code exchange, refresh, `getValidAccessToken`, revoke, userinfo), `session.ts` (iron-session encrypted cookie `marathon-session` holding `{refreshToken, accessToken, accessTokenExpiry, user}`), `drive.ts` (Drive REST against the hidden `appDataFolder`, token-parameterized). Routes: `auth/google/login` (redirect to consent w/ `access_type=offline&prompt=consent`, CSRF `state` cookie), `auth/google/callback` (exchange + save session), `auth/session` (`{configured, connected, user}` — no tokens), `auth/logout` (revoke + destroy), `drive/meta` (findFile), `drive/content` (GET download / POST create / PATCH update). All `runtime="nodejs"`, `dynamic="force-dynamic"`; a 401 (refresh failed / Drive 401) → client re-auth.
  - **Client** (`lib/google-drive.ts`, `store/use-sync-store.ts`): a thin same-origin fetch client (`findFile`/`downloadFile`/`createFile`/`updateFile` → `/api/drive/*`, serialized via a single-flight queue; `fetchSession`/`loginUrl`/`logout`). `connect()` is a **full-page redirect** to `/api/auth/google/login`. The store learns `configured`/`connected`/`user` from `/api/auth/session` on `init()`; conflict = newest-wins (`lastModified` vs Drive `modifiedTime`); 3s debounced auto-push + refresh-on-refocus unchanged.
  - Enabled only when `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`SESSION_SECRET` are set; otherwise the UI shows "not configured". No COOP header / no Google SDK in the browser (the old GIS token flow is gone).
- **Weather** (optional, server-side key, OpenWeatherMap One Call 4.0): server `lib/server/weather.ts` + routes `app/api/weather/{status,daily,hourly}` (key `OPENWEATHER_API_KEY`, never `NEXT_PUBLIC_`). Client `lib/weather.ts` (cache-first via `lib/weather-cache.ts`, localStorage `marathon-weather-cache-v1`), `store/use-weather-store.ts` (`{configured, ready, lastCoords}`, init in `sync-initializer.tsx`). `lib/weather-sync.ts` captures a `Workout.weather` snapshot on log (geolocation) and lazily backfills finished workouts; calendar shows per-day icon+temp via `useCalendarWeather` (one `daily` call per visible week). Gated by `preferences.weatherEnabled`/`weatherCalendar`; "not configured" when the key is absent. `Workout.startTime` ("HH:mm") drives precise hourly lookups.
- **Splits scanner** (optional, fully client-side): `lib/scanner/split-scanner.ts` OCRs a Strava splits screenshot with **tesseract.js** (dynamically imported so it stays out of the main bundle; no API key, image never leaves the device and is discarded after scanning) into `Workout.splits: WorkoutSplit[]` (`{km, pace, elevM?}`). The shared plumbing (canvas preprocessing, the worker, `PSM` typing) lives in `lib/scanner/ocr.ts`. The image is grayscaled + **inverted** + upscaled 2× on a canvas (Strava is dark mode; Tesseract wants dark-on-light) and recognized with a digit/colon `tessedit_char_whitelist` at **`PSM.SPARSE_TEXT`**. **`parseSplitsFromWords()` is the load-bearing part and works on word geometry, not line text** — Strava spaces Km/Pace/Elev far apart with a bar chart between, which makes Tesseract merge columns and drop characters (`1 4:50 1` → `1450`). Instead it keeps strict `m:ss` words, clusters them by x, then **picks the real Pace column by scoring, not size** — the pace chart's Y axis is often *longer* than the table (8 labels vs 7 splits), so "biggest cluster" silently returns `3:00, 3:30, 4:00 …`. An axis is an arithmetic progression (`looksLikeAxis()`, with equal-zero steps allowed so a perfectly even-paced run isn't rejected) and has no km index to its left or elevation to its right; columns are scored on those signals. It takes **km from row order** (the index column OCRs badly and is just 1,2,3…) honouring a leading fraction for the final partial km, and grabs an elevation number far to the right on the same row. km numbering is **row-pitch aware**, so a missed pace row doesn't silently renumber every split after it. Elevation gets a **dedicated second pass** (`readElevations`): the 1–2 char glyphs are too small for the full-page pass, so the narrow right-hand column is re-OCR'd at 4× as a `SINGLE_BLOCK` (a bare `1` is one thin stroke that sparse mode discards as noise; a sparse second pass was tried and added nothing). Minus signs OCR drops are recovered **geometrically** by `resolveElevations()`: the column is right-aligned, so a leading "-" makes the word box ~1.7× wider (74px for `1` vs 129px for `-1`), which is far more reliable than classifying a 2px dash. The same function drops readings tens of times the run's own median (e.g. `-1` misread as `41`); the bound scales with the run so a genuinely hilly run keeps its data, and a rejected row shows no elevation rather than a wrong one. There is deliberately **no line-text fallback** — the far-apart columns break Tesseract's line segmentation, so a line parse scored 0/45 rows on real screenshots where the geometry path scored 45/45; if no pace column is found the scan simply fails. Only numbers are inspected, so any language (e.g. Dutch, incl. `0,3` decimal commas) parses identically. Verified against four real screenshots (7, 10, 11 and 17 splits, incl. partial-km rows): **100% correct on km and pace in all four; elevation exact on the two originals**. Gated by `preferences.splitScannerEnabled` (no server key ⇒ no `configured` gate). UI: `components/common/screenshot-scan-field.tsx` in both log dialogs, `components/common/splits-list.tsx` for display, `components/stats/split-pace-chart.tsx` + `latestSplitRun()` in `lib/stats.ts` on the Stats page.
- **Summary scanner** (`lib/scanner/summary-scanner.ts`, same opt-in and the same on-device promise): reads an activity *summary* screenshot for total distance, average pace or speed, moving time and the start time of day, returning **canonical km and seconds-per-km** so a Strava account set to miles fills a kilometer app correctly. Like the splits parser it never reads a label, so it is language-independent by construction: values are found by **shape plus an adjacent unit token** (`km`, `mi`, `/km`, `km/h`), and units are the one part of the screen that does not translate. Both the joined (`16.34km`) and split (`16.34` + `km`) spellings are handled, since whether OCR breaks on the space depends on the font metrics. Duration is only taken from an unambiguous **two-colon** `h:mm:ss`; a bare `mm:ss` cannot be told from a pace, and the distance+duration solver derives it anyway. The **start time is the hard one** — a clock and a pace are both `h:mm` — so it needs an AM/PM marker (which also folds 12-hour into 24-hour), or else must sit above every anchored stat; the top 6% of the image is discarded outright or every scan would return the phone's status-bar clock. `parseSummary()` is pure and takes word boxes, so it is unit-tested against a to-scale model of the real layout.
- **Which parser runs** (`lib/scanner/index.ts` → `scanScreenshot`): one preprocessed canvas and one worker serve both. **The splits table wins outright when present** — a column of stacked paces only exists on the splits screen, so finding one identifies the screenshot and the summary parser is not consulted. That is correctness, not tidiness: Strava prints "best efforts" above the splits table and each row carries a genuine distance and pace with genuine unit tokens (`0.28 km  1:24  4:52 /km`), which by shape alone is indistinguishable from an activity total. Measured over 15 real splits screenshots, 9 produced exactly that false total before the rule. It also costs nothing, because a splits screenshot now skips the summary pass entirely. The file input takes **multiple files**, scanned sequentially (each scan holds a WASM worker and a canvas several times the screenshot's size), with the splits table kept from whichever yielded the most rows and summary fields merged first-answer-wins.
- **Workout dialog** (`components/plan/workout-form-dialog.tsx`): a **Plan vs Log** mode toggle. Plan mode = scheduling (date or flexible window + planned distance/pace; no actuals). Log mode = actuals (distance, duration `mm:ss`, pace, notes, completed). Distance + (duration *or* pace) auto-computes and locks the third field.

## i18n — `lib/i18n/`

react-i18next, locales `en`/`nl` in `lib/i18n/locales/`. `lib/i18n/locales/en.ts` exports `type Dict = typeof en` (NOT `as const` — that breaks `nl: Dict`), so **`nl` must mirror `en`'s keys** (the compiler enforces it). Use `const { t } = useTranslation()` and `t("namespace.key", { vars })`. **Adding a string = add the key to BOTH `en.ts` and `nl.ts`.** Locale lives in `preferences.locale`; `components/layout/i18n-provider.tsx` applies it + keeps `lib/date-locale.ts` (the date-fns locale holder used by `lib/date.ts`) in sync. The big AI prompts live in the dictionaries (`settings.aiPrompt`, `wizard.aiPrompt`) and keep JSON field names in English on purpose.

## Folder map

```
app/                      routes (dashboard /, plan, plan/new, calendar, off-days, stats, settings)
components/ui/            shadcn (Base UI) primitives — generally don't edit
components/{layout,common,dashboard,plan,calendar,off-days,stats,settings,wizard}/  feature UI
hooks/                    cross-feature hooks only: useActivePlan, useStats, useHydrated, useMounted, useWeekdayLabels
                          (feature-specific hooks live beside their components, e.g. components/calendar/use-calendar-nav.ts)
lib/                      primitives at the root — types, utils, date(+date-locale), pace, id — with each domain in a folder:
lib/plan/                 context (AI context), defaults, merge (import reconciliation), request (AI wire format), stats, workout, backyard, storage (export/import), example-plan(+.json)
lib/calendar/             layout (spanning-bar packing), range (visible days + stepping per view)
lib/weather/              client, cache (localStorage TTL), sync (glue to the stores)
lib/drive/                client (thin fetch wrapper), types, sync-decision (newest-wins)
lib/scanner/              on-device OCR: ocr (canvas + tesseract worker), split-scanner (the splits table), summary-scanner (totals + start time), index (scanScreenshot)
lib/server/               server-only Drive OAuth: session (iron-session), google-oauth, drive, api (error helper + returnTo guard)
lib/test/                 factories and the `server-only` stub, used only by tests
                          *.test.ts sits beside its module — `npm test` (vitest, node env, pure functions + the stores)
app/api/                  Route Handlers: auth/google/{login,callback}, auth/{session,logout}, drive/{meta,content}
store/                    use-training-store, use-sync-store
docs/                     this guide, roadmap.md (planned features), ai-plan-coach.md (deferred design)
```

## Installable web app (PWA)

`app/manifest.ts` + `public/sw.js` make the tracker installable to a phone home screen, and `components/settings/install-app-card.tsx` offers it in Settings.

- **Icons must be PNG.** `public/icons/{icon-192,icon-512,icon-maskable-512}.png`, regenerated from `app/icon.svg` by `scripts/build-icons.mjs`. An SVG entry with `sizes: "any"` looks like a perfect match to Chrome's icon picker, but it can't rasterize one for a WebAPK — it then reports `no-acceptable-icon`, stops looking, and "Install" silently degrades to a home-screen shortcut. `app/icon.svg` stays the tab favicon via `<link rel="icon">`, which is a separate mechanism.
- **The maskable variant** bleeds its background to every edge and keeps the runner inside the middle 80%, because launchers crop to a circle or squircle.
- **The install button is Chromium-only.** We capture `beforeinstallprompt`, `preventDefault()` it so Chrome's own infobar can't appear mid-run, and call `prompt()` from the button. Chrome then logs *"Banner not shown: beforeinstallpromptevent.preventDefault() called"* — that is the intended handshake, not an error. iOS has no equivalent API and Safari has repeatedly declined to add one, so `useInstallApp()` detects iOS and the card shows the Share → Add to Home Screen steps instead. The card renders nothing once installed.
- **The service worker is for offline, not installability.** Chrome installs the app with or without one — measured both ways. `public/sw.js` is deliberately conservative: network-first for navigations so a deploy goes live immediately, cache-first only for content-hashed `/_next/static/`, and it never touches `/api/`. It isn't registered in development, where it fights hot reload.

**Testing installability:** Playwright's `newContext` is incognito-like and Chrome refuses to install in incognito, which masks every other error — use `launchPersistentContext` with `--bypass-app-banner-engagement-checks`, against `next start` rather than `next dev`. CDP `Page.getInstallabilityErrors` gives Chrome's own verdict.

## Build & verify

- `npm install` then `npm run dev`. `npm run build` (Vercel-ready), `npm run lint` — **keep both green** (lint runs `react-hooks` rules stricter than build; avoid `setState`-in-effect — use the render-time reset or `useMounted`).
- Optional Drive sync: copy `.env.local.example` → `.env.local`, set `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`/`GOOGLE_REDIRECT_URI`/`SESSION_SECRET`, and register the redirect URI + publish the consent screen (see README "Cloud sync setup").
- `npm run typecheck` (`tsc --noEmit`) is faster than a full build for a pre-commit loop, and `npm test` runs the vitest suite over `lib/**` and `store/**`.
- **Regenerate the README screenshots**: `npm run dev`, then `npm i -D playwright-core && node scripts/screenshots.mjs && npm uninstall playwright-core`. It also asserts every page renders and that the Dutch shot is really Dutch.
- **Check the example plan** without a browser: `npx tsx` a script calling `loadExamplePlan()` from `lib/plan/example-plan.ts` — assert a future `raceDate`, `isExample: true`, and that `JSON.stringify(plan)` contains no `"lat"`.
- **Browser smoke** (no extra deps committed): `npm i -D playwright-core`, launch with `chromium.launch({ channel: "chrome" })` (uses system Chrome — no browser download), drive the app, then `npm uninstall playwright-core`. Use isolated `browser.newContext()` per scenario to reset localStorage. Onboarding popups appear on fresh state — the Drive dialog only shows when sync is configured (server env set), otherwise you go straight to the "create plan?" popup; choose a plan option.

## When extending

- New persisted field on a plan/preferences → add to `lib/types.ts`, default it in the generator and `lib/storage.ts` `normalizePlan`, and **bump the persist `version` + backfill in `migrate`**.
- New UI string → add to both dictionaries.
- New page → thin server `page.tsx` rendering a `"use client"` view inside `<HydrationGate>`, with a `<PageHeader titleKey=… />`; add a nav entry in `components/layout/app-nav.tsx`.
- Statistics are **derived live** (`lib/stats.ts` + `hooks/use-stats.ts`), never persisted.

## Future work

Planned/deferred features (with where to hook in) live in
[`roadmap.md`](roadmap.md) — e.g. Google Calendar integration for the off-days
step, and the in-app AI coach ([`ai-plan-coach.md`](ai-plan-coach.md)). Update
the roadmap when you ship or scope an item.
