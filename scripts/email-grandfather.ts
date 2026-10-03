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
 *   npm run email:grandfather -- --apply --before 2026-10-04T00:00:00Z   # only accounts created before that moment
 *
 * Use --before so accounts that signed up AFTER verification was introduced (and never confirmed) are not blessed.
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
const beforeIdx = process.argv.indexOf("--before");
const before = beforeIdx >= 0 ? new Date(process.argv[beforeIdx + 1] ?? "") : null;
if (before && Number.isNaN(before.getTime())) {
  console.error("--before needs an ISO date, e.g. --before 2026-10-04T00:00:00Z");
  process.exit(2);
}
// Say WHICH database this touches (host and name only — never credentials).
try {
  const u = new URL(process.env["DATABASE_URL"] ?? "");
  console.log(`Database: ${u.hostname}${u.pathname}`);
} catch {
  console.log("Database: (DATABASE_URL not readable)");
}
const prisma = getPrisma();
try {
  const pending = await prisma.user.findMany({ where: { emailVerifiedAt: null, ...(before ? { createdAt: { lt: before } } : {}) }, select: { id: true, identities: { select: { providerSubject: true } } } });
  console.log(`${pending.length} account(s) without a confirmed email address.`);
  if (!apply) {
    console.log("Dry run — nothing changed. Add --apply to count them as verified.");
  } else {
    const now = new Date();
    let done = 0;
    for (const u of pending) {
      await withTransaction(async (tx) => {
        // Guarded: a person who confirms between the read and this write keeps THEIR timestamp.
        const changed = await tx.user.updateMany({ where: { id: u.id, emailVerifiedAt: null }, data: { emailVerifiedAt: now } });
        if (changed.count === 0) return;
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
