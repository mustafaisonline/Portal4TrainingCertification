/*
 * PORTED 2026-09-21 from project-artifacts/mockup/components/TrainerCard.tsx
 * (ADR-045). Changes on port: takes an `ExpertRecord` (repository type) in
 * place of the mockup's `Practitioner` constant type — `role` → `roleTitle`,
 * `photo` → `photoPath`, `linkedin`/`mediumProfile` now live under
 * `profile`; the mockup's `assetPath()` basePath workaround is dropped.
 */

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import type { ExpertRecord } from "@/modules/catalogue/experts/repository";

/**
 * Reusable trainer card — used on the course detail pages' "Who delivers
 * this" section. Token-driven, so it renders correctly on both light and
 * night surfaces. Deliberately scalable: pages map over the expert
 * repository and this card never assumes how many trainers exist. Genuine
 * people and genuine photographs only.
 *
 * The card links OUTWARD to the trainer's own published profile — external,
 * new tab, with the usual rel and an explicit aria-label, matching how every
 * other outbound link in this portal behaves.
 *
 * HRD Corp badge: conditional on `person.hrdCorpAccreditation`, so a trainer
 * without one renders exactly as before.
 */
export function TrainerCard({ person }: { person: ExpertRecord }) {
  const profileUrl = person.profile.mediumProfile ?? person.profile.linkedin;
  const accreditation = person.hrdCorpAccreditation;

  return (
    <Card variant="panel" className="flex flex-col gap-5 sm:flex-row">
      <div className="relative h-24 w-24 shrink-0">
        <Image
          src={person.photoPath}
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
            className="absolute -bottom-1.5 -right-1.5 rounded-full bg-[var(--color-ground-raised)] p-0.5 shadow-md ring-1 ring-[var(--color-line-strong)]"
          >
            <Image
              src={accreditation.badge}
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
          {person.roleTitle}
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
            className="text-body-sm inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Read the full profile ↗
          </a>
        )}
      </div>
    </Card>
  );
}
