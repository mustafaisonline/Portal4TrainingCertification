/*
 * Bulk-approve every DRAFT question, across every topic, to REVIEWED
 * (M14 Phase 3's review gate — questions land as drafts on import and the
 * Knowledge Check only ever draws from `status: "reviewed"` questions of
 * published topics; see quiz.repository.ts's setAllQuestionsStatus). The
 * founder's explicit instruction, 2026-09-29: bulk-approve the whole
 * imported bank for now, rather than reviewing 3,830 questions one by one
 * before Knowledge Check testing can start.
 *
 *   npm run knowledge-check:approve-all -- <admin-email>
 *
 * Uses the same audited repository function the admin UI's "approve all
 * for this topic" button calls — one audit row per question, one
 * transaction per topic. Idempotent: only topics with remaining drafts are
 * touched, so it is safe to re-run after a fresh import.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { disconnectPrisma, withTransaction } from "../src/db/prisma.ts";
import { findUserByEmail } from "../src/modules/identity/users.repository.ts";
import { questionCountsByTopic, setAllQuestionsStatus } from "../src/modules/free-learning/quiz.repository.ts";

const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["DATABASE_URL"] && existsSync(envFile)) process.loadEnvFile(envFile);

const email = process.argv[2];
if (!email) {
  console.error("usage: npm run knowledge-check:approve-all -- <admin-email>");
  process.exit(2);
}

async function main(email: string) {
  const actor = await findUserByEmail(email);
  if (!actor) {
    console.error(`no user with email ${email}`);
    process.exitCode = 1;
    return;
  }

  const counts = await questionCountsByTopic();
  const withDrafts = [...counts.entries()].filter(([, c]) => c.total > c.reviewed);
  console.log(`${withDrafts.length} topic(s) have draft questions (of ${counts.size} total)`);

  let approved = 0;
  for (const [topicId] of withDrafts) {
    const n = await withTransaction((tx) => setAllQuestionsStatus(tx, { topicId, status: "reviewed", actorUserId: actor.id }));
    approved += n;
  }
  console.log(`approved ${approved} question(s) across ${withDrafts.length} topic(s), actor ${actor.email}`);
}

main(email)
  .catch((err) => {
    console.error("bulk-review-questions failed:", err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
