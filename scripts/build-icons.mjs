// Rasterize the app marks into the PNGs the web app manifest needs.
//
// Chrome will only mint a WebAPK on Android (a real installed app rather than
// a home-screen bookmark) if the manifest offers a raster icon of at least
// 192px, plus a 512px one for the splash screen. An SVG alone is not enough.
//
//   npm i -D playwright-core && node scripts/build-icons.mjs && npm uninstall playwright-core
//
// One set per sport, because `app/manifest.ts` serves the set matching whoever
// is installing. The artwork is the same as `components/layout/app-mark.tsx`
// draws in-app; keep the two in step, and see docs/architecture.md for why the
// installed icon can only ever be chosen at install time.
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
const MARKS = {
  run: `
    <g fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M28 30 L36 25"/>
      <path d="M36 25 L44 30 L47 38"/>
      <path d="M36 25 L34 36"/>
      <path d="M34 36 L41 44 L39 52"/>
      <path d="M34 36 L25 41 L18 38"/>
    </g>
    <circle cx="41" cy="15" r="6" fill="#fff"/>`,
  bike: `
    <g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="18" cy="46" r="11" stroke-width="4.5"/>
      <circle cx="46" cy="46" r="11" stroke-width="4.5"/>
      <path d="M24 35 L37 24" stroke-width="6"/>
      <path d="M37 25 L52 31" stroke-width="5"/>
      <path d="M25 36 L33 42 L29 52" stroke-width="5"/>
    </g>
    <circle cx="45" cy="17" r="6" fill="#fff"/>`,
  swim: `
    <g fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 33 L30 30 L40 35"/>
      <path d="M30 30 L38 18 L49 23"/>
      <path d="M8 48 q 8 -7 16 0 t 16 0 t 16 0"/>
    </g>
    <circle cx="23" cy="21" r="6" fill="#fff"/>`,
  // Three chevrons: more than one discipline, moving forward. Abstract on
  // purpose - the obvious mark for a triathlete is the Ironman M-dot, which is
  // a registered trademark of the World Triathlon Corporation.
  multi: `
    <g fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15 18 L28 32 L15 46"/>
      <path d="M27 18 L40 32 L27 46"/>
      <path d="M39 18 L52 32 L39 46"/>
    </g>`,
};

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

const browser = await chromium.launch({ channel: "chrome" });

for (const [sport, mark] of Object.entries(MARKS)) {
  // The running set keeps the original unsuffixed names: they are what every
  // already-installed app and every cached manifest still points at, and
  // renaming them would break icons in the wild for no gain.
  const suffix = sport === "run" ? "" : `-${sport}`;
  const targets = [
    { name: `icon${suffix}-192.png`, size: 192, svg: plate(mark) },
    { name: `icon${suffix}-512.png`, size: 512, svg: plate(mark) },
    { name: `icon${suffix}-maskable-512.png`, size: 512, svg: maskable(mark) },
  ];

  for (const { name, size, svg } of targets) {
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
}

await browser.close();
