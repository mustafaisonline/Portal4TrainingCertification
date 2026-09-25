import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma } from "@/db/prisma";
import { AUDIT_PAGE_SIZE, getAuditForAdmin, listAuditFilterValues, listAuditForAdmin } from "@/modules/platform/audit/admin.repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { deleteTestUser, uniqueEmail } from "../helpers/identity-db";

/*
 * Audit log administrator read path — integration against the REAL test
 * database (MILESTONE_8_EXECUTION_PLAN.md §2 item 5; §4 criterion 7). The
 * module under test has no write; these tests seed rows through the one
 * production write (`writeAudit`) and clean them up afterwards.
 */

const prisma = getPrisma();
const emails: string[] = [];
/** A per-run entity id so filters isolate this test's rows from everything else. */
const entityA = randomUUID();
const entityB = randomUUID();
let actor: { id: string; email: string };
let other: { id: string; email: string };
let firstCreated: Date;
let lastCreated: Date;

beforeAll(async () => {
  const a = uniqueEmail("m8audit-actor");
  const b = uniqueEmail("m8audit-other");
  emails.push(a, b);
  actor = await prisma.user.create({ data: { email: a, name: "Audit Actor", country: "Malaysia" }, select: { id: true, email: true } });
  other = await prisma.user.create({ data: { email: b, name: "Audit Other", country: "Malaysia" }, select: { id: true, email: true } });

  firstCreated = new Date();
  // `created_at` is stamped by Prisma at millisecond resolution; rows written
  // back-to-back can tie and then sort by their random id. Real audit rows for
  // one entity are never written within the same millisecond, so the fixture
  // simply spaces them out to keep "newest first" deterministic.
  const tick = () => new Promise((r) => setTimeout(r, 2));
  // 3 rows on entity A by the actor, 1 by the other person, 1 by the system.
  await writeAudit(prisma, { actorUserId: actor.id, action: "role.granted", entityType: "m8test", entityId: entityA, after: { role: "platform_admin" } });
  await tick();
  await writeAudit(prisma, { actorUserId: actor.id, action: "role.revoked", entityType: "m8test", entityId: entityA, before: { role: "platform_admin" }, reason: "why" });
  await tick();
  await writeAudit(prisma, { actorUserId: actor.id, action: "profile.updated", entityType: "m8test", entityId: entityA, after: { changed: ["city"] } });
  await tick();
  await writeAudit(prisma, { actorUserId: other.id, action: "profile.updated", entityType: "m8test", entityId: entityA });
  await tick();
  await writeAudit(prisma, { actorUserId: null, action: "job.run", entityType: "m8test", entityId: entityA, after: { queued: 0 } });
  await tick();
  // AUDIT_PAGE_SIZE + 5 rows on entity B for pagination.
  for (let i = 0; i < AUDIT_PAGE_SIZE + 5; i++) {
    await writeAudit(prisma, { actorUserId: actor.id, action: "job.run", entityType: "m8test-b", entityId: entityB, after: { i } });
    await tick();
  }
  lastCreated = new Date();
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { entityId: { in: [entityA, entityB] } } });
  for (const e of emails) await deleteTestUser(e);
  await disconnectPrisma();
});

describe("listAuditForAdmin", () => {
  it("lists newest first with the actor's email resolved, or 'system' as null", async () => {
    const page = await listAuditForAdmin({ entityType: "m8test", entityId: entityA });
    expect(page.total).toBe(5);
    expect(page.items.map((r) => r.action)).toEqual(["job.run", "profile.updated", "profile.updated", "role.revoked", "role.granted"]);
    for (let i = 1; i < page.items.length; i++) {
      expect(page.items[i - 1]!.createdAt.getTime()).toBeGreaterThanOrEqual(page.items[i]!.createdAt.getTime());
    }
    expect(page.items[0]!.actorUserId).toBeNull();
    expect(page.items[0]!.actorEmail).toBeNull();
    expect(page.items[1]!.actorEmail).toBe(other.email);
    expect(page.items[4]!.actorEmail).toBe(actor.email);
    expect(page.items[3]!.reason).toBe("why");
    expect(page.items[3]!.before).toEqual({ role: "platform_admin" });
  });

  it("filters by action, actor (including system) and date range", async () => {
    const byAction = await listAuditForAdmin({ entityId: entityA, action: "profile.updated" });
    expect(byAction.total).toBe(2);
    expect(byAction.items.every((r) => r.action === "profile.updated")).toBe(true);

    const byActor = await listAuditForAdmin({ entityId: entityA, actorUserId: actor.id });
    expect(byActor.total).toBe(3);
    expect(byActor.items.every((r) => r.actorUserId === actor.id)).toBe(true);

    const bySystem = await listAuditForAdmin({ entityId: entityA, actorUserId: null });
    expect(bySystem.total).toBe(1);
    expect(bySystem.items[0]!.action).toBe("job.run");

    const inRange = await listAuditForAdmin({ entityId: entityA, from: new Date(firstCreated.getTime() - 1000), to: new Date(lastCreated.getTime() + 1000) });
    expect(inRange.total).toBe(5);
    const beforeRange = await listAuditForAdmin({ entityId: entityA, to: new Date(firstCreated.getTime() - 60_000) });
    expect(beforeRange.total).toBe(0);
    const afterRange = await listAuditForAdmin({ entityId: entityA, from: new Date(lastCreated.getTime() + 60_000) });
    expect(afterRange.total).toBe(0);

    const combined = await listAuditForAdmin({ entityType: "m8test", action: "role.granted", actorUserId: actor.id });
    expect(combined.total).toBe(1);
    expect(combined.items[0]!.entityId).toBe(entityA);
  });

  it("pages at AUDIT_PAGE_SIZE and clamps an out-of-range page", async () => {
    const p1 = await listAuditForAdmin({ entityId: entityB });
    expect(p1.total).toBe(AUDIT_PAGE_SIZE + 5);
    expect(p1.pageCount).toBe(2);
    expect(p1.page).toBe(1);
    expect(p1.items).toHaveLength(AUDIT_PAGE_SIZE);
    const p2 = await listAuditForAdmin({ entityId: entityB, page: 2 });
    expect(p2.items).toHaveLength(5);
    const ids = new Set([...p1.items, ...p2.items].map((r) => r.id));
    expect(ids.size).toBe(AUDIT_PAGE_SIZE + 5);
    // Newest first across pages: page 2 holds the earliest rows.
    expect((p2.items.at(-1)!.after as { i: number }).i).toBe(0);
    const clamped = await listAuditForAdmin({ entityId: entityB, page: 9 });
    expect(clamped.page).toBe(2);
    expect(clamped.items).toHaveLength(5);
  });
});

describe("getAuditForAdmin / listAuditFilterValues", () => {
  it("returns one row with JSON snapshots and the actor email; malformed or unknown id → null", async () => {
    const page = await listAuditForAdmin({ entityId: entityA, action: "role.revoked" });
    const row = await getAuditForAdmin(page.items[0]!.id);
    expect(row).toMatchObject({ action: "role.revoked", entityId: entityA, actorEmail: actor.email, reason: "why", before: { role: "platform_admin" } });
    expect(row!.after).toBeNull();
    expect(await getAuditForAdmin(randomUUID())).toBeNull();
    expect(await getAuditForAdmin("not-a-uuid")).toBeNull();
  });

  it("offers only the actions and entity types that exist", async () => {
    const values = await listAuditFilterValues();
    expect(values.actions).toEqual(expect.arrayContaining(["role.granted", "role.revoked", "job.run"]));
    expect(values.entityTypes).toEqual(expect.arrayContaining(["m8test", "m8test-b"]));
    expect(values.actions).toEqual([...values.actions].sort());
    expect(new Set(values.actions).size).toBe(values.actions.length);
  });
});
