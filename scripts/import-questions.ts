/*
 * Load draft self-check questions for Free Learning topics
 * (Milestone 14 Phase 3; founder decisions P9–P10).
 *
 *   npm run learning:import-questions -- <file.json | directory> [--replace-drafts]
 *
 * Each JSON file names ONE topic by slug and carries its questions:
 *   { "topic": "what-is-data",
 *     "questions": [ { "stem": "…", "options": ["a","b","c","d","e"], "correct": 2, "explanation": "…" }, … ] }
 *
 * Questions land as DRAFTS; an administrator reviews them at
 * /admin/free-learning/<topic>/questions before readers see them. A topic
 * that already has questions is skipped unless --replace-drafts, which
 * removes its drafts (never its reviewed questions) and loads the file
 * again. Every file is validated before anything is written; one
 * transaction per topic.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { disconnectPrisma, getPrisma, withTransaction } from "../src/db/prisma.ts";
import { importDraftQuestions, QuestionValidationError, validateQuestion, type QuestionInput } from "../src/modules/free-learning/quiz.repository.ts";

const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["DATABASE_URL"] && existsSync(envFile)) process.loadEnvFile(envFile);

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));
const replaceDrafts = args.includes("--replace-drafts");
if (!target || !existsSync(target)) {
  console.error("usage: npm run learning:import-questions -- <file.json | directory> [--replace-drafts]");
  process.exit(2);
}

type QuestionFile = { topic: string; questions: QuestionInput[] };

function loadFiles(p: string): { file: string; data: QuestionFile }[] {
  const files = statSync(p).isDirectory() ? readdirSync(p).filter((f) => f.endsWith(".json")).sort().map((f) => path.join(p, f)) : [p];
  return files.map((file) => {
    const data = JSON.parse(readFileSync(file, "utf8")) as QuestionFile;
    if (typeof data.topic !== "string" || !Array.isArray(data.questions)) throw new Error(`${file}: expected { topic, questions[] }`);
    data.questions.forEach((q, i) => {
      try {
        validateQuestion(q, i);
      } catch (err) {
        throw new Error(`${file}: ${err instanceof QuestionValidationError ? err.message : String(err)}`);
      }
    });
    return { file, data };
  });
}

async function main() {
  const files = loadFiles(target!);
  const prisma = getPrisma();
  let inserted = 0;
  let replaced = 0;
  const skipped: string[] = [];
  const missing: string[] = [];
  for (const { file, data } of files) {
    const topic = await prisma.bookTopic.findUnique({ where: { slug: data.topic }, select: { id: true } });
    if (!topic) {
      missing.push(`${path.basename(file)} → no topic "${data.topic}"`);
      continue;
    }
    const r = await withTransaction((tx) => importDraftQuestions(tx, { topicId: topic.id, questions: data.questions, replaceDrafts }));
    if (r.skipped) skipped.push(data.topic);
    inserted += r.inserted;
    replaced += r.draftsReplaced;
  }
  console.log(`done: ${files.length} file(s) · ${inserted} draft questions inserted · ${replaced} drafts replaced · ${skipped.length} topic(s) skipped (already have questions; use --replace-drafts)`);
  if (skipped.length) console.log(`  skipped: ${skipped.join(", ")}`);
  if (missing.length) {
    console.error(`  NOT FOUND:\n  ${missing.join("\n  ")}`);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => disconnectPrisma());
