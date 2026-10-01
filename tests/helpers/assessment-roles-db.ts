import { randomUUID } from "node:crypto";
import { getPrisma } from "../../src/db/prisma";

/*
 * Fixtures for the role-test tests (integration + e2e): shared roles with a
 * bank of reviewed questions, organisations, and organisation questions.
 * Relative imports: Playwright resolves no `@/` alias. TEST DATABASE ONLY.
 *
 * Questions are inserted with two bulk inserts (fast — no per-question audit
 * rows). Every fixture question has FIVE options; the correct one is position
 * `correct` (default 1 = "A"). Clean up with `deleteRoleFixtures` — it removes
 * attempts, questions (options cascade), role links, private roles,
 * organisation access grants and the audit rows of everything it deletes.
 */

export const CATEGORIES = ["Pipelines", "Modelling", "Governance"] as const;

export function uniqueSlug(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

export type QuestionStatusName = "draft" | "pending" | "reviewed" | "rejected";

/** Bulk-insert `count` questions of one role/organisation/status, categories cycling through `CATEGORIES`. Returns their ids. */
export async function addQuestions(opts: { roleId: string; organisationId?: string | null; count: number; status?: QuestionStatusName; correct?: number; tag?: string }): Promise<string[]> {
  const prisma = getPrisma();
  const correct = opts.correct ?? 1;
  const tag = opts.tag ?? randomUUID().slice(0, 6);
  const ids = Array.from({ length: opts.count }, () => randomUUID());
  await prisma.roleQuestion.createMany({
    data: ids.map((id, i) => ({
      id,
      roleId: opts.roleId,
      organisationId: opts.organisationId ?? null,
      category: CATEGORIES[i % CATEGORIES.length]!,
      stem: `Fixture question ${tag}-${i + 1}: which option is correct?`,
      modelAnswer: `Fixture model answer ${tag}-${i + 1}: option ${"ABCDE"[correct - 1]} is correct because the fixture says so.`,
      status: opts.status ?? "reviewed",
    })),
  });
  await prisma.roleQuestionOption.createMany({
    data: ids.flatMap((questionId) => [1, 2, 3, 4, 5].map((position) => ({ questionId, position, text: `Option ${"ABCDE"[position - 1]}`, isCorrect: position === correct }))),
  });
  return ids;
}

/** A published SHARED role with `reviewed` reviewed questions (default 30). */
export async function createSharedRole(opts: { slugPrefix?: string; reviewed?: number; published?: boolean; correct?: number; name?: string } = {}): Promise<{ roleId: string; slug: string; reviewedIds: string[] }> {
  const slug = uniqueSlug(opts.slugPrefix ?? "t-role");
  const role = await getPrisma().assessmentRole.create({
    data: { slug, name: opts.name ?? `Test role ${slug}`, description: "A role fixture.", published: opts.published ?? true, position: 9000 },
  });
  const reviewedIds = await addQuestions({ roleId: role.id, count: opts.reviewed ?? 30, status: "reviewed", correct: opts.correct });
  return { roleId: role.id, slug, reviewedIds };
}

/** An organisation, optionally offering the given shared roles. */
export async function createOrganisationFixture(opts: { slugPrefix?: string; type?: "company" | "education"; published?: boolean; roleIds?: string[] } = {}): Promise<{ organisationId: string; slug: string }> {
  const prisma = getPrisma();
  const slug = uniqueSlug(opts.slugPrefix ?? "t-org");
  const org = await prisma.organisation.create({ data: { slug, name: `Test organisation ${slug}`, type: opts.type ?? "company", contactEmail: `${slug}@example.test`, published: opts.published ?? true } });
  for (const roleId of opts.roleIds ?? []) await prisma.organisationRole.create({ data: { organisationId: org.id, roleId } });
  return { organisationId: org.id, slug };
}

/** Removes everything the fixtures (and the code under test) created for these roles / organisations. Safe to call twice. */
export async function deleteRoleFixtures(opts: { roleIds?: string[]; organisationIds?: string[] }): Promise<void> {
  const prisma = getPrisma();
  const organisationIds = opts.organisationIds ?? [];
  const privateRoleIds = (await prisma.assessmentRole.findMany({ where: { organisationId: { in: organisationIds } }, select: { id: true } })).map((r) => r.id);
  const roleIds = [...new Set([...(opts.roleIds ?? []), ...privateRoleIds])];
  const questionIds = (await prisma.roleQuestion.findMany({ where: { OR: [{ roleId: { in: roleIds } }, { organisationId: { in: organisationIds } }] }, select: { id: true } })).map((q) => q.id);
  const attemptIds = (await prisma.roleTestAttempt.findMany({ where: { OR: [{ roleId: { in: roleIds } }, { organisationId: { in: organisationIds } }] }, select: { id: true } })).map((a) => a.id);
  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { entityId: { in: [...roleIds, ...organisationIds, ...questionIds, ...attemptIds] } } }),
    prisma.roleTestAttempt.deleteMany({ where: { id: { in: attemptIds } } }),
    prisma.roleQuestion.deleteMany({ where: { id: { in: questionIds } } }),
    prisma.organisationRole.deleteMany({ where: { OR: [{ roleId: { in: roleIds } }, { organisationId: { in: organisationIds } }] } }),
    prisma.assessmentRole.deleteMany({ where: { id: { in: roleIds } } }),
    prisma.userRole.deleteMany({ where: { scopeType: "organisation", scopeId: { in: organisationIds } } }),
    prisma.organisation.deleteMany({ where: { id: { in: organisationIds } } }),
  ]);
}
