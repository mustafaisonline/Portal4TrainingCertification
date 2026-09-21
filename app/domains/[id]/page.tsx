import Link from "next/link";
import { notFound } from "next/navigation";
import { findDomainById } from "@/modules/catalogue/domains/repository";

/*
 * Milestone 1's "one route rendering that domain's name from the database"
 * (MILESTONE_1_EXECUTION_PLAN.md §2 item 6). Parameterised by id — the route
 * shape ADR-023 requires; nothing here knows which domains exist.
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
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <p>
        <Link href="/">← All capability areas</Link>
      </p>
      <p style={{ fontFamily: "monospace", fontSize: "0.8rem", opacity: 0.7 }}>
        {domain.code}
      </p>
      <h1 data-testid="domain-name">{domain.name}</h1>
      {domain.description && <p>{domain.description}</p>}
      <p style={{ fontSize: "0.85rem", opacity: 0.7 }} data-testid="source">
        Rendered from PostgreSQL · id {domain.id}
      </p>
    </main>
  );
}
