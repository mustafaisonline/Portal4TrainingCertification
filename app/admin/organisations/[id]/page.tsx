import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { getOrganisationById, listOrganisationMembers, listOrganisationRoles } from "@/modules/assessment/organisations.repository";
import { listQuestionsForAdmin } from "@/modules/assessment/questions.repository";
import { listRolesForAdmin } from "@/modules/assessment/roles.repository";
import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { ApprovalCard } from "../../interview/QuestionForms";
import { AddRoleForm, EditOrganisationForm, OrganisationPublishToggle, RemoveRoleButton, RevokeMemberButton } from "../OrganisationForms";

/*
 * /admin/organisations/[id] — one organisation (CR-2026-10-01-1711): its
 * details and publish switch, the roles it offers (add a published shared role,
 * remove one), the people with Organisation access (revoke), and its questions
 * waiting for approval. Access is granted from Admin → Users. Administrators only.
 */
export const metadata: Metadata = { title: "Organisation" };
export const dynamic = "force-dynamic";

const TYPE_LABEL = { company: "Company", education: "Education sector" } as const;

export default async function AdminOrganisationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await authorise("platform_admin");
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/organisations/${id}`)}`);
    forbidden();
  }
  const org = await getOrganisationById(id);
  if (!org) notFound();
  const [offered, allRoles, members, pending] = await Promise.all([
    listOrganisationRoles(org.id),
    listRolesForAdmin(),
    listOrganisationMembers(org.id),
    listQuestionsForAdmin({ organisationId: org.id, status: "pending" }),
  ]);
  const offeredIds = new Set(offered.map((r) => r.id));
  const addable = allRoles.filter((r) => r.organisationId === null && r.published && !offeredIds.has(r.id)).map((r) => ({ id: r.id, name: r.name }));

  return (
    <div className="flex flex-col gap-6" data-testid="organisation-detail" data-organisation-id={org.id}>
      <header>
        <Link href="/admin/organisations" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Organisations
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">
          {TYPE_LABEL[org.type]} · {org.slug}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {org.logoPath ? (
            // A plain <img>: the path is an administrator-entered site path or https address, not a known static folder.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoPath} alt={`${org.name} logo`} className="h-12 w-auto rounded-[var(--radius-plate)] bg-white object-contain p-1" />
          ) : null}
          <h1 className="text-display" data-testid="organisation-title">
            {org.name}
          </h1>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span data-testid="organisation-detail-status">
            <Chip tone={org.published ? "primary" : "neutral"}>{org.published ? "Published" : "Unpublished"}</Chip>
          </span>
          <OrganisationPublishToggle organisationId={org.id} published={org.published} name={org.name} />
        </div>
      </header>

      <Card variant="panel" className="p-5 sm:p-6">
        <h2 className="text-h2 mb-4">Details</h2>
        <EditOrganisationForm organisationId={org.id} name={org.name} type={org.type} contactEmail={org.contactEmail} logoPath={org.logoPath} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="panel" className="p-5 sm:p-6" data-testid="organisation-roles-card">
          <h2 className="text-h2 mb-1">Roles offered</h2>
          <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">
            Candidates see a role once it is published and has reviewed questions. An organisation&apos;s own role also needs ten approved questions of its own.
          </p>
          {offered.length === 0 ? (
            <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]" data-testid="organisation-roles-empty">
              No roles offered yet.
            </p>
          ) : (
            <ul className="mb-4 flex list-none flex-col gap-3 p-0" data-testid="organisation-role-list">
              {offered.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-3 last:border-b-0 last:pb-0" data-testid="organisation-role" data-role-id={r.id}>
                  <div>
                    <p className="font-medium text-[var(--color-ink)]">{r.name}</p>
                    <p className="text-body-sm text-[var(--color-ink-quiet)]">
                      {r.isPrivate ? "Own role" : "Shared role"} · {r.listed ? "listed" : "not listed yet"} · {r.sharedQuestionCount} shared and {r.approvedQuestionCount} own approved questions
                    </p>
                  </div>
                  {r.isPrivate ? null : <RemoveRoleButton organisationId={org.id} roleId={r.id} roleName={r.name} />}
                </li>
              ))}
            </ul>
          )}
          <AddRoleForm organisationId={org.id} roles={addable} />
        </Card>

        <Card variant="panel" className="p-5 sm:p-6" data-testid="organisation-members-card">
          <h2 className="text-h2 mb-1">People with access</h2>
          <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">
            Granted from{" "}
            <Link href="/admin/users" className="text-[var(--color-primary)] underline underline-offset-4">
              Users
            </Link>{" "}
            → the person → Grant organisation access.
          </p>
          {members.length === 0 ? (
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="organisation-members-empty">
              No one has access yet.
            </p>
          ) : (
            <ul className="flex list-none flex-col gap-3 p-0" data-testid="organisation-member-list">
              {members.map((m) => (
                <li key={m.userId} className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] pb-3 last:border-b-0 last:pb-0" data-testid="organisation-member" data-user-id={m.userId}>
                  <div>
                    <Link href={`/admin/users/${m.userId}`} className="font-medium text-[var(--color-primary)] underline underline-offset-4">
                      {m.name}
                    </Link>
                    <p className="text-body-sm break-all text-[var(--color-ink-quiet)]">
                      {m.email} · since {formatTimestamp(m.grantedAt)}
                    </p>
                  </div>
                  <RevokeMemberButton organisationId={org.id} userId={m.userId} label={m.name} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section aria-labelledby="org-pending-heading" className="flex flex-col gap-4">
        <h2 id="org-pending-heading" className="text-h2">
          Questions waiting for approval{" "}
          <span className="text-body-sm font-normal text-[var(--color-ink-quiet)]" data-testid="organisation-pending-count">
            ({pending.total})
          </span>
        </h2>
        {pending.rows.length === 0 ? (
          <Card variant="panel" className="p-5 sm:p-6">
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="organisation-pending-empty">
              Nothing from this organisation is waiting.
            </p>
          </Card>
        ) : (
          <>
            <ol className="flex list-none flex-col gap-4 p-0" data-testid="organisation-pending-list">
              {pending.rows.map((q) => (
                <li key={q.id}>
                  <ApprovalCard
                    q={{ id: q.id, roleId: q.roleId, roleName: q.roleName, organisationName: q.organisationName, category: q.category, stem: q.stem, modelAnswer: q.modelAnswer, source: q.source, status: q.status, reviewedByName: q.reviewedByName, options: q.options }}
                  />
                </li>
              ))}
            </ol>
            {pending.pages > 1 ? (
              <p className="text-body-sm">
                <Link href={`/admin/interview/approvals?organisation=${org.id}`} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="organisation-pending-all">
                  See all {pending.total} in the approval queue
                </Link>
              </p>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
