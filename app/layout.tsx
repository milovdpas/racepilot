import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppCookieSync } from "@/components/common/app-cookie-sync";
import { MovedNotice } from "@/components/common/moved-notice";
import { OnboardingRedirect } from "@/components/common/onboarding-redirect";
import { RegionDetect } from "@/components/common/region-detect";
import { SyncInitializer } from "@/components/common/sync-initializer";
import { Toaster } from "@/components/common/toaster";
import { ServiceWorker } from "@/components/layout/service-worker";
import { I18nProvider } from "@/components/layout/i18n-provider";
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
 * Providers only. The app's chrome (nav, top bar, popups) lives in
 * `app/app/layout.tsx`, because `/`, `/privacy` and `/welcome` are full-bleed
 * pages that must not render it.
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
          <I18nProvider>
            <ServiceWorker />
            <SyncInitializer />
            <MovedNotice />
            <OnboardingRedirect />
            <AppCookieSync />
            <RegionDetect />
            <Toaster />
            {children}
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
