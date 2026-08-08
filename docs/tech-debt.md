# Known tech debt

Refactors worth doing that haven't been done, with enough context to pick up
cold. Feature work lives in [`roadmap.md`](roadmap.md); this file is only about
the shape of the code. Delete an item when it's done.

Most of what was listed here in August 2026 has since been cleared — see
"Recently cleared" at the bottom for what changed and why, so the same ground
isn't re-covered.

---

## 1. No component-level test coverage

**Status:** partially addressed. `npm test` runs vitest over `lib/**` and
`store/**` — 125 tests covering the import-merge logic, the Drive sync
decisions and auto-push, calendar layout/range, the workout predicates, the
plan-request wire format, the pace resolver, the OCR repair rules, the OAuth
refresh path and the redirect guard.

**What's still uncovered:** anything rendered. There are no component tests,
because they'd need i18n + Zustand + Base UI portals stood up, which costs more
than the suite would be worth at this size. The browser smoke recipe in
[`architecture.md`](architecture.md) and `scripts/screenshots.mjs` are the
stand-ins: both drive the real app and fail loudly if a page renders empty.

If a UI regression ever does slip through twice in the same place, that's the
signal to add jsdom + Testing Library for that one component — not before.

**Also uncovered:** `findPaceColumn` / `parseSplitsFromWords` in
`lib/scanner/split-scanner.ts`. Their inputs are OCR word-boxes, so a
meaningful test needs a fixture captured from a real screenshot. The two
helpers that encode the fiddly repair rules — `parsePartialKm` and
`resolveElevations` — take plain values and are covered.

`lib/scanner/summary-scanner.ts` shows what the fixture approach would buy:
`parseSummary` takes word boxes directly, and its test builds a to-scale model
of a real Strava layout by hand. That was cheap to write because the summary
grid is a dozen words. The splits table is not, which is why the same trick
hasn't been applied to it yet.

---

## 2. `lib/scanner/split-scanner.ts` is still a grab bag

**Status:** surface trimmed, and the *plumbing* has since been lifted out;
the parsing is still one module.

`lib/scanner/ocr.ts` now owns canvas preprocessing, the tesseract worker and
the shared word/geometry helpers, because the summary scanner needed the same
image and the same worker. What is left in split-scanner.ts is column
detection, split parsing and elevation resolution: the tuned part, moved
nothing. That extraction was verified the same way as the last one, by running
the 15 real screenshots through the scan UI before and after: **137 splits,
unchanged**.

**Earlier:** nine exports down to four — `scanSplitsFrom` / `ScanResult`, plus
`parsePartialKm` / `resolveElevations` kept public deliberately because they're
tested. Verified the same way: 137 splits, byte-identical.

**Why the remaining split is still skipped:** it works, every part is about one
screenshot, and it was tuned against real Strava output over many iterations.
Splitting it risks re-introducing OCR bugs that were expensive to find, for no
user-visible gain. Do it alongside item 1's word-box fixtures, so the behaviour
is pinned before it moves. The screenshots to generate those fixtures from live
outside the repo (gitignored `split-screenshots/`, and `pace-screenshots/` for
the summary side).

---

## 3. Miscellaneous

- **The route handlers themselves** are still untested end to end; only the
  logic behind them (`lib/server/google-oauth.ts`, `lib/server/api.ts`) is.
  Covering the handlers means stubbing `next/headers`, which is more
  scaffolding than their thin bodies justify today.
- **A live Drive round trip** is never exercised. The sync store is tested
  against a mocked client, which pins every decision but not the wire format.
  Doing better needs a real Google account and consent flow in CI — not worth
  it for a personal app; a manual connect-and-sync after touching
  `lib/google-drive.ts` covers it.

---

### Form labels are associated (fixed)

`components/common/field.tsx` used to render a bare `<Label>` beside its
children, so nothing tied the two together: screen readers announced an
unlabelled textbox, and `getByLabelText` found nothing (which is why two
browser tests had to select controls structurally). It now gives a single
control an id and a matching `htmlFor`, and wraps anything else in a
`role="group"` with `aria-labelledby`.

The distinction that matters: a *single child* is not automatically a
labelable control. The sport picker's child is a `<div>` of buttons, and
`htmlFor` pointing at a div associates nothing — silently. `Field` decides by
element type, treating host elements as wrappers and components as controls.

## 4. Scheduled deletion: the "we have moved" notice (December 2026)

The only code in the repo written to be thrown away. It exists to walk people
off the retired Vercel deployment and onto `racepilot.milovanderpas.nl`, and it
stops being useful the moment that deployment is gone.

**Delete when the Vercel project is retired** (planned December 2026, kept alive
until then because people are still using it). Not before: it is the only thing
telling those users their data is somewhere they are about to lose access to.

Everything to remove, so this can be done in one pass:

- `lib/legacy-host.ts` and `lib/legacy-host.test.ts` — delete both.
- `components/common/moved-notice.tsx` — delete.
- `app/layout.tsx` — drop the `<MovedNotice />` mount and its import.
- `components/common/whats-new-gate.tsx` — the `ready` predicate ends
  `&& !isLegacyHost()`, which stops announcements stacking over the notice.
  Drop that clause; it is the only other caller.
- `lib/i18n/locales/en.ts` and `nl.ts` — the whole `moved:` section, from both.
  `Dict` will flag it if only one side is removed.
- `README.md` — the paragraph under deployment about the retired host.

Nothing persisted is involved, so **no store version bump**: dismissal is
component state deliberately, so that the nag survives a reload. Removal is
pure subtraction with no migration.

One thing worth preserving if the situation ever recurs: the host check is an
allowlist of the old project's hostnames, *not* "any host that isn't the
canonical one". The app is self-hostable, and the exclusion form would show
every self-hoster a popup urging them to abandon their own install for a domain
they do not control. It is an easy inversion to reach for, and it is wrong.

---

## 5. Won't fix (recorded so it isn't re-litigated)

**`lib/google-drive.ts` and `lib/server/drive.ts` export the same four names**
(`findFile`/`downloadFile`/`createFile`/`updateFile`) with different signatures.
Looks like a trap, isn't one in practice: nothing imports both, they run in
different runtimes (`store/use-sync-store.ts` takes the client pair,
`app/api/drive/*` the server pair), and renaming is churn on the one subsystem
where a mistake loses user data.

**`lib/weather-sync.ts` imports the Zustand stores directly**, which inverts the
dependency direction the rest of `lib/` respects. It is explicitly the glue
layer between UI actions and the weather client. Purifying it means threading
store state through five call sites to make one file tidier. Net negative.

**`shadcn` sits in `dependencies`, not `devDependencies`.** It looks like a
misplaced CLI, but `app/globals.css` does `@import "shadcn/tailwind.css"`, so it
is needed at build time. Moving it risks a broken deploy under any install that
skips dev dependencies, and gains nothing.

---

## Recently cleared

Kept short, as a record of decisions rather than a changelog.

- **The pace/duration/distance triangle** was duplicated four ways across the
  two log dialogs — display and save could drift, which is how a run gets saved
  at a pace the user never saw. Now one `resolveLoggedRun()` in `lib/pace.ts`
  drives both, with tests pinning the edge cases (0 km derives nothing; a
  free-form pace survives a failed derivation).
- **The store's import-merge logic** moved to `lib/plan-merge.ts` and is tested.
  It's what stops an AI-generated re-import from destroying logged training,
  and there is no backend to restore from.
- **`newId` ×4, `Field` ×4, `num` ×2, `backyardDistanceKm` ×4** collapsed into
  `lib/id.ts`, `components/common/field.tsx`, `lib/pace.ts` and
  `lib/backyard.ts`. `components/ui/textarea.tsx` filled a real primitive gap.
- **Clipboard copy ×4** became `hooks/use-copy-to-clipboard.ts`. That was a
  latent bug, not just duplication: every copy did a bare
  `await navigator.clipboard.writeText(…)`, so a permission denial was an
  unhandled rejection with no feedback, and each leaked a `setTimeout` past
  unmount.
- **`add-plan-wizard.tsx` (733 → 133)** split into four step components plus
  `lib/plan-request.ts` for the versioned wire format, which is now tested.
- **`settings-view.tsx` (529 → 69)** split into per-section cards, finishing the
  pattern `cloud-sync-card` / `weather-card` / `split-scanner-card` had started.
- **The backyard rules** were smeared across `lib/types.ts` (constant) and
  `lib/plan-context.ts` (predicates); they now live in `lib/backyard.ts`.
  `lib/types.ts` is the domain model and shouldn't carry behaviour.
- **`components/common/onboarding-gate.tsx`** hand-rolled a phase machine over
  four near-identical dialogs. Now a declarative `steps` array plus a shared
  `<OnboardingStep>`: each step states when it *applies* and the gate renders
  the first applicable one from a cursor. That makes the "returning users only
  see genuinely new prompts" rule something you can read, rather than something
  that falls out of `phase !== "splits" && phase !== "plan"`.
- **The Drive newest-wins decision** moved to `lib/sync-decision.ts` and is
  tested. Extracting it surfaced a data-loss path: `exportData()` returns `""`
  when there are no plans, and the push branch of `reconcile()` had no plan
  guard (both sibling branches did). Deleting the last plan stamps a fresh
  `lastModified` and re-seeds *asynchronously*, so a reconcile in that window —
  a tab refocus is enough — uploaded an empty file over the user's synced
  training. It now adopts the remote file id instead of pushing nothing.
- **An open redirect on the OAuth callback.** The `returnTo` guard checked
  `startsWith("/") && !startsWith("//")`, which `/\evil.com` passes — but the
  URL parser reads the backslash as a slash, so `new URL()` resolved it to
  `https://evil.com/`. A user who had just completed a real Google login was
  handed to the attacker's domain. Replaced with a resolve-then-compare-origin
  check in `lib/server/api.ts` (shared by both routes, which each had their own
  copy), covered by 11 vectors.
