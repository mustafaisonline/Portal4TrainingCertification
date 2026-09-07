import { assetPath } from "@/lib/basePath";
import Image from "next/image";
import Link from "next/link";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";
import type { Practitioner } from "@/data/practitioners";

/**
 * Reusable trainer card — used on the course detail pages' "Who delivers
 * this" section (currently its only caller — /trainers has its own bespoke
 * card layout, and the P01 "Learn from practitioners" section this comment
 * originally described no longer exists on this rebuilt hub page). Token-
 * driven, so it renders correctly on both light and night surfaces.
 * Deliberately scalable: pages map over data/practitioners.ts and this card
 * never assumes how many trainers exist. Genuine people and genuine
 * photographs only.
 *
 * The in-portal profile page (/trainers/[slug]) was retired on 2026-09-02 by
 * founder direction. The card therefore links OUTWARD to the trainer's own
 * published profile instead of to a route that no longer exists — external,
 * new tab, with the usual rel and an explicit aria-label, matching how every
 * other outbound link in this portal behaves.
 *
 * HRD Corp badge added 2026-09-06, founder direction ("Update section:
 * 'Who delivers this' and add HRD logo") — same badge-overlay pattern
 * already used on /trainers and the programme hub's own "Who teaches you"
 * section (bottom-right of the photo, links out for details), added HERE
 * rather than re-implemented locally because this component's only caller
 * is exactly that section. Conditional on `person.hrdCorpAccreditation`, so
 * a future trainer without one renders exactly as before.
 */
export function TrainerCard({ person }: { person: Practitioner }) {
  const profileUrl = person.mediumProfile ?? person.linkedin;
  const accreditation = person.hrdCorpAccreditation;

  return (
    <Card variant="panel" className="flex flex-col gap-5 sm:flex-row">
      <div className="relative h-24 w-24 shrink-0">
        <Image
          src={assetPath(person.photo)}
          alt={`Photograph of ${person.name}`}
          width={800}
          height={800}
          className="h-24 w-24 rounded-[var(--radius-plate)] object-cover"
        />
        {accreditation && (
          <Link
            href="/hrd-corp"
            title="HRD Corp Accredited Trainer — see details"
            aria-label="HRD Corp Accredited Trainer — see accreditation details"
            className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white p-0.5 shadow-md ring-1 ring-[var(--color-line-strong)]"
          >
            <Image
              src={assetPath(accreditation.badge)}
              alt="HRD Corp Accredited Trainer badge"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          </Link>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-h2">{person.name}</p>
        <p className="text-body-sm mb-1 text-[var(--color-ink-quiet)]">
          {person.role}
        </p>
        {/* Standalone stat line, so mono is kept as the "measured voice". */}
        <p className="text-mono text-body-sm mb-3 text-[var(--color-ink-faint)]">
          {person.experienceLine}
        </p>
        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
          {person.summary}
        </p>
        <div className="mb-5 flex flex-wrap gap-2">
          {person.expertise.slice(0, 3).map((tag) => (
            <Chip key={tag}>{tag}</Chip>
          ))}
        </div>
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Read ${person.name}'s full profile (opens in a new tab)`}
            className="text-body-sm font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Read the full profile ↗
          </a>
        )}
      </div>
    </Card>
  );
}
