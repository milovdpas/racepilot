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
- **Statistics** — total distance, longest run, weighted average pace, runs completed, weekly mileage trend, and long-run progression (planned vs actual) charts. A mixed plan also gets a per-sport breakdown, where time is the total that means something across sports.
- **Calendar** — monthly grid with colored workout dots (faded = planned, solid = completed); tap a day to view, edit, or add workouts.
- **Settings** — race details, theme (light/dark/system), and **export / import JSON** so you can hand the whole schema to an agent and re-import it.

---

## The training plan

A new install seeds a real, worked example: an exported 17-week marathon block
with ~17 logged runs, per-kilometer splits, weather and off-day periods. It
lives in [`lib/plan/example-plan.json`](lib/plan/example-plan.json) and is
loaded by [`lib/plan/example-plan.ts`](lib/plan/example-plan.ts), which rebases
every date onto the
current week (in whole weeks, so weekdays and the Sunday race survive) — the
demo never rots into a race that finished months ago.

To refresh it from your own training: **Settings → Export**, then

```bash
node scripts/scrub-example-plan.mjs marathon-plans-YYYY-MM-DD.json
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
- [Recharts](https://recharts.org) for graphs · [date-fns](https://date-fns.org) for dates · [next-themes](https://github.com/pacocoursey/next-themes) for dark mode

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

Turn on **Settings → Weather** (or accept the onboarding prompt) to see per-day weather in the calendar and record the conditions of each logged run. It uses your **device location** (browser permission) and a server-side weather key — the key never reaches the browser.

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
app/                 # Routes: dashboard (/), plan, calendar, stats, settings
components/
  ui/                # shadcn/ui primitives
  layout/            # nav, theme provider/toggle
  common/            # shared widgets (workout row, stat card, progress ring, …)
  dashboard|plan|calendar|stats|settings/   # per-page views
lib/                 # primitives at the root, domains in folders
  types.ts           # domain models
  utils.ts  date.ts  date-locale.ts  pace.ts  id.ts
  plan/              # context, defaults, merge, request, stats, workout,
                     #   backyard, storage, example-plan(+.json)
  calendar/          # layout (spanning bars), range (visible days per view)
  weather/           # client, cache, sync
  drive/             # client, types, sync-decision (newest-wins)
  scanner/           # split-scanner (on-device OCR)
  server/            # server-only: session, google-oauth, drive, api
  i18n/              # en/nl dictionaries
  test/              # factories + the server-only stub
store/
  use-training-store.ts   # Zustand store + localStorage persistence
  use-sync-store.ts       # Google Drive sync state + auto-push
hooks/                # useHydrated, useStats
```

Statistics are **derived live** from your workouts rather than stored, so they never go stale — the only persisted state is the plan, your workouts, and preferences.
