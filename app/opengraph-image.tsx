import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

/**
 * Rendered at 2x the nominal 1200x630. The shape is what Twitter, LinkedIn and
 * Slack expect, but WhatsApp crops to a square — and at 1200x630 that crop had
 * only 630x630 pixels to work with, which a phone then upscaled to roughly 960
 * device px. That upscale is what made an earlier, text-heavy version look
 * blurry. At 2400x1260 the square crop gets 1260x1260 and downsamples instead.
 */
const SCALE = 2;
const px = (n: number) => n * SCALE;

export const size = { width: 1200 * SCALE, height: 630 * SCALE };
export const contentType = "image/png";
export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;

/**
 * Just the app mark, full-bleed on the brand orange.
 *
 * No wordmark and no strapline, for two reasons. A link preview already shows
 * `og:title` and `og:description` as real text beside the image, so anything
 * written *into* the image is a worse-rendered duplicate of what is already
 * there. And type is what suffers when a client crops the card square and
 * scales it into a ~320px bubble; a single vector glyph on a flat field
 * survives any crop and any size, because there is nothing to lose off the
 * edges.
 *
 * Same artwork as `app/icon.svg` and `app/apple-icon.tsx` — the mark should be
 * one thing wherever it appears.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          // Matches --brand in globals.css and the manifest theme_color.
          background: "#f1472c",
        }}
      >
        {/* Sized generously: the runner occupies only ~70% of its 64x64
            viewBox, so a nominally 300px glyph renders about a third of the
            canvas height. This lands it near half, which is what reads as "a
            logo" rather than "a small mark on a big field". */}
        <svg width={px(440)} height={px(440)} viewBox="0 0 64 64">
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
    ),
    size,
  );
}
