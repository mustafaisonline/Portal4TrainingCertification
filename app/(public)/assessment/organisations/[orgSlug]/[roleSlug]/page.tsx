import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ORG_QUESTION_CAP } from "@/modules/assessment/constants";
import { getOrganisationBySlug, listOrganisationRoles } from "@/modules/assessment/organisations.repository";
import { plannedTestSize } from "@/modules/assessment/role-test-scope";
import { RoleIntroScreen } from "../../../_role-test/RoleIntroScreen";

/*
 * /assessment/organisations/[orgSlug]/[roleSlug] — an organisation's screening
 * test for one role (CR-2026-10-01-1711): the introduction, the REQUIRED
 * acknowledgement that the result is shared with the organisation, the start
 * button, and the person's own results for this role and organisation. 404 for
 * an unknown or unpublished organisation, and for a role it does not list. The
 * screen, test and result are the same components as Prepare for Interview.
 */
export const dynamic = "force-dynamic";

async function resolve(orgSlug: string, roleSlug: string) {
  const org = await getOrganisationBySlug(orgSlug);
  if (!org) return null;
  const role = (await listOrganisationRoles(org.id, { onlyListed: true })).find((r) => r.slug === roleSlug);
  return role ? { org, role } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ orgSlug: string; roleSlug: string }> }): Promise<Metadata> {
  const { orgSlug, roleSlug } = await params;
  const found = await resolve(orgSlug, roleSlug);
  return found ? { title: `${found.role.name} — ${found.org.name} Interview Screening` } : { title: "Interview Screening" };
}

export default async function OrganisationRolePage({ params }: { params: Promise<{ orgSlug: string; roleSlug: string }> }) {
  const { orgSlug, roleSlug } = await params;
  const found = await resolve(orgSlug, roleSlug);
  if (!found) notFound();
  const { org, role } = found;
  return (
    <RoleIntroScreen
      scope={{ roleSlug: role.slug, orgSlug: org.slug }}
      role={role}
      organisation={{ id: org.id, name: org.name }}
      plannedSize={plannedTestSize({ organisationApproved: role.approvedQuestionCount, shared: role.sharedQuestionCount })}
      ownQuestionCount={Math.min(role.approvedQuestionCount, ORG_QUESTION_CAP)}
      sharedQuestionCount={role.sharedQuestionCount}
      isPrivateRole={role.isPrivate}
    />
  );
}
