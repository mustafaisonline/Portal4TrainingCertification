import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

/**
 * Placeholder page for a legal / policy document that does NOT yet exist —
 * added 2026-09-20, founder direction ("pages for these items are also
 * missing"). One component, three routes: /terms, /privacy,
 * /credential-integrity-policy.
 *
 * ⚠ NO POLICY TEXT IS WRITTEN HERE, DELIBERATELY. Terms, a privacy policy and
 * the credential-integrity policy are binding legal instruments and business
 * policy; drafting them is the founder's and counsel's work
 * (docs/SITE_PAGES.md "Blocked on legal drafting"; CLAUDE.md rule 8). A page
 * with plausible-looking clauses would be worse than none — a visitor could
 * rely on it. So each page states plainly that the document is not yet
 * published and what it will govern once it is, and nothing more.
 */
export function PolicyPlaceholder({
  title,
  governs,
  needs,
}: {
  title: string;
  /** One sentence: what this document will cover, once published. */
  governs: string;
  /** What must be decided or supplied before it can be written. */
  needs: string[];
}) {
  return (
    <PublicShell>
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[720px] px-4 py-14 sm:px-6 sm:py-20">
          <p className="text-label mb-3 text-[var(--color-primary)]">Legal</p>
          <h1 className="mb-4 text-display">{title}</h1>
          <Card variant="panel" className="p-6 sm:p-8">
            <p className="text-label mb-3">Not yet published</p>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              This document has not been published yet. {governs}
            </p>
            <p className="text-body-sm mb-2 text-[var(--color-ink-quiet)]">
              It will be published once the following are settled:
            </p>
            <ul className="text-body-sm mb-6 flex list-disc flex-col gap-1.5 pl-5 text-[var(--color-ink-quiet)]">
              {needs.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className="text-body-sm mb-6 text-[var(--color-ink-faint)]">
              Nothing on this portal should be read as a term, policy or
              undertaking until the document is published here.
            </p>
            <Button variant="secondary" href="/contact-us">
              Ask us a question
            </Button>
          </Card>
        </div>
      </section>
    </PublicShell>
  );
}
