# Sending workouts to a sports watch

Living document for this feature, the way [`racepilot.md`](racepilot.md) tracks
the multi-sport conversion. The boundary against the other docs:
[`architecture.md`](architecture.md) describes how things work **once landed**,
[`roadmap.md`](roadmap.md) is features not started, [`tech-debt.md`](tech-debt.md)
is deferred refactors, and this file is **the sequence, the status of each slice,
and the decisions with their reasons**. Update it *within* each slice, not after.

## Status

| Slice | What | Status |
|---|---|---|
| 1 | Workout structure (`Workout.steps`) | **done** |
| 2 | Encoders (`.fit`, `.ics`) + the delivery Strategy | **done** |
| 3 | The intervals.icu target | not started |
| 4 | Watch profile (onboarding, settings, what's new) | **done** |
| 5 | Settings accordion | not started |
| — | Garmin Training API target | blocked, enquiry sent |

### Slice 4, landed

- `components/common/watch-picker.tsx`, single-select, reused verbatim by the
  onboarding step, the settings card and the what's-new prompt.
- It renders in **two** places from one component, with `chrome` deciding
  whether it draws its own heading: the watch settings card, and a what's-new
  step that sits immediately *after* the watch question. `applies` is
  recomputed every render, so the moment that step writes a real brand the
  upgrade step becomes eligible and shows next. That is the teachable moment:
  "your intervals will export as one flat block" is abstract until you have
  just said which watch you own. `usePendingStructure()` is exported alongside
  it, because the gate needs the *question* before it renders the answer and
  duplicating the rule is how the two drift apart.
- `Preferences.stepsUpgradePromptSeen` (persist **v17**) stops the popup
  returning on every load. A plain boolean, not a tri-state: there is no
  "declined" worth distinguishing, because the same offer stays permanently in
  the settings card. Both exits record it.
- The debug panel reports `watch` and can **replay the one-time prompts** by
  clearing the flags in `ONE_TIME_PROMPT_KEYS`, which lives beside the steps in
  `whats-new-gate.tsx` rather than in the panel. The panel kept its own copy
  first, and adding a fifth prompt silently left it resetting four: the worst
  kind of broken for a testing aid, because it still looks like it worked.
  `lib/one-time-prompts.test.ts` now fails if a step writes a flag the list
  does not clear. Testing a prompt that fires once otherwise means
  editing `localStorage` by hand, and these questions are asked of the
  *installed* app on a phone, where there is no console to do that in.
- `Preferences.watch` is tri-state: `undefined` never asked, `"none"` asked and
  declined. Skipping the prompt writes `"none"`, which is what stops it
  returning; leaving it unset would ask again on the next load.
- `components/common/plan-steps-upgrade.tsx` carries the whole AI round trip
  in one place: export, copy the prompt, import back by file **or** paste.
  Pasting is the commoner path, not the fallback, because most models answer in
  the chat and only produce a file if asked. `sanitizeImportJson` already
  repairs a reply wrapped in prose and a code fence.
- It appears only when there is a watch selected **and** upcoming sessions that
  genuinely want structure, and retires itself once they have it.

**A number that cannot reach zero is not a nudge, it is a complaint.** The first
version counted every upcoming workout without steps. On a real 17-week plan it
said "43 sessions have no step breakdown"; the athlete ran the whole round trip,
the AI did exactly as asked, and it still said 27 — because 25 of those were
easy, long and recovery runs, which the prompt deliberately leaves alone, since
a single effort at a single pace has no structure to write down. `needsSteps()`
now counts only `interval` and `tempo`, so that plan reads 6 before and **2**
after: the two the AI actually skipped. The two it skipped were right to skip, which took
looking at the numbers to see: `6x800m @ 4:10 (reduced - Vacation)` has
`plannedDistanceKm: 5`, and six times 800 m is 4.8 km of reps before any
warmup. The title was stale, describing the session before it was scaled down
for a holiday. So the prompt now says the stored numbers are the truth and the
title can be out of date: scale the session to fit rather than overflow the
total. The first attempt at this said the opposite, telling the model to obey
the title, which would have produced exactly the overflow the same prompt
forbids two lines earlier.

The copied prompt also **names the workouts to change**, with their id, title,
`plannedDistanceKm` and `plannedPace`. That saves the model deciding which of
sixty sessions have structure, and it is what makes the "stored numbers are the
truth" rule actionable: `6x800m` printed beside `5 km total` is the
contradiction, right there, without the model having to hunt for it.

**A live bug this slice surfaced: `common.copied` never existed.** The debug
panel shipped with a button reading the literal string "common.copied", because
`t()` takes a plain string and nothing checked it. `Dict` catches a key missing
from `nl.ts`; nothing caught a key missing from both. `lib/i18n/keys.test.ts`
now walks every `t("…")` in the source against the English dictionary, and its
second case guards the guard so an empty pass cannot mean the scanner matched
nothing. Verified it fails on a deliberately broken key before being kept.

Verified in Chrome, 20 checks plus a full round trip: export the plan, add
steps as the prompt asks, paste the reply back wrapped in prose and a fence,
and watch the invalid step get dropped at the boundary while
`plannedDistanceKm` stays put.

### Slice 2, landed

- `lib/export/ics.ts` + 16 tests. Folds at 75 **octets**, not characters, and
  never splits a UTF-8 sequence: "6×800m" is multi-byte, and a naive character
  count emits lines a strict parser rejects.
- `lib/export/fit.ts` + 18 tests, split pure (`buildFitMessages`) from
  SDK-bound (`encodeFit`, dynamic import).
- `lib/export/target.ts` + 8 tests: the `ExportTarget` Strategy and
  `availableTargets` factory.
- `downloadJSON` generalised to `downloadFile(name, data, mime)`; the three
  existing call sites are untouched.
- UI: "Add to calendar" on **both** the calendar header and the plan overview
  (no dialog: there is one thing it does), and a per-workout watch icon in
  `components/common/workout-row.tsx` opening
  `components/export/send-to-watch-dialog.tsx`.

**Targets carry a `scope`: `"workout"` or `"plan"`.** These are different jobs,
not one job with a flag. A `.fit` is a single session you take out on a run; a
calendar is the whole block laid out over months. The first build offered both
beside a single workout, and it read as a question — "which of these do I
want?" — when the answer for one session is always the file. So the workout
dialog asks `availableTargets(prefs, "workout")` and the calendar export is
offered where the whole plan is in view. Slice 3's intervals.icu target is
workout-scope, so it lands in that same dialog with no UI change.

**The calendar export is the whole plan from today onwards, never the visible
range.** Two rules, and both were checked rather than assumed. The range: twelve
sessions spread across four months, paged three months forward, exported again,
same twelve. The cut-off: `upcomingWorkouts()` in `lib/plan/workout.ts` filters
by **date, not by completion**. A calendar full of runs already done is a record
rather than a plan, and date is the predictable rule — today's session belongs
in today's calendar whether or not it is ticked off, and a completed workout
dated next week is a data entry mistake, not a reason to hide it. When nothing
is left ahead, the plan page disables the button and the calendar hides it,
rather than handing over an empty `.ics`.

**The FIT scales were established empirically, not read off a page.** Probe
files were encoded and decoded back with the SDK's own `Decoder`:
`duration_value` is **centimetres** for a distance step and **milliseconds**
for a time step; the speed band is `customTargetValueLow/High` in **m/s at
scale 1000**, and `customTargetSpeedLow` is a *decode-side subfield name* that
the encoder does not accept. A repeat is `durationType:
"repeatUntilStepsCmplt"` with `durationValue` = the index to jump back to and
`targetValue` = the count, emitted **after** the steps it repeats. Every one of
those is pinned by an encode-then-decode test, because a wrong scale produces a
file that looks perfectly fine as a number and is 100x wrong on the wrist.

Also note the band inversion: a *slower* pace is a *lower* speed, so the slow
end of the pace range becomes `low`. Backwards, a watch silently ignores it.

Verified in Chrome, 27 checks, including decoding the `.fit` **the browser
produced** with Garmin's decoder: 5 steps, 800 real metres, 3.922 m/s, repeat
6x from step 1. Bundle checked: the 1.4 MB SDK is absent from `/`, `/app`,
`/app/plan` and `/app/calendar`.

### Slice 1, landed

- `WorkoutStep` / `WorkoutBlock` / `StepRole` in `lib/types.ts`, `Workout.steps?`
- `lib/plan/workout-steps.ts` + **33 tests**: `flattenSteps`, `stepsDistanceKm`,
  `stepsDurationSec`, `isValidSteps`, `describeSteps`, `normalizeSteps`
- `normalizeSteps()` wired into `normalizeWorkouts` in `lib/plan/storage.ts`
- `components/plan/workout-steps-field.tsx`, rendered in the dialog's **plan**
  mode; logging a session leaves structure untouched
- AI output schema extended in both locales, with the rule that
  `plannedDistanceKm` is never rewritten to match the steps
- Persist `version: 16`, additive, no migrate code

**One bug worth remembering.** The editor keeps raw text in local state, so a
half-typed "1." survives a keystroke and km/mi does not round-trip through a
number on every character. But the dialog's content is **not** torn down between
opens, so the field mounted once against an empty list and then reported that
empty list for every workout opened afterwards — silently wiping saved steps on
the next edit. Fixed with `key={open}-{workout.id}` on the field. Anything else
holding derived local state inside that dialog needs the same treatment.

Verified in Chrome, 18 checks: building a 6×800m session and reading it back
from `localStorage`; a workout that already has steps opening expanded and
round-tripping; "use the step total" being the only thing that touches
`plannedDistanceKm`; and 1 mile entered in an imperial profile storing as
1.609344 km.

---

## Context

RacePilot plans a training block but the athlete re-keys every session into their
watch by hand. This adds a path from a planned workout to the wrist, plus a
profile step so the app knows which watch they own and can give brand-correct
instructions.

Five findings shape the design. They are why this is not simply "call the Garmin
API":

1. **Garmin Connect will not accept a workout file.** Not FIT, not TCX. Its
   upload endpoint is for completed *activities* only. Exactly two routes exist:
   the **Training API** (partner programme) or **copying a `.fit` file to
   `GARMIN/NEWFILES/` over USB**. TrainingPeaks and 80/20 Endurance both document
   the USB route as their fallback, so we are in good company — but it is
   desktop-only and the UI must say so plainly.
2. **The Training API is not available to us yet.** The Program FAQ says the
   programme is "only for business use". An enquiry has been sent via
   `garmin.com/en-US/forms/developercontactus/` asking whether it is currently
   open; the answer is pending. **Nothing in slices 1–3 may depend on it.**
3. **`.fit` is the universal format.** Garmin, COROS and Wahoo read it, Apple
   Watch owners can import it via a helper app such as WatchFit, and
   intervals.icu accepts it base64-encoded. One encoder serves every target. The
   watch profile changes only the *instructions*, never the bytes. Polar and
   Suunto accept no third-party workout import at all, which is what `.ics` is
   for.
4. **The data model has no structure.** `Workout` is one `plannedDistanceKm`, one
   `plannedPace` and a prose `title`. `"6×800m @ 4:10"` is a *string*; nothing
   parses it. Exporting that as-is would put a single 20-minute block at an
   average pace on someone's watch on their hardest day. Slice 1 fixes this, and
   is worth doing for the app regardless of export.
5. **The `@garmin/fitsdk` licence is proprietary** and forbids redistributing the
   SDK to third parties. Settled: declaring an npm dependency is not
   redistribution, and the Docker image bundling `node_modules` is **private** —
   verified by a second Docker Hub account getting "Not Authorized" on
   `milovdpas8/racepilot`, which is what a private repo does and a public one
   never does. No third party can obtain the SDK through this project. Use the
   SDK; revisit only if that image is ever made public.

**The architectural decision that follows from (2):** delivery is the part that
will change, so it goes behind a **Strategy** with a factory. Encoding a workout
into FIT bytes is stable; *where those bytes go* is not. Ship the file target
now, add the intervals.icu target as a real sync path today, and drop in a Garmin
target if and when access is granted — with no change to any caller.

---

## Slice 1 — Workout structure

The prerequisite. Everything else is thin once this exists.

### Model — `lib/types.ts`

Additive and optional, following the house rule that absent is the correct
default and nothing is backfilled.

```ts
/** One step of a structured workout. Duration is distance OR time, never both. */
export interface WorkoutStep {
  role: "warmup" | "work" | "recovery" | "cooldown";
  distanceKm?: number;
  durationSec?: number;
  /** Target pace, "mm:ss" per km — the same canonical unit as everywhere else. */
  pace?: string;
  /** ± seconds per km around `pace`. Absent means a single target, not a band. */
  paceRangeSec?: number;
  note?: string;
}

/** One level of nesting only: 6 × (800m hard + 400m jog). FIT expresses exactly
 *  this via repeat_steps, and deeper nesting has no editor worth building. */
export type WorkoutBlock =
  | ({ kind: "step" } & WorkoutStep)
  | { kind: "repeat"; times: number; steps: WorkoutStep[] };
```

On `Workout`:

```ts
/** Structured steps. Absent = a flat workout, which is every plan authored
 *  before this. `plannedDistanceKm` stays the authoritative total — see below. */
steps?: WorkoutBlock[];
```

**`plannedDistanceKm` remains the source of truth for totals.** Every consumer
already reads it — weekly volume, stats, charts, long-run progression. Steps are
additive detail, not a replacement, and a time-based step has no distance to
derive from anyway. The editor offers a "use the sum" action and flags a material
disagreement; it never silently overwrites.

### New pure module — `lib/plan/workout-steps.ts` + `.test.ts`

- `stepsDistanceKm(blocks)` — sum, expanding repeats, ignoring time-only steps
- `stepsDurationSec(blocks, pace)` — estimate, for the ICS event length
- `flattenSteps(blocks)` — repeats expanded, the shape every encoder wants
- `describeSteps(blocks, fmt)` — the human line ("2 km warmup · 6 × 800 m @ 4:10
  · 2 km cooldown"), reused by the ICS description and the UI summary
- `isValidSteps(blocks)` — exactly one of distance/duration per step

Pure, no React, no DOM. Reuse `paceToSeconds` / `secondsToPace` from
`lib/pace.ts` rather than reimplementing pace maths.

### Editor — `components/plan/workout-form-dialog.tsx`

A collapsible "Structure (optional)" section: add step, add repeat block,
reorder, delete. Keep the dialog's three-row grid so the footer stays pinned —
the visual-viewport fix already there must not regress.

### AI schema — `lib/i18n/locales/en.ts` and `nl.ts`

Extend the plan-request prompt so generated plans can emit `steps`. **Skipping
this makes the slice inert**: the AI is how plans actually get authored, so
structure the prompt cannot produce will stay empty forever. Also coerce `steps`
in `normalizePlan` (`lib/plan/storage.ts`), the import boundary that already
defends against unknown enum values.

### Persist

Bump `version: 15` → `16` in `store/use-training-store.ts` with a `// v16:
additive — Workout.steps …` comment. **No migrate code**: absent is correct.

---

## Slice 2 — Encoders and the delivery Strategy

### Encoders (pure, testable, target-agnostic)

`lib/export/ics.ts` + `.test.ts` — pure string generation, no dependency. One
`VEVENT` per workout: `DTSTART` from the date (all-day, or timed when
`startTime` is set), `SUMMARY` of title + distance, `DESCRIPTION` from
`describeSteps` plus notes. Must escape `,` `;` `\` and newlines and fold lines
at 75 octets — the two things naive ICS writers get wrong, both easy to pin.

What it is and is not, so the copy stays honest: a calendar entry is a **label
with a date**, not a workout the watch can guide you through. What it buys is
that the label reaches the wrist with no cable and no computer — Garmin has a
built-in calendar glance, and Apple Watch and Wear OS show events natively — and
that it is the only route available to Polar and Suunto owners, or to anyone
whose only device is a phone. Verified for Garmin; not verified for Polar and
Suunto, so do not claim it for them in the UI.

`lib/export/fit.ts` + `.test.ts` — split the way `lib/scanner/` is split:

- `buildFitMessages(workout, plan)` — **pure**, returns `{ mesgNum, fields }[]`.
  Unit-testable with no SDK and no DOM, which is where the real logic lives.
- `encodeFit(messages)` — thin, **dynamically imports** `@garmin/fitsdk` exactly
  as `lib/scanner/ocr.ts` does with `tesseract.js`, so it never enters the main
  bundle.

Following Garmin's official "Encoding FIT Workout Files" recipe: `file_id`
(`type: "workout"`), `workout` (`wktName`, `sport` from `workoutSport(w, plan)`,
`numValidSteps`), one `workout_step` per flattened step (`durationType`
distance/time, `targetType: "speed"` with `customTargetSpeedLow/High` in **m/s**
— `1000 / secPerKm`, a new helper; `lib/sport.ts:81` already does the km/h form),
and repeats via a `repeat_steps` step pointing at the first step index.

### The Strategy — `lib/export/target.ts`

```ts
export type ExportTargetId = "file" | "intervals" | "garmin";

export type TargetStatus =
  | { state: "ready" }
  | { state: "needs-setup"; reason: "no-api-key" | "not-connected" }
  | { state: "unavailable"; reason: "not-configured" | "no-access" };

export interface ExportTarget {
  id: ExportTargetId;
  /** Can this run right now? Server config, tokens, keys. */
  status(): Promise<TargetStatus>;
  /** What the athlete must still do by hand once we hand off. */
  followUp: "usb" | "app-import" | "calendar" | "none";
  deliver(workouts: Workout[], plan: TrainingPlan): Promise<DeliveryResult>;
}

/** Factory. Returns only the targets this deployment and user can actually use. */
export function availableTargets(prefs: Preferences): Promise<ExportTarget[]>;
export function targetFor(id: ExportTargetId): ExportTarget;
```

Each target owns **both** its format and its delivery, which avoids a
format × transport matrix. The UI asks the factory what is available and renders
that; it never branches on target ids.

### `targets/file.ts` — the one that ships first

Downloads `.fit` and/or `.ics`. `followUp` comes from the watch profile.
Always `status: ready`; no account, no network, works offline.

### Generalise the downloader — `lib/plan/storage.ts`

`downloadJSON(filename, contents)` hardcodes `type: "application/json"`. Widen to
`downloadFile(filename, data: BlobPart, mime: string)` and keep `downloadJSON` as
a one-line wrapper so the three call sites
(`components/settings/data-card.tsx`, `components/wizard/steps/step-ai.tsx`,
`components/common/moved-dialog.tsx`) are untouched.

### UI — two placements, because these are two different jobs

**Neither lives in Settings.** Each belongs where the thing it acts on already
is, which is also where someone would look for it.

1. **Calendar export → the calendar.** A download action in
   `components/calendar/calendar-header.tsx`, beside the existing Today / prev /
   next controls (it already lays out as `flex ... justify-between`, so the
   button drops into the right-hand group). Exports the plan as `.ics`, framed as
   "add my training to my calendar" — a scheduling aid, and honest that it is a
   calendar entry rather than a workout the watch can guide you through. It is
   also what makes the feature usable at all from a phone, and the only thing
   Polar and Suunto owners can use.
2. **Watch export → the workout.** A "Send to watch" action per workout, opening
   the target dialog with brand-correct instructions. Two entry points:
   `components/plan/workout-form-dialog.tsx` and an optional third icon button in
   `components/common/workout-row.tsx` beside the existing `onToggle` / `onEdit`
   (same `aria-label`-on-icon-button pattern), so it is reachable without opening
   the dialog.

**Shown only when it can work.** The action renders when
`availableTargets(prefs)` returns something usable for that workout, so a Polar
owner never sees a "send to watch" button that leads to a dead end. That check is
the factory's job, not the component's.

---

## Slice 3 — The intervals.icu target (real sync, today)

Why this earns its place: intervals.icu is free, has an official Garmin Connect
link that pushes planned workouts to the watch, and its API takes **the same FIT
bytes Slice 2 already produces**. It is genuine account-to-watch sync without
Garmin approval.

- `POST /api/v1/athlete/{id}/events`
- Header `Authorization: ApiKey API_KEY:<key>`
- Body: `category: "WORKOUT"`, `start_date_local`, `name`, `description`, and
  `filename` + **`file_contents_base64`** — where our `.fit` goes

**Server proxy, not a browser call**: `app/api/intervals/route.ts`, mirroring
`app/api/drive/*` (`runtime = "nodejs"`, `dynamic = "force-dynamic"`, an
`isConfigured()` guard, `cache: "no-store"`, errors mapped by name). The browser
must not call intervals.icu directly — CORS, and it keeps the key off the
request log of a third-party origin.

**Key storage**: the athlete's personal API key in `Preferences`, like every
other setting, and forwarded per request by the proxy. It is *their* key for
*their* account, which is consistent with the app's promise — but say so in the
UI rather than leaving it implicit.

**Be honest about the chain.** RacePilot → intervals.icu → Garmin Connect →
watch is three hops, and when it breaks the athlete cannot tell which one failed.
The setup card must state the prerequisites plainly: an intervals.icu account,
Garmin linked *there*, and "Upload planned workouts" ticked in their settings.

Deliberately **personal API key, not OAuth**, for v1. intervals.icu supports
OAuth 2.0 with scopes and that would be nicer UX, but it needs a registered app
and the existing `lib/server/google-oauth.ts` template is a better use of that
effort when the Garmin target arrives.

---

## Slice 4 — Watch profile

### Preference — `lib/types.ts`

```ts
/** Which watch the athlete owns, so export instructions match their device.
 *  Tri-state on purpose: `undefined` = never asked (existing users get the
 *  one-time prompt), `"none"` = asked and declined, never ask again. */
watch?: WatchBrand;
```

`export type WatchBrand = "garmin" | "coros" | "wahoo" | "apple" | "polar" |
"suunto" | "other" | "none";`

The `undefined` vs `"none"` distinction is the mechanism `athleteTypes` uses, and
is why no companion `watchOnboardingSeen` boolean is needed. Rolls into v16.

### Shared picker — `components/common/watch-picker.tsx`

Controlled `{ value, onChange }`, modelled on
`components/common/athlete-type-picker.tsx` but **single-select**, so a
`grid grid-cols-2` of `aria-pressed` buttons. Reused verbatim by all three
consumers, which is the established pattern in this codebase.

### Three consumers

1. **Onboarding** — `components/onboarding/step-watch.tsx`, inserted into the
   `STEPS` tuple in `onboarding-flow.tsx` after `profile`: flow-level state, one
   render line, and the answer added to the single `setPreferences` call in
   `finish()`. Needs `welcome.watchTitle` / `welcome.watchSubtitle` in both
   locales — the shell derives them by convention.
2. **Settings** — `components/settings/watch-card.tsx`. Identity, not an opt-in
   feature, so beside `AthleteCard` in `settings-view.tsx`, not inside
   `FeaturesCard`.
3. **Existing users** — one `Step` in `components/common/whats-new-gate.tsx` with
   `applies: ready && watch === undefined`.

### How to deliver: sync or a file

A second preference beside the brand, because owning a Garmin does not say
whether you want to plug it in every week or have sessions appear on it.

```ts
/** Sync where possible, or always hand over a file. `undefined` = never
 *  chosen, which offers both, the same rule the other tri-states follow. */
watchDelivery?: "sync" | "file";
```

The resolution rules, all inside `availableTargets` so no view has to know
them:

| Preference | Sync status | What is offered |
|---|---|---|
| `"file"` | anything | the file only |
| `"sync"` | `ready` | sync only, since that is what they asked for |
| `"sync"` | `needs-setup` | **sync with a connect prompt, plus the file** |
| `undefined` | `ready` | both |
| any | `unavailable` | the file only |

The third row is the one that matters and the reason `TargetStatus` already
distinguishes `needs-setup` from `unavailable`. Someone who chose sync and has
not connected their account must not be left with no way to train this week:
they get the prompt *and* the fallback, so the preference never becomes a dead
end. Silently downloading a file instead would be worse — it hides that their
choice is not in effect.

**The choice only appears once a sync target exists.** Until Slice 3 lands, and
on any deployment where the proxy is not configured, `status()` returns
`unavailable` and the setting is hidden entirely, exactly as the weather and
Drive cards hide themselves. Offering a preference between one option and
nothing is noise.

This also means Slice 3 and Slice 4 can land in either order: build the profile
first and the delivery choice simply stays hidden until there is something to
choose between.

### Per-brand follow-up

| Brand | Target | What the athlete does |
|---|---|---|
| Garmin | file `.fit`, or intervals | USB → `GARMIN/NEWFILES/`. Say plainly Garmin Connect cannot import it. |
| COROS / Wahoo | file `.fit` | Import via Training Hub / the app |
| Apple | file `.fit` + `.ics` | Helper app, or just the calendar |
| Polar / Suunto | file `.ics` | No workout import exists; calendar only |
| other / none | file `.ics` | Calendar only |

---

## Slice 5 — Settings, de-cluttered

Settings is 12 cards in one column and this adds two more. Convert
`components/settings/settings-view.tsx` to an **accordion** of four groups —
Plan, Training, Features, App — with only the first expanded. Use the existing
Base UI primitives (`render` prop, not `asChild`) and persist the open section in
`preferences.settingsSection`. Cards move unchanged; this is grouping, not a
rewrite.

---

## Deferred

**The Garmin target** — `lib/export/targets/garmin.ts`, a third `ExportTarget`
with no change to any caller. Blocked on the Training API enquiry. If granted,
`lib/server/google-oauth.ts`, `lib/server/session.ts` and `lib/drive/client.ts`
are a directly copyable template (token refresh, `RefreshError` → 401,
`isOauthConfigured()` guard, serialized client calls to avoid racing the
session-cookie write). Garmin tokens become fields on the existing `SessionData`
cookie — mind the 4 KB budget, which the existing "no id_token (keeps it small)"
comment shows has already been felt.

---

## Verification

1. `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` green.
   `nl.ts` typed `: Dict` makes every missing translation a compile error.
2. **Unit tests** on the pure modules: `workout-steps.ts` (repeat expansion,
   mixed distance/time, the description string), `ics.ts` (escaping, folding,
   all-day vs timed), `fit.ts` (`buildFitMessages` for a flat workout, an
   interval workout with a repeat, and a bike workout), `target.ts` (the factory
   returns only usable targets).
3. **A real FIT file on a real watch.** The only test that counts: export an
   interval session, copy it to `GARMIN/NEWFILES/`, confirm the watch lists it
   under Training → Workouts with the right steps and targets. Nothing in CI
   substitutes for this.
4. **A real ICS file** in Google Calendar and Apple Calendar.
5. **A real intervals.icu round trip** — post a workout, confirm it appears on
   their calendar, and confirm it reaches Garmin if the athlete has that link on.
6. **Browser smoke** (`playwright-core` + system Chrome, `channel: "chrome"`):
   onboarding reaches the new step and persists the answer; the settings card
   round-trips; someone who declines is never re-asked; the calendar header's
   export downloads a well-formed `.ics`; the per-workout action shows Garmin
   instructions for a Garmin owner and is **absent** for a Polar owner rather
   than leading to a dead end; the intervals target reports `needs-setup`
   without a key.
7. **Bundle check** — confirm `@garmin/fitsdk` is absent from the initial
   payload, using the measurement harness from the marketing-page work: load
   `/app`, sum JS transferred before `load`, diff against the current number.
8. Persist: load a v15 blob, confirm it reads clean at v16 with no workout
   touched.

---

## Upgrading plans that already exist

Every plan authored before Slice 1 has flat workouts whose structure lives only
in the title: `"6×800m @ 4:10"` is a string. Those athletes get the least out of
a watch export precisely on the days it would help most.

**The route is the AI round-trip the app already has.** Rather than building a
title parser — which would have to guess at every way a human writes an interval
session, and be wrong often enough to matter — export the plan JSON, hand it to
an AI with a prompt that asks it to fill in `steps` from each title, and import
the result. The app already exports a request bundle
(`components/wizard/steps/step-ai.tsx`) and already repairs AI-pasted JSON
(`sanitizeImportJson` in `lib/plan/storage.ts`), so both ends exist.

What to build, in Slice 4:

- A copy-to-clipboard **upgrade prompt** next to the export, using the existing
  `useCopyToClipboard` hook. The prompt states the `steps` schema and tells the
  model to leave `plannedDistanceKm` alone and to add `steps` only where the
  title actually describes structure.
- **The moment to say it is right after they pick a watch**, in the what's-new
  step and again in the watch settings card: that is when "your existing plan
  will export as one flat block" becomes concrete and the fix is worth the two
  minutes. The step mentions it and links there. It does **not** put the prompt
  in the popup: a wall of copyable text in a dialog someone is trying to dismiss
  is the wrong place for it.
- Only worth showing to someone who actually has flat workouts. Gate it on the
  active plan containing a workout with no `steps`, so an athlete whose plan is
  already structured is not told to go and fix it.
- `normalizeSteps()` is what makes this safe to accept — a model that invents a
  step ending on both a distance and a time has that step dropped at the import
  boundary rather than handed to an encoder.

This also means the feature does not need every plan re-authored to be useful,
which is the difference between shipping it and shipping it to nobody.
