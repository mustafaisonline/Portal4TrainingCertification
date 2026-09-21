import Link from "next/link";
import { listDomains } from "@/modules/catalogue/domains/repository";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * Milestone 1 index — proves the foundation: every item below is read from
 * PostgreSQL through the repository layer at request time. No domain is named
 * in this file (ADR-023 / BR-5). Rendered with the ported design tokens and
 * primitives (M1b) so the token port is exercised by the e2e + axe run; the
 * real homepage replaces this page in M3 (WIREFRAME_TO_PRODUCTION_PLAN.md §7).
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const domains = await listDomains();
  return (
    <main className="mx-auto max-w-[720px] px-4 py-12 sm:px-6">
      <p className="text-label mb-3">Data &amp; AI Academy</p>
      <h1 className="text-h1 mb-2">Capability areas</h1>
      <p className="text-body-sm mb-8 text-[var(--color-ink-quiet)]">Read from the database at request time.</p>
      {domains.length === 0 ? (
        <Card variant="plate" className="p-6">
          <p data-testid="empty" className="text-body-sm text-[var(--color-ink-quiet)]">
            No domains yet — run the seed.
          </p>
        </Card>
      ) : (
        <ul data-testid="domain-list" className="flex flex-col gap-3">
          {domains.map((d) => (
            <li key={d.id}>
              <Card variant="panel" className="flex items-center justify-between gap-4">
                <Link
                  href={`/domains/${d.id}`}
                  data-testid="domain-link"
                  className="font-medium text-[var(--color-primary)] underline-offset-4 hover:underline"
                >
                  {d.name}
                </Link>
                <Chip>{d.code}</Chip>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
