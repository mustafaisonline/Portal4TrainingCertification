import type { Metadata } from "next";
import { listPublishedSharedRoles } from "@/modules/assessment/roles.repository";
import { ROLE_TEST_SIZE } from "@/modules/assessment/constants";
import { plannedTestSize, TEST_MINUTES } from "@/modules/assessment/role-test-scope";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * /assessment/interview — Prepare for Interview (CR-2026-10-01-1711, DR-07): one
 * card per role. A person picks the role they are interviewing for and takes
 * that role's test — up to 100 random questions, 90 minutes kept by the portal,
 * a model answer to every question afterwards. Free; signing in is needed to
 * start (the role page asks). A role whose question bank has no reviewed
 * questions yet shows "Coming soon" and is not a link.
 */
export const metadata: Metadata = {
  title: "Prepare for Interview",
  description: `Practise for the interview for your role: pick a role, answer up to ${ROLE_TEST_SIZE} questions in ${TEST_MINUTES} minutes, then read a model answer to each one. Free with an account.`,
};
export const dynamic = "force-dynamic";

export default async function InterviewRolesPage() {
  const roles = await listPublishedSharedRoles();
  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Assessment</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="interview-title">
            Prepare for Interview
          </h1>
          <p className="text-body-lg max-w-[680px] text-[var(--color-ink-quiet)]" data-testid="interview-lead">
            Pick the role you are interviewing for. Answer up to {ROLE_TEST_SIZE} questions in {TEST_MINUTES} minutes, then read a model answer to every one — the way a strong candidate would say it.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-14" aria-labelledby="roles-heading">
        <h2 id="roles-heading" className="sr-only">
          Choose a role
        </h2>
        {roles.length === 0 ? (
          <Card variant="panel" className="max-w-[640px] p-6 sm:p-8" data-testid="interview-empty">
            <p className="text-body-lg mb-2 font-medium">No roles are open yet.</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">Interview practice tests are being prepared. Please check back soon.</p>
          </Card>
        ) : (
          <ul className="grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3" data-testid="interview-roles">
            {roles.map((r) => {
              const ready = r.reviewedQuestionCount > 0;
              const size = plannedTestSize({ organisationApproved: 0, shared: r.reviewedQuestionCount });
              return (
                <li key={r.id} className="min-w-0">
                  <Card variant="panel" className="flex h-full flex-col border border-[var(--color-line)] p-6 sm:p-8" data-testid={`role-card-${r.slug}`} data-ready={ready ? "yes" : "no"}>
                    <h3 className="text-h1 mb-3">{r.name}</h3>
                    {r.description ? <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">{r.description}</p> : null}
                    <p className="text-label mb-6 text-[var(--color-ink-faint)]" data-testid={`role-facts-${r.slug}`}>
                      {ready ? `${size} ${size === 1 ? "question" : "questions"} · ${TEST_MINUTES} minutes · model answers` : "Questions are being prepared"}
                    </p>
                    <div className="mt-auto">
                      {ready ? (
                        <Button href={`/assessment/interview/${r.slug}`} data-testid={`role-open-${r.slug}`}>
                          View the test
                        </Button>
                      ) : (
                        <span data-testid={`role-soon-${r.slug}`}>
                          <Chip>Coming soon</Chip>
                        </span>
                      )}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
