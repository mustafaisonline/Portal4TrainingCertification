import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { authorise } from "@/modules/identity/session";
import { listRolesForAdmin } from "@/modules/assessment/roles.repository";
import { listQuestionsForAdmin } from "@/modules/assessment/questions.repository";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { CreateRoleForm, DeleteRoleButton, RolePublishToggle } from "./RoleForms";

/*
 * /admin/interview — the SHARED interview roles (CR-2026-10-01-1711, P2–P4):
 * every role with its question counts by status, a publish switch, a link to
 * the role's question bank, and the form that creates a role. An
 * organisation's private roles are managed from its own dashboard. Questions
 * are added by hand here or loaded as drafts by the seed. Administrators only.
 */
export const metadata: Metadata = { title: "Interview roles" };
export const dynamic = "force-dynamic";

export default async function AdminInterviewPage() {
  const access = await authorise("platform_admin");
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/interview")}`);
    forbidden();
  }
  const [allRoles, pending] = await Promise.all([listRolesForAdmin(), listQuestionsForAdmin({ status: "pending" })]);
  const roles = allRoles.filter((r) => r.organisationId === null);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Operations
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Assessment</p>
        <h1 className="text-display" data-testid="interview-admin-title">
          Interview roles
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          The roles people can practise for under Prepare for Interview, and that organisations offer in their screening. Each role has a bank of questions with a detailed model answer; candidates only ever see <strong>reviewed</strong> questions.
        </p>
        <p className="text-body-sm mt-2">
          <Link href="/admin/interview/approvals" className="text-[var(--color-primary)] underline underline-offset-4" data-testid="interview-approvals-link">
            Approval queue
          </Link>{" "}
          — <span data-testid="interview-pending-count">{pending.total}</span> organisation {pending.total === 1 ? "question is" : "questions are"} waiting.
        </p>
      </header>

      {roles.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="interview-admin-empty">
            No interview roles yet
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            Create one below, or run <code className="text-mono">npm run db:seed</code> to add Data Engineer and AI Engineer.
          </p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[820px] border-collapse" data-testid="interview-roles-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {["Role", "URL name", "Status", "Draft", "Pending", "Reviewed", "Rejected", ""].map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Action</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-line)] align-top last:border-b-0" data-testid="interview-role-row" data-slug={r.slug} data-role-id={r.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/interview/${r.id}`} className="font-medium text-[var(--color-primary)] underline underline-offset-4" data-testid="interview-role-link">
                      {r.name}
                    </Link>
                  </td>
                  <td className="text-mono px-4 py-3 text-[var(--color-ink-quiet)]">{r.slug}</td>
                  <td className="px-4 py-3" data-testid="interview-role-status">
                    <Chip tone={r.published ? "primary" : "neutral"}>{r.published ? "Published" : "Unpublished"}</Chip>
                  </td>
                  <td className="px-4 py-3" data-testid="count-draft">
                    {r.counts.draft}
                  </td>
                  <td className="px-4 py-3" data-testid="count-pending">
                    {r.counts.pending}
                  </td>
                  <td className="px-4 py-3" data-testid="count-reviewed">
                    {r.counts.reviewed}
                  </td>
                  <td className="px-4 py-3" data-testid="count-rejected">
                    {r.counts.rejected}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
                      <Link
                        href={`/admin/interview/${r.id}`}
                        className="text-[var(--color-primary)] underline underline-offset-4"
                        aria-label={`Edit ${r.name}`}
                        data-testid="interview-role-edit"
                      >
                        Edit
                      </Link>
                      <RolePublishToggle roleId={r.id} published={r.published} name={r.name} />
                      <DeleteRoleButton roleId={r.id} name={r.name} attempts={r.attemptCount} questions={r.counts.draft + r.counts.pending + r.counts.reviewed + r.counts.rejected} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card variant="panel" className="p-5 sm:p-6">
        <h2 className="text-h2 mb-1">Create a role</h2>
        <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">A new role starts unpublished with an empty bank. Add questions, approve them, then publish it.</p>
        <CreateRoleForm />
      </Card>
    </div>
  );
}
