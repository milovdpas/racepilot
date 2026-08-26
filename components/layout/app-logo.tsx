import { APP_MARK } from "@/components/layout/app-mark";
import type { MarkId } from "@/lib/athlete";
import { cn } from "@/lib/utils";

const SIZE = {
  sm: "size-8 rounded-lg text-base",
  md: "size-9 rounded-xl text-lg",
  lg: "size-11 rounded-2xl text-2xl",
} as const;

/**
 * The app mark: the same runner badge as `app/icon.svg`. Shared so the three
 * places that show it can't drift apart on radius or colour, as they had.
 *
 * `mark` lets it follow the athlete (see `AthleteLogo`). It used to be an
 * emoji, which rendered differently on every platform and broke outright for a
 * triathlete, whose "🏊🚴🏃" is three glyphs in a 32px box.
 *
 * Note this only ever changes the *in-app* mark: an installed PWA's icon is
 * baked in at install time on both Android and iOS and cannot be swapped
 * afterwards, and `app/icon.svg` stays the runner for the favicon.
 */
export function AppLogo({
  size = "md",
  mark = "run",
  className,
}: {
  size?: keyof typeof SIZE;
  mark?: MarkId;
  className?: string;
}) {
  const Mark = APP_MARK[mark];
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center bg-primary text-primary-foreground",
        SIZE[size],
        className,
      )}
    >
      <Mark />
    </span>
  );
}
