import { randomUUID } from "node:crypto";
import { getPrisma, withTransaction } from "../../src/db/prisma";
import { grantRole, type Role } from "../../src/modules/identity/roles.repository";
import { findUserByEmail } from "../../src/modules/identity/users.repository";

/*
 * Database helpers for identity tests (integration + e2e). Relative imports:
 * Playwright resolves no `@/` alias. TEST DATABASE ONLY — tests/setup-env.ts
 * and playwright.config.ts point DATABASE_URL at DATABASE_URL_TEST.
 */

export function uniqueEmail(prefix = "test"): string {
  return `${prefix}-${randomUUID().slice(0, 8)}@example.test`;
}

export const STRONG_PASSWORD = "correct-horse-battery-staple-42";

/** The most recent email recorded for an address and template. */
export async function latestEmail(to: string, templateKey: string) {
  return getPrisma().outboundEmail.findFirst({
    where: { toEmail: to.toLowerCase(), templateKey },
    orderBy: { createdAt: "desc" },
  });
}

/** Sends are deliberately not awaited by the auth endpoints (timing-safe
 *  responses), so a test polls briefly for the row to appear. */
export async function waitForEmail(to: string, templateKey: string, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const row = await latestEmail(to, templateKey);
    if (row) return row;
    if (Date.now() > deadline) throw new Error(`no ${templateKey} email for ${to} within ${timeoutMs}ms`);
    await new Promise((r) => setTimeout(r, 50));
  }
}

/** The first absolute URL in an email body — the verification / reset link. */
export function firstLink(text: string): string {
  const m = text.match(/https?:\/\/\S+/);
  if (!m) throw new Error("no link in email body");
  return m[0];
}

export async function grantRoleByEmail(email: string, role: Role): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) throw new Error(`no user ${email}`);
  await withTransaction((tx) => grantRole(tx, { userId: user.id, role, grantedByUserId: null, reason: "test" }));
}

/** The auth endpoints are rate-limited per client and the counters live in
 *  the database (restart-safe, plan §6.7). A test run registers many accounts
 *  from one address in seconds, so each test starts with clear counters. */
export async function resetRateLimits(): Promise<void> {
  await getPrisma().authRateLimit.deleteMany({});
}

/** Everything a registration created, in reverse. audit_log is insert-only
 *  in the product; this test-only helper clears the rows for the test user so
 *  the TEST database does not grow without bound. */
export async function deleteTestUser(email: string): Promise<void> {
  const prisma = getPrisma();
  const lower = email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: lower }, select: { id: true } });
  if (user) {
    await prisma.$transaction([
      prisma.consent.deleteMany({ where: { userId: user.id } }),
      prisma.userRole.deleteMany({ where: { userId: user.id } }),
      prisma.authIdentity.deleteMany({ where: { userId: user.id } }),
      prisma.auditLog.deleteMany({ where: { OR: [{ entityId: user.id }, { actorUserId: user.id }] } }),
      prisma.user.delete({ where: { id: user.id } }),
    ]);
  }
  // Cascade removes sessions, accounts and two-factor rows.
  await prisma.authUser.deleteMany({ where: { email: lower } });
  await prisma.outboundEmail.deleteMany({ where: { toEmail: lower } });
}
