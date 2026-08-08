import { readFileSync } from "node:fs";
import type { NextConfig } from "next";

/**
 * Read at build time and inlined into the client bundle, so the hidden debug
 * panel can say which build a phone is actually running. Importing
 * package.json instead would bundle the whole dependency list with it.
 */
const { version } = JSON.parse(readFileSync("./package.json", "utf8"));

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: version },

  /**
   * Emit a self-contained server bundle in `.next/standalone`, so the runtime
   * image can drop `node_modules` entirely. Required by the Dockerfile; on
   * Vercel it is simply ignored.
   */
  output: "standalone",

  /**
   * The app used to live at the site root; it now lives under /app so that "/"
   * can be an indexable marketing page. These keep old bookmarks, home-screen
   * shortcuts and any existing inbound links working.
   *
   * Permanent (308, not 307) so browsers and crawlers stop asking. "/" itself
   * is deliberately absent — its meaning changed, its address didn't.
   */
  async redirects() {
    return [
      { source: "/plan/:path*", destination: "/app/plan/:path*", permanent: true },
      { source: "/calendar", destination: "/app/calendar", permanent: true },
      { source: "/off-days", destination: "/app/off-days", permanent: true },
      { source: "/stats", destination: "/app/stats", permanent: true },
      { source: "/settings", destination: "/app/settings", permanent: true },
    ];
  },
};

export default nextConfig;
