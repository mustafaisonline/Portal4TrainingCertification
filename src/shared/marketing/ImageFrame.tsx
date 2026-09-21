/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/ImageFrame.tsx
 * (ADR-045). Change on port: the mockup's `assetPath()` (static-export
 * basePath workaround, retired) is dropped — `src` is used as given.
 */

import type { ReactNode } from "react";
import Image from "next/image";

/**
 * ImageFrame — a reserved place for a photograph that does not exist yet.
 *
 * The design rule this component exists to enforce (see docs/IMAGE_SLOTS.md
 * in the mockup):
 *
 *   An empty slot must LOOK empty. A labelled frame is honest, cannot be
 *   mistaken for evidence, and carries the shoot brief — subject, aspect
 *   ratio, minimum width. A stock or generated photograph in the same slot
 *   would claim delivery that has not happened.
 *
 * The engineering rule: **a slot with no image is a design state, not a
 * hole.** Passing `src` swaps the frame for the real image with no layout
 * change — the frame already reserves the right box at the right ratio.
 *
 * Token-driven, so it renders correctly on paper and inside `.night`.
 *
 * `illustration`: a third state, between empty and a real photograph — an
 * original, abstract SVG graphic (see DeliveryIllustrations.tsx) standing in
 * for the photograph until one is shot. `src` still wins when both are
 * supplied — a real photograph always replaces the illustration standing in
 * for it.
 */

export type ImageFrameProps = {
  /** What to photograph. This is the brief — write it for a photographer. */
  subject: string;
  /** CSS aspect-ratio, e.g. "4 / 3". Reserves the box before any image exists. */
  ratio?: string;
  /** Minimum acceptable pixel width of the delivered photograph. */
  minWidth?: number;
  /** A constraint the photographer must know — consent, no client data, etc. */
  note?: string;
  /** Supply when the genuine photograph exists; the frame is then replaced. */
  src?: string;
  /** Required whenever `src` is set. */
  alt?: string;
  className?: string;
  /** An original SVG illustration standing in for the photograph — see the
   *  header comment above. Ignored when `src` is also supplied. */
  illustration?: ReactNode;
};

export function ImageFrame({
  subject,
  ratio = "4 / 3",
  minWidth,
  note,
  src,
  alt,
  className = "",
  illustration,
}: ImageFrameProps) {
  // Filled state — the genuine photograph, in the box the frame reserved.
  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-[var(--radius-plate)] ${className}`}
        style={{ aspectRatio: ratio }}
      >
        <Image
          src={src}
          alt={alt ?? subject}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, 33vw"
        />
      </div>
    );
  }

  // Illustrated stand-in — not a photograph, doesn't claim to be one; see
  // the header comment above.
  if (illustration) {
    return (
      <div
        className={`overflow-hidden rounded-[var(--radius-plate)] ${className}`}
        style={{ aspectRatio: ratio }}
        role="img"
        aria-label={`Illustration standing in for a photograph: ${subject}`}
      >
        {illustration}
      </div>
    );
  }

  // Empty state — deliberately, visibly unfilled.
  return (
    <div
      // Content is centred, not bottom-anchored: on a large frame a caption
      // stuck in the corner reads as a broken image, whereas centred content
      // reads as a deliberate empty state. Holds at small sizes too.
      className={`flex flex-col items-center justify-center rounded-[var(--radius-plate)] border-2 border-dashed border-[var(--color-accent-line)] bg-[var(--color-accent-soft)] p-5 text-center ${className}`}
      style={{ aspectRatio: ratio }}
      // Announced to assistive tech as what it is: a gap, not a picture.
      role="note"
      aria-label={`Photograph needed: ${subject}`}
    >
      {/* Colour set inline, not via a Tailwind utility: `.text-label`
          hard-codes `color: var(--color-ink-faint)` and, being unlayered
          CSS, outranks any `text-*` utility. Uses --color-accent-ink, not
          --color-accent: the base ember only reaches 3.71:1 on the tint and
          would fail AA at this size. */}
      <span
        className="text-label mb-1.5"
        style={{ color: "var(--color-accent-ink)" }}
      >
        Photograph needed
      </span>
      <span className="text-body-sm max-w-[46ch] leading-snug text-[var(--color-ink-quiet)]">
        {subject}
      </span>
      {/* ink-quiet, not ink-faint: faint measures 3.39:1 on the tint and would
          fail AA. */}
      {(minWidth || note) && (
        <span className="text-mono mt-1.5 text-[0.7rem] leading-snug text-[var(--color-ink-quiet)]">
          {[ratio.replace(/\s/g, ""), minWidth && `min ${minWidth}px`, note]
            .filter(Boolean)
            .join(" · ")}
        </span>
      )}
    </div>
  );
}
