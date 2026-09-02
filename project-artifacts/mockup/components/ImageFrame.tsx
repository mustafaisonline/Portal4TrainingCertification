import Image from "next/image";

/**
 * ImageFrame — a reserved place for a photograph that does not exist yet.
 *
 * The design rule this component exists to enforce (see the photography
 * brief and docs/IMAGE_SLOTS.md):
 *
 *   An empty slot must LOOK empty. A labelled frame is honest, cannot be
 *   mistaken for evidence, and carries the shoot brief — subject, aspect
 *   ratio, minimum width. A stock or generated photograph in the same slot
 *   would claim delivery that has not happened, and would tell nobody what
 *   to photograph, so it would quietly become permanent.
 *
 * The engineering rule: **a slot with no image is a design state, not a
 * hole.** Some of these photographs may not exist for months, so the page
 * must hold either way. Passing `src` swaps the frame for the real image
 * with no layout change — the frame already reserves the right box at the
 * right ratio.
 *
 * Token-driven, so it renders correctly on paper and inside `.night`.
 *
 * It is DELIBERATELY LOUD. An empty slot uses a dedicated ember tint
 * (`--color-accent-soft`) rather than the Panel card surface it used to
 * share, so every reserved image is identifiable at a glance while
 * reviewing a page. This is a working instrument: when the photographs
 * arrive the tint disappears with them, because a filled frame renders the
 * image alone.
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
};

export function ImageFrame({
  subject,
  ratio = "4 / 3",
  minWidth,
  note,
  src,
  alt,
  className = "",
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

  // Empty state — deliberately, visibly unfilled.
  return (
    <div
      // Content is centred, not bottom-anchored: on a large frame (the 21:9
      // programme header is ~500px tall) a caption stuck in the corner reads
      // as a broken image, whereas centred content reads as a deliberate
      // empty state. Holds at small sizes too.
      className={`flex flex-col items-center justify-center rounded-[var(--radius-plate)] border-2 border-dashed border-[var(--color-accent-line)] bg-[var(--color-accent-soft)] p-5 text-center ${className}`}
      style={{ aspectRatio: ratio }}
      // Announced to assistive tech as what it is: a gap, not a picture.
      role="note"
      aria-label={`Photograph needed: ${subject}`}
    >
      {/* Colour set inline, not via a Tailwind utility: `.text-label`
          hard-codes `color: var(--color-ink-faint)` and, being unlayered
          CSS, outranks any `text-*` utility — the ember silently did not
          apply. See DESIGN_FOUNDATION.md "CSS layer/specificity traps".
          Uses --color-accent-ink, not --color-accent: the base ember only
          reaches 3.71:1 on the tint and would fail AA at this size. */}
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
          fail AA. This is one place the known ink-faint contrast problem was
          avoidable without waiting for the global fix. */}
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
