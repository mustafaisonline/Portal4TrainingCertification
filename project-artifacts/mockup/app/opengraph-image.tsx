import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/*
 * Open Graph card — the image every LinkedIn/WhatsApp/Slack share renders.
 * Before this existed, every shared link previewed as a blank card.
 *
 * Generated at build time by `next/og`, which is part of Next.js — no new
 * dependency. It is NOT a photograph and does not need one: this is a
 * typographic treatment, so it stays truthful while genuine delivery
 * photography does not yet exist.
 *
 * LIGHT-THEME REDESIGN, 2026-09-06, founder direction: recoloured from the
 * portal's old dark-navy-and-indigo identity to match the light-theme
 * propagation across every real page (see components/HomeHeroLight.tsx's
 * header comment for that redesign). Every hex value below is one of this
 * theme's actual values (--color-ground, --color-ink, --color-primary,
 * etc. from app/globals.css), not a fresh palette invented for this file —
 * hardcoded because Satori (inside ImageResponse) cannot read CSS custom
 * properties.
 *
 * Fonts are read from `assets/fonts/` rather than `public/`, because they
 * are build-time inputs and must never be served to browsers — the runtime
 * faces come from next/font. Satori (inside ImageResponse) cannot read the
 * hashed .woff2 files next/font emits, which is why static TTFs are vendored.
 *
 * Satori supports a flexbox subset only: every element with more than one
 * child sets `display: flex` explicitly.
 */

/* Required by `output: "export"` (the GitHub Pages build): Next will not
   collect an image route for a static export unless it is explicitly
   declared static. The card was already generated at build time in every
   other mode, so this states existing behaviour rather than changing it. */
export const dynamic = "force-static";

export const alt =
  "Data & AI Academy — expert-led Data & AI training and certification";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (f: string) => readFile(join(process.cwd(), "assets/fonts", f));

export default async function OpenGraphImage() {
  const [sansRegular, sansSemiBold, serifMedium] = await Promise.all([
    font("IBMPlexSans-Regular.ttf"),
    font("IBMPlexSans-SemiBold.ttf"),
    font("IBMPlexSerif-Medium.ttf"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f9fd",
          backgroundImage:
            "radial-gradient(900px 520px at 78% 12%, rgba(47,95,224,0.14), rgba(247,249,253,0) 70%)",
          padding: "64px 72px",
          fontFamily: "Plex Sans",
        }}
      >
        {/* Masthead — mark + wordmark, exactly as the portal sets it */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* Inline SVG, not an <img> with a data URI: satori rasterises
              inline SVG itself, whereas the data-URI path goes through
              resvg and failed here with "svgload_buffer: SVG rendering
              failed" during prerender. */}
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#2f5fe0" />
            <path
              d="M8 22.5 L14 15 L18 18 L24 9"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="24" cy="9" r="3.1" fill="#ffffff" />
            <circle cx="8" cy="22.5" r="2.2" fill="#ffffff" fillOpacity="0.7" />
          </svg>
          <div
            style={{
              fontFamily: "Plex Serif",
              fontSize: 40,
              color: "#1b1f27",
              marginLeft: 22,
              letterSpacing: "0.004em",
            }}
          >
            Data &amp; AI Academy
          </div>
        </div>

        {/* The proposition — the portal's own hero line */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: "0.11em",
              textTransform: "uppercase",
              color: "#2f5fe0",
              marginBottom: 26,
            }}
          >
            Expert-led training &amp; certification
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 68,
              fontWeight: 600,
              lineHeight: 1.12,
              letterSpacing: "-0.018em",
              color: "#1b1f27",
            }}
          >
            <div>Taught live by a practitioner.</div>
            <div style={{ color: "#2f5fe0" }}>Proven by the work you do.</div>
          </div>
        </div>

        {/* Footer meta — positioning facts only, never metrics */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            borderTop: "1px solid #e5e9f2",
            paddingTop: 26,
            fontSize: 23,
            color: "#7a8091",
          }}
        >
          Face-to-face &amp; live online · Malaysia &amp; internationally
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Plex Sans", data: sansRegular, weight: 400, style: "normal" },
        { name: "Plex Sans", data: sansSemiBold, weight: 600, style: "normal" },
        { name: "Plex Serif", data: serifMedium, weight: 500, style: "normal" },
      ],
    },
  );
}
