import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { QUESTION_STATUSES, type RoleQuestionStatus } from "@/modules/assessment/constants";
import { listOrganisationsOfferingRole } from "@/modules/assessment/organisations.repository";
import { countsByStatus, listQuestionsForAdmin } from "@/modules/assessment/questions.repository";
import { getRoleById } from "@/modules/assessment/roles.repository";
import { authorise } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { ApproveAllDrafts, RoleDetailsForm, RolePublishToggle } from "../RoleForms";
import { BankQuestionCard, QuestionForm } from "../QuestionForms";

/*
 * /admin/interview/[roleId] — one role's SHARED question bank (CR-2026-10-01-1711):
 * the role's details and publish switch, counts by status, "Approve all drafts"
 * (asks first), the bank filtered by status and paginated, and the form that
 * adds a question. A reviewed question is edited after returning it to draft.
 * Organisation questions are approved in the approval queue. Administrators only.
 */
export const metadata: Metadata = { title: "Interview role" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<RoleQuestionStatus, string> = { draft: "Draft", pending: "Pending", reviewed: "Reviewed", rejected: "Rejected" };

export default async function AdminInterviewRolePage({ params, searchParams }: { params: Promise<{ roleId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { roleId } = await params;
  const access = await authorise("platform_admin");
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/interview/${roleId}`)}`);
    forbidden();
  }
  const role = await getRoleById(roleId);
  if (!role || role.organisationId !== null) notFound(); // a private role belongs to its organisation
  const sp = await searchParams;
  const statusParam = typeof sp["status"] === "string" ? sp["status"] : "";
  const status = (QUESTION_STATUSES as readonly string[]).includes(statusParam) ? (statusParam as RoleQuestionStatus) : undefined;
  const requestedPage = typeof sp["page"] === "string" ? Number.parseInt(sp["page"], 10) : 1;
  const [counts, list] = await Promise.all([
    countsByStatus(role.id, null),
    listQuestionsForAdmin({ roleId: role.id, organisationId: null, ...(status ? { status } : {}), page: Number.isFinite(requestedPage) ? requestedPage : 1 }),
  ]);
  const total = QUESTION_STATUSES.reduce((n, s) => n + counts[s], 0);
  const href = (p: number, s: RoleQuestionStatus | undefined = status) => {
    const q = new URLSearchParams();
    if (s) q.set("status", s);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return `/admin/interview/${role.id}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6" data-testid="interview-role" data-role-id={role.id}>
      <header>
        <Link href="/admin/interview" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Interview roles
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Question bank · {role.slug}</p>
        <h1 className="text-display" data-testid="interview-role-title">
          {role.name}
        </h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]" data-testid="interview-role-summary">
          {total} {total === 1 ? "question" : "questions"} · {counts.reviewed} reviewed · {counts.draft} draft · {counts.rejected} rejected. Candidates see reviewed questions only.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Chip tone={role.published ? "primary" : "neutral"}>{role.published ? "Published" : "Unpublished"}</Chip>
          <RolePublishToggle roleId={role.id} published={role.published} name={role.name} />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="panel" className="p-5 sm:p-6">
          <h2 className="text-h2 mb-4">Role details</h2>
          <RoleDetailsForm roleId={role.id} name={role.name} description={role.description} position={role.position} />
        </Card>
        <Card variant="panel" className="p-5 sm:p-6">
          <h2 className="text-h2 mb-1">Review</h2>
          <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">Questions loaded by the seed arrive as drafts. Approve them one by one below, or all at once.</p>
          <ApproveAllDrafts roleId={role.id} drafts={counts.draft} />
        </Card>
      </div>

      <Card variant="panel" className="p-5 sm:p-6">
        <h2 className="text-h2 mb-4">Add a question</h2>
        <QuestionForm roleId={role.id} organisations={await listOrganisationsOfferingRole(role.id)} />
      </Card>

      <section aria-labelledby="bank-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="bank-heading" className="text-h2">
            The bank
          </h2>
          <nav aria-label="Filter by status" className="flex flex-wrap gap-2" data-testid="bank-filters">
            <Button variant={status ? "secondary" : "primary"} href={href(1, undefined)} data-testid="status-filter-all" aria-current={status ? undefined : "true"}>
              All ({total})
            </Button>
            {QUESTION_STATUSES.map((s) => (
              <Button key={s} variant={status === s ? "primary" : "secondary"} href={href(1, s)} data-testid={`status-filter-${s}`} aria-current={status === s ? "true" : undefined}>
                {STATUS_LABEL[s]} ({counts[s]})
              </Button>
            ))}
          </nav>
        </div>

        {list.rows.length === 0 ? (
          <Card variant="panel" className="p-5 sm:p-6">
            <p className="text-body-lg font-medium" data-testid="bank-empty">
              {status ? `No ${STATUS_LABEL[status].toLowerCase()} questions` : "No questions yet"}
            </p>
          </Card>
        ) : (
          <ol className="flex list-none flex-col gap-4 p-0" data-testid="bank-list">
            {list.rows.map((q) => (
              <li key={q.id}>
                <BankQuestionCard
                  q={{ id: q.id, roleId: q.roleId, roleName: q.roleName, organisationName: q.organisationName, category: q.category, stem: q.stem, modelAnswer: q.modelAnswer, source: q.source, status: q.status, reviewedByName: q.reviewedByName, options: q.options }}
                />
              </li>
            ))}
          </ol>
        )}

        {list.pages > 1 ? (
          <nav aria-label="Bank pages" className="flex flex-wrap items-center justify-between gap-3" data-testid="bank-pagination">
            <div className="flex gap-2">
              {list.page > 1 ? (
                <Button variant="secondary" href={href(list.page - 1)} data-testid="bank-prev">
                  ← Previous
                </Button>
              ) : null}
            </div>
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="bank-page-label">
              Page {list.page} of {list.pages} · {list.total} questions
            </p>
            <div className="flex gap-2">
              {list.page < list.pages ? (
                <Button variant="secondary" href={href(list.page + 1)} data-testid="bank-next">
                  Next →
                </Button>
              ) : null}
            </div>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
