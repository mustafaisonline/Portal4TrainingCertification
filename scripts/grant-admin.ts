/*
 * Grant `platform_admin` to an existing, registered user — the bootstrap for
 * the first administrator (MILESTONE_2_EXECUTION_PLAN.md §2 item 13; AD-D1:
 * founder = Administrator). There is no admin UI for roles until M8, and an
 * admin cannot be created by registration.
 *
 *   npm run admin:grant -- someone@example.com
 *
 * Writes the role and its audit row in one transaction (actor = system, since
 * no signed-in admin exists yet). The person must still enrol MFA before
 * /admin serves anything (plan §6.8). Idempotent.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { disconnectPrisma, withTransaction } from "../src/db/prisma.ts";
import { grantRole } from "../src/modules/identity/roles.repository.ts";
import { findUserByEmail } from "../src/modules/identity/users.repository.ts";

const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["DATABASE_URL"] && existsSync(envFile)) process.loadEnvFile(envFile);

const email = process.argv[2];
if (!email) {
  console.error("usage: npm run admin:grant -- <email>");
  process.exit(2);
}

async function main(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    console.error(`no user with email ${email} — the person must register first`);
    process.exitCode = 1;
    return;
  }
  const granted = await withTransaction((tx) =>
    grantRole(tx, {
      userId: user.id,
      role: "platform_admin",
      grantedByUserId: null,
      reason: "bootstrap via scripts/grant-admin.ts",
    }),
  );
  console.log(granted ? `granted platform_admin to ${user.email} (${user.id})` : `${user.email} already holds platform_admin`);
}

main(email)
  .catch((err) => {
    console.error("grant-admin failed:", err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
