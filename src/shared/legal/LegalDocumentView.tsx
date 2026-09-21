import Link from "next/link";
import type { LegalDocument, LegalSection } from "@/content/legal/types";
import { Card } from "@/shared/ui/Card";

/*
 * Renders one legal document (src/content/legal/*) in the portal's house
 * style — added 2026-09-21 alongside the three drafts, founder direction.
 * Sits next to PolicyPlaceholder.tsx, which remains in use for
 * /credential-integrity-policy (certification is paused; that document is
 * still undrafted).
 *
 * Server component, no client state. Layout mirrors app/(public)/faq/page.tsx:
 * eyebrow → h1 → summary → (draft notice) → contents → sections, each an h2
 * with an anchor id so the contents list and external links can point at it.
 *
 * THE DRAFT NOTICE IS NOT OPTIONAL. Whenever `status === "draft"` a notice
 * card states that the document is a draft for legal review and not in
 * force. A reader must never be able to mistake a draft for a term they can
 * rely on (CLAUDE.md rule 8; PolicyPlaceholder's original reasoning).
 */

/** Stable, readable anchor for a heading: "3. Your account" → "s-3-your-account". */
export function sectionAnchor(heading: string): string {
  return (
    "s-" +
    heading
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

function SectionBlock({ section }: { section: LegalSection }) {
  const id = sectionAnchor(section.heading);
  return (
    <section aria-labelledby={id} className="mb-10 scroll-mt-24">
      <h2 id={id} className="text-h2 mb-3">
        {section.heading}
      </h2>
      <div className="flex flex-col gap-3 text-[var(--color-ink-quiet)]">
        {section.paragraphs.map((p, i) => (
          <p key={i} className="text-body-sm">
            {p}
          </p>
        ))}
        {section.table && <SectionTable table={section.table} />}
        {section.bullets && (
          <ul className="text-body-sm flex list-disc flex-col gap-1.5 pl-5">
            {section.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function SectionTable({ table }: { table: NonNullable<LegalSection["table"]> }) {
  return (
    <div className="overflow-x-auto">
      <table className="text-body-sm w-full border-collapse rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <caption className="text-label mb-2 text-left">{table.caption}</caption>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th
                key={c}
                scope="col"
                className="border-b border-[var(--color-line-strong)] px-4 py-2 text-left font-semibold text-[var(--color-ink)]"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`border-b border-[var(--color-line)] px-4 py-2 align-top ${ci === 0 ? "text-[var(--color-ink)]" : ""}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LegalDocumentView({ document }: { document: LegalDocument }) {
  const isDraft = document.status === "draft";
  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Legal</p>
        <h1 className="mb-3 text-display">{document.title}</h1>
        <p className="text-body-lg mb-6 max-w-[60ch] text-[var(--color-ink-quiet)]">{document.summary}</p>

        {isDraft && (
          <Card
            variant="panel"
            className="mb-8 border-[var(--color-accent-line)] bg-[var(--color-accent-soft)] p-5 sm:p-6"
          >
            <p role="status" className="text-label mb-2 text-[var(--color-accent-ink)]">
              Draft for legal review — not yet in force
            </p>
            <p className="text-body-sm text-[var(--color-ink)]">
              Version {document.version}. This text is a draft prepared for review by a
              Malaysian-qualified lawyer. It has not been published and nothing in it is a term,
              policy or undertaking until a reviewed version appears here with an effective
              date.
            </p>
          </Card>
        )}

        <p className="text-body-sm mb-10 text-[var(--color-ink-faint)]">
          Version {document.version} · Last updated {document.lastUpdated}
        </p>

        <nav aria-labelledby="legal-contents" className="mb-12">
          <h2 id="legal-contents" className="text-label mb-3">
            Contents
          </h2>
          <ol className="text-body-sm flex flex-col gap-1.5 pl-5 text-[var(--color-ink-quiet)]">
            {document.sections.map((s) => (
              <li key={s.heading} className="list-decimal marker:text-[var(--color-ink-faint)]">
                <a
                  href={`#${sectionAnchor(s.heading)}`}
                  className="text-[var(--color-primary)] underline underline-offset-4"
                >
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {document.sections.map((s) => (
          <SectionBlock key={s.heading} section={s} />
        ))}

        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Questions about this document?{" "}
          <Link href="/contact-us" className="text-[var(--color-primary)] underline underline-offset-4">
            Ask us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
