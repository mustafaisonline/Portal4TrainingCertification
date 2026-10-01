import Link from "next/link";
import { listResultsForOrganisation } from "@/modules/assessment/attempts.repository";
import { MIN_PRIVATE_ROLE_QUESTIONS, ORG_QUESTION_CAP } from "@/modules/assessment/constants";
import type { OrganisationRecord, OrganisationRoleView } from "@/modules/assessment/organisations.repository";
import { countsByStatus } from "@/modules/assessment/questions.repository";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { tabHref } from "./helpers";

/* Overview: who the organisation is, the numbers, and how it works. */
export async function OverviewTab({ organisation, roles }: { organisation: OrganisationRecord; roles: OrganisationRoleView[] }) {
  const [perRole, results] = await Promise.all([
    Promise.all(roles.map((r) => countsByStatus(r.id, organisation.id))),
    listResultsForOrganisation(organisation.id, { page: 1 }),
  ]);
  const sum = (key: "reviewed" | "pending" | "rejected") => perRole.reduce((n, c) => n + c[key], 0);
  const stats: { key: string; label: string; value: number; href: string }[] = [
    { key: "roles", label: "Roles offered", value: roles.length, href: tabHref("roles") },
    { key: "listed", label: "Roles listed to candidates", value: roles.filter((r) => r.listed).length, href: tabHref("roles") },
    { key: "approved", label: "Approved questions", value: sum("reviewed"), href: tabHref("questions") },
    { key: "pending", label: "Questions pending approval", value: sum("pending"), href: tabHref("questions") },
    { key: "rejected", label: "Rejected questions", value: sum("rejected"), href: tabHref("questions") },
    { key: "results", label: "Candidate results", value: results.total, href: tabHref("results") },
  ];
  return (
    <div className="flex flex-col gap-6">
      <Card variant="panel" className="p-5 sm:p-8" data-testid="org-overview">
        <h2 className="text-h1 mb-3" data-testid="org-name">
          {organisation.name}
        </h2>
        <p className="mb-4 flex flex-wrap items-center gap-2">
          <span data-testid="org-type">
            <Chip tone="primary">{organisation.type === "company" ? "Company" : "Education sector"}</Chip>
          </span>
          <span data-testid="org-published">
            <Chip>{organisation.published ? "Published" : "Not published yet"}</Chip>
          </span>
        </p>
        <p className="text-body-sm max-w-[62ch] text-[var(--color-ink-quiet)]">
          {organisation.published ? (
            <>
              Candidates can find your organisation on the{" "}
              <Link href="/assessment/organisations" className="text-[var(--color-primary)] underline underline-offset-4">
                Organisations page
              </Link>
              .
            </>
          ) : (
            "An administrator publishes your organisation before candidates can find it. Please contact us when you are ready."
          )}
        </p>
      </Card>

      <Card variant="plate" className="p-5 sm:p-6">
        <h2 className="text-h2 mb-4">At a glance</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3" data-testid="org-stats">
          {stats.map((s) => (
            <div key={s.key} className="flex flex-col gap-1" data-testid={`org-stat-${s.key}`}>
              <dt className="text-body-sm text-[var(--color-ink-quiet)]">{s.label}</dt>
              <dd className="text-display">
                <Link href={s.href} className="text-[var(--color-ink)] underline-offset-4 hover:underline" aria-label={`${s.label}: ${s.value}`}>
                  {s.value}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card variant="plate" className="p-5 sm:p-6" data-testid="org-how-it-works">
        <h2 className="text-h2 mb-3">How it works</h2>
        <ul className="text-body-sm flex max-w-[68ch] list-disc flex-col gap-2 pl-5 text-[var(--color-ink-quiet)]">
          <li>Candidates choose your organisation on the Organisations page, pick one of your roles and take its test. They are told before they start that the result is shared with you.</li>
          <li>
            Your approved questions are always in your tests (up to {ORG_QUESTION_CAP} per test); the rest of each test is drawn from the shared question bank. A role you create yourself uses only your own questions and is listed once it has {MIN_PRIVATE_ROLE_QUESTIONS} approved ones.
          </li>
          <li>An administrator approves every question you add before candidates see it.</li>
          <li>You see the results of your own candidates on the Results tab, and can export them as a CSV file.</li>
        </ul>
      </Card>
    </div>
  );
}
