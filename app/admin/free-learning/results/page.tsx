import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { formatCalendarDate } from "@/modules/certificates/dates";
import { ASSESSMENT_GRADE_BANDS, ASSESSMENT_GRADES, isAssessmentGrade } from "@/modules/free-learning/assessment-rules";
import { listPassedResultsForAdmin } from "@/modules/free-learning/knowledge-check.repository";
import { authorise } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { inputClass } from "@/shared/ui/forms";
import { formatTimestamp } from "@/shared/util/dates";
import { RevokeKnowledgeCheck } from "./RevokeKnowledgeCheck";

/*
 * /admin/free-learning/results — passed Free Assessment Checks and their
 * Certificates of Achievement (Milestone 15, Requirement 3; graded from
 * 2026-09-30). Search by exact Assessment Check ID, filter by grade
 * (Charlie / Bravo / Alpha — derived from the score, so the filter is a score
 * range on 200-question results) or see the latest; revoke one with a recorded
 * reason (unchanged). Administrators only. Email is shown here and never on the
 * public page. A result of an earlier size has no grade ("—").
 */
export const metadata: Metadata = { title: "Free Assessment Check certificates" };
export const dynamic = "force-dynamic";

const STATUS_LABEL = { valid: "Valid", expired: "Expired", revoked: "Revoked", not_passed: "Not passed" } as const;

export default async function AdminKnowledgeCheckResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const access = await authorise("platform_admin");
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/free-learning/results")}`);
    forbidden();
  }
  const sp = await searchParams;
  const q = typeof sp["q"] === "string" ? sp["q"].trim() : "";
  const gradeRaw = typeof sp["grade"] === "string" ? sp["grade"] : "";
  const grade = isAssessmentGrade(gradeRaw) ? gradeRaw : undefined;
  const rows = await listPassedResultsForAdmin({ publicId: q || undefined, grade });
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/free-learning" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Free Learning
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Free Certifications</p>
        <h1 className="text-display" data-testid="kc-results-title">
          Free Assessment Check certificates
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          Passed results and their Certificates of Achievement, with the grade earned (Charlie 60–70 %, Bravo 71–80 %, Alpha 81–100 %). A certificate is valid for one year from the pass date; revoking one is permanent here and shows on its public verification page.
        </p>
      </header>

      <form action="/admin/free-learning/results" method="get" className="flex flex-wrap items-end gap-3" role="search" aria-label="Find a Free Assessment Check certificate">
        <div className="flex flex-col gap-1">
          <label htmlFor="kc-q" className="text-label">
            Assessment Check ID
          </label>
          <input id="kc-q" name="q" defaultValue={q} placeholder="KC-2026-XXXX-XXXX" className={inputClass} data-testid="kc-results-search" />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="kc-grade" className="text-label">
            Grade
          </label>
          <select id="kc-grade" name="grade" defaultValue={grade ?? ""} className={inputClass} data-testid="kc-results-grade-filter">
            <option value="">Any</option>
            {ASSESSMENT_GRADES.map((g) => (
              <option key={g} value={g}>
                {ASSESSMENT_GRADE_BANDS[g].name} ({ASSESSMENT_GRADE_BANDS[g].band})
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="secondary">
          Find
        </Button>
        {q || grade ? (
          <Button variant="secondary" href="/admin/free-learning/results">
            Show latest
          </Button>
        ) : null}
      </form>

      {rows.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="kc-results-empty">
            {q || grade ? "No passed result matches." : "No passed Free Assessment Check yet."}
          </p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[960px] border-collapse" data-testid="kc-results-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {["Assessment Check ID", "Holder", "Score", "Grade", "Passed on", "Valid until", "Status", "Revoke"].map((c) => (
                  <th key={c} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.attemptId} className="border-b border-[var(--color-line)] align-top last:border-b-0" data-testid="kc-results-row" data-id={r.publicId}>
                  <td className="text-mono px-4 py-3">
                    <Link href={`/verify/${r.publicId}`} className="text-[var(--color-primary)] underline underline-offset-4">
                      {r.publicId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {r.holderName}
                    <span className="block text-[var(--color-ink-faint)]">{r.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.score} of {r.size} ({r.percent} %)
                  </td>
                  <td className="px-4 py-3" data-testid="kc-results-grade" data-grade={r.grade ?? "none"}>
                    {r.grade ? ASSESSMENT_GRADE_BANDS[r.grade].name : "—"}
                  </td>
                  <td className="px-4 py-3">{formatTimestamp(r.finishedAt)}</td>
                  <td className="px-4 py-3">{r.expiresOn ? formatCalendarDate(r.expiresOn) : "—"}</td>
                  <td className="px-4 py-3" data-testid="kc-results-status" data-status={r.status}>
                    {STATUS_LABEL[r.status]}
                    {r.revocationReason ? <span className="block text-[var(--color-ink-faint)]">{r.revocationReason}</span> : null}
                  </td>
                  <td className="px-4 py-3">{r.status === "revoked" ? "—" : <RevokeKnowledgeCheck publicId={r.publicId} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
