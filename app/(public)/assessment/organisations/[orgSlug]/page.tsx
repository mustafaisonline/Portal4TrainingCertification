import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ORG_QUESTION_CAP } from "@/modules/assessment/constants";
import { getOrganisationBySlug, listOrganisationRoles } from "@/modules/assessment/organisations.repository";
import { plannedTestSize, TEST_MINUTES } from "@/modules/assessment/role-test-scope";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * /assessment/organisations/[orgSlug] — one organisation's role cards
 * (CR-2026-10-01-1711): the roles it offers that are LISTED (published, with
 * enough approved questions). An unknown or unpublished organisation is a 404.
 */
export const dynamic = "force-dynamic";

const TYPE_LABEL = { company: "Company", education: "Education sector" } as const;

export async function generateMetadata({ params }: { params: Promise<{ orgSlug: string }> }): Promise<Metadata> {
  const { orgSlug } = await params;
  const org = await getOrganisationBySlug(orgSlug);
  return org ? { title: `${org.name} — Interview Screening` } : { title: "Interview Screening" };
}

export default async function OrganisationRolesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrganisationBySlug(orgSlug);
  if (!org) notFound();
  const roles = await listOrganisationRoles(org.id, { onlyListed: true });
  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="mb-4">
            <Link href="/assessment/organisations" className="text-label text-[var(--color-primary)] underline underline-offset-4">
              ← Organisations — Interview Screening
            </Link>
          </p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="org-title">
            {org.name}
          </h1>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span data-testid="org-type">
              <Chip tone="primary">{TYPE_LABEL[org.type]}</Chip>
            </span>
          </div>
          <p className="text-body-lg max-w-[680px] text-[var(--color-ink-quiet)]" data-testid="org-lead">
            Choose the role you are applying for. The test includes {org.name}&rsquo;s own questions, and your result is shared with {org.name} — you are asked to confirm that before you start.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-14" aria-labelledby="org-roles-heading">
        <h2 id="org-roles-heading" className="sr-only">
          Choose a role
        </h2>
        {roles.length === 0 ? (
          <Card variant="panel" className="max-w-[640px] p-6 sm:p-8" data-testid="org-roles-empty">
            <p className="text-body-lg mb-2 font-medium">No roles are open for screening yet.</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">{org.name} has not opened a role for screening here yet. Please check back soon.</p>
          </Card>
        ) : (
          <ul className="grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3" data-testid="org-roles">
            {roles.map((r) => {
              const size = plannedTestSize({ organisationApproved: r.approvedQuestionCount, shared: r.sharedQuestionCount });
              const own = Math.min(r.approvedQuestionCount, ORG_QUESTION_CAP);
              return (
                <li key={r.id} className="min-w-0">
                  <Card variant="panel" className="flex h-full flex-col border border-[var(--color-line)] p-6 sm:p-8" data-testid={`org-role-card-${r.slug}`}>
                    <h3 className="text-h1 mb-3">{r.name}</h3>
                    {r.description ? <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">{r.description}</p> : null}
                    <p className="text-label mb-3 text-[var(--color-ink-faint)]" data-testid={`org-role-facts-${r.slug}`}>
                      {size} {size === 1 ? "question" : "questions"} · {TEST_MINUTES} minutes · model answers
                    </p>
                    {own > 0 ? (
                      <p className="mb-6" data-testid={`org-role-own-${r.slug}`}>
                        <Chip tone="primary">Includes {org.name}&rsquo;s own questions</Chip>
                      </p>
                    ) : (
                      <div className="mb-3" />
                    )}
                    <div className="mt-auto">
                      <Button href={`/assessment/organisations/${org.slug}/${r.slug}`} data-testid={`org-role-open-${r.slug}`}>
                        View the test
                      </Button>
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
