<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# RacePilot - agent orientation

**Read [`docs/architecture.md`](docs/architecture.md) before changing anything.** It is the authoritative guide (data model, state, flows, conventions, how to build/verify). Planned/deferred features (e.g. Google Calendar in the off-days flow, in-app AI coach) are in [`docs/roadmap.md`](docs/roadmap.md); known refactors that were deliberately deferred are in [`docs/tech-debt.md`](docs/tech-debt.md). The multi-sport conversion (rebrand, routing, athlete types, and the units / cycling / swimming / triathlon work still to come) is tracked in [`docs/racepilot.md`](docs/racepilot.md) - read it before touching onboarding, routing or the plan schema. Sending workouts to a watch (structured workouts, `.fit` / `.ics` export, the delivery Strategy) is tracked in [`docs/watch-export.md`](docs/watch-export.md) - read it before touching `Workout.steps`, the export targets or the watch profile. `README.md` is user-facing and may lag.

Quick orientation:

- **Mostly client-side Next.js (App Router) SPA. No database.** Data lives in `localStorage` (Zustand `persist`). The only server code is `app/api/*` Route Handlers for **server-side Google Drive OAuth** (refresh token in an encrypted iron-session cookie; see `lib/server/*`). Deploys to Vercel (Functions). Mobile-first, dark mode, English + Dutch.
- **Single source of truth:** `store/use-training-store.ts` — a `plans` map + `activePlanId`. Read the active plan via `useActivePlan()` (there is no `s.plan`). Domain types: `lib/types.ts`.
- **Top gotchas that will bite you:**
  - shadcn here is **Base UI (`@base-ui/react`), not Radix** → compose with the **`render` prop**, not `asChild`.
  - **Tailwind v4** (CSS `@theme`, no config file); dynamic class names aren't generated — use static class maps.
  - i18n: every UI string is a key in **both** `lib/i18n/locales/en.ts` and `nl.ts` (the `Dict` type enforces parity). Use `useTranslation()`.
  - Persisted-shape changes require **bumping the persist `version` + an additive `migrate`** in `use-training-store.ts` (currently v18).
  - Pages are thin server components rendering a `"use client"` view inside `<HydrationGate>`. **The app lives under `/app/*`**; `/` is a server-rendered marketing page and `/welcome` is the first-run flow, both outside the app chrome in `app/app/layout.tsx`.
  - Sticky offsets and z-index are **CSS variables in `app/globals.css`** (`--h-topbar`, `--stick-under-viewbar`, `--z-sticky`, …), consumed as `top-(--stick-under-viewbar)`. Don't reintroduce pixel literals — they silently detach when a bar's height changes.
  - **Manifest icons must be PNG.** An SVG entry with `sizes: "any"` looks like a perfect match to Chrome's icon picker, but it cannot rasterize one for an Android WebAPK — it then reports `no-acceptable-icon` and stops looking, and "Install" silently degrades to a home-screen shortcut. `app/icon.svg` is the tab favicon only; `public/icons/*.png` (regenerate with `scripts/build-icons.mjs`) is what `app/manifest.ts` points at.
  - The bundled example plan (`lib/plan/example-plan.json`) is a scrubbed real export. **This repo is public:** raw exports carry home coordinates, so `marathon-plans-*.json` is gitignored and `scripts/scrub-example-plan.mjs` strips `lat`/`lon` and `preferences`.
- **Copy:** never use an em dash (`—`) in anything a user reads. That means the i18n dictionaries, the landing and privacy pages, page metadata, and the OG image. Rewrite the sentence instead: a full stop usually works, a comma or a colon otherwise. A hyphen is acceptable but a rewrite reads better. This does **not** apply to code comments or docs, only to user-facing strings. Check before committing copy with:
  ```bash
  grep -rn "—" lib/i18n/locales/*.ts app/page.tsx app/*/page.tsx lib/plan/example-specs.ts lib/plan/example-plan.json | grep -vE ":[[:space:]]*(\*|//)"
  ```
  The second `grep` drops comment lines, which are exempt; any output left is a real violation. The demo plans count as copy: their workout titles and plan names are read by every user who opens an example.
- **Commits:** the title is **hard-capped at 72 characters**, including the `type:` prefix — count it, don't estimate. Conventional-commit prefixes (`feat:`, `fix:`, `refactor:`, `chore:`, `update:`), imperative mood, no trailing full stop. Put the detail in the body, wrapped at 72 too; explain *why*, and call out anything a reviewer would otherwise have to discover.
- **Verify:** keep `npm run build`, `npm run lint` and `npm test` green (`npm run typecheck` is the fast inner loop). Pure logic in `lib/` gets a `*.test.ts`; components are covered by browser smoke instead. Browser smoke via `playwright-core` + system Chrome (`channel: "chrome"`); see `docs/architecture.md` → "Build & verify".
