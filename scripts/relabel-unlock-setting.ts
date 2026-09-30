/*
 * One-off operator script — Milestone 16 wording (founder, 2026-09-30):
 * the stored unlock-fee label, which is also the Stripe product name, still
 * read "Knowledge Check result document". This appends ONE new setting row
 * with the current default label (UNLOCK_DEFAULT_LABEL) and the SAME enabled
 * flag, amount and currency as the setting in force — exactly what an
 * administrator does at /admin/orders/unlock, audited against the founder's
 * account. Nothing else changes; the old row stays in the history.
 *
 *   npm run unlock:relabel -- <admin email>
 *
 * Idempotent: if the setting in force already carries the label, it does
 * nothing.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { disconnectPrisma, withTransaction } from "../src/db/prisma.ts";
import { createUnlockSetting, currentUnlockSetting, UNLOCK_DEFAULT_LABEL } from "../src/modules/commerce/unlock.repository.ts";
import { activeRolesForUser, holdsRole } from "../src/modules/identity/roles.repository.ts";
import { findUserByEmail } from "../src/modules/identity/users.repository.ts";

const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["DATABASE_URL"] && existsSync(envFile)) process.loadEnvFile(envFile);

const email = process.argv[2];
if (!email) {
  console.error("usage: npm run unlock:relabel -- <admin email>");
  process.exit(2);
}

async function main(email: string) {
  const user = await findUserByEmail(email);
  if (!user) {
    console.error(`no user with email ${email}`);
    process.exitCode = 1;
    return;
  }
  if (!holdsRole(await activeRolesForUser(user.id), "platform_admin")) {
    console.error(`${email} is not a platform administrator`);
    process.exitCode = 1;
    return;
  }
  const now = new Date();
  const current = await currentUnlockSetting(now);
  if (!current) {
    console.error("no unlock setting exists yet — nothing to relabel");
    process.exitCode = 1;
    return;
  }
  if (current.label === UNLOCK_DEFAULT_LABEL) {
    console.log(`unlock setting already labelled "${current.label}" — nothing to do`);
    return;
  }
  const row = await withTransaction((tx) =>
    createUnlockSetting(tx, { enabled: current.enabled, amountMinor: current.amountMinor, currency: current.currency, label: UNLOCK_DEFAULT_LABEL, effectiveFrom: now, note: "Relabelled for the Free Assessment Check wording (Milestone 16)" }, user.id, now),
  );
  console.log(`unlock setting relabelled: "${current.label}" → "${row.label}" (${row.currency} ${(row.amountMinor / 100).toFixed(2)}, ${row.enabled ? "enabled" : "disabled"})`);
}

main(email)
  .catch((err) => {
    console.error("relabel failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
