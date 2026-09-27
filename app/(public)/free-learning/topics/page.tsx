import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedTopics } from "@/modules/free-learning/book.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/forms";

/*
 * /free-learning/topics — every published topic of *I Am Datapedia!* in book
 * order, with a search box (Milestone 14 Phase 2; the founder's "all topics
 * visible … with a search option"). Reading is free and anonymous; nothing
 * about the reader is stored (P11).
 */
export const metadata: Metadata = {
  title: "Learn free — topics",
  description: "Every topic of I Am Datapedia!, free to read, with a search.",
};

export const dynamic = "force-dynamic";

export default async function TopicsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp["q"] === "string" ? sp["q"].trim().slice(0, 120) : "";
  const topics = await listPublishedTopics(q);

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[1080px] px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/free-learning" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Free Training &amp; Certification
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">Learn free</p>
        <h1 className="text-display mb-3" data-testid="topics-title">
          Topics from <em>I Am Datapedia!</em>
        </h1>
        <p className="text-body-lg mb-8 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Read any topic, in the book&rsquo;s order or by searching for the one you need. Free, no account, nothing saved.
        </p>

        <Card variant="panel" className="mb-8 p-5 sm:p-6">
          <form method="get" action="/free-learning/topics" role="search" aria-label="Search topics" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:flex-1">
              <Field label="Search topics" name="q" type="search" defaultValue={q} autoComplete="off" maxLength={120} placeholder="e.g. metadata, entity, data lake" />
            </div>
            <Button type="submit" className="sm:shrink-0" data-testid="topics-search">
              Search
            </Button>
          </form>
        </Card>

        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]" data-testid="topics-count" role="status">
          {q ? `${topics.length} ${topics.length === 1 ? "topic matches" : "topics match"} “${q}”` : `${topics.length} topics`}
          {q ? (
            <>
              {" · "}
              <Link href="/free-learning/topics" className="text-[var(--color-primary)] underline underline-offset-4">
                Show all
              </Link>
            </>
          ) : null}
        </p>

        {topics.length === 0 ? (
          <Card variant="panel" className="p-5 sm:p-6" data-testid="topics-empty">
            <p className="text-body-lg font-medium">{q ? "No topic matches." : "The topics are being prepared."}</p>
            <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
              {q ? "Try another word, or browse the full list." : "They appear here the moment the first ones are published."}
            </p>
          </Card>
        ) : (
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
        )}
      </div>
    </section>
  );
}
