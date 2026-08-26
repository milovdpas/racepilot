import type { MetadataRoute } from "next";

/**
 * Makes the tracker installable to a phone home screen, which matters for a
 * mobile-first app you open mid-training-block. `standalone` drops the browser
 * chrome so the bottom nav sits where a native tab bar would.
 *
 * Android only mints a real installed app (a WebAPK) when the manifest offers
 * a raster icon of at least 192px plus a 512px one. Miss that and Chrome
 * silently downgrades "Install" to a home-screen bookmark. (A service worker
 * is *not* required for installability — measured both ways — but see
 * public/sw.js for why we ship one anyway.)
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    // A stable identity, so moving start_url doesn't create a second installed
    // app alongside the first. Frozen: changing it mints a duplicate icon on
    // every Android home screen that already has the app.
    id: "/",
    name: "RacePilot",
    short_name: "RacePilot",
    description:
      "Free training plans for marathon, ultra, trail and backyard races.",
    // The app, not the marketing page — an installed app should never open on
    // a landing page selling itself. `scope` stays "/" because narrowing it
    // would put `id` outside the scope.
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    categories: ["health", "fitness", "sports"],
    // Matches --brand in globals.css and the viewport themeColor in layout.tsx.
    theme_color: "#f1472c",
    // Dark, because the app defaults to the system theme and a white flash on
    // launch is the more jarring of the two.
    background_color: "#0a0a0a",
    // PNG only, deliberately. An SVG entry with sizes:"any" looks like a
    // perfect match to Chrome's icon picker, but it can't rasterize one for a
    // WebAPK — it then reports "no-acceptable-icon" and stops looking, so the
    // PNGs below never get considered and install silently degrades to a
    // home-screen shortcut. app/icon.svg is still the tab favicon via
    // <link rel="icon">, which is a separate mechanism.
    icons: [
      { src: "/icons/icon-192.png", type: "image/png", sizes: "192x192", purpose: "any" },
      { src: "/icons/icon-512.png", type: "image/png", sizes: "512x512", purpose: "any" },
      // Launchers crop to a circle/squircle; this variant keeps the runner
      // inside the safe zone and bleeds the background to every edge.
      {
        src: "/icons/icon-maskable-512.png",
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
  };
}
