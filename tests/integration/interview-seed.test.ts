import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { removeRoleFromOrganisation } from "@/modules/assessment/organisations.repository";
import { deleteQuestion } from "@/modules/assessment/questions.repository";
import { setRolePublished, updateRole } from "@/modules/assessment/roles.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { approveAllDraftInterviewQuestions } from "../../scripts/approve-interview-questions";
import { seedInterview, type SeedOrganisation } from "../../prisma/seed-interview";
import { addQuestions, createSharedRole, deleteRoleFixtures, uniqueSlug } from "../helpers/assessment-roles-db";
import { createAdminUser, createCertificateUser } from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * The Interview seed and the operator approval script against the REAL test
 * database (CR-2026-10-01-1711): the seed loads a role's questions as DRAFTS,
 * links the first organisation, is idempotent (a second run changes nothing),
 * never undoes what an administrator changed, and skips a missing file. It runs
 * against a temporary folder and unique slugs, so the real "Data Engineer" and
 * "YPT" rows are never created here. The approve-all script moves drafts to
 * reviewed (audited against the administrator), refuses a non-administrator and
 * an unknown role, and is idempotent. Every fixture is removed afterwards.
 */

const prisma = getPrisma();
const tag = uniqueSlug("t-seed");
const roleSlug = `${tag}-role`;
const organisation: SeedOrganisation = { name: `Seed Org ${tag}`, slug: `${tag}-org`, type: "company", contactEmail: `${tag}@example.test`, logoPath: null };
let dir = "";
let admin: { id: string; email: string };
let person: { id: string; email: string; name: string };
const roleIds: string[] = [];
const orgIds: string[] = [];

function question(n: number) {
  return {
    category: n % 2 ? "Pipelines" : "Modelling",
    level: "junior",
    stem: `Seed question ${tag} number ${n}: which design keeps a retried load safe?`,
    options: ["Make the load idempotent", "Run it twice and hope", "Delete the target first", "Turn the scheduler off", "Ignore failures"],
    correct: 0,
    modelAnswer: `Seed model answer ${n}: a retried load is safe when it is idempotent, so I would key the writes naturally and prove it with a double-run test.`,
  };
}

const rolesOf = async (slug: string) => prisma.assessmentRole.findUnique({ where: { slug }, select: { id: true, name: true, published: true, organisationId: true } });
const bankOf = (roleId: string) => prisma.roleQuestion.findMany({ where: { roleId, organisationId: null }, select: { id: true, status: true, createdByUserId: true } });

beforeAll(async () => {
  dir = mkdtempSync(path.join(os.tmpdir(), "interview-seed-"));
  writeFileSync(path.join(dir, "role.json"), JSON.stringify({ role: { slug: roleSlug, name: `Seed Role ${tag}`, description: "A seeded role for the test." }, questions: [1, 2, 3].map(question) }));
  admin = await createAdminUser("seed-admin");
  person = await createCertificateUser({ prefix: "seed-person", legalName: "Pat Person" });
});

afterAll(async () => {
  const role = await rolesOf(roleSlug);
  if (role) roleIds.push(role.id);
  const org = await prisma.organisation.findUnique({ where: { slug: organisation.slug }, select: { id: true } });
  if (org) orgIds.push(org.id);
  await deleteRoleFixtures({ roleIds, organisationIds: orgIds });
  await deleteTestUser(person.email);
  await deleteTestUser(admin.email);
  rmSync(dir, { recursive: true, force: true });
  await disconnectPrisma();
});

describe("seedInterview", () => {
  const options = () => ({ dir, files: ["role.json"] as const, organisation });

  it("creates the published role, imports its questions as drafts (system actor), creates the organisation and links the role", async () => {
    const result = await seedInterview(options());
    expect(result).toEqual({ rolesCreated: 1, rolesKept: 0, filesSkipped: 0, questionsImported: 3, organisationCreated: true, rolesLinked: 1 });

    const role = await rolesOf(roleSlug);
    expect(role).toMatchObject({ name: `Seed Role ${tag}`, published: true, organisationId: null });
    const bank = await bankOf(role!.id);
    expect(bank).toHaveLength(3);
    expect(bank.every((q) => q.status === "draft" && q.createdByUserId === null)).toBe(true); // nothing is approved by the seed
    const options5 = await prisma.roleQuestionOption.findMany({ where: { questionId: bank[0]!.id }, orderBy: { position: "asc" } });
    expect(options5.map((o) => o.isCorrect)).toEqual([true, false, false, false, false]);

    const org = await prisma.organisation.findUnique({ where: { slug: organisation.slug } });
    expect(org).toMatchObject({ name: organisation.name, type: "company", published: true });
    expect(await prisma.organisationRole.count({ where: { organisationId: org!.id, roleId: role!.id } })).toBe(1);
    const audit = await listAuditForEntity(prisma, "assessment_role", role!.id);
    expect(audit.map((a) => a.action)).toEqual(expect.arrayContaining(["assessment_role.created", "role_question.imported"]));
    expect(audit.every((a) => a.actorUserId === null)).toBe(true);
  });

  it("is idempotent: a second run changes nothing", async () => {
    const role = (await rolesOf(roleSlug))!;
    const org = (await prisma.organisation.findUnique({ where: { slug: organisation.slug }, select: { id: true } }))!;
    // Scoped to this test's own rows: other suites share the database.
    const snapshot = async () => ({
      bank: await bankOf(role.id),
      roles: await prisma.assessmentRole.count({ where: { slug: roleSlug } }),
      links: await prisma.organisationRole.count({ where: { organisationId: org.id } }),
      orgs: await prisma.organisation.count({ where: { slug: organisation.slug } }),
      audit: await prisma.auditLog.count({ where: { entityId: { in: [role.id, org.id] } } }),
    });
    const before = await snapshot();
    const result = await seedInterview(options());
    expect(result).toEqual({ rolesCreated: 0, rolesKept: 1, filesSkipped: 0, questionsImported: 0, organisationCreated: false, rolesLinked: 0 });
    expect(await snapshot()).toEqual(before);
  });

  it("never overwrites an administrator's changes: a renamed, unpublished role, a deleted question and a removed link stay as they are", async () => {
    const role = (await rolesOf(roleSlug))!;
    const org = (await prisma.organisation.findUnique({ where: { slug: organisation.slug }, select: { id: true } }))!;
    const [first] = await bankOf(role.id);
    await withTransaction(async (tx) => {
      await updateRole(tx, role.id, { name: "Renamed by an administrator" }, admin.id);
      await setRolePublished(tx, role.id, false, admin.id);
      await deleteQuestion(tx, first!.id, admin.id);
      await removeRoleFromOrganisation(tx, org.id, role.id, admin.id);
    });
    const result = await seedInterview(options());
    expect(result).toMatchObject({ rolesCreated: 0, rolesKept: 1, questionsImported: 0, organisationCreated: false, rolesLinked: 0 });
    expect(await rolesOf(roleSlug)).toMatchObject({ name: "Renamed by an administrator", published: false });
    expect(await bankOf(role.id)).toHaveLength(2);
    expect(await prisma.organisationRole.count({ where: { organisationId: org.id, roleId: role.id } })).toBe(0);
  });

  it("skips a missing role file with a log line instead of failing", async () => {
    const result = await seedInterview({ dir, files: ["does-not-exist.json"], organisation: null });
    expect(result).toEqual({ rolesCreated: 0, rolesKept: 0, filesSkipped: 1, questionsImported: 0, organisationCreated: false, rolesLinked: 0 });
  });

  it("refuses a file that is not valid JSON, naming it", async () => {
    writeFileSync(path.join(dir, "broken.json"), "{ not json");
    await expect(seedInterview({ dir, files: ["broken.json"], organisation: null })).rejects.toThrow(/broken\.json is not valid JSON/);
  });
});

describe("interview:approve-all (approveAllDraftInterviewQuestions)", () => {
  it("approves a role's shared drafts against the administrator, leaves organisation questions and other roles alone, and is idempotent", async () => {
    const target = await createSharedRole({ slugPrefix: "t-appr", reviewed: 2 });
    const other = await createSharedRole({ slugPrefix: "t-appr-other", reviewed: 0 });
    roleIds.push(target.roleId, other.roleId);
    await addQuestions({ roleId: target.roleId, count: 4, status: "draft", tag: "d" });
    await addQuestions({ roleId: target.roleId, count: 1, status: "rejected", tag: "r" });
    await addQuestions({ roleId: other.roleId, count: 3, status: "draft", tag: "o" });

    const first = await approveAllDraftInterviewQuestions(admin.email, target.slug);
    expect(first).toMatchObject({ actorEmail: admin.email, approved: 4, roles: [{ slug: target.slug, approved: 4 }] });
    const counts = await prisma.roleQuestion.groupBy({ by: ["status"], where: { roleId: target.roleId }, _count: { _all: true } });
    expect(Object.fromEntries(counts.map((c) => [c.status, c._count._all]))).toEqual({ reviewed: 6, rejected: 1 });
    expect(await prisma.roleQuestion.count({ where: { roleId: other.roleId, status: "draft" } })).toBe(3); // another role untouched
    const approved = await prisma.roleQuestion.findMany({ where: { roleId: target.roleId, reviewedByUserId: admin.id }, select: { id: true } });
    expect(approved).toHaveLength(4);
    const audit = await listAuditForEntity(prisma, "assessment_role", target.roleId);
    expect(audit.find((a) => a.action === "role_question.bulk_status_changed")?.actorUserId).toBe(admin.id);

    const again = await approveAllDraftInterviewQuestions(admin.email, target.slug);
    expect(again.approved).toBe(0);
  });

  it("refuses a person who is not a platform administrator, an unknown email and an unknown role", async () => {
    const target = await createSharedRole({ slugPrefix: "t-appr-guard", reviewed: 0 });
    roleIds.push(target.roleId);
    await addQuestions({ roleId: target.roleId, count: 2, status: "draft", tag: "g" });
    await expect(approveAllDraftInterviewQuestions(person.email, target.slug)).rejects.toThrow(/not a platform administrator/);
    await expect(approveAllDraftInterviewQuestions("nobody@example.test", target.slug)).rejects.toThrow(/no user with email/);
    await expect(approveAllDraftInterviewQuestions(admin.email, "no-such-role-slug")).rejects.toThrow(/no shared interview role/);
    expect(await prisma.roleQuestion.count({ where: { roleId: target.roleId, status: "draft" } })).toBe(2);
  });
});
