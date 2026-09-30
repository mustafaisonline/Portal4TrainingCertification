import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { listPublishedTopics } from "@/modules/free-learning/book.repository";
import { questionCountsByTopic } from "@/modules/free-learning/quiz.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { Field } from "@/shared/ui/forms";

/*
 * /free-trainings — the Knowledge Hub (Milestone 14; renamed twice on
 * founder instruction: "Free Trainings" → "Free Knowledge Hub" → "Knowledge
 * Hub", both 2026-09-28; the URL never changed). One page since 2026-09-28
 * ("New more change": "merge /free-learning/topics into /free-trainings, no
 * need for two pages"): the hero and the Learn Free card, then the full
 * topics browser that used to be its own page — search, the Index/Content
 * views, ten-a-page pagination. /free-learning/topics redirects here; each
 * topic's own reading page (/free-learning/topics/[slug]) is unchanged.
 * Reading is free and anonymous; nothing about the reader is stored (P11).
 *
 * Views of the matching list, switched by `?tab=` (founder, 2026-09-28):
 * **Content** (default — full cards with the excerpt, paginated ten a page
 * with First/Previous/Next/Last) and **Index** (topic names only, book
 * order, the full matching list on one page). `listPublishedTopics` returns
 * lightweight rows (no body HTML, no image bytes), so both views share one
 * fetch. A search submission carries the active tab forward (a hidden
 * field) but always drops any existing `page`, landing on page 1.
 */
export const metadata: Metadata = {
  title: "Knowledge Hub",
  description: "Learn free from I Am Datapedia!, topic by topic, with self-checks and a search.",
};

export const dynamic = "force-dynamic";

const DATAPEDIA_ASIN = "B0F1NT87CL";
const PAGE_SIZE = 10;
type Tab = "content" | "index";

export default async function KnowledgeHubPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp["q"] === "string" ? sp["q"].trim().slice(0, 120) : "";
  const tab: Tab = sp["tab"] === "index" ? "index" : "content";
  const [experts, counts, allTopics] = await Promise.all([listPublishedExperts(), questionCountsByTopic(), listPublishedTopics(q)]);
  // UX review 2026-09-27 D3: say what exists — topics with at least one reviewed self-check question.
  const selfCheckTopics = [...counts.values()].filter((c) => c.reviewed > 0).length;
  const author = experts.find((e) => e.profile.books?.some((b) => b.url.includes(DATAPEDIA_ASIN))) ?? experts.find((e) => (e.profile.books?.length ?? 0) > 0) ?? null;
  const datapedia = author?.profile.books?.find((b) => b.url.includes(DATAPEDIA_ASIN)) ?? null;

  const totalPages = Math.max(1, Math.ceil(allTopics.length / PAGE_SIZE));
  const requestedPage = typeof sp["page"] === "string" ? Number.parseInt(sp["page"], 10) : 1;
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const topics = allTopics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const params = (extra: Record<string, string>) => `?${new URLSearchParams({ ...(q ? { q } : {}), ...extra })}`;
  const pageHref = (p: number) => `/free-trainings${params({ tab, page: String(p) })}`;
  const tabHref = (t: Tab) => `/free-trainings${t === "content" && !q ? "" : params(t === "content" ? {} : { tab: t })}`;
  const clearSearchHref = `/free-trainings${tab === "content" ? "" : "?tab=index"}`;

  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Knowledge Hub</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="free-trainings-title">
            Learn free, at your own pace.
          </h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            Self-paced learning from the trainer&rsquo;s own published work, with topic self-checks — alongside,
            not instead of, our expert-led trainings.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-4 py-12 sm:px-6 sm:py-16">
        {/* Founder, 2026-09-30: the visible "Topics from I Am Datapedia! Read any topic …" heading and
            sentence are removed; an invisible heading keeps the page outline for screen readers. */}
        <h2 className="sr-only" data-testid="topics-title">
          Topics
        </h2>

        <Card variant="panel" className="mb-8 p-5 sm:p-6">
          <form method="get" action="/free-trainings" role="search" aria-label="Search topics" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="tab" value={tab} />
            <div className="sm:flex-1">
              <Field label="Search topics" name="q" type="search" defaultValue={q} autoComplete="off" maxLength={120} placeholder="e.g. metadata, entity, data lake" />
            </div>
            <Button type="submit" className="sm:shrink-0" data-testid="topics-search">
              Search
            </Button>
          </form>
        </Card>

        {/* Index (names only) is listed first; Content (the full cards) is
            still the tab auto-selected on landing (founder, 2026-09-28) —
            display order and the default selection are independent: `tab`
            drives which is active, not which link comes first in the DOM.
            Plain links, not an ARIA tabs widget — there is no client script
            here to give it roving-tabindex/arrow-key behaviour, and a
            half-built tabs pattern fails accessibility checks worse than an
            honest segmented navigation does. No `transition-colors` on
            these links, deliberately: axe-core sampled a genuinely blended
            mid-transition colour right after navigation on the production
            build (a real, reproducible contrast failure, not test flake) —
            same trap ProgrammePricing.tsx's region tabs have, just never
            axe-tested there. */}
        <nav aria-label="Topics view" className="mb-6 flex gap-2" data-testid="topics-view-tabs">
          <Link
            scroll={false}
            href={tabHref("index")}
            aria-current={tab === "index" ? "page" : undefined}
            data-testid="topics-tab-index"
            // `.text-label` is unlayered CSS that sets `color`, so it would beat the text-* utility
            // below and leave low-contrast text on the active tab's blue fill (ProgrammePricing.tsx's
            // region tabs hit the same trap) — its typography is restated here without the colour.
            className={`rounded-full border px-4 py-2 text-[0.75rem] font-semibold uppercase leading-[1.4] tracking-[0.08em] ${
              tab === "index"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-ink)]"
                : "border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] hover:border-[var(--color-primary)] hover:text-[var(--color-ink)]"
            }`}
          >
            Index
          </Link>
          <Link
            scroll={false}
            href={tabHref("content")}
            aria-current={tab === "content" ? "page" : undefined}
            data-testid="topics-tab-content"
            className={`rounded-full border px-4 py-2 text-[0.75rem] font-semibold uppercase leading-[1.4] tracking-[0.08em] ${
              tab === "content"
                ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-ink)]"
                : "border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] hover:border-[var(--color-primary)] hover:text-[var(--color-ink)]"
            }`}
          >
            Content
          </Link>
        </nav>

        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]" data-testid="topics-count" role="status">
          {q ? `${allTopics.length} ${allTopics.length === 1 ? "topic matches" : "topics match"} “${q}”` : `${allTopics.length} topics`}
          {tab === "content" && allTopics.length > PAGE_SIZE ? ` · page ${page} of ${totalPages}` : ""}
          {q ? (
            <>
              {" · "}
              <Link scroll={false} href={clearSearchHref} className="text-[var(--color-primary)] underline underline-offset-4">
                Show all
              </Link>
            </>
          ) : null}
        </p>

        {allTopics.length === 0 ? (
          <Card variant="panel" className="p-5 sm:p-6" data-testid="topics-empty">
            <p className="text-body-lg font-medium">{q ? "No topic matches." : "The topics are being prepared."}</p>
            <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
              {q ? "Try another word, or browse the full list." : "They appear here the moment the first ones are published."}
            </p>
          </Card>
        ) : tab === "index" ? (
          <ol className="grid list-none gap-x-6 gap-y-2 p-0 sm:grid-cols-2 lg:grid-cols-3" data-testid="topics-index-list">
            {allTopics.map((t) => (
              <li key={t.id} className="min-w-0">
                <Link
                  href={`/free-learning/topics/${t.slug}`}
                  className="text-body-sm block truncate py-1 text-[var(--color-ink)] underline-offset-4 hover:text-[var(--color-primary)] hover:underline"
                  data-testid="index-item"
                  data-slug={t.slug}
                >
                  <span className="text-[var(--color-ink-faint)]">{t.position}.</span> {t.title}
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <>
            <ol className="grid list-none gap-3 p-0 sm:grid-cols-2" data-testid="topics-list">
              {topics.map((t) => (
                <li key={t.id} className="min-w-0">
                  <Link href={`/free-learning/topics/${t.slug}`} className="block h-full" data-testid="topic-card" data-slug={t.slug}>
                    <Card variant="panel" className="h-full p-4 transition-colors hover:border-[var(--color-primary)]">
                      <p className="text-label mb-1 text-[var(--color-ink-faint)]">{t.position}</p>
                      <p className="text-body-lg font-medium">{t.title}</p>
                      <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">{t.excerpt}</p>
                    </Card>
                  </Link>
                </li>
              ))}
            </ol>

            {totalPages > 1 ? (
              <nav aria-label="Topics pages" className="mt-6 flex flex-wrap items-center justify-between gap-3" data-testid="topics-pagination">
                <div className="flex flex-wrap gap-2">
                  {page > 1 ? (
                    <>
                      <Button variant="secondary" scroll={false} href={pageHref(1)} data-testid="topics-page-first">
                        « First
                      </Button>
                      <Button variant="secondary" scroll={false} href={pageHref(page - 1)} data-testid="topics-page-prev">
                        ← Previous
                      </Button>
                    </>
                  ) : null}
                </div>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  Page {page} of {totalPages}
                </p>
                <div className="flex flex-wrap gap-2">
                  {page < totalPages ? (
                    <>
                      <Button variant="secondary" scroll={false} href={pageHref(page + 1)} data-testid="topics-page-next">
                        Next →
                      </Button>
                      <Button variant="secondary" scroll={false} href={pageHref(totalPages)} data-testid="topics-page-last">
                        Last »
                      </Button>
                    </>
                  ) : null}
                </div>
              </nav>
            ) : null}
          </>
        )}

        {/* Founder, 2026-09-30: the "Learn free" section sits at the end of the page, just before the footer. */}
        <Card variant="panel" className="mt-12 p-6 sm:p-8" data-testid="learn-free">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* The book's own cover (founder, 2026-09-28: "the book image …
                picked up from the book's Amazon page") — the same cover file
                the Amazon listing shows, already in /public/books. */}
            {datapedia?.cover ? (
              <Image
                src={datapedia.cover}
                alt={`Cover of ${datapedia.title}`}
                width={144}
                height={192}
                className="h-48 w-36 shrink-0 rounded-[var(--radius-plate)] border border-[var(--color-line)] object-cover shadow-sm"
                data-testid="datapedia-cover"
              />
            ) : null}
            <div className="flex min-w-0 flex-col">
              <p className="text-label mb-2 text-[var(--color-primary)]">Learn free</p>
              <h2 className="text-h1 mb-3">Learn from <em>I Am Datapedia!</em></h2>
              <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
                Every topic of the book, readable below, with a search box to find the one you need —{" "}
                {selfCheckTopics > 0 ? `${selfCheckTopics} of them with a self-check at the end` : "self-checks are being added topic by topic"}.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Chip data-testid="self-check-count">{selfCheckTopics > 0 ? `Self-checks on ${selfCheckTopics} topics` : "Self-checks coming"}</Chip>
                {datapedia && author ? (
                  <Button variant="secondary" href={datapedia.url} target="_blank" rel="noopener noreferrer" data-testid="datapedia-amazon">
                    The book on Amazon ↗
                  </Button>
                ) : null}
              </div>
              {datapedia && author ? (
                <p className="text-body-sm mt-4 border-t border-[var(--color-line)] pt-4 text-[var(--color-ink-quiet)]">
                  The source: <span className="font-medium text-[var(--color-ink)]">{datapedia.title}</span> — {datapedia.subtitle}. By {author.name}.
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}
