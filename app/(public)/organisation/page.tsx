import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { listOrganisationRoles, organisationForUser } from "@/modules/assessment/organisations.repository";
import { listPublishedSharedRoles } from "@/modules/assessment/roles.repository";
import { isOrganisationUser } from "@/modules/identity/roles.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { TABS, tabFrom, tabHref } from "./helpers";
import { OverviewTab } from "./OverviewTab";
import { QuestionsTab } from "./QuestionsTab";
import { ResultsTab } from "./ResultsTab";
import { RolesTab } from "./RolesTab";

/*
 * /organisation — the Organisation Dashboard (CR-2026-10-01-1711, P3/P4).
 * Only people holding the Organisation role (`org_admin`) see it; everyone else
 * gets a 403 and a signed-out visitor is sent to sign in. The organisation is
 * resolved from the SESSION. Four tabs as plain links (`?tab=overview|roles|
 * questions|results`), so they work without JavaScript: Overview, Roles (add
 * from the catalogue or create your own), Questions (per role, with approval
 * status), Results (own candidates, CSV export). A person with the role but no
 * organisation record is told so — nothing crashes.
 */
export const metadata: Metadata = { title: "Organisation Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined): string | undefined => (typeof v === "string" && v !== "" ? v : undefined);
const pageNumber = (v: string | string[] | undefined): number => Number.parseInt(one(v) ?? "1", 10) || 1;

export default async function OrganisationDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?return-to=${encodeURIComponent("/organisation")}`);
  if (!isOrganisationUser(user.roles)) forbidden();

  const organisation = await organisationForUser(user.id);
  if (!organisation) {
    return (
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">Organisation</p>
          <h1 className="text-display mb-4" data-testid="organisation-title">
            Organisation Dashboard
          </h1>
          <Card variant="panel" className="p-5 sm:p-8" data-testid="organisation-no-record">
            <p className="text-body-lg mb-2 font-medium">Your organisation isn&rsquo;t set up yet.</p>
            <p className="text-body-sm max-w-[62ch] text-[var(--color-ink-quiet)]">
              You have Organisation access, but it is not linked to an organisation record yet. Please{" "}
              <Link href="/contact" className="text-[var(--color-primary)] underline underline-offset-4">
                contact us
              </Link>{" "}
              and we will finish the set-up.
            </p>
          </Card>
        </div>
      </section>
    );
  }

  const sp = await searchParams;
  const tab = tabFrom(sp["tab"]);
  const roles = await listOrganisationRoles(organisation.id);
  const roleParam = one(sp["role"]);
  const page = pageNumber(sp["page"]);

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Organisation</p>
        <h1 className="text-display mb-2" data-testid="organisation-title">
          Organisation Dashboard
        </h1>
        <p className="text-body-lg mb-6 text-[var(--color-ink-quiet)]" data-testid="organisation-name">
          {organisation.name}
        </p>

        <nav aria-label="Dashboard sections" className="mb-6 flex gap-1 overflow-x-auto border-b border-[var(--color-line)] sm:gap-2" data-testid="org-tabs">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={tabHref(t.key)}
              scroll={false}
              aria-current={tab === t.key ? "page" : undefined}
              data-testid={`org-tab-${t.key}`}
              className={`text-body-sm -mb-px whitespace-nowrap border-b-2 px-3 py-3 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] sm:px-4 ${
                tab === t.key ? "border-[var(--color-primary)] text-[var(--color-primary)]" : "border-transparent text-[var(--color-ink-quiet)] hover:text-[var(--color-ink)]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {tab === "overview" ? <OverviewTab organisation={organisation} roles={roles} /> : null}
        {tab === "roles" ? <RolesTab roles={roles} catalogue={await listPublishedSharedRoles()} /> : null}
        {tab === "questions" ? <QuestionsTab organisation={organisation} roles={roles} roleId={roleParam} page={page} /> : null}
        {tab === "results" ? <ResultsTab organisation={organisation} roles={roles} roleId={roleParam} page={page} /> : null}
      </div>
    </section>
  );
}
