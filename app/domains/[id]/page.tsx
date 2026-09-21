import { notFound } from "next/navigation";
import { findDomainById } from "@/modules/catalogue/domains/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * Milestone 1's "one route rendering that domain's name from the database"
 * (MILESTONE_1_EXECUTION_PLAN.md §2 item 6). Parameterised by id — the route
 * shape ADR-023 requires; nothing here knows which domains exist. Styled with
 * the ported primitives (M1b).
 */
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DomainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const domain = await findDomainById(id);
  if (!domain) notFound();

  return (
    <main className="mx-auto max-w-[720px] px-4 py-12 sm:px-6">
      <p className="mb-6">
        <Button variant="text" href="/">
          ← All capability areas
        </Button>
      </p>
      <Card variant="feature">
        <div className="mb-3">
          <Chip tone="primary">{domain.code}</Chip>
        </div>
        <h1 data-testid="domain-name" className="text-display mb-3">
          {domain.name}
        </h1>
        {domain.description && (
          <p className="text-body-lg text-[var(--color-ink-quiet)]">{domain.description}</p>
        )}
        <p className="text-mono mt-6 text-[0.75rem] text-[var(--color-ink-faint)]" data-testid="source">
          Rendered from PostgreSQL · id {domain.id}
        </p>
      </Card>
    </main>
  );
}
