import Link from "next/link";
import { listDomains } from "@/modules/catalogue/domains/repository";

/*
 * Milestone 1 index — a plain page that proves the foundation: every item
 * below is read from PostgreSQL through the repository layer at request time.
 * No domain is named in this file (ADR-023 / BR-5). The real homepage replaces
 * this in the milestone that ports the public pages (WIREFRAME_TO_PRODUCTION_
 * PLAN.md §7 M3).
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const domains = await listDomains();
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1>Data &amp; AI Academy</h1>
      <p>Capability areas, read from the database:</p>
      {domains.length === 0 ? (
        <p data-testid="empty">No domains yet — run the seed.</p>
      ) : (
        <ul data-testid="domain-list">
          {domains.map((d) => (
            <li key={d.id}>
              <Link href={`/domains/${d.id}`} data-testid="domain-link">
                {d.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
