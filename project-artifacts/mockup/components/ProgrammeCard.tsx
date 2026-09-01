import Link from "next/link";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";
import { mentorshipPackages, type Programme } from "@/data/programmes";

/**
 * Reusable programme card — used on /programmes, the P01 homepage preview
 * and the "related programmes" rail on detail pages. Token-driven, so it
 * renders correctly on both light and night surfaces.
 *
 * Discovery and navigation: level, duration, audience, formats, a summary
 * and an indicative "from" price (Malaysia rate — the detail page carries
 * all three regions). Still no dates or capacity: scheduled offerings
 * remain an open decision (see data/programmes.ts header).
 */
export function ProgrammeCard({ programme }: { programme: Programme }) {
  // Mentorship is priced per package; show its entry package as the "from".
  const fromPrice =
    programme.pricing?.malaysia.today ??
    (programme.level === "Mentorship"
      ? mentorshipPackages[0]?.pricing.malaysia.today
      : undefined);

  return (
    <Card
      variant="panel"
      className="flex h-full flex-col border border-[var(--color-line)]"
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Chip tone="primary">{programme.level}</Chip>
        {programme.flagship && <Chip>Flagship</Chip>}
      </div>
      <h3 className="text-h2 mb-2">{programme.title}</h3>
      <p className="text-body-sm mb-5 flex-1 text-[var(--color-ink-quiet)]">
        {programme.summary}
      </p>
      <dl className="mb-5 flex flex-col gap-1.5 border-t border-[var(--color-line)] pt-4">
        <div className="flex gap-3 text-body-sm">
          <dt className="text-label w-[86px] shrink-0">Duration</dt>
          <dd className="text-mono text-[0.8rem] text-[var(--color-ink-quiet)]">
            {programme.duration}
          </dd>
        </div>
        <div className="flex gap-3 text-body-sm">
          <dt className="text-label w-[86px] shrink-0">For</dt>
          <dd className="text-[var(--color-ink-quiet)]">
            {programme.audienceSummary}
          </dd>
        </div>
        <div className="flex gap-3 text-body-sm">
          <dt className="text-label w-[86px] shrink-0">Delivery</dt>
          <dd className="text-[var(--color-ink-quiet)]">
            {programme.formats.join(" · ")}
          </dd>
        </div>
        {fromPrice && (
          <div className="flex gap-3 text-body-sm">
            <dt className="text-label w-[86px] shrink-0">From</dt>
            <dd className="text-mono text-[0.8rem] text-[var(--color-primary)]">
              {fromPrice}{" "}
              <span className="text-[var(--color-ink-faint)]">(MY)</span>
            </dd>
          </div>
        )}
      </dl>
      <Link
        href={`/programmes/${programme.slug}`}
        className="text-body-sm font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
      >
        Programme details →
      </Link>
    </Card>
  );
}
