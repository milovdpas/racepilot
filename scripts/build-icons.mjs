// Rasterize the app marks into the PNGs the web app manifest needs.
//
// Chrome will only mint a WebAPK on Android (a real installed app rather than
// a home-screen bookmark) if the manifest offers a raster icon of at least
// 192px, plus a 512px one for the splash screen. An SVG alone is not enough.
//
//   npm i -D playwright-core && node scripts/build-icons.mjs && npm uninstall playwright-core
//
// One set, the runner, and deliberately not one per sport: the installed icon
// cannot vary per athlete. See docs/racepilot.md - Android bakes icons into the
// WebAPK at install time and rate-limits updates to days, iOS snapshots the
// touch icon when it is added, and a manifest linked without
// crossorigin="use-credentials" is fetched with credentials omitted, so it
// cannot read a cookie to decide. Only the in-app mark varies; that lives in
// `components/layout/app-mark.tsx`.
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });

const BRAND = "#f1472c";

/**
 * The four marks, on the same 64x64 grid as app/icon.svg.
 *
 * Strokes are deliberately heavy (~9% of the canvas) so a figure still reads
 * at a 16px favicon, and every mark is sized to the same optical weight.
 */
/** The runner, on the same 64x64 grid as app/icon.svg. Strokes are heavy
 *  (~9% of the canvas) so the figure still reads at a 16px favicon. */
const RUNNER = `
  <g fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
    <path d="M28 30 L36 25"/>
    <path d="M36 25 L44 30 L47 38"/>
    <path d="M36 25 L34 36"/>
    <path d="M34 36 L41 44 L39 52"/>
    <path d="M34 36 L25 41 L18 38"/>
  </g>
  <circle cx="41" cy="15" r="6" fill="#fff"/>`;

/** The rounded-square badge, as `app/icon.svg` draws it. */
const plate = (mark) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="14" fill="${BRAND}"/>${mark}
  </svg>`;

/**
 * Maskable icons get cropped to a circle or squircle by the launcher, so the
 * artwork has to sit inside the middle 80% ("safe zone") and the background
 * has to bleed to every edge - no rounded corners of our own.
 */
const maskable = (mark) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="${BRAND}"/>
    <g transform="translate(32 32) scale(0.72) translate(-32 -32)">${mark}</g>
  </svg>`;

const TARGETS = [
  { name: "icon-192.png", size: 192, svg: plate(RUNNER) },
  { name: "icon-512.png", size: 512, svg: plate(RUNNER) },
  { name: "icon-maskable-512.png", size: 512, svg: maskable(RUNNER) },
];

const browser = await chromium.launch({ channel: "chrome" });
for (const { name, size, svg } of TARGETS) {
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  await page.setContent(
    `<body style="margin:0"><div style="width:${size}px;height:${size}px">${svg}</div></body>`,
  );
  await page.waitForTimeout(150);
  const png = await page.screenshot({ omitBackground: true });
  writeFileSync(`${OUT}/${name}`, png);
  console.log(`${OUT}/${name}  ${size}x${size}  ${png.length} bytes`);
  await ctx.close();
}
await browser.close();
