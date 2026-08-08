// Regenerate the README screenshots in docs/screenshots.
//
// Doubles as a smoke test: every page must render real content with no console
// errors, and the Dutch shot must actually be in Dutch.
//
// Needs the app running and system Chrome. Prefer a production server: `next
// dev` paints its own overlay and renders slower, which shows up as half-loaded
// charts. playwright-core is installed on demand rather than committed as a
// dependency (same convention as the browser smoke recipe in
// docs/architecture.md):
//
//   npm run build && npx next start -p 3130
//   npm i -D playwright-core
//   SCREENSHOT_BASE=http://localhost:3130 node scripts/screenshots.mjs
//   npm uninstall playwright-core
//
// The port is configurable because :3000 is usually already taken by whichever
// dev server you were using when you decided the screenshots looked stale.
import { chromium } from "playwright-core";

const BASE = process.env.SCREENSHOT_BASE ?? "http://localhost:3000";
// The app moved under /app; "/" is the marketing page.
const APP = `${BASE}/app`;
const OUT = "docs/screenshots";
const VIEWPORT = { width: 430, height: 932 }; // a tall phone, matching the old shots

const browser = await chromium.launch({ channel: "chrome" });
const problems = [];

/** A context with the example plan already seeded and onboarding dismissed. */
async function app({ dark = false, locale = "en" } = {}) {
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: dark ? "dark" : "light",
    // Pinned: `detectCountry()` reads the browser locale, so on a US machine
    // every shot would silently come out in miles.
    locale: "en-GB",
  });
  const page = await ctx.newPage();
  // The dev overlay renders a floating badge that would land in every shot.
  await page.addInitScript(() => {
    const css = [
      // The dev overlay badge would land in every shot.
      "nextjs-portal,#next-logo,[data-nextjs-dev-tools-button]{display:none !important}",
      // In a full-page capture a position:fixed bar renders at its viewport
      // offset, i.e. slicing through the middle of the image. Re-anchor the
      // mobile nav and header to the document so each appears once, in place.
      // In a full-page capture, fixed/sticky chrome renders at its viewport
      // offset — i.e. slicing through the middle of the image. Flow the sticky
      // bits normally and pin the fixed nav to the document bottom.
      "body{position:relative}",
      ".sticky{position:static !important}",
      "nav.fixed{position:absolute !important}",
    ].join("");
    document.addEventListener("DOMContentLoaded", () => {
      const el = document.createElement("style");
      el.textContent = css;
      document.head.appendChild(el);
    });
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

  await page.goto(APP, { waitUntil: "networkidle" });
  await page.evaluate(
    ([theme, loc]) => {
      const raw = JSON.parse(
        localStorage.getItem("marathon-training-v1") || '{"state":{}}',
      );
      raw.state = {
        ...raw.state,
        preferences: {
          ...(raw.state.preferences ?? {}),
          theme,
          locale: loc,
          onboardingSeen: true,
          // At phone width the calendar defaults to the agenda, which renders
          // the whole plan; the month grid is the representative shot.
          calendarView: "month",
          splitScannerOnboardingSeen: true,
          // Otherwise the athlete-type and install prompts photobomb every shot.
          athleteTypes: [],
          installPromptSeen: true,
          // Explicit, so the shots don't depend on who ran the script.
          country: "NL",
          units: "metric",
        },
      };
      localStorage.setItem("marathon-training-v1", JSON.stringify(raw));
      localStorage.setItem("theme", theme);
    },
    [dark ? "dark" : "light", locale],
  );
  return { ctx, page, errors };
}

/** A shot of a page outside the app chrome (the landing page, the welcome flow). */
async function shotAbsolute(page, url, name, { minChars = 300 } = {}) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const chars = await page.evaluate(() => document.body.innerText.length);
  if (chars < minChars) problems.push(`${name}: body has only ${chars} chars`);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`  ${name.padEnd(20)} ${chars} chars`);
}

async function shot(page, path, name) {
  await page.goto(APP + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1400);
  for (let i = 0; i < 3; i++) {
    if (!(await page.locator('[role="dialog"]').count())) break;
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
  }
  await page.waitForTimeout(500);
  const chars = await page.evaluate(
    () => document.querySelector("main")?.innerText.length ?? 0,
  );
  if (chars < 150) problems.push(`${name}: main has only ${chars} chars`);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`  ${name.padEnd(20)} ${chars} chars`);
}

// --- light ---
{
  const { ctx, page, errors } = await app();
  await shot(page, "", "dashboard-light");
  await shot(page, "/plan", "plan-light");
  await shot(page, "/calendar", "calendar-light");
  await shot(page, "/stats", "stats-light");
  await shot(page, "/off-days", "off-days");
  await shot(page, "/settings", "settings-light");

  // Wizard step 3 (the training step) — click through from step 1.
  await page.goto(`${APP}/plan/new`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const form = page.locator("main");
  await form.getByRole("textbox").first().fill("Spring marathon");
  {
    const dates = form.locator('input[type="date"]');
    await dates.nth(0).fill("2027-01-04");
    await dates.nth(1).fill("2027-04-18");
  }
  for (let i = 0; i < 2; i++) {
    await form.getByRole("button", { name: /^(next|volgende)$/i }).click();
    await page.waitForTimeout(500);
  }
  const stepText = await page.locator("main").innerText();
  if (!/recent|latest|training/i.test(stepText)) {
    problems.push("wizard-step3: does not look like the training step");
  }
  await page.screenshot({ path: `${OUT}/wizard-step3.png`, fullPage: true });
  console.log(`  wizard-step3         ${stepText.length} chars`);

  if (errors.length) problems.push(`light console: ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
}

// --- the pages outside the app chrome ---
{
  // A fresh context: the landing page redirects anyone who already has plans,
  // and the welcome flow only exists before onboarding is done.
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: "en-GB",
  });
  const page = await ctx.newPage();
  await shotAbsolute(page, BASE, "landing");

  // The athlete-profile step rather than the first: it shows the picker that
  // drives personalisation, and fills a phone screen (the privacy step is a
  // short list, so a full-height shot of it is mostly empty).
  await page.goto(`${BASE}/welcome`, { waitUntil: "networkidle" });
  for (let i = 0; i < 2; i++) {
    await page.getByRole("button", { name: /^continue$/i }).click();
    await page.waitForTimeout(300);
  }
  const welcomeText = await page.locator("main").innerText();
  if (!/road runner|trail runner/i.test(welcomeText)) {
    problems.push("welcome: not on the athlete-profile step");
  }
  await page.screenshot({ path: `${OUT}/welcome.png`, fullPage: true });
  console.log(`  welcome              ${welcomeText.length} chars`);
  await ctx.close();
}

// --- dark ---
{
  const { ctx, page, errors } = await app({ dark: true });
  await shot(page, "", "dashboard-dark");
  await shot(page, "/calendar", "calendar-dark");
  await shot(page, "/stats", "stats-dark");
  if (errors.length) problems.push(`dark console: ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
}

// --- Dutch ---
{
  const { ctx, page, errors } = await app({ locale: "nl" });
  await shot(page, "", "dashboard-nl");
  const txt = await page.locator("main").innerText();
  if (!/dagen te gaan|Totale afstand/i.test(txt)) {
    problems.push("dashboard-nl: page is not in Dutch");
  }
  if (errors.length) problems.push(`nl console: ${errors.slice(0, 3).join(" | ")}`);
  await ctx.close();
}

await browser.close();
console.log(problems.length ? `\nPROBLEMS:\n- ${problems.join("\n- ")}` : "\nAll screenshots OK");
