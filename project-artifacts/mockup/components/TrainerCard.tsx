import Image from "next/image";
import Link from "next/link";
import { Card } from "./ui/Card";
import { Chip } from "./ui/Chip";
import type { Practitioner } from "@/data/practitioners";

/**
 * Reusable trainer card — used on the P01 "Learn from practitioners"
 * section and the /trainers index. Token-driven, so it renders correctly
 * on both light and night surfaces. Deliberately scalable: the pages map
 * over data/practitioners.ts, and this card never assumes how many
 * trainers exist. Genuine people and genuine photographs only.
 */
export function TrainerCard({ person }: { person: Practitioner }) {
  return (
    <Card variant="panel" className="flex flex-col gap-5 sm:flex-row">
      <Image
        src={person.photo}
        alt={`Photograph of ${person.name}`}
        width={800}
        height={800}
        className="h-24 w-24 shrink-0 rounded-[var(--radius-plate)] object-cover"
      />
      <div className="min-w-0">
        <p className="text-h2">{person.name}</p>
        <p className="text-body-sm mb-1 text-[var(--color-ink-quiet)]">
          {person.role}
        </p>
        <p className="text-mono mb-3 text-[0.8rem] text-[var(--color-ink-faint)]">
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
        <Link
          href={`/trainers/${person.slug}`}
          className="text-body-sm font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
        >
          View full profile →
        </Link>
      </div>
    </Card>
  );
}
