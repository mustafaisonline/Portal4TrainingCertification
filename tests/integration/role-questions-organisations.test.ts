import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { MIN_PRIVATE_ROLE_QUESTIONS } from "@/modules/assessment/constants";
import { finishRoleAttempt, startRoleAttempt } from "@/modules/assessment/attempts.repository";
import {
  addRoleToOrganisation,
  createOrganisation,
  createPrivateRole,
  getOrganisationById,
  getOrganisationBySlug,
  grantOrganisationAccess,
  listOrganisationMembers,
  listOrganisationRoles,
  listOrganisationsForAdmin,
  listPublishedOrganisations,
  organisationForUser,
  removeRoleFromOrganisation,
  revokeOrganisationAccess,
  setOrganisationPublished,
  updateOrganisation,
  updatePrivateRole,
} from "@/modules/assessment/organisations.repository";
import {
  bulkSetStatus,
  countReviewedShared,
  countsByStatus,
  createOrganisationQuestion,
  createQuestion,
  deleteOrganisationQuestion,
  deleteQuestion,
  importDraftQuestions,
  listQuestionsForAdmin,
  listQuestionsForOrganisation,
  setQuestionStatus,
  updateOrganisationQuestion,
  updateQuestion,
  type QuestionContent,
} from "@/modules/assessment/questions.repository";
import { createRole, deleteRole, getRoleById, roleDeletionInfo, getSharedRoleBySlug, listPublishedSharedRoles, listRolesForAdmin, setRolePublished, updateRole } from "@/modules/assessment/roles.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { activeRolesForUser } from "@/modules/identity/roles.repository";
import { addQuestions, createOrganisationFixture, createSharedRole, deleteRoleFixtures, uniqueSlug } from "../helpers/assessment-roles-db";
import { createAdminUser, createCertificateUser } from "../helpers/certificates-db";
import { deleteTestUser } from "../helpers/identity-db";

/*
 * Roles, questions and organisations against the REAL test database
 * (CR-2026-10-01-1711): question validation and the draft → reviewed flow
 * (import is idempotent), editing only while not reviewed, the organisation's
 * ownership rules (own organisation only, offered roles only, new = pending,
 * editing an approved one = pending again, never served until approved), the
 * listed-role rules (a private role needs 10 approved questions), organisation
 * access through `user_roles`, and an audit row for every administrator /
 * organisation write. Every fixture is removed afterwards.
 */

const prisma = getPrisma();
const roleIds: string[] = [];
const orgIds: string[] = [];
let admin: { id: string; email: string };
let orgUser: { id: string; email: string; name: string };
let outsider: { id: string; email: string; name: string };

const content = (n: number, over: Partial<QuestionContent> = {}): QuestionContent => ({
  category: "Pipelines",
  stem: `Which of these makes ingestion step ${n} safe to retry?`,
  options: [
    { text: "Make it idempotent", isCorrect: true },
    { text: "Run it twice and hope", isCorrect: false },
    { text: "Delete the target first", isCorrect: false },
    { text: "Disable the scheduler", isCorrect: false },
    { text: "Ignore failures", isCorrect: false },
  ],
  modelAnswer: `A strong answer for ${n}: retries are safe when the step is idempotent, so I would key writes naturally and test a double run.`,
  ...over,
});

const actions = async (entityType: string, id: string) => (await listAuditForEntity(prisma, entityType, id)).map((r) => r.action);

beforeAll(async () => {
  admin = await createAdminUser("rq-admin");
  orgUser = await createCertificateUser({ prefix: "rq-org", legalName: "Olive Org" });
  outsider = await createCertificateUser({ prefix: "rq-out", legalName: "Otto Outsider" });
});

afterAll(async () => {
  await deleteRoleFixtures({ roleIds, organisationIds: orgIds });
  await deleteTestUser(orgUser.email);
  await deleteTestUser(outsider.email);
  await deleteTestUser(admin.email);
  await disconnectPrisma();
});

describe("roles", () => {
  it("creates a shared role (URL name from the name), refuses a duplicate, edits, publishes — each audited", async () => {
    const name = `Data Engineer ${uniqueSlug("x")}`;
    const created = await withTransaction((tx) => createRole(tx, { name, description: "Builds pipelines." }, admin.id));
    roleIds.push(created.id);
    expect(created.slug).toBe(name.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    expect(created).toMatchObject({ published: false, organisationId: null });
    await expect(withTransaction((tx) => createRole(tx, { name: "Other", slug: created.slug, description: "" }, admin.id))).rejects.toMatchObject({ reason: "slug_taken" });
    await expect(withTransaction((tx) => createRole(tx, { name: "x", description: "" }, admin.id))).rejects.toMatchObject({ reason: "invalid_input" });

    const updated = await withTransaction((tx) => updateRole(tx, created.id, { description: "Builds and runs data pipelines.", position: 3 }, admin.id));
    expect(updated).toMatchObject({ description: "Builds and runs data pipelines.", position: 3, slug: created.slug });
    expect(await getSharedRoleBySlug(created.slug)).toBeNull(); // not published yet
    await withTransaction((tx) => setRolePublished(tx, created.id, true, admin.id));
    await withTransaction((tx) => setRolePublished(tx, created.id, true, admin.id)); // no-op, no second audit row
    expect(await getSharedRoleBySlug(created.slug)).toMatchObject({ id: created.id, reviewedQuestionCount: 0 });
    expect(await actions("assessment_role", created.id)).toEqual(["assessment_role.created", "assessment_role.updated", "assessment_role.published_changed"]);
    await expect(withTransaction((tx) => updateRole(tx, "00000000-0000-4000-8000-000000000000", {}, admin.id))).rejects.toMatchObject({ reason: "not_found" });
  });

  it("deletes a shared role nobody has tested (questions and organisation links go with it, audited); refuses one with attempts, an organisation's own role, and an unknown one", async () => {
    const free = await createSharedRole({ slugPrefix: "t-rq-del", reviewed: 4 });
    const org = await createOrganisationFixture({ slugPrefix: "t-rq-delorg", roleIds: [free.roleId] });
    orgIds.push(org.organisationId);
    expect(await roleDeletionInfo(free.roleId)).toEqual({ attempts: 0, questions: 4, organisationLinks: 1 });
    const removed = await withTransaction((tx) => deleteRole(tx, free.roleId, admin.id));
    expect(removed).toEqual({ questions: 4, organisationLinks: 1 });
    expect(await getRoleById(free.roleId)).toBeNull();
    expect(await prisma.roleQuestion.count({ where: { roleId: free.roleId } })).toBe(0);
    expect(await prisma.organisationRole.count({ where: { roleId: free.roleId } })).toBe(0);
    expect(await actions("assessment_role", free.roleId)).toEqual(["assessment_role.deleted"]);
    await prisma.auditLog.deleteMany({ where: { entityType: "assessment_role", entityId: free.roleId } });

    const tested = await createSharedRole({ slugPrefix: "t-rq-deltested", reviewed: 3 });
    roleIds.push(tested.roleId);
    await prisma.roleTestAttempt.create({ data: { userId: outsider.id, roleId: tested.roleId, size: 3, questionIds: tested.reviewedIds, answers: {} } });
    expect((await roleDeletionInfo(tested.roleId)).attempts).toBe(1);
    await expect(withTransaction((tx) => deleteRole(tx, tested.roleId, admin.id))).rejects.toMatchObject({ reason: "not_editable" });
    expect(await getRoleById(tested.roleId)).not.toBeNull();
    expect(await actions("assessment_role", tested.roleId)).toEqual([]);

    const priv = await createOrganisationFixture({ slugPrefix: "t-rq-delp" });
    orgIds.push(priv.organisationId);
    const privateRole = await withTransaction((tx) => createPrivateRole(tx, priv.organisationId, { name: "Private To Keep", description: "x" }, admin.id));
    await expect(withTransaction((tx) => deleteRole(tx, privateRole.id, admin.id))).rejects.toMatchObject({ reason: "forbidden" });
    await expect(withTransaction((tx) => deleteRole(tx, "00000000-0000-4000-8000-000000000000", admin.id))).rejects.toMatchObject({ reason: "not_found" });
  });

  it("lists published shared roles with their reviewed counts, and every role (with counts by status) for the administrator", async () => {
    const r = await createSharedRole({ slugPrefix: "t-rq-list", reviewed: 7 });
    roleIds.push(r.roleId);
    await addQuestions({ roleId: r.roleId, count: 3, status: "draft" });
    const hidden = await createSharedRole({ slugPrefix: "t-rq-hidden", reviewed: 2, published: false });
    roleIds.push(hidden.roleId);
    const priv = await createOrganisationFixture({ slugPrefix: "t-rq-p" });
    orgIds.push(priv.organisationId);
    const privateRole = await withTransaction((tx) => createPrivateRole(tx, priv.organisationId, { name: "Hidden Private", description: "x" }, admin.id));

    const listed = await listPublishedSharedRoles();
    expect(listed.find((x) => x.id === r.roleId)).toMatchObject({ slug: r.slug, reviewedQuestionCount: 7 });
    expect(listed.some((x) => x.id === hidden.roleId)).toBe(false);
    expect(listed.some((x) => x.id === privateRole.id)).toBe(false);
    expect(await getSharedRoleBySlug(privateRole.slug)).toBeNull();

    const all = await listRolesForAdmin();
    expect(all.find((x) => x.id === r.roleId)!.counts).toEqual({ draft: 3, pending: 0, reviewed: 7, rejected: 0 });
    expect(all.find((x) => x.id === privateRole.id)).toMatchObject({ organisationName: expect.any(String), counts: { draft: 0, pending: 0, reviewed: 0, rejected: 0 } });
    expect(all.some((x) => x.id === hidden.roleId)).toBe(true);
    expect((await getRoleById(r.roleId))!.slug).toBe(r.slug);
    expect(await getRoleById("nonsense")).toBeNull();
  });
});

describe("questions — validation, import, edit, review", () => {
  let role: { roleId: string; slug: string; reviewedIds: string[] };
  beforeAll(async () => {
    role = await createSharedRole({ slugPrefix: "t-rq-q", reviewed: 0 });
    roleIds.push(role.roleId);
  });

  it("createQuestion stores five options with exactly one correct, and refuses anything else; audited", async () => {
    const q = await withTransaction((tx) => createQuestion(tx, { ...content(1), roleId: role.roleId, organisationId: null, status: "draft", createdByUserId: admin.id, source: "Test blueprint" }));
    expect(q.options.map((o) => o.position)).toEqual([1, 2, 3, 4, 5]);
    expect(q.options.filter((o) => o.isCorrect)).toHaveLength(1);
    expect(q).toMatchObject({ status: "draft", organisationId: null, source: "Test blueprint", createdByName: expect.any(String) });
    expect(await actions("role_question", q.id)).toEqual(["role_question.created"]);

    const bad = (c: QuestionContent) => withTransaction((tx) => createQuestion(tx, { ...c, roleId: role.roleId, organisationId: null, status: "draft" }));
    await expect(bad(content(2, { options: content(2).options.slice(0, 4) }))).rejects.toMatchObject({ reason: "invalid_input" });
    await expect(bad(content(2, { options: content(2).options.map((o) => ({ ...o, isCorrect: true })) }))).rejects.toMatchObject({ reason: "invalid_input" });
    await expect(bad(content(2, { stem: "" }))).rejects.toMatchObject({ reason: "invalid_input" });
    await expect(bad(content(2, { modelAnswer: "" }))).rejects.toMatchObject({ reason: "invalid_input" });
    await expect(withTransaction((tx) => createQuestion(tx, { ...content(3), roleId: "00000000-0000-4000-8000-000000000000", organisationId: null, status: "draft" }))).rejects.toMatchObject({ reason: "not_found" });
    expect(await prisma.roleQuestion.count({ where: { roleId: role.roleId } })).toBe(1); // the refusals wrote nothing
  });

  it("importDraftQuestions is idempotent (a stem the role already holds is skipped) and all-or-nothing on a bad item", async () => {
    const items = [content(10), content(11), content(12)];
    expect(await withTransaction((tx) => importDraftQuestions(tx, role.roleId, items, admin.id))).toEqual({ inserted: 3, skipped: 0 });
    expect(await withTransaction((tx) => importDraftQuestions(tx, role.roleId, [...items, content(13)], admin.id))).toEqual({ inserted: 1, skipped: 3 });
    expect(await withTransaction((tx) => importDraftQuestions(tx, role.roleId, [{ ...content(10), stem: content(10).stem.toUpperCase() }], admin.id))).toEqual({ inserted: 0, skipped: 1 });
    await expect(withTransaction((tx) => importDraftQuestions(tx, role.roleId, [content(20), content(21, { options: [] })], admin.id))).rejects.toThrowError(/question 2/);
    expect(await prisma.roleQuestion.count({ where: { roleId: role.roleId, stem: content(20).stem } })).toBe(0);
    const counts = await countsByStatus(role.roleId, null);
    expect(counts).toEqual({ draft: 5, pending: 0, reviewed: 0, rejected: 0 }); // 1 created + 4 imported
    expect((await actions("assessment_role", role.roleId)).filter((a) => a === "role_question.imported")).toHaveLength(3);
  });

  it("draft → reviewed records who and when; reviewed questions cannot be edited or deleted until returned to draft", async () => {
    const q = (await listQuestionsForAdmin({ roleId: role.roleId, status: "draft" })).rows[0]!;
    expect(await withTransaction((tx) => setQuestionStatus(tx, q.id, "reviewed", admin.id))).toEqual({ id: q.id, from: "draft", to: "reviewed" });
    const reviewed = (await listQuestionsForAdmin({ roleId: role.roleId, status: "reviewed" })).rows[0]!;
    expect(reviewed).toMatchObject({ id: q.id, reviewedByName: expect.any(String) });
    expect(reviewed.reviewedAt).toBeInstanceOf(Date);
    expect(await countReviewedShared(role.roleId)).toBe(1);

    await expect(withTransaction((tx) => updateQuestion(tx, q.id, content(99), admin.id))).rejects.toMatchObject({ reason: "not_editable" });
    await expect(withTransaction((tx) => deleteQuestion(tx, q.id, admin.id))).rejects.toMatchObject({ reason: "not_editable" });

    await withTransaction((tx) => setQuestionStatus(tx, q.id, "draft", admin.id, "needs another look"));
    const back = (await listQuestionsForAdmin({ roleId: role.roleId })).rows.find((r) => r.id === q.id)!;
    expect(back.reviewedAt).toBeNull();
    expect(back.reviewedByName).toBeNull();
    const edited = await withTransaction((tx) => updateQuestion(tx, q.id, content(99), admin.id));
    expect(edited.stem).toBe(content(99).stem);
    expect(edited.options).toHaveLength(5);
    expect(edited.status).toBe("draft");
    await withTransaction((tx) => deleteQuestion(tx, q.id, admin.id));
    expect((await prisma.roleQuestion.findUnique({ where: { id: q.id } }))).toBeNull();
    expect(await prisma.roleQuestionOption.count({ where: { questionId: q.id } })).toBe(0); // options cascade
    const audit = await listAuditForEntity(prisma, "role_question", q.id);
    expect(audit.map((a) => a.action)).toEqual(["role_question.created", "role_question.status_changed", "role_question.status_changed", "role_question.updated", "role_question.deleted"]);
    expect(audit[2]!.reason).toBe("needs another look");
  });

  it("bulkSetStatus moves a whole bank at once (one audit row) and the admin list filters and pages", async () => {
    await addQuestions({ roleId: role.roleId, count: 25, status: "draft", tag: "bulk" });
    const before = await countsByStatus(role.roleId, null);
    expect(await withTransaction((tx) => bulkSetStatus(tx, { roleId: role.roleId, organisationId: null, from: "draft", to: "reviewed" }, admin.id))).toBe(before.draft);
    expect(await withTransaction((tx) => bulkSetStatus(tx, { roleId: role.roleId, organisationId: null, from: "draft", to: "reviewed" }, admin.id))).toBe(0);
    await expect(withTransaction((tx) => bulkSetStatus(tx, { roleId: role.roleId, organisationId: null, from: "draft", to: "draft" }, admin.id))).rejects.toMatchObject({ reason: "invalid_input" });
    const after = await countsByStatus(role.roleId, null);
    expect(after).toEqual({ draft: 0, pending: 0, reviewed: before.draft + before.reviewed, rejected: 0 });
    expect(await countReviewedShared(role.roleId)).toBe(after.reviewed);
    expect((await actions("assessment_role", role.roleId)).filter((a) => a === "role_question.bulk_status_changed")).toHaveLength(1);

    const p1 = await listQuestionsForAdmin({ roleId: role.roleId, status: "reviewed", page: 1 });
    expect(p1.total).toBe(after.reviewed);
    expect(p1.rows).toHaveLength(20);
    expect(p1.pages).toBe(Math.ceil(after.reviewed / 20));
    expect((await listQuestionsForAdmin({ roleId: role.roleId, status: "reviewed", page: 99 })).page).toBe(p1.pages);
    expect((await listQuestionsForAdmin({ roleId: role.roleId, status: "draft" })).total).toBe(0);
    expect((await listQuestionsForAdmin({ roleId: role.roleId, organisationId: null })).total).toBe(after.reviewed); // shared bank only
    expect((await listQuestionsForAdmin({ roleId: "nope" })).rows).toEqual([]);
  });
});

describe("organisations — records, access, roles", () => {
  it("registers, edits and publishes an organisation; an unpublished one is not public; each step audited", async () => {
    const name = `Org ${uniqueSlug("n")}`;
    const o = await withTransaction((tx) => createOrganisation(tx, { name, type: "company", contactEmail: "HR@Example.Test", logoPath: "/logos/x.svg" }, admin.id));
    orgIds.push(o.id);
    expect(o).toMatchObject({ published: false, contactEmail: "hr@example.test", type: "company", logoPath: "/logos/x.svg" });
    await expect(withTransaction((tx) => createOrganisation(tx, { name: "Another", slug: o.slug, type: "education", contactEmail: "a@example.test" }, admin.id))).rejects.toMatchObject({ reason: "slug_taken" });
    await expect(withTransaction((tx) => createOrganisation(tx, { name: "Bad", type: "charity" as never, contactEmail: "a@example.test" }, admin.id))).rejects.toMatchObject({ reason: "invalid_input" });
    await expect(withTransaction((tx) => createOrganisation(tx, { name: "Bad", type: "company", contactEmail: "nope" }, admin.id))).rejects.toMatchObject({ reason: "invalid_input" });

    const u = await withTransaction((tx) => updateOrganisation(tx, o.id, { type: "education", logoPath: null }, admin.id));
    expect(u).toMatchObject({ type: "education", logoPath: null, slug: o.slug });
    expect(await getOrganisationBySlug(o.slug)).toBeNull();
    await withTransaction((tx) => setOrganisationPublished(tx, o.id, true, admin.id));
    expect((await getOrganisationBySlug(o.slug))!.id).toBe(o.id);
    expect((await getOrganisationById(o.id))!.published).toBe(true);
    expect(await actions("organisation", o.id)).toEqual(["organisation.created", "organisation.updated", "organisation.published_changed"]);
    const row = (await listOrganisationsForAdmin()).find((x) => x.id === o.id)!;
    expect(row).toMatchObject({ roleCount: 0, memberCount: 0, pendingQuestionCount: 0 });
  });

  it("access: grant → organisationForUser, members, scoped user_roles row, audited; revoke removes it; the first-granted organisation wins", async () => {
    const a = await createOrganisationFixture({ slugPrefix: "t-rq-acc-a" });
    const b = await createOrganisationFixture({ slugPrefix: "t-rq-acc-b" });
    orgIds.push(a.organisationId, b.organisationId);
    expect(await organisationForUser(orgUser.id)).toBeNull();
    expect(await withTransaction((tx) => grantOrganisationAccess(tx, { userId: orgUser.id, organisationId: a.organisationId, grantedByUserId: admin.id }))).toBe(true);
    expect(await withTransaction((tx) => grantOrganisationAccess(tx, { userId: orgUser.id, organisationId: a.organisationId, grantedByUserId: admin.id }))).toBe(false);
    expect(await activeRolesForUser(orgUser.id)).toEqual([{ role: "org_admin", scopeType: "organisation", scopeId: a.organisationId }]);
    expect((await organisationForUser(orgUser.id))!.id).toBe(a.organisationId);
    expect((await listOrganisationMembers(a.organisationId)).map((m) => m.userId)).toEqual([orgUser.id]);
    expect((await listOrganisationsForAdmin()).find((x) => x.id === a.organisationId)!.memberCount).toBe(1);
    expect(await actions("organisation", a.organisationId)).toEqual(["organisation_access.granted"]);
    expect((await actions("user", orgUser.id)).filter((x) => x === "role.granted")).toHaveLength(1);

    await withTransaction((tx) => grantOrganisationAccess(tx, { userId: orgUser.id, organisationId: b.organisationId, grantedByUserId: admin.id }));
    expect((await organisationForUser(orgUser.id))!.id).toBe(a.organisationId);
    expect(await withTransaction((tx) => revokeOrganisationAccess(tx, { userId: orgUser.id, organisationId: a.organisationId, revokedByUserId: admin.id }))).toBe(true);
    expect(await withTransaction((tx) => revokeOrganisationAccess(tx, { userId: orgUser.id, organisationId: a.organisationId, revokedByUserId: admin.id }))).toBe(false);
    expect((await organisationForUser(orgUser.id))!.id).toBe(b.organisationId);
    expect(await listOrganisationMembers(a.organisationId)).toEqual([]);
    expect(await actions("organisation", a.organisationId)).toEqual(["organisation_access.granted", "organisation_access.revoked"]);
    await withTransaction((tx) => revokeOrganisationAccess(tx, { userId: orgUser.id, organisationId: b.organisationId, revokedByUserId: admin.id }));
    expect(await organisationForUser(orgUser.id)).toBeNull();
    // Re-granting re-activates (the existing grant/revoke semantics).
    expect(await withTransaction((tx) => grantOrganisationAccess(tx, { userId: orgUser.id, organisationId: a.organisationId, grantedByUserId: admin.id }))).toBe(true);
    await expect(withTransaction((tx) => grantOrganisationAccess(tx, { userId: orgUser.id, organisationId: "00000000-0000-4000-8000-000000000000", grantedByUserId: admin.id }))).rejects.toMatchObject({ reason: "not_found" });
    await expect(withTransaction((tx) => grantOrganisationAccess(tx, { userId: "00000000-0000-4000-8000-000000000000", organisationId: a.organisationId, grantedByUserId: admin.id }))).rejects.toMatchObject({ reason: "not_found" });
    await withTransaction((tx) => revokeOrganisationAccess(tx, { userId: orgUser.id, organisationId: a.organisationId, revokedByUserId: admin.id }));
  });

  it("offering roles: a shared role can be added/removed; another organisation's private role cannot be added", async () => {
    const shared = await createSharedRole({ slugPrefix: "t-rq-off", reviewed: 3 });
    roleIds.push(shared.roleId);
    const a = await createOrganisationFixture({ slugPrefix: "t-rq-off-a" });
    const b = await createOrganisationFixture({ slugPrefix: "t-rq-off-b" });
    orgIds.push(a.organisationId, b.organisationId);
    expect(await withTransaction((tx) => addRoleToOrganisation(tx, a.organisationId, shared.roleId, admin.id))).toBe(true);
    expect(await withTransaction((tx) => addRoleToOrganisation(tx, a.organisationId, shared.roleId, admin.id))).toBe(false);
    expect((await listOrganisationRoles(a.organisationId)).map((r) => r.id)).toEqual([shared.roleId]);
    const priv = await withTransaction((tx) => createPrivateRole(tx, a.organisationId, { name: "Owned", description: "x" }, admin.id));
    await expect(withTransaction((tx) => addRoleToOrganisation(tx, b.organisationId, priv.id, admin.id))).rejects.toMatchObject({ reason: "forbidden" });
    await expect(withTransaction((tx) => addRoleToOrganisation(tx, b.organisationId, "00000000-0000-4000-8000-000000000000", admin.id))).rejects.toMatchObject({ reason: "not_found" });
    expect(await withTransaction((tx) => removeRoleFromOrganisation(tx, a.organisationId, shared.roleId, admin.id))).toBe(true);
    expect(await withTransaction((tx) => removeRoleFromOrganisation(tx, a.organisationId, shared.roleId, admin.id))).toBe(false);
    expect(await actions("organisation", a.organisationId)).toEqual(["organisation_role.added", "organisation_role.added", "organisation_role.removed"]);
  });
});

describe("organisation questions — ownership and approval", () => {
  let shared: { roleId: string; reviewedIds: string[] };
  let org: { organisationId: string; slug: string };
  let rival: { organisationId: string; slug: string };
  let notOffered: { roleId: string };

  beforeAll(async () => {
    shared = await createSharedRole({ slugPrefix: "t-rq-own", reviewed: 25 });
    notOffered = await createSharedRole({ slugPrefix: "t-rq-noff", reviewed: 5 });
    roleIds.push(shared.roleId, notOffered.roleId);
    org = await createOrganisationFixture({ slugPrefix: "t-rq-own-org", roleIds: [shared.roleId] });
    rival = await createOrganisationFixture({ slugPrefix: "t-rq-own-riv", roleIds: [shared.roleId] });
    orgIds.push(org.organisationId, rival.organisationId);
    await withTransaction((tx) => grantOrganisationAccess(tx, { userId: orgUser.id, organisationId: org.organisationId, grantedByUserId: admin.id }));
  });

  it("only a member of the organisation can write, only for roles it offers; the question starts pending", async () => {
    const q = await withTransaction((tx) => createOrganisationQuestion(tx, { ...content(1), userId: orgUser.id, organisationId: org.organisationId, roleId: shared.roleId }));
    expect(q).toMatchObject({ status: "pending", organisationId: org.organisationId, createdByName: orgUser.name });
    await expect(withTransaction((tx) => createOrganisationQuestion(tx, { ...content(2), userId: outsider.id, organisationId: org.organisationId, roleId: shared.roleId }))).rejects.toMatchObject({ reason: "forbidden" });
    await expect(withTransaction((tx) => createOrganisationQuestion(tx, { ...content(2), userId: orgUser.id, organisationId: rival.organisationId, roleId: shared.roleId }))).rejects.toMatchObject({ reason: "forbidden" });
    await expect(withTransaction((tx) => createOrganisationQuestion(tx, { ...content(2), userId: orgUser.id, organisationId: org.organisationId, roleId: notOffered.roleId }))).rejects.toMatchObject({ reason: "role_not_offered" });
    expect(await listQuestionsForOrganisation(org.organisationId)).toHaveLength(1);
    expect(await listQuestionsForOrganisation(rival.organisationId)).toEqual([]);
  });

  it("a member cannot touch another organisation's (or the shared bank's) questions", async () => {
    const rivals = await withTransaction((tx) => createQuestion(tx, { ...content(30), roleId: shared.roleId, organisationId: rival.organisationId, status: "pending" }));
    const sharedQ = await withTransaction((tx) => createQuestion(tx, { ...content(31), roleId: shared.roleId, organisationId: null, status: "draft" }));
    for (const id of [rivals.id, sharedQ.id]) {
      await expect(withTransaction((tx) => updateOrganisationQuestion(tx, { ...content(40), userId: orgUser.id, organisationId: org.organisationId, questionId: id }))).rejects.toMatchObject({ reason: "not_found" });
      await expect(withTransaction((tx) => deleteOrganisationQuestion(tx, { userId: orgUser.id, organisationId: org.organisationId, questionId: id }))).rejects.toMatchObject({ reason: "not_found" });
    }
    // …nor can a non-member act on its own organisation's question.
    const mine = (await listQuestionsForOrganisation(org.organisationId))[0]!;
    await expect(withTransaction((tx) => updateOrganisationQuestion(tx, { ...content(41), userId: outsider.id, organisationId: org.organisationId, questionId: mine.id }))).rejects.toMatchObject({ reason: "forbidden" });
    await expect(withTransaction((tx) => deleteOrganisationQuestion(tx, { userId: outsider.id, organisationId: org.organisationId, questionId: mine.id }))).rejects.toMatchObject({ reason: "forbidden" });
  });

  it("pending/rejected questions are never served; approval brings one into the organisation's tests; editing an approved one sends it back to pending", async () => {
    const candidate = await createCertificateUser({ prefix: "rq-cand", legalName: "Cora Candidate" });
    try {
      const q = await withTransaction((tx) => createOrganisationQuestion(tx, { ...content(50), userId: orgUser.id, organisationId: org.organisationId, roleId: shared.roleId }));
      const served = async () => {
        await prisma.roleTestAttempt.deleteMany({ where: { userId: candidate.id } });
        const a = await withTransaction((tx) => startRoleAttempt(tx, { userId: candidate.id, roleId: shared.roleId, organisationId: org.organisationId, acknowledgedSharing: true }));
        await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: a.id, userId: candidate.id }));
        return a.questionIds;
      };
      expect(await served()).not.toContain(q.id); // pending
      await withTransaction((tx) => setQuestionStatus(tx, q.id, "rejected", admin.id, "unclear"));
      expect(await served()).not.toContain(q.id);
      await withTransaction((tx) => setQuestionStatus(tx, q.id, "reviewed", admin.id));
      expect(await served()).toContain(q.id); // approved: always in the organisation's test
      const publicTest = await withTransaction((tx) => startRoleAttempt(tx, { userId: candidate.id, roleId: shared.roleId }));
      expect(publicTest.questionIds).not.toContain(q.id); // …and never in the public one
      await withTransaction((tx) => finishRoleAttempt(tx, { attemptId: publicTest.id, userId: candidate.id }));

      await expect(withTransaction((tx) => deleteOrganisationQuestion(tx, { userId: orgUser.id, organisationId: org.organisationId, questionId: q.id }))).rejects.toMatchObject({ reason: "not_editable" });
      const edited = await withTransaction((tx) => updateOrganisationQuestion(tx, { ...content(51), userId: orgUser.id, organisationId: org.organisationId, questionId: q.id }));
      expect(edited).toMatchObject({ status: "pending", stem: content(51).stem, reviewedByName: null, reviewedAt: null });
      expect(edited.options).toHaveLength(5);
      expect(await served()).not.toContain(q.id);
      await withTransaction((tx) => deleteOrganisationQuestion(tx, { userId: orgUser.id, organisationId: org.organisationId, questionId: q.id }));
      expect(await prisma.roleQuestion.findUnique({ where: { id: q.id } })).toBeNull();
      expect(await actions("role_question", q.id)).toEqual(["role_question.created", "role_question.status_changed", "role_question.status_changed", "role_question.updated", "role_question.deleted"]);
    } finally {
      await prisma.roleTestAttempt.deleteMany({ where: { userId: candidate.id } });
      await deleteTestUser(candidate.email);
    }
  });

  it("the approval queue: pending organisation questions are listed for the administrator and counted per organisation", async () => {
    const pending = await listQuestionsForAdmin({ organisationId: org.organisationId, status: "pending" });
    expect(pending.total).toBeGreaterThanOrEqual(1);
    expect(pending.rows.every((r) => r.organisationName !== null && r.status === "pending")).toBe(true);
    const row = (await listOrganisationsForAdmin()).find((o) => o.id === org.organisationId)!;
    expect(row.pendingQuestionCount).toBe(pending.total);
    expect(await countsByStatus(shared.roleId, org.organisationId)).toMatchObject({ pending: pending.total });
  });
});

describe("which roles are LISTED, and which organisations", () => {
  it("a private role is listed only with ≥ 10 approved questions (and published); organisations appear only with ≥ 1 listed role", async () => {
    const o = await createOrganisationFixture({ slugPrefix: "t-rq-list-o", published: true });
    orgIds.push(o.organisationId);
    const publicOrgIds = async () => (await listPublishedOrganisations()).map((x) => x.id);
    expect(await publicOrgIds()).not.toContain(o.organisationId); // no roles yet

    const priv = await withTransaction((tx) => createPrivateRole(tx, o.organisationId, { name: "Screening Role", description: "Our own role." }, admin.id));
    expect(priv.slug).toBe(`${o.slug}-screening-role`);
    expect(priv).toMatchObject({ organisationId: o.organisationId, published: true });
    await expect(withTransaction((tx) => createPrivateRole(tx, o.organisationId, { name: "Screening Role", description: "" }, admin.id))).rejects.toMatchObject({ reason: "slug_taken" });
    const renamed = await withTransaction((tx) => updatePrivateRole(tx, o.organisationId, priv.id, { description: "Updated." }, admin.id));
    expect(renamed.description).toBe("Updated.");

    const roleView = async () => (await listOrganisationRoles(o.organisationId)).find((r) => r.id === priv.id)!;
    expect(await roleView()).toMatchObject({ isPrivate: true, approvedQuestionCount: 0, listed: false });

    await addQuestions({ roleId: priv.id, organisationId: o.organisationId, count: MIN_PRIVATE_ROLE_QUESTIONS - 1, status: "reviewed", tag: "a" });
    await addQuestions({ roleId: priv.id, organisationId: o.organisationId, count: 5, status: "pending", tag: "p" }); // pending does not count
    expect(await roleView()).toMatchObject({ approvedQuestionCount: 9, listed: false });
    expect(await publicOrgIds()).not.toContain(o.organisationId);
    expect(await listOrganisationRoles(o.organisationId, { onlyListed: true })).toEqual([]);

    await addQuestions({ roleId: priv.id, organisationId: o.organisationId, count: 1, status: "reviewed", tag: "b" });
    expect(await roleView()).toMatchObject({ approvedQuestionCount: 10, sharedQuestionCount: 0, listed: true });
    const found = (await listPublishedOrganisations()).find((x) => x.id === o.organisationId)!;
    expect(found.listedRoleCount).toBe(1);
    expect((await listOrganisationRoles(o.organisationId, { onlyListed: true })).map((r) => r.id)).toEqual([priv.id]);

    await prisma.assessmentRole.update({ where: { id: priv.id }, data: { published: false } });
    expect((await roleView()).listed).toBe(false);
    await prisma.assessmentRole.update({ where: { id: priv.id }, data: { published: true } });
    await prisma.organisation.update({ where: { id: o.organisationId }, data: { published: false } });
    expect(await publicOrgIds()).not.toContain(o.organisationId); // unpublished organisation
  });

  it("a shared role is listed when the shared bank has reviewed questions OR the organisation has approved ones for it", async () => {
    const empty = await createSharedRole({ slugPrefix: "t-rq-sh-empty", reviewed: 0 });
    const full = await createSharedRole({ slugPrefix: "t-rq-sh-full", reviewed: 12 });
    const unpublished = await createSharedRole({ slugPrefix: "t-rq-sh-off", reviewed: 12, published: false });
    roleIds.push(empty.roleId, full.roleId, unpublished.roleId);
    const o = await createOrganisationFixture({ slugPrefix: "t-rq-sh-o", roleIds: [empty.roleId, full.roleId, unpublished.roleId] });
    orgIds.push(o.organisationId);
    const view = async () => new Map((await listOrganisationRoles(o.organisationId)).map((r) => [r.id, r]));
    let v = await view();
    expect(v.get(empty.roleId)).toMatchObject({ listed: false, sharedQuestionCount: 0 });
    expect(v.get(full.roleId)).toMatchObject({ listed: true, sharedQuestionCount: 12, approvedQuestionCount: 0, isPrivate: false });
    expect(v.get(unpublished.roleId)!.listed).toBe(false);

    await addQuestions({ roleId: empty.roleId, organisationId: o.organisationId, count: 1, status: "pending" });
    expect((await view()).get(empty.roleId)!.listed).toBe(false); // pending is not approved
    await addQuestions({ roleId: empty.roleId, organisationId: o.organisationId, count: 1, status: "reviewed" });
    v = await view();
    expect(v.get(empty.roleId)).toMatchObject({ listed: true, approvedQuestionCount: 1 });
    // Another organisation's approved questions do not make it listed for this one's neighbour.
    const o2 = await createOrganisationFixture({ slugPrefix: "t-rq-sh-o2", roleIds: [empty.roleId] });
    orgIds.push(o2.organisationId);
    expect((await listOrganisationRoles(o2.organisationId))[0]).toMatchObject({ listed: false, approvedQuestionCount: 0 });
    expect(await listOrganisationRoles("garbage")).toEqual([]);
  });
});
