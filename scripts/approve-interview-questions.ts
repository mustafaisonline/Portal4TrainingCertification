/*
 * Bulk-approve DRAFT interview questions of the SHARED banks to REVIEWED
 * (CR-2026-10-01-1711, P2–P4). Questions land as drafts when the seed loads them,
 * and candidates only ever see reviewed ones. This is the founder's explicit
 * instruction to approve a bank without reading each question — the same move as
 * the admin screen's "Approve all drafts" button, in bulk. It is NEVER run
 * automatically.
 *
 *   npm run interview:approve-all -- <admin email> [role-slug]
 *
 * With a role slug only that role's bank is touched; without one, every shared
 * role's. Uses the audited repository function the screen uses (one summary audit
 * row per role, against that administrator's account). Idempotent: only drafts
 * move, so a second run changes nothing. Refuses an email that is not a platform
 * administrator. Organisation questions are never touched — they go through the
 * approval queue.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { disconnectPrisma, withTransaction } from "../src/db/prisma.ts";
import { activeRolesForUser, holdsRole } from "../src/modules/identity/roles.repository.ts";
import { findUserByEmail } from "../src/modules/identity/users.repository.ts";
import { bulkSetStatus } from "../src/modules/assessment/questions.repository.ts";
import { listRolesForAdmin } from "../src/modules/assessment/roles.repository.ts";

export type ApproveAllResult = { actorEmail: string; roles: { slug: string; approved: number }[]; approved: number };

/** Approve every draft of the shared role banks (one role when `roleSlug` is given). Throws with a plain message when the person is not an administrator or the role is unknown. */
export async function approveAllDraftInterviewQuestions(email: string, roleSlug?: string): Promise<ApproveAllResult> {
  const actor = await findUserByEmail(email);
  if (!actor) throw new Error(`no user with email ${email}`);
  if (!holdsRole(await activeRolesForUser(actor.id), "platform_admin")) throw new Error(`${email} is not a platform administrator`);
  const shared = (await listRolesForAdmin()).filter((r) => r.organisationId === null);
  const chosen = roleSlug ? shared.filter((r) => r.slug === roleSlug) : shared;
  if (roleSlug && chosen.length === 0) throw new Error(`no shared interview role with the URL name "${roleSlug}"`);
  const roles: { slug: string; approved: number }[] = [];
  for (const role of chosen) {
    if (role.counts.draft === 0) {
      roles.push({ slug: role.slug, approved: 0 });
      continue;
    }
    const approved = await withTransaction((tx) => bulkSetStatus(tx, { roleId: role.id, organisationId: null, from: "draft", to: "reviewed" }, actor.id));
    roles.push({ slug: role.slug, approved });
  }
  return { actorEmail: actor.email, roles, approved: roles.reduce((n, r) => n + r.approved, 0) };
}

async function main() {
  const envFile = path.resolve(process.cwd(), ".env.local");
  if (!process.env["DATABASE_URL"] && existsSync(envFile)) process.loadEnvFile(envFile);
  const email = process.argv[2];
  const roleSlug = process.argv[3];
  if (!email) {
    console.error("usage: npm run interview:approve-all -- <admin email> [role-slug]");
    process.exit(2);
  }
  try {
    const result = await approveAllDraftInterviewQuestions(email, roleSlug);
    for (const r of result.roles) console.log(`${r.slug}: ${r.approved} draft question(s) approved`);
    console.log(`approved ${result.approved} question(s) across ${result.roles.length} role(s), actor ${result.actorEmail}`);
  } catch (err) {
    console.error("interview:approve-all failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  } finally {
    await disconnectPrisma();
  }
}

// Runs only when invoked as a script; the function is also called in-process by the integration test.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) void main();
