import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { getOrganisationById } from "@/modules/assessment/organisations.repository";
import { listQuestionsForAdmin } from "@/modules/assessment/questions.repository";
import { authorise } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ApprovalCard } from "../QuestionForms";

/*
 * /admin/interview/approvals — the QUEUE of questions waiting for an
 * administrator (CR-2026-10-01-1711): the questions organisations wrote for
 * their own screening tests start PENDING and reach candidates only once approved
 * here. Each shows the organisation, the role, the options with the correct one
 * marked and the model answer; Approve or Reject, with an optional reason that is
 * kept in the audit log. `?organisation=<id>` narrows it to one organisation.
 * Administrators only.
 */
export const metadata: Metadata = { title: "Approval queue" };
export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await authorise("platform_admin");
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/interview/approvals")}`);
    forbidden();
  }
  const sp = await searchParams;
  const organisationParam = typeof sp["organisation"] === "string" ? sp["organisation"] : "";
  const organisation = isUuid(organisationParam) ? await getOrganisationById(organisationParam) : null;
  const requestedPage = typeof sp["page"] === "string" ? Number.parseInt(sp["page"], 10) : 1;
  const list = await listQuestionsForAdmin({ status: "pending", ...(organisation ? { organisationId: organisation.id } : {}), page: Number.isFinite(requestedPage) ? requestedPage : 1 });
  const href = (p: number) => {
    const q = new URLSearchParams();
    if (organisation) q.set("organisation", organisation.id);
    if (p > 1) q.set("page", String(p));
    const qs = q.toString();
    return `/admin/interview/approvals${qs ? `?${qs}` : ""}`;
  };
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/interview" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Interview roles
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Assessment</p>
        <h1 className="text-display" data-testid="approvals-title">
          Approval queue
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]" data-testid="approvals-summary">
          {list.total} {list.total === 1 ? "question is" : "questions are"} waiting{organisation ? ` from ${organisation.name}` : ""}. Approved questions appear in that organisation&apos;s tests at once; rejected ones stay with the organisation to edit.
          {organisation ? (
            <>
              {" "}
              <Link href="/admin/interview/approvals" className="text-[var(--color-primary)] underline underline-offset-4">
                Show every organisation
              </Link>
            </>
          ) : null}
        </p>
      </header>

      {list.rows.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="approvals-empty">
            Nothing is waiting for approval
          </p>
        </Card>
      ) : (
        <ol className="flex list-none flex-col gap-4 p-0" data-testid="approvals-list">
          {list.rows.map((q) => (
            <li key={q.id}>
              <ApprovalCard
                q={{ id: q.id, roleId: q.roleId, roleName: q.roleName, organisationName: q.organisationName, category: q.category, stem: q.stem, modelAnswer: q.modelAnswer, source: q.source, status: q.status, reviewedByName: q.reviewedByName, options: q.options }}
              />
            </li>
          ))}
        </ol>
      )}

      {list.pages > 1 ? (
        <nav aria-label="Queue pages" className="flex flex-wrap items-center justify-between gap-3" data-testid="approvals-pagination">
          <div className="flex gap-2">
            {list.page > 1 ? (
              <Button variant="secondary" href={href(list.page - 1)} data-testid="approvals-prev">
                ← Previous
              </Button>
            ) : null}
          </div>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            Page {list.page} of {list.pages}
          </p>
          <div className="flex gap-2">
            {list.page < list.pages ? (
              <Button variant="secondary" href={href(list.page + 1)} data-testid="approvals-next">
                Next →
              </Button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
