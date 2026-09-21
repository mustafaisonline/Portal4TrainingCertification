import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";

/* The fixed diagnostic question set, with its capability area. "I'm not
 * sure" is appended by the UI as an equal, unpenalised option — never stored. */

export type DiagnosticQuestionRecord = {
  code: string;
  position: number;
  scenario: string;
  options: string[];
  domain: { id: string; code: string; name: string };
};

export async function listDiagnosticQuestions(db: Db = getPrisma()): Promise<DiagnosticQuestionRecord[]> {
  const rows = await db.diagnosticQuestion.findMany({
    orderBy: { position: "asc" },
    include: { domain: { select: { id: true, code: true, name: true } } },
  });
  return rows.map((r) => ({ code: r.code, position: r.position, scenario: r.scenario, options: r.options as string[], domain: r.domain }));
}
