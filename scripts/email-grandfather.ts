/*
 * Count the EXISTING accounts as email-verified (CR-2026-10-03-1245; founder,
 * 2026-10-03: "Count them as verified" — they registered before verification
 * existed). Run it BEFORE switching REQUIRE_EMAIL_VERIFICATION on, otherwise
 * everyone who signed up earlier — the administrator included — would be locked
 * out waiting for a link.
 *
 *   set -a; . /etc/p4tc/production.env; set +a
 *   npm run email:grandfather            # dry run: prints how many accounts it WOULD mark
 *   npm run email:grandfather -- --apply # marks them (idempotent; one audit row per account)
 *
 * It only ever sets `users.email_verified_at` where it is empty — and the sign-in
 * provider's own `emailVerified` flag, which is the one Better Auth checks at
 * sign-in — and never clears or changes a value.
 * It prints counts, never addresses.
 */
import { existsSync } from "node:fs";
import path from "node:path";

const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["DATABASE_URL"] && existsSync(envFile)) process.loadEnvFile(envFile);

const { getPrisma, disconnectPrisma, withTransaction } = await import("../src/db/prisma.ts");
const { writeAudit } = await import("../src/modules/platform/audit/repository.ts");

const apply = process.argv.includes("--apply");
const prisma = getPrisma();
try {
  const pending = await prisma.user.findMany({ where: { emailVerifiedAt: null }, select: { id: true, identities: { select: { providerSubject: true } } } });
  console.log(`${pending.length} account(s) without a confirmed email address.`);
  if (!apply) {
    console.log("Dry run — nothing changed. Add --apply to count them as verified.");
  } else {
    const now = new Date();
    let done = 0;
    for (const u of pending) {
      await withTransaction(async (tx) => {
        await tx.user.update({ where: { id: u.id }, data: { emailVerifiedAt: now } });
        const subjects = u.identities.map((i) => i.providerSubject);
        if (subjects.length > 0) await tx.authUser.updateMany({ where: { id: { in: subjects }, emailVerified: false }, data: { emailVerified: true } });
        await writeAudit(tx, { actorUserId: null, action: "user.email_verified", entityType: "user", entityId: u.id, before: { emailVerifiedAt: null }, after: { emailVerifiedAt: now.toISOString(), reason: "grandfathered: registered before email verification existed (CR-2026-10-03-1245)" } });
      });
      done++;
    }
    console.log(`Marked ${done} account(s) as verified.`);
  }
} finally {
  await disconnectPrisma();
}
