import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell } from "@/components/PublicShell";
import { Chip } from "@/components/ui/Chip";
import { faqGroups } from "@/data/faq";

/**
 * FAQ — added 2026-09-20, founder direction. Content and its honesty rule
 * live in data/faq.ts (read its header). Questions whose answers are open
 * decisions carry a "To be confirmed" chip rather than an invented answer.
 * Plain <details> disclosures — no library.
 */
export const metadata: Metadata = {
  title: "FAQ — Data & AI Academy",
  description: "Answers about the programme, registering and paying, the certificate, and your account.",
};

export default function FaqPage() {
  return (
    <PublicShell>
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">FAQ</p>
          <h1 className="mb-3 text-display">Frequently asked questions</h1>
          <p className="text-body-lg mb-10 max-w-[60ch] text-[var(--color-ink-quiet)]">
            Straight answers. Where something is not decided yet, we say so
            rather than guess.
          </p>
          {faqGroups.map((g) => (
            <section key={g.title} aria-labelledby={`faq-${g.title}`} className="mb-10">
              <h2 id={`faq-${g.title}`} className="text-h1 mb-4">
                {g.title}
              </h2>
              <div className="flex flex-col gap-2">
                {g.items.map((f) => (
                  <details
                    key={f.q}
                    className="rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] px-4 py-3"
                  >
                    <summary className="text-body-sm flex cursor-pointer items-center justify-between gap-3 font-medium">
                      <span>{f.q}</span>
                      {f.tbc && <Chip>To be confirmed</Chip>}
                    </summary>
                    <p className="text-body-sm mt-3 text-[var(--color-ink-quiet)]">{f.a}</p>
                    {f.href && (
                      <Link
                        href={f.href}
                        className="text-body-sm mt-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4"
                      >
                        {f.hrefLabel} →
                      </Link>
                    )}
                  </details>
                ))}
              </div>
            </section>
          ))}
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            Didn&rsquo;t find it?{" "}
            <Link href="/contact-us" className="text-[var(--color-primary)] underline underline-offset-4">
              Ask us
            </Link>
            .
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
