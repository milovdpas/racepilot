import type { MarkId } from "@/lib/athlete";

/**
 * The artwork inside the app badge, one per sport plus one for an athlete who
 * does more than one.
 *
 * Drawn rather than set in emoji. The mark used to render the athlete's emoji,
 * which worked for a single glyph and fell apart for a triathlete: `"🏊🚴🏃"`
 * is three glyphs squeezed into a 32px box. It also meant the badge looked
 * different on every platform, which is not what a brand mark should do.
 *
 * Same 64x64 canvas, stroke weight and geometry as `app/icon.svg`, so the
 * running mark here IS the favicon artwork rather than a lookalike. The
 * background and colour come from `AppLogo`; these draw in `currentColor`.
 *
 * There is deliberately no per-combination mark. Swim+bike and run+bike would
 * be indistinguishable at the size this actually renders, and three figures in
 * a 32px badge is mush. One mark per sport, one for "more than one".
 */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-[68%]"
      fill="none"
      stroke="currentColor"
      strokeWidth={5.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** The runner from `app/icon.svg`, minus its background plate. */
function RunMark() {
  return (
    <Frame>
      <path d="M28 30 L36 25" />
      <path d="M36 25 L44 30 L47 38" />
      <path d="M36 25 L34 36" />
      <path d="M34 36 L41 44 L39 52" />
      <path d="M34 36 L25 41 L18 38" />
      <circle cx="41" cy="15" r="6" fill="currentColor" stroke="none" />
    </Frame>
  );
}

function BikeMark() {
  return (
    <Frame>
      {/* The rider is the subject and the bike is two outlines, which is what
          survives at 32px. A full frame - top tube, down tube, chainstays -
          turns into a smudge at this size and says less than the figure does. */}
      <circle cx="18" cy="46" r="11" strokeWidth={4.5} />
      <circle cx="46" cy="46" r="11" strokeWidth={4.5} />
      <circle cx="45" cy="17" r="6" fill="currentColor" stroke="none" />
      <path d="M24 35 L37 24" strokeWidth={6} />
      <path d="M37 25 L52 31" strokeWidth={5} />
      <path d="M25 36 L33 42 L29 52" strokeWidth={5} />
    </Frame>
  );
}

function SwimMark() {
  return (
    <Frame>
      <circle cx="23" cy="21" r="6" fill="currentColor" stroke="none" />
      {/* Body trailing back, and the recovering arm swinging over the head. */}
      <path d="M11 33 L30 30 L40 35" strokeWidth={5} />
      <path d="M30 30 L38 18 L49 23" strokeWidth={5} />
      <path d="M8 48 q 8 -7 16 0 t 16 0 t 16 0" strokeWidth={5} />
    </Frame>
  );
}

/**
 * Three chevrons: more than one discipline, moving forward.
 *
 * Abstract on purpose. The obvious mark for a triathlete is the Ironman
 * M-dot, which is a registered trademark of the World Triathlon Corporation
 * and not ours to draw.
 */
function MultiMark() {
  return (
    <Frame>
      <path d="M15 18 L28 32 L15 46" strokeWidth={6} />
      <path d="M27 18 L40 32 L27 46" strokeWidth={6} />
      <path d="M39 18 L52 32 L39 46" strokeWidth={6} />
    </Frame>
  );
}

export const APP_MARK: Record<MarkId, () => React.ReactElement> = {
  run: RunMark,
  bike: BikeMark,
  swim: SwimMark,
  multi: MultiMark,
};
