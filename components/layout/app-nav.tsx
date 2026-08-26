"use client";

import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Settings,
  Umbrella,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AthleteLogo } from "@/components/layout/athlete-logo";
import type { MarkId } from "@/lib/athlete";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/app", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/app/plan", labelKey: "nav.plan", icon: ListChecks },
  { href: "/app/calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { href: "/app/off-days", labelKey: "nav.offDays", icon: Umbrella },
  { href: "/app/stats", labelKey: "nav.stats", icon: BarChart3 },
  { href: "/app/settings", labelKey: "nav.settings", icon: Settings },
];

function isActive(pathname: string, href: string): boolean {
  // The dashboard is the section root, so it needs an exact match or every
  // other page would light it up too.
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function AppNav({ initialMark }: { initialMark?: MarkId }) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-card/40 px-4 py-6 md:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <AthleteLogo initial={initialMark} />
          <div className="leading-tight">
            <p className="text-sm font-semibold">{t("common.appName")}</p>
            <p className="text-xs text-muted-foreground">
              {t("common.appTagline")}
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, labelKey, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-5" />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">{t("nav.theme")}</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-(--z-nav) flex border-t bg-card/90 backdrop-blur md:hidden">
        {NAV.map(({ href, labelKey, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="size-5" />
              {t(labelKey)}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
