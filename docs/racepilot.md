# RacePilot — the multi-sport conversion

**Status: complete.** This document records a conversion that spans several
releases: turning a running-only "Marathon Tracker" into **RacePilot**, an
endurance planner that covers marathon, ultra, backyard ultra, trail, cycling,
swimming and triathlon.

It exists because the work is too big for one commit and the *reasons* behind
the decisions are easy to lose between slices. Read this before starting any
slice; update it **within** the slice, not afterwards.

Where this sits next to the other docs — the boundary matters, or all four rot:

| doc | answers |
|---|---|
| [`architecture.md`](architecture.md) | How the app works **now**. Edited when a slice lands. |
| [`roadmap.md`](roadmap.md) | Features not started, unrelated to this conversion. |
| [`tech-debt.md`](tech-debt.md) | Refactors deliberately deferred. |
| **this file** | This conversion: sequence, progress, decisions and their reasons. |

---

## 1. What RacePilot is becoming

One planner for seven race types, personalised to the athlete rather than
showing everyone everything:

🏃 Marathon · 🏃 Ultra · 🏃 Backyard Ultra · 🏔️ Trail · 🚴 Cycling · 🏊 Swimming · 🏊🚴🏃 Triathlon

The app stays what it is: free, no account, no database, no ads. Training data
lives in the browser's `localStorage`, or in the user's *own* Google Drive. That
promise is now stated on the landing page and in onboarding, which makes it a
constraint on every future slice rather than a marketing line.

---

## 2. Slices

| # | slice | status | landed in |
|---|---|---|---|
| 1 | Rebrand + `/app/*` routing + full-page onboarding + athlete types + example-plan catalogue + SEO | **done** | see git log |
| 2 | Units & country (km/mi), Settings toggle, AI context | **done** | see git log |
| 3 | Multi-sport workouts (`Workout.sport`), cycling / swimming / trail | **done** | see git log |
| 4 | Triathlon (multi-leg races, bricks, transitions) | **done** | see git log |
| 5 | ~~Remaining example plans~~ | **done** (shipped with 3) | see git log |

**All five slices are shipped.** The conversion is complete: every race type on the landing page works end to end. Anything further belongs in `roadmap.md`, not here.

### Slice 1 — rebrand, routing, onboarding

- Rebrand the *product* to RacePilot. Domain data keeps its names (see
  "Frozen identifiers" below).
- `/` becomes a server-rendered marketing page; the app moves to `/app/*` with
  308 redirects from the old paths.
- New full-page onboarding at `/welcome` — privacy first, then a short tour,
  athlete profile, feature opt-ins, and finally "create a plan" or "look
  around". The popup mechanism survives, but only as the *what's new* channel
  for existing users.
- `athleteTypes` multi-select, driving `lib/athlete.ts` capabilities.
- An example-plan **catalogue** so each athlete type can get a relevant demo.
- SEO: per-page metadata, sitemap, robots, OG image, Search Console.

### Slice 2 — units & country (done)

Canonical storage forever: km, °C, metres, and pace as **seconds per km** — in
every unit system. Conversion happens only at the display edge (`lib/units.ts`)
and at input boundaries, so switching the toggle can never rewrite a plan. A
browser test pins that: flipping to miles and back leaves `plans` byte-identical.

The country comes from `navigator.language`'s region subtag with a small
timezone fallback (`lib/region.ts`), never from IP or the weather feature's
geolocation — either would contradict the first screen of onboarding. It is
stored, editable, and passed to the AI.

Every formatter lives behind one `useFormat()` hook, so a component asks for a
formatted value rather than deciding whether to convert. The sites that hand-
rolled `${km} km` were exactly the ones that would have silently stayed metric.

### Slice 3 — multi-sport workouts (done)

`Workout.sport` and `PlanMeta.sport`, both optional, both resolved through
`workoutSport(workout, plan)`: absent on a workout means the plan's sport,
absent on a plan means running. Nothing was backfilled, because absent already
says what every pre-multi-sport workout meant.

Each sport shows speed in its own convention, which is a fact about the sport
rather than a preference: runners read min/km, **cyclists read km/h** (and
faster is a *bigger* number, the one inversion in the whole system), swimmers
read min/100m or min/100yd. All of it converts from the same stored
seconds-per-km.

Stats gain a per-sport breakdown and `totalTimeMin`. Distance stays per sport
on purpose — 40 km on a bike and 10 km running are not 50 km of anything — and
time is the only figure that survives being added across them.

Cycling and swimming example plans landed with it, so the Settings catalogue no
longer promises sports it can't show.

### Slice 4 — triathlon (done)

`RaceType` gains `"multisport"` and `PlanMeta.legs[]` carries each leg's sport,
distance and the transition *after* it (so the last leg has none). Race day is
one workout per leg, marked with `Workout.raceLegIndex`.

That index is what fixed the real bug: `raceWorkout()` returned the longest
workout on race day — the 40 km bike leg of a triathlon — and its only caller
asked `raceWorkout(plan)?.completed`. A triathlete who logged their bike was
told the race was finished with the run still ahead of them. The question is now
asked directly, by `isRaceComplete()`, which requires *every* leg.

Transitions are deliberately **not** workouts. They are part of the race clock,
nothing is trained in them, and counting them as workouts would corrupt every
distance total. They live on the leg.

The wizard grew a multi-sport path with the standard distances as presets
(sprint, Olympic, 70.3, 140.6, duathlon), because nobody remembers that a 70.3
is 1.9 / 90 / 21.1 km — and the fields stay editable, since local races rarely
match a brand exactly.

---

## 3. Decisions, and why

These are the ones that are expensive to rediscover.

**No analytics beyond Search Console.** Google Search Console reports search
impressions and clicks — how people *find* the app — which is enough. There is
deliberately no GTM, no product analytics and no consent banner, because "we
collect no data about you" is only worth saying if it is literally true.

**Marketing at `/`, app at `/app/*`.** Every app page renders behind
`HydrationGate`, which shows a skeleton until Zustand rehydrates from
`localStorage`. A crawler's `localStorage` is empty, so it *never* sees content
— before this change the entire indexable body of `/` was six words. A real
prefix (rather than a route group) also means the app's chrome and its
`noindex` live in one layout, `app/app/layout.tsx`.

**`sport` is orthogonal to `type`.** `WorkoutType` is an *intensity* axis
(`easy`/`tempo`/`interval`/`long`/`recovery`) — proven by `longRunProgression`
filtering on `type === "long"`. "Tempo" means the same thing on a bike, so the
two axes multiply rather than merge: sport picks the icon, intensity picks the
colour, and the badge doesn't grow.

**One canonical pace unit.** Seconds per kilometer, for every sport, converted
at display: min/100m is (min/km) ÷ 10 and km/h is 3600 ÷ (s/km). Storing each
sport's idiomatic unit would mean every stat, chart and merge helper learning
three representations.

**`athleteTypes` is a tri-state.** `undefined` means never asked (so existing
users get the one-time prompt), `[]` means asked and declined (never ask
again). This is why there is no companion `athleteTypesSeen` flag — a plain
boolean, like `splitScannerOnboardingSeen`, cannot tell `false` from "not
asked". The gate predicate must therefore be `athleteTypes === undefined` and
**not** `!athleteTypes?.length`, which would re-ask a decliner forever.

**Capabilities, not raw types.** *Feature* gating branches on
`capabilitiesFor(types)` (`lib/athlete.ts`), never on `types.includes("ultra")`.
A capability survives adding an eighth athlete type; a scattered `includes` does
not. The one deliberate exception is the example catalogue, where each entry
already declares the types it is for, so `examplesFor` matches on those directly
rather than inventing a capability per demo.

**`capabilitiesFor` is cached on the exact list, not a sorted one.** Order is
meaningful — the first type picked becomes `primary` and drives the app's mark —
so `["cyclist","runner"]` and `["runner","cyclist"]` must not share a cache
entry. A test pins this; it was wrong first time round.

**Unknown profile shows every *feature*, but only running *plans*.**
`capabilitiesFor(undefined)` and `capabilitiesFor([])` enable every capability,
because hiding functionality from someone who told us nothing makes the app look
broken. `examplesFor` deliberately does the opposite and treats an unset profile
as a runner: offering a swimmer's plan to someone who has never swum is clutter,
not a missing feature. There is deliberately **no** cross-sport escape hatch in
the demo list — the lever is "Your sports" directly above it, so the two
controls can't disagree about what you do.

**Example plans for bike / swim / tri are blocked, not forgotten.** An example
plan is data in the current schema, and `Workout` has no `sport` field yet — so
those plans are literally unrepresentable until slice 3. They are not faked by
relabelling running workouts: a demo whose job is to show the user their sport
is worse than useless if it lies.

**Units are display-only, and the wire format is always metric.** The AI
plan-request sends `distanceKm` and min/km whatever the athlete sees, plus an
`athlete.units` hint telling the coach how to *talk*. One canonical format means
a plan written for a US runner imports cleanly for a Dutch one.

**The UK defaults to metric.** Road signs are in miles, but British distance
runners train and race in km (parkrun is 5K, track is metric). Overridable
either way; the cost of being wrong is one switch.

**The install prompt is a popup, not an onboarding step.** `useInstallApp()`
only reaches `mode: "prompt"` once Chrome fires `beforeinstallprompt`, which
often happens *after* the user has clicked through `/welcome`. As a step it
would render for one user and blank for the next.

---

## 4. Frozen identifiers

Changing any of these breaks existing installs. They look like branding; they
are not.

| identifier | where | why it's frozen |
|---|---|---|
| `STORAGE_KEY = "marathon-training-v1"` | `lib/plan/storage.ts` | Orphans every existing user's `localStorage`. |
| `manifest.id: "/"` | `app/manifest.ts` | Chrome keys the installed Android WebAPK on it — a change mints a *second* icon on every home screen. `start_url` is the field that may move. |
| `DEFAULT_PLAN_ID = "milo-marathon"` | `lib/plan/defaults.ts` | Existing installs already hold a plan with this id; it stays the marathon example's id. |
| `DEFAULT_PLAN_META.raceName`, `MARATHON_KM` | `lib/plan/defaults.ts` | Domain data, not product name. |

---

## 5. Known gaps

Things a slice deliberately left half-done. Close them in the slice named, or
record why not.

- **Athlete types can only personalise what exists.** As of slice 1 that is the
  race-format picker, the distance presets, the app's in-app mark and which
  example plans are offered — because `RaceType` is still just
  `"standard" | "backyard"`. Slice 3 gives it real surface area.
- **Picking "cyclist", "swimmer" or "triathlete" adds no example plan.** There
  is nothing to add: those demos need `Workout.sport`. The Settings card says so
  explicitly (`examples.comingSoon`) rather than silently showing an unchanged
  list, and `defaultExampleFor` falls back to the marathon block so a first run
  is never empty. Delete that message in slice 5, when the plans exist.
- **The installed app icon cannot vary per athlete.** Android bakes icons into
  the WebAPK at install time and rate-limits updates to days; iOS snapshots the
  touch icon when the user adds it. Only the in-app mark and the browser tab
  favicon can change — and the favicon is invisible in `display: standalone`.
  Do not attempt a dynamic manifest.
- **Race day is three workouts on one date**, not one workout with legs. Every
  consumer already understands a workout and none of them would know how to sum
  legs; `raceLegIndex` orders them and marks them as the race. There is no
  separate group id because a plan has exactly one `raceDate` — add one if
  multi-race plans ever exist.
- **A multi-sport race has no goal pace**, only a goal time. Three sports means
  three units, so the wizard offers finish/time and the dashboard shows the goal
  label alone.
- **The long-run chart draws a planned 0 but not a future 0.** A week with no
  long run planned is real information (cutback, taper, race week), so the
  dashed line drops to the axis. The orange "actual" line reports 0 only once a
  week is behind you; while it is ahead it stays null, or every plan would
  appear to flatline from today onward.
- **Splits are running-only.** The scanner reads a Strava run screenshot, and
  `SplitPaceChart` labels its bars per kilometer. A bike or swim session simply
  has no splits.
- **Trail is not its own race type.** It is a running plan; the trail demo uses
  `raceType: "standard"` and leans on elevation. If terrain ever needs to change
  behaviour rather than framing, that is when to add a field.
- **Workout titles are never converted.** "Tempo 9 km @ 4:30" is free text
  authored with the plan, so an imperial user still reads km there. Rewriting it
  would mean parsing and re-emitting someone's prose. The AI prompt now asks for
  titles in the athlete's units instead, which fixes it at the source for
  generated plans but not for the bundled example.
- **Splits stay per kilometer.** They are scanned per km off a screenshot, so
  only the pace and elevation convert. Re-bucketing them into miles would mean
  inventing data points that were never measured.

- **Dutch has no separate URLs.** `hreflang` needs locale routes and a
  per-request-safe i18n layer; today's is a process-level singleton that would
  race across concurrent renders. Revisit only if Search Console shows real
  Dutch impressions.
