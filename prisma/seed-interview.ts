/*
 * Seed — the Interview roles, their starting question banks and the first
 * organisation (CR-2026-10-01-1711, P2–P4). Called by prisma/seed.ts; exported
 * on its own so the integration test can run it against a temporary folder.
 *
 * Same philosophy as the programme seed (decision L8): the portal is the truth
 * once an administrator has touched anything, so this file only ever CREATES.
 *   - A shared role is created only when its URL name is absent (published, with the
 *     description from its file). An existing role is left exactly as it is.
 *   - A role's questions are imported (as DRAFTS — nothing is approved here) only
 *     into a role whose shared bank is EMPTY. Once a bank holds any question, an
 *     administrator's edits, deletions and approvals are never re-imported or undone.
 *     The import itself is idempotent by question text (importDraftQuestions).
 *   - The organisation is created only when its URL name is absent. Its roles are linked
 *     when it is created, and when a role is created in the same run; a link an
 *     administrator removed is never put back.
 *   - A missing role file is skipped with a log line, never a failure.
 * The audit actor is null — "system", as the other seeds do.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPrisma, withTransaction } from "../src/db/prisma.ts";
import type { OrganisationType } from "../src/modules/assessment/constants.ts";
import { addRoleToOrganisation, createOrganisation } from "../src/modules/assessment/organisations.repository.ts";
import { importDraftQuestions } from "../src/modules/assessment/questions.repository.ts";
import { createRole } from "../src/modules/assessment/roles.repository.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
export const INTERVIEW_QUESTIONS_DIR = path.join(here, "seed-data", "interview-questions");

/** The two starting roles, in display order. */
export const INTERVIEW_ROLE_FILES = ["data-engineer.json", "ai-engineer.json"] as const;

export type SeedOrganisation = { name: string; slug: string; type: OrganisationType; contactEmail: string; logoPath: string | null };

/** The first organisation (founder, CR-2026-10-01-1711 R3). */
export const YPT: SeedOrganisation = { name: "Your Partner Technologies", slug: "ypt", type: "company", contactEmail: "sales@dataainexus.com", logoPath: "/brand/ypt-logo.jpg" };

export type InterviewSeedOptions = {
  /** Folder holding the role files (default: prisma/seed-data/interview-questions). */
  dir?: string;
  /** File names inside `dir`, in display order (default: the two starting roles). */
  files?: readonly string[];
  /** The organisation that offers the seeded roles; `null` seeds none (default: YPT). */
  organisation?: SeedOrganisation | null;
};

export type InterviewSeedResult = {
  rolesCreated: number;
  rolesKept: number;
  filesSkipped: number;
  questionsImported: number;
  organisationCreated: boolean;
  rolesLinked: number;
};

type RoleFile = {
  role: { slug: string; name: string; description: string };
  questions: { category: string; stem: string; options: string[]; correct: number; modelAnswer: string; source?: string }[];
};

/** The audit actor of the seed. The repositories take a user id for the audit row and write it as-is; the
 *  column is nullable and "system" is null, as for every other seed row. */
const SYSTEM = null as unknown as string;

function readRoleFile(file: string): RoleFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    throw new Error(`interview seed: ${path.basename(file)} is not valid JSON (${err instanceof Error ? err.message : String(err)})`);
  }
  const data = parsed as Partial<RoleFile>;
  if (!data.role?.slug || !data.role.name || !Array.isArray(data.questions)) throw new Error(`interview seed: ${path.basename(file)} must have a "role" ({ slug, name, description }) and a "questions" array`);
  return data as RoleFile;
}

export async function seedInterview(options: InterviewSeedOptions = {}): Promise<InterviewSeedResult> {
  const prisma = getPrisma();
  const dir = options.dir ?? INTERVIEW_QUESTIONS_DIR;
  const files = options.files ?? INTERVIEW_ROLE_FILES;
  const organisation = options.organisation === undefined ? YPT : options.organisation;
  const result: InterviewSeedResult = { rolesCreated: 0, rolesKept: 0, filesSkipped: 0, questionsImported: 0, organisationCreated: false, rolesLinked: 0 };

  /** Roles of this run: id and whether this run created it. */
  const seeded: { id: string; slug: string; created: boolean }[] = [];

  for (const [index, name] of files.entries()) {
    const file = path.join(dir, name);
    if (!existsSync(file)) {
      console.log(`seed: interview file ${name} not found — skipped`);
      result.filesSkipped += 1;
      continue;
    }
    const data = readRoleFile(file);
    const existing = await prisma.assessmentRole.findUnique({ where: { slug: data.role.slug }, select: { id: true, organisationId: true } });
    if (existing && existing.organisationId !== null) {
      console.log(`seed: interview role "${data.role.slug}" is an organisation's private role — skipped`);
      result.filesSkipped += 1;
      continue;
    }
    const roleId =
      existing?.id ??
      (await withTransaction((tx) => createRole(tx, { name: data.role.name, description: data.role.description ?? "", slug: data.role.slug, position: (index + 1) * 10, published: true }, SYSTEM))).id;
    if (existing) result.rolesKept += 1;
    else result.rolesCreated += 1;
    seeded.push({ id: roleId, slug: data.role.slug, created: !existing });

    const bank = await prisma.roleQuestion.count({ where: { roleId, organisationId: null } });
    if (bank > 0) {
      console.log(`seed: interview role "${data.role.slug}" already has ${bank} question(s) — kept as saved in the portal`);
      continue;
    }
    const items = data.questions.map((q) => ({
      category: q.category,
      stem: q.stem,
      options: q.options.map((text, i) => ({ text, isCorrect: i === q.correct })),
      modelAnswer: q.modelAnswer,
      source: q.source ?? null,
    }));
    const imported = await withTransaction((tx) => importDraftQuestions(tx, roleId, items, SYSTEM));
    result.questionsImported += imported.inserted;
    console.log(`seed: interview role "${data.role.slug}" questions imported as drafts=${imported.inserted} skipped=${imported.skipped}`);
  }

  if (organisation) {
    const existing = await prisma.organisation.findUnique({ where: { slug: organisation.slug }, select: { id: true } });
    const organisationId = existing?.id ?? (await withTransaction((tx) => createOrganisation(tx, { ...organisation, published: true }, SYSTEM))).id;
    result.organisationCreated = existing === null;
    for (const role of seeded) {
      if (!result.organisationCreated && !role.created) continue; // never put back a link an administrator removed
      const linked = await withTransaction((tx) => addRoleToOrganisation(tx, organisationId, role.id, SYSTEM));
      if (linked) result.rolesLinked += 1;
    }
    if (result.organisationCreated) console.log(`seed: organisation "${organisation.slug}" created with ${result.rolesLinked} role(s)`);
  }
  return result;
}
