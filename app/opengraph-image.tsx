import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

// The social preview card. Next reuses this for Twitter too, so there is no
// separate twitter-image.
/**
 * Rendered at 2x the nominal 1200x630. The shape is what Twitter, LinkedIn and
 * Slack expect, but WhatsApp crops to a square — and at 1200x630 that crop had
 * only 630x630 pixels to work with, which a phone then upscaled to roughly 960
 * device px. That upscale is what made the preview look blurry; it was never
 * about how the image is produced. At 2400x1260 the square crop gets 1260x1260
 * and lands comfortably above any phone's bubble.
 */
const SCALE = 2;
const px = (n: number) => n * SCALE;

export const size = { width: 1200 * SCALE, height: 630 * SCALE };
export const contentType = "image/png";
export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;

/**
 * 1200x630 is the right shape for Twitter, LinkedIn and Slack, but **WhatsApp
 * crops link previews towards a square** — and a centre-square of this canvas
 * is only the middle 630px. A left-aligned layout lost the logo completely and
 * chopped the headline into "your race. / every kilometer.", which is what a
 * shared link actually looked like in a chat.
 *
 * So everything that matters is centred inside a 600px column: comfortably
 * within the square crop, and still balanced at full width. The outer thirds
 * carry background only, and are the only part a square crop is allowed to eat.
 *
 * Rendered with Satori, which supports a deliberate subset of CSS: no external
 * fonts or images, and every element with more than one child needs an explicit
 * `display: flex`.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#0a0a0a",
          color: "#fafafa",
          padding: px(60),
        }}
      >
        {/* The safe zone: narrower than the square crop, so nothing essential
            can fall outside it. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: px(600),
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: px(18) }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: px(68),
                height: px(68),
                borderRadius: px(19),
                background: "#f1472c",
              }}
            >
              <svg width={px(48)} height={px(48)} viewBox="0 0 64 64">
                <g
                  fill="none"
                  stroke="#fff"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M28 30 L36 25" />
                  <path d="M36 25 L44 30 L47 38" />
                  <path d="M36 25 L34 36" />
                  <path d="M34 36 L41 44 L39 52" />
                  <path d="M34 36 L25 41 L18 38" />
                </g>
                <circle cx="41" cy="15" r="6" fill="#fff" />
              </svg>
            </div>
            <div style={{ fontSize: px(44), fontWeight: 600 }}>{SITE_NAME}</div>
          </div>

          {/* Two rows rather than a <br>: Satori counts the break as a second
              child and refuses any element with more than one that isn't
              explicitly a flex container. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: px(44),
              fontSize: px(56),
              fontWeight: 600,
              lineHeight: 1.15,
            }}
          >
            <div>Plan your race.</div>
            <div>Track every kilometer.</div>
          </div>

          <div style={{ marginTop: px(28), fontSize: px(26), color: "#a1a1aa" }}>
            Marathon · Ultra · Trail · Triathlon
          </div>
          <div style={{ marginTop: px(8), fontSize: px(26), color: "#a1a1aa" }}>
            Free, no account.
          </div>
        </div>
      </div>
    ),
    size,
  );
}
