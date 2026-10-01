import Link from "next/link";
import { ADMIN_PAGE_SIZE } from "@/modules/assessment/constants";
import type { OrganisationRecord, OrganisationRoleView } from "@/modules/assessment/organisations.repository";
import { countsByStatus, listQuestionsForOrganisation } from "@/modules/assessment/questions.repository";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { listingNote, tabHref } from "./helpers";
import { QuestionForm, QuestionItem, type QuestionView } from "./QuestionForms";

/* Questions: pick one of the organisation's roles, see ITS questions with their approval status, add / edit / delete. */
export async function QuestionsTab({ organisation, roles, roleId, page }: { organisation: OrganisationRecord; roles: OrganisationRoleView[]; roleId: string | undefined; page: number }) {
  if (roles.length === 0) {
    return (
      <Card variant="plate" className="p-5 sm:p-6" data-testid="org-questions-empty">
        <h2 className="text-h2 mb-1">Questions</h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Your organisation offers no roles yet.{" "}
          <Link href={tabHref("roles")} className="text-[var(--color-primary)] underline underline-offset-4">
            Add a role first
          </Link>
          , then write its questions here.
        </p>
      </Card>
    );
  }
  const role = roles.find((r) => r.id === roleId) ?? roles[0]!;
  const [all, counts] = await Promise.all([listQuestionsForOrganisation(organisation.id, role.id), countsByStatus(role.id, organisation.id)]);
  const pages = Math.max(1, Math.ceil(all.length / ADMIN_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const shown: QuestionView[] = all.slice((current - 1) * ADMIN_PAGE_SIZE, current * ADMIN_PAGE_SIZE).map((q) => ({
    id: q.id,
    category: q.category,
    stem: q.stem,
    modelAnswer: q.modelAnswer,
    status: q.status,
    options: q.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
  }));
  const note = listingNote(role);
  return (
    <div className="flex flex-col gap-6">
      <Card variant="plate" className="p-5 sm:p-6">
        <h2 className="text-h2 mb-1">Questions for a role</h2>
        <p className="text-body-sm mb-4 max-w-[68ch] text-[var(--color-ink-quiet)]" data-testid="org-approval-note">
          An administrator approves every question you add before candidates see it. Only approved questions appear in tests. Editing an approved question sends it back for approval.
        </p>
        <nav aria-label="Choose a role" className="flex flex-wrap gap-2" data-testid="org-role-picker">
          {roles.map((r) => (
            <Link
              key={r.id}
              href={tabHref("questions", { role: r.id })}
              scroll={false}
              aria-current={r.id === role.id ? "page" : undefined}
              data-testid="org-role-pick"
              className={`text-body-sm rounded-full border px-3.5 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                r.id === role.id ? "border-[var(--color-primary)] font-medium text-[var(--color-primary)]" : "border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] hover:text-[var(--color-ink)]"
              }`}
            >
              {r.name}
            </Link>
          ))}
        </nav>
      </Card>

      <Card variant="plate" className="p-5 sm:p-6" data-testid="org-questions">
        <h2 className="text-h2 mb-3" data-testid="org-questions-role">
          {role.name}
        </h2>
        <p className="mb-3 flex flex-wrap items-center gap-2" data-testid="org-question-counts">
          <span data-testid="org-count-approved">
            <Chip tone="primary">Approved {counts.reviewed}</Chip>
          </span>
          <span data-testid="org-count-pending">
            <Chip>Pending approval {counts.pending}</Chip>
          </span>
          <span data-testid="org-count-rejected">
            <Chip>Rejected {counts.rejected}</Chip>
          </span>
        </p>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]" data-testid="org-questions-listing">
          {note.text}
        </p>
        {all.length === 0 ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="org-questions-none">
            You have not added a question for this role yet.
          </p>
        ) : (
          <ul className="flex flex-col" data-testid="org-question-list">
            {shown.map((q) => (
              <QuestionItem key={q.id} question={q} />
            ))}
          </ul>
        )}
        {pages > 1 ? (
          <nav aria-label="Question pages" className="text-body-sm mt-5 flex items-center justify-between gap-3 border-t border-[var(--color-line)] pt-4">
            {current > 1 ? (
              <Link href={tabHref("questions", { role: role.id, page: current - 1 })} className="text-[var(--color-primary)] underline underline-offset-4">
                ← Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-[var(--color-ink-quiet)]">
              Page {current} of {pages}
            </span>
            {current < pages ? (
              <Link href={tabHref("questions", { role: role.id, page: current + 1 })} className="text-[var(--color-primary)] underline underline-offset-4">
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </Card>

      <Card variant="plate" className="p-5 sm:p-6" data-testid="org-add-question">
        <h2 className="text-h2 mb-1">Add a question for {role.name}</h2>
        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">Multiple choice: five options, exactly one correct, and a model answer.</p>
        <QuestionForm key={role.id} mode="add" roleId={role.id} roleName={role.name} />
      </Card>
    </div>
  );
}
