#!/usr/bin/env node
/**
 * Turn a raw plan export into the bundled demo plan.
 *
 *   node scripts/scrub-example-plan.mjs racepilot-plans-2026-08-07.json
 *
 * A raw export is NOT safe to commit: this repo is public, and every weather
 * snapshot carries the exporter's `lat`/`lon` — their home address, repeated
 * once per logged run. It also carries a `preferences` block that would switch
 * weather and the split scanner on (and skip onboarding) for every new user if
 * it ever reached the seed path.
 *
 * So the export stays gitignored and this writes the scrubbed copy the app
 * actually ships. Pretty-printed on purpose: it should diff like source and be
 * regenerable verbatim from Settings -> Export.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const OUT = "lib/plan/example-plan.json";

const input = process.argv[2];
if (!input) {
  console.error("usage: node scripts/scrub-example-plan.mjs <export.json>");
  process.exit(1);
}

const bundle = JSON.parse(readFileSync(resolve(input), "utf8"));

if (!bundle.plans || typeof bundle.plans !== "object") {
  console.error(`${input}: not a plan export (no "plans" object).`);
  process.exit(1);
}

// The app seeds a plan, never preferences.
delete bundle.preferences;

let scrubbed = 0;
let workouts = 0;
for (const plan of Object.values(bundle.plans)) {
  for (const w of Object.values(plan.workouts ?? {})) {
    workouts++;
    if (!w.weather) continue;
    if ("lat" in w.weather || "lon" in w.weather) scrubbed++;
    delete w.weather.lat;
    delete w.weather.lon;
  }
}

const json = `${JSON.stringify(bundle, null, 2)}\n`;

// Belt and braces: never write a file that still mentions coordinates.
if (/"(lat|lon)"\s*:/.test(json)) {
  console.error("Refusing to write: coordinates survived the scrub.");
  process.exit(1);
}

writeFileSync(OUT, json);

const plans = Object.keys(bundle.plans).length;
console.log(
  `${OUT}: ${plans} plan(s), ${workouts} workouts, ` +
    `coordinates stripped from ${scrubbed} weather snapshot(s).`,
);
