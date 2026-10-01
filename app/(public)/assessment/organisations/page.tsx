import type { Metadata } from "next";
import { listPublishedOrganisations } from "@/modules/assessment/organisations.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * /assessment/organisations — Organisations — Interview Screening (CR-2026-10-01-1711,
 * DR-07): the companies and education-sector bodies registered with the Academy to
 * screen candidates, one card each. Public (anyone can browse; signing in is needed
 * to take a test); only PUBLISHED organisations with at least one listed role appear.
 * Each card leads to that organisation's role cards. A candidate is told, before
 * starting, that the result is shared with the organisation.
 */
export const metadata: Metadata = {
  title: "Organisations — Interview Screening",
  description: "Companies and education institutions that screen candidates with a role test on the Academy. Choose the organisation you are applying to, then the role.",
};
export const dynamic = "force-dynamic";

const TYPE_LABEL = { company: "Company", education: "Education sector" } as const;

export default async function OrganisationsPage() {
  const organisations = await listPublishedOrganisations();
  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Assessment</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="organisations-title">
            Organisations — Interview Screening
          </h1>
          <p className="text-body-lg max-w-[680px] text-[var(--color-ink-quiet)]" data-testid="organisations-lead">
            Applying to one of these organisations? Choose it, pick the role, and take its screening test. Each test includes the organisation&rsquo;s own questions, and your result is shared with
            that organisation — you are asked to confirm that before you start.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-14" aria-labelledby="organisations-heading">
        <h2 id="organisations-heading" className="sr-only">
          Choose an organisation
        </h2>
        {organisations.length === 0 ? (
          <Card variant="panel" className="max-w-[640px] p-6 sm:p-8" data-testid="organisations-empty">
            <p className="text-body-lg mb-2 font-medium">No organisations are open for screening yet.</p>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">Organisations that screen candidates here will appear on this page. Please check back soon.</p>
          </Card>
        ) : (
          <ul className="grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3" data-testid="organisations-list">
            {organisations.map((o) => (
              <li key={o.id} className="min-w-0">
                <Card variant="panel" className="flex h-full flex-col border border-[var(--color-line)] p-6 sm:p-8" data-testid={`org-card-${o.slug}`}>
                  <div className="mb-4 flex items-center gap-4">
                    {o.logoPath ? (
                      // Plain <img>: the logo is an administrator-supplied site path or https address, shown as supplied.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={o.logoPath} alt={`${o.name} logo`} className="h-14 w-14 shrink-0 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground)] object-contain p-1" data-testid={`org-logo-${o.slug}`} />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="text-h1 flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] text-[var(--color-primary)]"
                        data-testid={`org-initial-${o.slug}`}
                      >
                        {o.name.trim().charAt(0).toUpperCase()}
                      </span>
                    )}
                    <h3 className="text-h1 min-w-0 break-words">{o.name}</h3>
                  </div>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span data-testid={`org-type-${o.slug}`}>
                      <Chip tone="primary">{TYPE_LABEL[o.type]}</Chip>
                    </span>
                  </div>
                  <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]" data-testid={`org-roles-${o.slug}`}>
                    {o.listedRoleCount} {o.listedRoleCount === 1 ? "role" : "roles"} open for screening
                  </p>
                  <div className="mt-auto">
                    <Button href={`/assessment/organisations/${o.slug}`} data-testid={`org-open-${o.slug}`}>
                      See the roles
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
