import Image from "next/image";
import type { ExpertRecord } from "@/modules/catalogue/experts/repository";
import { Card } from "@/shared/ui/Card";

/*
 * "Take away" — the trainer's published books (Milestone 14 Phase 1,
 * founder request 2026-09-27: "give away soft copies of all my books; links
 * and costs from these links"). Reads the `books[]` already seeded on the
 * expert profile (title, subtitle, Amazon URL, cover). Prices are NOT
 * shown: Amazon's price is the price (decision P5, "See price on Amazon").
 * Soft-copy downloads arrive with Phase 6, once the PDFs exist and the
 * `book_files` table is approved — nothing here pretends otherwise.
 */
export type TakeAwayBook = NonNullable<ExpertRecord["profile"]["books"]>[number];

export function TakeAwayBooks({ books, author, compact = false }: { books: TakeAwayBook[]; author: string; compact?: boolean }) {
  if (books.length === 0) return null;
  return (
    <ul className={compact ? "grid gap-3 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"} data-testid="take-away-books">
      {books.map((b) => (
        <li key={b.url}>
          <Card variant="panel" className="flex h-full gap-4 p-4" data-testid="take-away-book">
            <Image src={b.cover} alt={`Cover of ${b.title}`} width={96} height={128} className="h-32 w-24 shrink-0 rounded-[var(--radius-plate)] object-cover" />
            <div className="flex min-w-0 flex-col">
              <p className="text-body-lg font-medium">{b.title}</p>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">{b.subtitle}</p>
              <p className="text-body-sm mt-1 text-[var(--color-ink-faint)]">By {author}</p>
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-body-sm mt-auto inline-block pt-3 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
                aria-label={`${b.title} on Amazon (opens in a new tab) — see price on Amazon`}
              >
                See price on Amazon ↗
              </a>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
