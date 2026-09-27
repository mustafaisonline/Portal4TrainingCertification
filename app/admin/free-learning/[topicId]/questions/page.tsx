import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { listQuestionsForAdmin } from "@/modules/free-learning/quiz.repository";
import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { QuestionReview } from "./QuestionReview";

/*
 * /admin/free-learning/[topicId]/questions — review a topic's self-check
 * questions (Milestone 14 Phase 3; P10: drafts until the founder marks them
 * reviewed). Every question with its five options and the correct one
 * marked; per-question Reviewed / Back to draft; "Mark all reviewed" for the
 * topic. Only reviewed questions reach readers. Administrators only.
 */
export const metadata: Metadata = { title: "Review questions" };
export const dynamic = "force-dynamic";

export default async function AdminTopicQuestionsPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = await params;
  const access = await authorise("platform_admin");
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/free-learning/${topicId}/questions`)}`);
    forbidden();
  }
  if (!isUuid(topicId)) notFound();
  const topic = await getPrisma().bookTopic.findUnique({ where: { id: topicId }, select: { id: true, slug: true, title: true, position: true, published: true } });
  if (!topic) notFound();
  const questions = await listQuestionsForAdmin(topic.id);
  const reviewed = questions.filter((q) => q.status === "reviewed").length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/free-learning" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Free Learning
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Self-check questions · topic {topic.position}</p>
        <h1 className="text-display" data-testid="questions-title">
          {topic.title}
        </h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]" data-testid="questions-summary">
          {questions.length} {questions.length === 1 ? "question" : "questions"} · {reviewed} reviewed · readers see reviewed questions only
          {topic.published ? "" : " · the topic itself is unpublished"}.
        </p>
      </header>

      {questions.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="questions-empty">
            No questions yet for this topic
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            Load drafts with <code className="text-mono">npm run learning:import-questions -- &lt;file or folder&gt;</code>.
          </p>
        </Card>
      ) : (
        <QuestionReview topicId={topic.id} questions={questions.map((q) => ({ ...q, reviewedAt: q.reviewedAt ? q.reviewedAt.toISOString() : null }))} />
      )}
    </div>
  );
}
