import type { OfficeLocation } from "@/content/locations";
import { Card } from "@/shared/ui/Card";

/*
 * One company location on /contact-us — CR-2026-10-01-0712. The head office
 * card is laid out wide (logo beside the details); a partner card stacks. The
 * logo sits on a tile whose colour follows the logo, not the theme: Infocentric's
 * wordmark is white on transparent and needs the dark tile, ours is on white.
 * Every link is a real link: tel:, mailto:, and an external website that opens
 * safely and says so to a screen reader. Nothing is shown that the location
 * does not have (no phone line when there is no number).
 */
const TILE: Record<OfficeLocation["logo"]["tile"], string> = { light: "#ffffff", dark: "#0b1b3a" };

function Row({ label, children, testId }: { label: string; children: React.ReactNode; testId: string }) {
  return (
    <div className="grid gap-x-4 gap-y-1 sm:grid-cols-[6.5rem_1fr]" data-testid={testId}>
      <dt className="text-label pt-0.5">{label}</dt>
      <dd className="text-body-sm min-w-0 break-words text-[var(--color-ink)]">{children}</dd>
    </div>
  );
}

const linkClass = "text-[var(--color-primary)] underline underline-offset-4";

export function LocationCard({ location: l }: { location: OfficeLocation }) {
  const head = l.kind === "head_office";
  return (
    <Card
      variant="panel"
      className={`flex h-full flex-col gap-6 border border-[var(--color-line)] p-6 sm:p-8 ${head ? "md:flex-row md:items-start" : ""}`}
      data-testid={`location-${l.id}`}
      data-kind={l.kind}
    >
      <div
        className="flex shrink-0 items-center justify-center self-start rounded-[var(--radius-plate)] border border-[var(--color-line)] p-3"
        style={{ background: TILE[l.logo.tile] }}
        data-testid={`location-${l.id}-logo`}
      >
        {/* A fixed brand asset from /public/brand; next/image's local-source allow-list does not cover it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={l.logo.src} alt={l.logo.alt} width={l.logo.width} height={l.logo.height} style={{ height: "auto", maxWidth: "100%" }} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-label mb-2 text-[var(--color-primary)]" data-testid={`location-${l.id}-role`}>
          {l.roleLabel}
        </p>
        <h3 className="text-h1 mb-1">{l.name}</h3>
        {l.tagline ? <p className="text-body-sm mb-3 font-medium text-[var(--color-ink-quiet)]">{l.tagline}</p> : null}
        {l.about ? <p className="text-body-sm mb-4 max-w-[60ch] text-[var(--color-ink-quiet)]">{l.about}</p> : null}

        <dl className="mt-4 flex flex-col gap-3 border-t border-[var(--color-line)] pt-4">
          {l.registration ? <Row label="Company No." testId={`location-${l.id}-registration`}>{l.registration}</Row> : null}
          <Row label="Address" testId={`location-${l.id}-address`}>
            {l.address}
          </Row>
          {l.phone ? (
            <Row label="Phone" testId={`location-${l.id}-phone`}>
              <a href={`tel:${l.phone.tel}`} className={linkClass}>
                {l.phone.display}
              </a>
            </Row>
          ) : null}
          {l.email ? (
            <Row label="Email" testId={`location-${l.id}-email`}>
              <a href={`mailto:${l.email}`} className={`${linkClass} break-all`}>
                {l.email}
              </a>
            </Row>
          ) : null}
          <Row label="Website" testId={`location-${l.id}-website`}>
            <a href={l.website.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {l.website.label}
              <span className="sr-only"> (opens external site)</span>
              <span aria-hidden="true"> ↗</span>
            </a>
          </Row>
        </dl>
      </div>
    </Card>
  );
}
