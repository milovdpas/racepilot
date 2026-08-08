# 🏃 RacePilot

A clean, mobile-first web app for planning and tracking endurance training: marathon, ultra, backyard ultra, trail, cycling, swimming and triathlon. Each sport reads in its own units, so a ride shows km/h and a swim shows min/100m, while everything is stored the same way underneath.

No login required. Everything lives in your browser's **localStorage**, in kilometers and °C whatever you choose to see. Optional Google Drive sync uses a thin Next.js backend (server-side OAuth) — there's no database. Runs as a Docker container behind nginx; see [`Dockerfile`](Dockerfile).

> Design language: **Strava × Notion** — calm surfaces, data-dense cards, an orange race-day accent, and full dark mode.

> **Developers / AI agents:** start with [`docs/architecture.md`](docs/architecture.md) - the authoritative guide to the data model, state, flows, and conventions, and [`docs/racepilot.md`](docs/racepilot.md) for the multi-sport conversion and the decisions behind it. This README is a user-facing overview and may lag behind newer features.

---

## Screenshots

| Landing page | Onboarding |
| --- | --- |
| ![Landing page](docs/screenshots/landing.png) | ![Onboarding](docs/screenshots/welcome.png) |

| Dashboard | Dashboard (dark) |
| --- | --- |
| ![Dashboard](docs/screenshots/dashboard-light.png) | ![Dashboard dark](docs/screenshots/dashboard-dark.png) |

| Plan | Calendar | Stats |
| --- | --- | --- |
| ![Plan](docs/screenshots/plan-light.png) | ![Calendar](docs/screenshots/calendar-light.png) | ![Stats](docs/screenshots/stats-light.png) |

| Off days | Settings | Add-plan wizard |
| --- | --- | --- |
| ![Off days](docs/screenshots/off-days.png) | ![Settings](docs/screenshots/settings-light.png) | ![Add-plan wizard](docs/screenshots/wizard-step3.png) |

| Calendar (dark) | Stats (dark) | Dashboard (Dutch) |
| --- | --- | --- |
| ![Calendar dark](docs/screenshots/calendar-dark.png) | ![Stats dark](docs/screenshots/stats-dark.png) | ![Dashboard Dutch](docs/screenshots/dashboard-nl.png) |

---

## Features

- **Dashboard** — countdown to race day, % through the training block, plan-completion %, weekly & monthly mileage (planned vs actual), upcoming and recently-completed workouts.
- **Training plan** - all training weeks, grouped and collapsible, with a phase badge (Base / Build / Peak / Taper / Race / Reduced) and special-period labels. Mark complete, edit, add custom workouts.
- **Workout tracking** — date, sport (run / bike / swim), type (Easy / Tempo / Interval / Long / Recovery), planned & actual distance, planned & actual pace, duration. Actual pace is auto-derived from distance + time. Sport and type are separate axes: a tempo effort is a tempo effort on a bike too.
- **Any sport, in its own language** — runners read min/km, cyclists km/h, swimmers min/100m. Pick kilometers or miles in Settings; it only changes what you see, never what is stored.
- **Statistics** — total distance, longest session, weighted average pace (or speed), sessions completed, weekly volume, and a longest-session-per-week chart. A plan that mixes sports gets the **whole set once per sport**, each in its own units, plus an overall section carrying only total time and session count — the two figures that survive being added across sports.
- **Calendar** — monthly grid with colored workout dots (faded = planned, solid = completed); tap a day to view, edit, or add workouts.
- **Settings** — race details, your sports, country and units, theme and language (English/Dutch), optional features, example plans to explore, and **export / import JSON** so you can hand the whole schema to an agent and re-import it.

---

## The training plan

A new install seeds an example plan matching the sport you picked during
onboarding — there is one for each of the seven race types, catalogued in
[`lib/plan/examples.ts`](lib/plan/examples.ts), and you can add the others from
**Settings → Try an example plan**.

The marathon one is real training: an exported 17-week block with ~17 logged
runs, per-kilometer splits, weather and off-day periods. It lives in
[`lib/plan/example-plan.json`](lib/plan/example-plan.json) and is loaded by
[`lib/plan/example-plan.ts`](lib/plan/example-plan.ts), which rebases every date
onto the current week (in whole weeks, so weekdays and the Sunday race survive)
— the demo never rots into a race that finished months ago. The rest are
generated deterministically from a small spec
([`example-specs.ts`](lib/plan/example-specs.ts)), so they cost a few hundred
bytes each instead of another 26 KB of invented JSON.

To refresh it from your own training: **Settings → Export**, then

```bash
node scripts/scrub-example-plan.mjs racepilot-plans-YYYY-MM-DD.json
```

That strips the `preferences` block and the home coordinates every weather
snapshot carries, and writes `lib/plan/example-plan.json`. Raw exports are
gitignored — **never commit one**, this repo is public.

Want a different plan for yourself? Create one in the app (**Settings → Add
plan**) and let an AI build it, or export your JSON, edit it, and import it back.

---

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Base UI primitives)
- [Zustand](https://github.com/pmndrs/zustand) with `persist` → localStorage
- [Recharts](https://recharts.org) for graphs · [date-fns](https://date-fns.org) for dates · [next-themes](https://github.com/pacocoursey/next-themes) for dark mode · [react-i18next](https://react.i18next.com) for English/Dutch

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first visit shows the
landing page; the app itself lives under `/app`, and `/welcome` runs the
first-run flow.

```bash
npm run build   # production build
npm run start   # serve the production build
```

### Deploy

The app is mostly client-side, but it is **not** a static bundle: `app/api/*`
are Route Handlers doing Google Drive OAuth and weather, and `proxy.ts` runs per
request. It needs a Node server either way.

**Docker (how it is deployed today).** [`Dockerfile`](Dockerfile) builds a
Next.js standalone image that listens on port 80 and runs as a non-root user;
[`docker-compose.prod.yml`](docker-compose.prod.yml) puts it behind a shared
nginx proxy, and [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
builds, tests and ships it on a push to `main`.

Two things that are easy to get wrong:

- `NEXT_PUBLIC_SITE_URL` is a **build argument**, not a runtime variable. The
  landing page, `/privacy`, `sitemap.xml` and `robots.txt` are prerendered, so
  the canonical origin is baked into the image; changing domains means a
  rebuild. Leave it unset and the app marks itself `noindex` rather than
  advertise `localhost` as its canonical URL.
- Health checks must probe `http://127.0.0.1/health`, not `localhost` — the
  server binds IPv4-only and BusyBox `wget` tries `::1` first.

**Vercel** also works with no configuration: import the repo and it supplies its
own origin. The only (optional) setup is the Google Drive sync env below — leave
it unset and the app runs localStorage-only.

---

## Cloud sync setup (optional)

By default everything lives in your browser's localStorage. You can optionally connect a **Google account** to back up and sync your progress via **Google Drive**, using a **server-side OAuth 2.0 authorization-code flow** (refresh tokens kept in an encrypted session cookie — no database, no tokens in the browser). Data is stored in Drive's hidden **app-data folder**, invisible in your Drive and accessible only to this app.

Without the env below, the app still works fully (local only) and the Settings → Cloud sync card shows "not configured".

To enable it, create an OAuth client in the [Google Cloud Console](https://console.cloud.google.com/):

1. **Create a project** (or pick one).
2. **APIs & Services → Library →** enable **Google Drive API**.
3. **APIs & Services → OAuth consent screen:** choose **External**, add the scope `https://www.googleapis.com/auth/drive.appdata`, and **Publish the app (set it to "In production")**. ⚠️ Don't leave it in *Testing* — Google expires refresh tokens after **7 days** in Testing mode, which defeats staying signed in. `drive.appdata` is *sensitive* but not *restricted*, so publishing needs no formal verification; users just click past a one-time "unverified app" warning.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application.** Under **Authorized redirect URIs** add:
   - `http://localhost:3000/api/auth/google/callback`
   - `https://<your-stable-domain>/api/auth/google/callback` (use a stable Vercel alias or custom domain — **not** a per-deployment hash URL).
5. Copy the **Client ID** and **Client secret** into `.env.local` (see `.env.local.example`):

   ```bash
   GOOGLE_CLIENT_ID=xxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxxxxx
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
   SESSION_SECRET=$(openssl rand -base64 32)   # ≥32 chars; encrypts the session cookie
   ```

   For Vercel, add the same four variables under **Project → Settings → Environment Variables** (set `GOOGLE_REDIRECT_URI` to your production callback URL) and redeploy.

Then open **Settings → Cloud sync → Connect Google Drive** — you'll be redirected to Google and back.

- The **client secret** is confidential: it lives only in server env, never `NEXT_PUBLIC_`, never committed.
- The browser never sees an access/refresh token — it only calls same-origin `/api/*` routes; the server refreshes tokens transparently, so sessions survive page refreshes and the 1-hour token lifetime.
- Sync is **newest-wins**: it pulls on connect/refocus, auto-pushes a few seconds after each edit, and offers a manual **Sync now**. Disconnecting revokes the token server-side and clears the session, but keeps your local data.

### Troubleshooting: `redirect_uri_mismatch`

The `GOOGLE_REDIRECT_URI` (and the live callback URL) must **exactly** match an Authorized redirect URI on the OAuth client — scheme, host, and path. Per-deployment Vercel URLs (with a hash) change every deploy; register a stable alias/custom domain instead.

### Troubleshooting: signed out after ~7 days

Your consent screen is still in **Testing** mode (refresh tokens expire after 7 days). **Publish the app** in OAuth consent screen → Audience, then reconnect.

---

## Weather setup (optional)

Turn on **Settings → Weather** (or accept the onboarding prompt) to see per-day weather in the calendar and record the conditions of each logged session. It uses your **device location** (browser permission) and a server-side weather key — the key never reaches the browser.

To enable it:

1. Create an API key at [OpenWeatherMap](https://openweathermap.org/api/one-call-3) and subscribe to **"One Call by Call"** — **1000 calls/day are free**, but a **credit card is required even for the free tier**.
2. In your OWM dashboard, set a **"Calls per day" cap** to hard-stop at the free limit (the app caches aggressively, but this is your safety net).
3. Add the key to `.env.local` (and Vercel env), server-side only:

   ```bash
   OPENWEATHER_API_KEY=xxxxxxxx
   ```

Notes & limits:

- The key is **server-only** (never `NEXT_PUBLIC_`); the browser calls same-origin `/api/weather/*`. Without it, the Settings card shows "not configured".
- Responses are cached in `localStorage`; past days cache ~permanently, near-future briefly. The calendar fetches **one call per visible week**.
- **Hourly precision** (the logged finish time) resolves within ~48 h ahead or any past date; further-future planned runs only get the daily value.
- Weather uses your **current** location, so runs done while travelling/abroad will show your current-location weather.

---

## Support

This app is free and runs entirely in your browser, with no accounts, no ads, and no database. If it helps your training, you can leave a small tip. 💧

→ [buymeacoffee.com/milovanderpas](https://buymeacoffee.com/milovanderpas)

---

## Project structure

```
app/
  page.tsx           # the landing page — the only substantial indexable content
  privacy/  welcome/ # the data promise, and the first-run flow
  app/               # THE APP: dashboard, plan, calendar, off-days, stats, settings
  api/               # Route Handlers: Google OAuth, Drive, weather
proxy.ts             # sends returning users past the landing page before paint
components/
  ui/                # shadcn/ui primitives
  layout/            # nav, theme provider/toggle
  common/            # shared widgets (workout row, stat card, sport icon, …)
  marketing|onboarding/                     # landing page, welcome flow
  dashboard|plan|calendar|stats|settings|wizard/   # per-page views
lib/                 # primitives at the root, domains in folders
  types.ts           # domain models
  utils.ts  date.ts  date-locale.ts  pace.ts  id.ts  site.ts  app-cookie.ts
  sport.ts           # run/bike/swim + each sport's pace or speed convention
  units.ts  region.ts  # km/mi conversion at the display edge; country detection
  athlete.ts         # athlete types -> capabilities
  plan/              # context, defaults, merge, request, stats, workout,
                     #   backyard, multisport, storage, examples(+builder,
                     #   specs, example-plan.json)
  calendar/          # layout (spanning bars), range (visible days per view)
  weather/           # client, cache, sync
  drive/             # client, types, sync-decision (newest-wins)
  scanner/           # split-scanner (on-device OCR)
  server/            # server-only: session, google-oauth, drive, api
  i18n/              # en/nl dictionaries (the Dict type enforces parity)
  test/              # factories + the server-only stub
store/               # training (+localStorage persist), sync, weather, toast
hooks/               # useHydrated, useStats, useFormat, useUnits, useDuration, …
```

Statistics are **derived live** from your workouts rather than stored, so they never go stale — the only persisted state is the plan, your workouts, and preferences.
