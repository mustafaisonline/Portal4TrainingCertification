import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";

/* FAQ content as data. Rule carried from the mockup: every answer is either a
 * fact stated elsewhere in the portal or an honest "to be confirmed" (`tbc`). */

export type FaqItem = { question: string; answer: string; href: string | null; hrefLabel: string | null; tbc: boolean };
export type FaqGroup = { title: string; items: FaqItem[] };

export async function listFaqGroups(db: Db = getPrisma()): Promise<FaqGroup[]> {
  const rows = await db.faqEntry.findMany({
    where: { published: true },
    orderBy: [{ groupTitle: "asc" }, { position: "asc" }],
    select: { groupTitle: true, position: true, question: true, answer: true, href: true, hrefLabel: true, tbc: true },
  });
  // `position` is global (seed: groupIndex * 100 + itemIndex), so sorting by
  // it preserves the authored order of groups and of items within a group.
  const groups = new Map<string, FaqItem[]>();
  for (const r of rows.sort((a, b) => a.position - b.position)) {
    const list = groups.get(r.groupTitle) ?? [];
    list.push({ question: r.question, answer: r.answer, href: r.href, hrefLabel: r.hrefLabel, tbc: r.tbc });
    groups.set(r.groupTitle, list);
  }
  return [...groups].map(([title, items]) => ({ title, items }));
}
