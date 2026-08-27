# Importing a training history

How RacePilot learns what the athlete has actually been doing, so the plan AI
has evidence instead of a handful of typed rows.

## Status

| Slice | What | Status |
|---|---|---|
| 0 | `.gitignore` for account exports | **done** |
| 1 | `lib/activity/` parser and derived picture | **done** |
| 1b | Read `activities.csv` straight out of the export zip | **done** |
| 2 | `activities` store slice, persist v19 | **done** |
| 3 | Wizard training step + `trainingHistory` in the AI request | **done** |
| 4 | Settings card under About you | **done** |
| - | GPX per-km splits, log-workout matching | not started |
| - | `.fit` / `.tcx` / Garmin Connect exports | not started |

---

## Why an export and not the Strava API

The API was the obvious route and is not viable for this app:

- **Cost.** Since June 2026, Standard-tier API access requires the developer to
  hold an active Strava subscription (~$11.99/mo). Extended Access waives it but
  is aimed at partner-scale apps.
- **Reach.** A new app is capped at **1** connected athlete, self-service
  upgrade takes it to **10**, and going beyond that needs app review. RacePilot's
  eleventh user could not connect.
- **Terms.** The November 2024 API Agreement restricts using API data in AI
  applications. A developer asked Strava directly whether inference-only use for
  a personalised plan is permitted and the thread went unanswered for months.

A **data export** has none of those problems. Any athlete can request one from
Strava's website, it costs nothing, there is no key, no cap, no account linking
and no terms question, and it works for someone whose data lives anywhere else.

## What an export actually contains

Verified against a real one (103 activities, 54 MB unpacked):

- `activities.csv`, 32 KB, 103 columns. Carries date, type, name, distance,
  moving time, elapsed time, average speed and elevation gain. **This is the
  only file read**, out of a 21 MB zip.
- `activities/*.gpx`, 100 files at ~176 KB. Full GPS traces. Not read.
- Roughly forty other CSVs: `logins`, `contacts`, `followers`, `profile`,
  `reactions`, plus `messaging.json` and a `media/` folder.

Two things the file forces, both non-obvious:

- **Duplicate column names.** `Distance` appears twice, once rounded in the
  athlete's display unit and once in metres; so do `Elapsed Time` and
  `Max Heart Rate`. A name lookup silently takes the first, which for an
  imperial athlete is **miles** and would shrink every session by 40%.
  `metresFrom()` disambiguates by physics instead of position: the true distance
  satisfies `distance ≈ avgSpeed × movingSec`.
- **Locale-formatted dates.** `Activity Date` reads `"Aug 23, 2026, 9:17:44 AM"`
  in the account's language, and `Start Time` is empty in every row, so there is
  no ISO date to fall back on. `parseActivityDate` tries `Date.parse` then a
  month table covering English and Dutch. Unparseable rows are skipped and
  counted, never guessed at.

Heart rate and cadence were empty in all 101 rows of the real export, so nothing
depends on them, though the parser keeps them when present.

## Telling people how to get one

The import is useless to anyone who has not done this before, and the fact
people get stuck on is that **the export exists only on the Strava website**:
the mobile app cannot produce one at all, which is confirmed by Strava's own
support documentation. `ActivityImportField` says so before the steps rather
than after them, since that is what someone hunting through the app needs to
read first.

The three steps are: open `strava.com/account` (linked), find "Download your
account" and request the archive, then come back with the zip Strava emails a
few minutes later.

Collapsed to a heading once a history exists. By then the athlete has plainly
managed it, and five permanent lines of instructions is the clutter the settings
accordion was added to remove. One tap away, not gone.

## Taking the zip directly

The archive is accepted as downloaded; a loose `activities.csv` still works, and
which one it is gets decided by sniffing the first four bytes rather than by the
extension. Asking someone to unzip 21 MB and go find one file inside is where
most people stop, and on a phone it is worse than tedious.

`lib/activity/zip.ts` reads **one named entry**, not the archive:

1. Scan the last 64 KB backwards for the end-of-central-directory record.
   Backwards because `PK` is four ordinary bytes that can occur inside
   file data, and the real record is the last one. There is a test with a decoy.
2. Read the central directory and find `activities.csv` by basename, so it works
   whether or not the archive has a top-level folder.
3. Inflate that entry alone with `DecompressionStream("deflate-raw")`.

Three consequences worth keeping:

- **No dependency.** `deflate-raw` is native in every browser this app targets,
  so the whole format handling is a few header offsets. `fflate` would have been
  the alternative at ~8 KB and rather more capability than wanted.
- **Nothing is loaded whole.** Every read is a `Blob.slice()` range: the tail,
  the directory, the one entry. A 21 MB archive costs about 53 ms in the browser
  and never sits in memory.
- **The traces are never inflated.** A general unpacker would decompress 100 GPX
  files to reach one CSV. This one cannot, because nothing ever matches them.

Sizes come from the **central directory**, never the local header: an entry
written with a data descriptor carries zeroes there, which would yield an empty
file and look like an empty export rather than an error.

Zip64 and encrypted entries are refused by name (`UnreadableZipError`) rather
than half-handled, and the UI answers with "unzip it yourself and pick
activities.csv". An archive needing Zip64 has over 65535 entries or is over
4 GB, which no realistic Strava export is.

A **damaged** archive has to arrive the same way. Every read is bounds-checked
against what the archive actually holds (the entry name against the central
directory, the local header and the entry data against the blob) and a corrupt
deflate stream is caught, so all of them surface as
`UnreadableZipError("malformed")`. Unchecked, they escaped as a raw `RangeError`
or `TypeError`, and the import field can only turn those into the generic
"import failed" instead of the guidance the error class exists to trigger.

## The privacy property

`activities.csv` has **no coordinate column of any kind**: not lat, lon, address
or start location. Reading it and nothing else means GPS data never enters the
app, which is a guarantee by construction rather than by careful handling.

Three things hold it in place:

- `ActivitySummary` in `lib/types.ts` is a narrow shape, and
  `normalizeActivities` in `lib/plan/storage.ts` rebuilds each row field by
  field at the import boundary, so unknown keys are dropped rather than carried.
- `lib/activity/strava-csv.test.ts` asserts the parser's output matches neither
  `/lat/i` nor `/lon/i`, the same belt-and-braces check
  `scripts/scrub-example-plan.mjs` applies before writing.
- The zip reader is targeted, so `activities/*.gpx` is never inflated even when
  the athlete hands over the whole archive.
- `.gitignore` covers `export-strava/` and `strava_export_*/`. An unpacked
  archive in the working tree of a **public** repo is 162 files of traces,
  logins and messages one `git add -A` away from being published.

`scripts/scrub-example-plan.mjs` also strips `activities` now, because an export
carries them and a demo plan shipped from a public repo must not contain a real
person's training.

## What reaches the AI

Not the 101 rows. `trainingPicture()` reduces the last 16 weeks to weeks
covered, sessions per week, average and peak weekly volume, longest session, a
per-sport median pace, and the last 8 weekly totals including the zeros, since a
week off is information and dropping it would flatten an injury gap into a
straight line.

Plus **the last 10 sessions in full**. The aggregates say what the block looked
like; these say what a week actually contains - that the 20 km was a Saturday
long run and the 9 km was intervals, rather than eight identical outings
averaging 12 km. Ten reaches back about five weeks at a typical frequency.

They live in the picture rather than in the wizard's `latestRuns` list, which
stays at five. That list is a hand-editable form and ten rows of inputs is a
screen and a half of scrolling on a phone; here they cost a few hundred bytes
and no pixels. About 900 bytes in total for a real 2.5 year history.

The plan prompt in both locales documents the field, says it is stronger
evidence than `latestRuns`, and tells the model to open the plan near
`avgWeeklyKm` rather than above it. A field the request carries but the prompt
never mentions is a field the model has no reason to read.

It returns `null` rather than a picture of zeroes when there is nothing in the
window: "no data" and "trained nothing" are different claims and only one of
them is ours to make. `buildPlanRequest` omits `trainingHistory` entirely in
that case, so nothing changes for anyone who never imports.

## Both AI flows read it

The **new plan** wizard sends the derived picture as `trainingHistory`.

The **edit an existing plan** flow in Settings sends the raw `activities` list,
because its payload is the whole export bundle. That was dead weight until the
edit prompt named the field: `exportData()` has carried activities since they
were added (a backup that loses them is not a backup), but a field the prompt
never mentions is a field the model has no reason to read, so 14.8 KB of a
57 KB paste was doing nothing.

Both prompts now describe it, and the edit prompt adds one rule the create one
does not need: **return the list unchanged**. It is a record of the past, not
part of the plan. `importData` merges on id rather than replacing, so a model
that drops it does no harm either.

This is what earns the Settings card its place. Without it the import only ever
affected plan creation, and a second import surface that changed nothing would
be exactly the redundancy it looked like.

## Where it appears

- **Create plan, step 3.** States what is stored: "The AI will use your
  imported training history: 101 activities, Feb 2024 to Aug 2026."

  It does **not** fill the `latestRuns` rows, which it used to. Two reasons.
  Those rows duplicated `trainingHistory.recentSessions`, putting the same
  sessions in the request twice. And filling them only happened when the import
  was done *here*, so an athlete who imported in Settings reached this step,
  saw an empty list, and reasonably concluded nothing had carried over - when
  in fact the request already had the full picture. The line above is shown for
  both routes, so they now look the same because they are the same.

  `latestRuns` stays as the hand-typed path for anyone who has not imported.
- **Settings, About you.** `TrainingHistoryCard`, showing the count and range.

Its button says **Add activities**, never "Import". The Data card in the App
section already has an Import that restores a plan JSON backup, and two buttons
reading the same word while doing very different things is how somebody loses a
plan.

## Adding another source

`parseStravaCsv` returns `ActivitySummary[]` and nothing above it knows where
the rows came from. A Garmin Connect export, a `.fit` reader (`@garmin/fitsdk`
is already a dependency for the watch export and decodes as well as it encodes)
or a `.tcx` reader slots in beside it without touching any UI.

GPX is the obvious next one, and only for per-km splits, which would unlock a
"match this activity" button in the log-workout dialog beside the screenshot
scanner. It needs the 176 KB traces, so it carries a privacy cost this pass
deliberately avoided: compute splits from trackpoints, then discard the
coordinates without ever storing one.
