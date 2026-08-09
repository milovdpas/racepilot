import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MovedNotice } from "@/components/common/moved-notice";
import { ServiceWorker } from "@/components/layout/service-worker";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Without this, every relative OG/canonical URL silently resolves against
  // localhost in production.
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME}: ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "A free training planner for marathons, ultras, trail and backyard races. No account, no ads and no database. Your training stays in your browser, or in your own Google Drive.",
  applicationName: SITE_NAME,
  // Installed to a home screen, this should open chromeless like the manifest
  // asks for; iOS reads it from here rather than the manifest.
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: "default" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME}: ${SITE_TAGLINE}`,
    description:
      "Plan and track marathon, ultra, trail and backyard training. Free, no account, and your data never leaves your device unless you say so.",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  // The literal value of --brand in globals.css. Keep the two in step: this is
  // the browser/OS chrome colour and a mismatch shows as a seam above the app.
  themeColor: "#f1472c",
};

/**
 * The two providers every page genuinely needs, and nothing else.
 *
 * Theming applies to the marketing pages as much as the app, and the service
 * worker has to register from wherever the visitor first lands or an install
 * from the landing page has no shell to offer. Everything else the app needs
 * moved to `components/layout/app-runtime.tsx`, which mounts under `/app` and
 * `/welcome` only — see the note there for what it was costing `/`.
 *
 * The app's chrome (nav, top bar, popups) lives in `app/app/layout.tsx`,
 * because `/`, `/privacy` and `/welcome` are full-bleed pages that must not
 * render it.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ServiceWorker />
          <MovedNotice />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
