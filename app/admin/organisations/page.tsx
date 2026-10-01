import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { listOrganisationsForAdmin } from "@/modules/assessment/organisations.repository";
import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { CreateOrganisationForm, OrganisationPublishToggle } from "./OrganisationForms";

/*
 * /admin/organisations — the companies and education-sector bodies registered
 * for interview screening (CR-2026-10-01-1711): each with its type, publish
 * state, roles offered, people with Organisation access and questions waiting
 * for approval; and the form that registers one. People are given access to an
 * organisation from Admin → Users → the person. Administrators only.
 */
export const metadata: Metadata = { title: "Organisations" };
export const dynamic = "force-dynamic";

const TYPE_LABEL = { company: "Company", education: "Education sector" } as const;

export default async function AdminOrganisationsPage() {
  const access = await authorise("platform_admin");
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/organisations")}`);
    forbidden();
  }
  const organisations = await listOrganisationsForAdmin();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Operations
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Assessment</p>
        <h1 className="text-display" data-testid="organisations-admin-title">
          Organisations
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          Companies and education-sector bodies that screen candidates with Interview Screening. An organisation appears to the public once it is published and offers a role with questions. To give someone its dashboard, open them under{" "}
          <Link href="/admin/users" className="text-[var(--color-primary)] underline underline-offset-4">
            Users
          </Link>{" "}
          and choose Grant organisation access.
        </p>
      </header>

      {organisations.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="organisations-admin-empty">
            No organisations yet
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
            Register one below, or run <code className="text-mono">npm run db:seed</code> to add Your Partner Technologies.
          </p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[860px] border-collapse" data-testid="organisations-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {["Organisation", "Type", "Status", "Roles", "Members", "Pending questions", ""].map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Action</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {organisations.map((o) => (
                <tr key={o.id} className="border-b border-[var(--color-line)] align-top last:border-b-0" data-testid="organisation-row" data-slug={o.slug} data-organisation-id={o.id}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/organisations/${o.id}`} className="font-medium text-[var(--color-primary)] underline underline-offset-4" data-testid="organisation-link">
                      {o.name}
                    </Link>
                    <p className="text-mono text-[var(--color-ink-faint)]">{o.slug}</p>
                  </td>
                  <td className="px-4 py-3" data-testid="organisation-type">
                    {TYPE_LABEL[o.type]}
                  </td>
                  <td className="px-4 py-3" data-testid="organisation-status">
                    <Chip tone={o.published ? "primary" : "neutral"}>{o.published ? "Published" : "Unpublished"}</Chip>
                  </td>
                  <td className="px-4 py-3" data-testid="organisation-roles">
                    {o.roleCount}
                  </td>
                  <td className="px-4 py-3" data-testid="organisation-members">
                    {o.memberCount}
                  </td>
                  <td className="px-4 py-3" data-testid="organisation-pending">
                    {o.pendingQuestionCount}
                  </td>
                  <td className="px-4 py-3">
                    <OrganisationPublishToggle organisationId={o.id} published={o.published} name={o.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Card variant="panel" className="p-5 sm:p-6">
        <h2 className="text-h2 mb-1">Register an organisation</h2>
        <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">It starts unpublished. Offer it roles, give someone its dashboard, then publish it.</p>
        <CreateOrganisationForm />
      </Card>
    </div>
  );
}
