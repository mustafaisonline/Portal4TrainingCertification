import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { listTopicsForAdmin } from "@/modules/free-learning/book.repository";
import { questionCountsByTopic } from "@/modules/free-learning/quiz.repository";
import { authorise } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { PublishToggle } from "./PublishToggle";

/*
 * /admin/free-learning — the imported topics (Milestone 14 Phase 2): every
 * topic in book order with its slug, size and image count, and a publish /
 * unpublish switch per topic (audited). Importing itself is the script
 * (`npm run learning:import`), never a browser upload — the book is 72 MB.
 * Administrators only.
 */
export const metadata: Metadata = { title: "Free Learning" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminFreeLearningPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await authorise("platform_admin");
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/free-learning")}`);
    forbidden();
  }
  const sp = await searchParams;
  const [allTopics, counts] = await Promise.all([listTopicsForAdmin(), questionCountsByTopic()]);
  // Founder, 2026-09-28: paginate, with First/Previous/Next/Last — the same
  // controls the public topics list carries.
  const totalPages = Math.max(1, Math.ceil(allTopics.length / PAGE_SIZE));
  const requestedPage = typeof sp["page"] === "string" ? Number.parseInt(sp["page"], 10) : 1;
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const topics = allTopics.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageHref = (p: number) => `/admin/free-learning?page=${p}`;
  const published = allTopics.filter((t) => t.published).length;
  const reviewedQuestions = [...counts.values()].reduce((a, c) => a + c.reviewed, 0);
  const totalQuestions = [...counts.values()].reduce((a, c) => a + c.total, 0);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Operations
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Free Learning</p>
        <h1 className="text-display" data-testid="free-learning-admin-title">
          Topics from <em>I Am Datapedia!</em>
        </h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]" data-testid="free-learning-admin-summary">
          {allTopics.length} imported · {published} published · {totalQuestions} self-check questions, {reviewedQuestions} reviewed. Import or re-import with{" "}
          <code className="text-mono">npm run learning:import</code>; a topic you unpublish here stays unpublished across re-imports. Load draft questions
          with <code className="text-mono">npm run learning:import-questions</code>; readers see reviewed questions only.
        </p>
        <p className="text-body-sm mt-2">
          <Link href="/admin/free-learning/results" className="text-[var(--color-primary)] underline underline-offset-4" data-testid="kc-results-link">
            Free Assessment Check certificates
          </Link>{" "}
          — passed results, and revoking a certificate.
        </p>
      </header>

      {allTopics.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="free-learning-admin-empty">
            No topics imported yet
          </p>
        </Card>
      ) : (
        <>
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[760px] border-collapse" data-testid="free-learning-admin-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {["#", "Topic", "Slug", "Words", "Images", "Questions", "Published", ""].map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Action</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topics.map((t) => (
                <tr key={t.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="free-learning-admin-row" data-slug={t.slug}>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]">{t.position}</td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">
                    {t.published ? (
                      <Link href={`/free-learning/topics/${t.slug}`} className="hover:text-[var(--color-primary)]">
                        {t.title}
                      </Link>
                    ) : (
                      t.title
                    )}
                  </td>
                  <td className="px-4 py-3 text-mono text-[var(--color-ink-quiet)]">{t.slug}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]">{t.wordCount}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]">{t.imageCount}</td>
                  <td className="px-4 py-3 whitespace-nowrap" data-testid="free-learning-admin-questions">
                    <Link href={`/admin/free-learning/${t.id}/questions`} className="text-[var(--color-primary)] underline underline-offset-4">
                      {counts.get(t.id) ? `${counts.get(t.id)!.reviewed} of ${counts.get(t.id)!.total} reviewed` : "none"}
                    </Link>
                  </td>
                  <td className="px-4 py-3" data-testid="free-learning-admin-status">
                    {t.published ? "Published" : "Unpublished"}
                  </td>
                  <td className="px-4 py-3">
                    <PublishToggle topicId={t.id} published={t.published} title={t.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        {totalPages > 1 ? (
          <nav aria-label="Topics pages" className="flex flex-wrap items-center justify-between gap-3" data-testid="free-learning-admin-pagination">
            <div className="flex flex-wrap gap-2">
              {page > 1 ? (
                <>
                  <Button variant="secondary" href={pageHref(1)} data-testid="admin-topics-first">
                    « First
                  </Button>
                  <Button variant="secondary" href={pageHref(page - 1)} data-testid="admin-topics-prev">
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
                  <Button variant="secondary" href={pageHref(page + 1)} data-testid="admin-topics-next">
                    Next →
                  </Button>
                  <Button variant="secondary" href={pageHref(totalPages)} data-testid="admin-topics-last">
                    Last »
                  </Button>
                </>
              ) : null}
            </div>
          </nav>
        ) : null}
        </>
      )}
    </div>
  );
}
