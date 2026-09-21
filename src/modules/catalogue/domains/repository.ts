import { getPrisma } from "@/db/prisma";

/*
 * Domain repository — the data-access layer for `domains` (module: catalogue).
 *
 * Milestone 1's "one repository function taking a domainId parameter"
 * (MILESTONE_1_EXECUTION_PLAN.md §2 item 5). Callers never see Prisma types
 * directly; they get plain records, so the ORM stays replaceable behind this
 * boundary (ADR-001 module boundaries; AP-10 stability).
 *
 * ADR-023 / BR-5: no domain code, name or slug is ever a literal in
 * application code — every lookup is parameterised. The grep proof
 * (Milestone 1 criterion 9) enforces this.
 */

export type DomainRecord = {
  id: string;
  code: string;
  name: string;
  slug: string;
  description: string | null;
};

const select = {
  id: true,
  code: true,
  name: true,
  slug: true,
  description: true,
} as const;

export async function findDomainById(domainId: string): Promise<DomainRecord | null> {
  return getPrisma().domain.findUnique({ where: { id: domainId }, select });
}

export async function findDomainBySlug(slug: string): Promise<DomainRecord | null> {
  return getPrisma().domain.findUnique({ where: { slug }, select });
}

export async function listDomains(): Promise<DomainRecord[]> {
  return getPrisma().domain.findMany({ select, orderBy: { code: "asc" } });
}
