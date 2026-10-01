import Link from "next/link";
import { listResultsForOrganisation } from "@/modules/assessment/attempts.repository";
import type { OrganisationRecord, OrganisationRoleView } from "@/modules/assessment/organisations.repository";
import { formatTimestamp } from "@/shared/util/dates";
import { Card } from "@/shared/ui/Card";
import { formatDuration, tabHref } from "./helpers";

const pill = "text-body-sm rounded-full border px-3.5 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

/* Results: the organisation's own candidates (who agreed to share), a role filter, pagination and a CSV export. */
export async function ResultsTab({ organisation, roles, roleId, page }: { organisation: OrganisationRecord; roles: OrganisationRoleView[]; roleId: string | undefined; page: number }) {
  const role = roles.find((r) => r.id === roleId);
  const results = await listResultsForOrganisation(organisation.id, { ...(role ? { roleId: role.id } : {}), page });
  const csvHref = role ? `/organisation/results.csv?role=${role.id}` : "/organisation/results.csv";
  return (
    <div className="flex flex-col gap-6">
      <Card variant="plate" className="p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-h2 mb-1">Candidate results</h2>
            <p className="text-body-sm max-w-[62ch] text-[var(--color-ink-quiet)]">
              Candidates who took your organisation&rsquo;s tests. They were told before they started that their result is shared with you. Only your own candidates appear here.
            </p>
          </div>
          {/* A plain link: the file is downloaded, not navigated to. */}
          <a
            href={csvHref}
            data-testid="org-results-csv"
            className="text-body-sm inline-flex items-center justify-center rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] px-5 py-2.5 font-medium text-[var(--color-ink)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Export CSV
          </a>
        </div>
        <nav aria-label="Filter by role" className="flex flex-wrap gap-2" data-testid="org-results-filter">
          <Link href={tabHref("results")} scroll={false} aria-current={role ? undefined : "page"} data-testid="org-results-filter-all" className={`${pill} ${role ? "border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] hover:text-[var(--color-ink)]" : "border-[var(--color-primary)] font-medium text-[var(--color-primary)]"}`}>
            All roles
          </Link>
          {roles.map((r) => (
            <Link
              key={r.id}
              href={tabHref("results", { role: r.id })}
              scroll={false}
              aria-current={role?.id === r.id ? "page" : undefined}
              data-testid="org-results-filter-role"
              className={`${pill} ${role?.id === r.id ? "border-[var(--color-primary)] font-medium text-[var(--color-primary)]" : "border-[var(--color-line-strong)] text-[var(--color-ink-quiet)] hover:text-[var(--color-ink)]"}`}
            >
              {r.name}
            </Link>
          ))}
        </nav>
      </Card>

      <Card variant="plate" className="p-0" data-testid="org-results">
        {results.total === 0 ? (
          <p className="text-body-sm p-5 text-[var(--color-ink-quiet)] sm:p-6" data-testid="org-results-empty">
            No results yet{role ? ` for ${role.name}` : ""}. They appear here when candidates finish one of your tests.
          </p>
        ) : (
          <>
            <div role="region" aria-label="Candidate results table" tabIndex={0} className="overflow-x-auto">
              <table className="text-body-sm w-full min-w-[760px] border-collapse" data-testid="org-results-table">
                <caption className="sr-only">Candidate results, newest first</caption>
                <thead>
                  <tr className="border-b border-[var(--color-line)] text-left">
                    {["Candidate", "Email", "Role", "Score", "Percent", "Time taken", "Finished"].map((h) => (
                      <th key={h} scope="col" className="text-label px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((r) => (
                    <tr key={r.attemptId} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="org-result-row">
                      <td className="px-4 py-3 font-medium">{r.candidateName}</td>
                      <td className="px-4 py-3 break-all">{r.candidateEmail}</td>
                      <td className="px-4 py-3">{r.roleName}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {r.score} / {r.size}
                      </td>
                      <td className="px-4 py-3">{r.percent}%</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDuration(r.timeTakenMs)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatTimestamp(r.finishedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <nav aria-label="Result pages" className="text-body-sm flex items-center justify-between gap-3 border-t border-[var(--color-line)] px-4 py-3">
              {results.page > 1 ? (
                <Link href={tabHref("results", { role: role?.id, page: results.page - 1 })} className="text-[var(--color-primary)] underline underline-offset-4">
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-[var(--color-ink-quiet)]" data-testid="org-results-pages">
                {results.total} {results.total === 1 ? "result" : "results"} · page {results.page} of {results.pages}
              </span>
              {results.page < results.pages ? (
                <Link href={tabHref("results", { role: role?.id, page: results.page + 1 })} className="text-[var(--color-primary)] underline underline-offset-4">
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </>
        )}
      </Card>
    </div>
  );
}
