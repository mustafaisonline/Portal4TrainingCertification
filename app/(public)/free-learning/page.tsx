import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { countPublishedTopics } from "@/modules/free-learning/book.repository";
import { bankSize } from "@/modules/free-learning/knowledge-check.repository";
import { TakeAwayBooks } from "@/shared/marketing/TakeAwayBooks";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * /free-learning — "Free Training & Certification" (Milestone 14 Phase 1,
 * founder's "Free Learning" page, 2026-09-27; DR-03). Two items, as asked:
 *
 *   1. LEARN FREE — the founder's book *I Am Datapedia!* as free, self-paced
 *      learning: every topic readable and self-checked here. The topics
 *      arrive with Phase 2 (a database table fed from the book — Rule 1
 *      approval pending); until then this page says so and links the book.
 *   2. GIVE FREE TEST AND GAIN CERTIFICATE — the Knowledge Check (50 / 100 /
 *      200 questions, signed-in only, 70 % pass). Phase 4. Until then the
 *      free ten-question diagnostic remains the taster, unchanged and unsaved.
 *
 * Nothing here is invented: the two items are described as what they will
 * be, and what exists today is what is linked. "Take away" lists the
 * trainer's books with Amazon links (P5: see price on Amazon).
 */
export const metadata: Metadata = {
  title: "Free Training & Certification",
  description: "Learn free from I Am Datapedia!, check yourself topic by topic, and take the free Knowledge Check.",
};

export const dynamic = "force-dynamic";

const DATAPEDIA_ASIN = "B0F1NT87CL";

export default async function FreeLearningPage() {
  const [experts, topicCount, bank] = await Promise.all([listPublishedExperts(), countPublishedTopics(), bankSize()]);
  const author = experts.find((e) => e.profile.books?.some((b) => b.url.includes(DATAPEDIA_ASIN))) ?? experts.find((e) => (e.profile.books?.length ?? 0) > 0) ?? null;
  const datapedia = author?.profile.books?.find((b) => b.url.includes(DATAPEDIA_ASIN)) ?? null;

  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Free Training &amp; Certification</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="free-learning-title">
            Learn free. Test yourself. Prove it.
          </h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            Self-paced learning from the trainer&rsquo;s own published work, topic self-checks, and a free Knowledge Check for account
            holders — alongside, not instead of, our expert-led trainings.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1 — Learn Free */}
          <Card variant="panel" className="flex flex-col p-6 sm:p-8" data-testid="learn-free">
            <p className="text-label mb-2 text-[var(--color-primary)]">1 · Learn free</p>
            <h2 className="text-h1 mb-3">Learn from <em>I Am Datapedia!</em></h2>
            <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
              Every topic of the book, readable here, with a search box to find the one you need — and, soon, a self-check at the
              end of each.
            </p>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              {topicCount > 0 ? (
                <>
                  <Button href="/free-learning/topics" data-testid="browse-topics">
                    Browse {topicCount} topics
                  </Button>
                  <Chip>Self-checks coming</Chip>
                </>
              ) : (
                <Chip>Topics coming</Chip>
              )}
            </div>
            {datapedia && author ? (
              <div className="mt-auto border-t border-[var(--color-line)] pt-5">
                <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
                  The source: <span className="font-medium text-[var(--color-ink)]">{datapedia.title}</span> — {datapedia.subtitle}. By {author.name}.
                </p>
                <Button variant="secondary" href={datapedia.url} target="_blank" rel="noopener noreferrer" data-testid="datapedia-amazon">
                  The book on Amazon ↗
                </Button>
              </div>
            ) : null}
          </Card>

          {/* 2 — Give free test and gain certificate */}
          <Card variant="panel" className="flex flex-col p-6 sm:p-8" data-testid="free-test">
            <p className="text-label mb-2 text-[var(--color-primary)]">2 · Give free test and gain certificate</p>
            <h2 className="text-h1 mb-3">The free Knowledge Check</h2>
            <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
              Choose 50, 100 or 200 questions drawn from the topics; pass at 70 % and receive a Knowledge Check result with its own
              verifiable ID. For account holders; no time limit, retake as often as you like. It arrives with the topics.
            </p>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              {bank >= 50 ? (
                <Button href="/free-learning/knowledge-check" data-testid="start-knowledge-check">
                  Start the Knowledge Check
                </Button>
              ) : (
                <Chip>{bank} reviewed questions so far — opens at 50</Chip>
              )}
            </div>
            <div className="mt-auto border-t border-[var(--color-line)] pt-5">
              <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
                Also: the free ten-question skill diagnostic — no account, nothing saved.
              </p>
              <Button href="/free-learning/diagnostic" data-testid="free-diagnostic-link">
                Take the free diagnostic
              </Button>
            </div>
          </Card>
        </div>
        <p className="text-body-sm mt-6 max-w-[70ch] text-[var(--color-ink-faint)]">
          A Knowledge Check result is not the Academy&rsquo;s credential. The Certificate of Completion is earned by attending an
          expert-led training —{" "}
          <Link href="/programs" className="underline underline-offset-4">
            see the trainings
          </Link>
          .
        </p>
      </section>

      {/* Take away — the trainer's books (M14 item A; P5, P6). */}
      {author && author.profile.books && author.profile.books.length > 0 ? (
        <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-tint)]" data-testid="free-learning-take-away">
          <div className="mx-auto max-w-[1280px] px-6 py-16">
            <p className="text-label mb-3 text-[var(--color-primary)]">Take away</p>
            <h2 className="text-display mb-3">Books by {author.name}</h2>
            <p className="text-body-lg mb-8 max-w-[640px] text-[var(--color-ink-quiet)]">
              The trainer&rsquo;s published work. Prices are Amazon&rsquo;s; soft copies will be offered here once they are ready.
            </p>
            <TakeAwayBooks books={author.profile.books} author={author.name} />
          </div>
        </section>
      ) : null}
    </>
  );
}
