import Link from "next/link";

/*
 * Page links for the result's question list (ten a page — CR-2026-10-03-2251). Plain links with `?page=`, so it works without
 * scripting; it renders nothing when everything fits on one page. Used above and below the list.
 */
export function ResultPager({ pager, base, position }: { pager: { page: number; pages: number; from: number; to: number; total: number }; base: string; position: "top" | "bottom" }) {
  if (pager.pages <= 1) return null;
  const href = (n: number) => `${base}${n > 1 ? `?page=${n}` : ""}#result-questions-heading`;
  const link = "text-body-sm inline-flex min-h-[44px] items-center rounded-[var(--radius-plate)] border border-[var(--color-line)] px-4 text-[var(--color-primary)] hover:border-[var(--color-primary)]";
  return (
    <nav aria-label={position === "top" ? "Result pages" : "Result pages (bottom)"} className="my-4 flex flex-wrap items-center gap-3" data-testid={`result-pager-${position}`}>
      {pager.page > 1 ? (
        <Link href={href(pager.page - 1)} className={link} data-testid="result-prev" rel="prev">
          ← Previous 10
        </Link>
      ) : null}
      <span className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="result-page-label">
        Questions {pager.from}–{pager.to} of {pager.total} · Page {pager.page} of {pager.pages}
      </span>
      {pager.page < pager.pages ? (
        <Link href={href(pager.page + 1)} className={link} data-testid="result-next" rel="next">
          Next 10 →
        </Link>
      ) : null}
    </nav>
  );
}
