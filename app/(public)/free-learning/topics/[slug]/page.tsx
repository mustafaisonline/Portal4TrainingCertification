import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findPublishedTopicBySlug } from "@/modules/free-learning/book.repository";
import { listReviewedQuestionPage } from "@/modules/free-learning/quiz.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { TopicQuiz } from "./TopicQuiz";

/*
 * /free-learning/topics/[slug] — one topic of *I Am Datapedia!* (Milestone
 * 14 Phase 2). The body is the HTML the import stored (sanitised at import;
 * images served from the database by /free-learning/images/<id>). The
 * self-check questions (Phase 3) sit on a second tab, "Questions", so a
 * reader can go straight to them instead of scrolling past the whole topic
 * (founder, 2026-09-29): `/topics/<slug>` is the Topic tab and
 * `?tab=questions` the Questions tab. A `?page=N` link — the quiz's own
 * pagination — always means the Questions tab. Plain links, so both tabs
 * work without JavaScript and can be shared. An unpublished or unknown slug
 * is a 404.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const topic = await findPublishedTopicBySlug(slug);
  return topic ? { title: `${topic.title} — Learn free`, description: topic.excerpt } : { title: "Topic not found" };
}

const BODY_CLASSES =
  "text-body-md text-[var(--color-ink)] [&_p]:mb-4 [&_p]:leading-relaxed [&_h2]:text-h1 [&_h2]:mb-3 [&_h2]:mt-8 [&_h3]:text-h2 [&_h3]:mb-2 [&_h3]:mt-6 " +
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_strong]:font-semibold [&_em]:italic " +
  "[&_img]:my-6 [&_img]:max-w-full [&_img]:rounded-[var(--radius-plate)] [&_img]:border [&_img]:border-[var(--color-line)] " +
  "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--color-line)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--color-line)] [&_th]:p-2 [&_th]:text-left " +
  "[&_a]:text-[var(--color-primary)] [&_a]:underline [&_a]:underline-offset-4";

export default async function TopicPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const topic = await findPublishedTopicBySlug(slug);
  if (!topic) notFound();
  const quiz = await listReviewedQuestionPage(topic.id, Number.parseInt(typeof sp["page"] === "string" ? sp["page"] : "1", 10) || 1);
  const activeTab: "topic" | "questions" = sp["tab"] === "questions" || typeof sp["page"] === "string" ? "questions" : "topic";
  const topicHref = `/free-learning/topics/${topic.slug}`;
  const tabs = [
    { key: "topic" as const, label: "Topic", href: topicHref },
    { key: "questions" as const, label: quiz.total > 0 ? `Questions (${quiz.total})` : "Questions", href: `${topicHref}?tab=questions` },
  ];

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/free-trainings" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← All topics
        </Link>
        <p className="text-label mb-3 text-[var(--color-primary)]">
          Learn free · topic {topic.position}
        </p>
        <h1 className="text-display mb-6" data-testid="topic-title">
          {topic.title}
        </h1>

        <nav aria-label="Topic sections" className="mb-6 flex gap-2 border-b border-[var(--color-line)]" data-testid="topic-tabs">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              scroll={false}
              aria-current={activeTab === t.key ? "page" : undefined}
              data-testid={`topic-tab-${t.key}`}
              className={`text-body-sm -mb-px border-b-2 px-4 py-3 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                activeTab === t.key
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-transparent text-[var(--color-ink-quiet)] hover:text-[var(--color-ink)]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {activeTab === "topic" ? (
          <>
            <Card variant="panel" className="p-5 sm:p-8">
              {/* The import sanitised this HTML (src/modules/free-learning/import.ts);
                  it is the founder's own text, stored in our database. */}
              <div className={BODY_CLASSES} data-testid="topic-body" dangerouslySetInnerHTML={{ __html: topic.bodyHtml }} />
            </Card>
            {quiz.total > 0 ? (
              <Card variant="plate" className="mt-6 flex flex-wrap items-center justify-between gap-3 p-5" data-testid="topic-to-questions">
                <p className="text-body-sm text-[var(--color-ink-quiet)]">Finished reading? Test yourself with {quiz.total} questions on this topic.</p>
                <Button href={`${topicHref}?tab=questions`} data-testid="topic-to-questions-link">
                  Go to the questions →
                </Button>
              </Card>
            ) : null}
          </>
        ) : quiz.total > 0 ? (
          /* Phase 3: reviewed questions, ten a page; nothing about the reader is stored. */
          <TopicQuiz topicSlug={topic.slug} page={quiz} />
        ) : (
          <Card variant="plate" className="p-5 sm:p-6" data-testid="topic-quiz-coming">
            <p className="text-label mb-1 text-[var(--color-primary)]">Self-check</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Questions on this topic — ten at a time, with the answers shown when you submit — are being prepared.
            </p>
          </Card>
        )}

        <nav aria-label="Neighbouring topics" className="mt-8 flex flex-wrap items-center justify-between gap-3">
          {topic.previous ? (
            <Button variant="secondary" href={`/free-learning/topics/${topic.previous.slug}`} data-testid="topic-previous">
              ← {topic.previous.title}
            </Button>
          ) : (
            <span />
          )}
          {topic.next ? (
            <Button variant="secondary" href={`/free-learning/topics/${topic.next.slug}`} data-testid="topic-next">
              {topic.next.title} →
            </Button>
          ) : null}
        </nav>

        <p className="text-body-sm mt-8 text-[var(--color-ink-faint)]">
          From <em>I Am Datapedia!</em> by Mustafa Qizilbash, published here free by the author. Nothing about your reading is stored.
        </p>
      </div>
    </section>
  );
}
