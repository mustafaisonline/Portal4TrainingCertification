import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSharedRoleBySlug } from "@/modules/assessment/roles.repository";
import { plannedTestSize } from "@/modules/assessment/role-test-scope";
import { RoleIntroScreen } from "../../_role-test/RoleIntroScreen";

/*
 * /assessment/interview/[roleSlug] — a role's introduction, the start button and
 * the person's own results for it (CR-2026-10-01-1711). An unknown or unpublished
 * role is a 404. The screen is shared with the organisation journey.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ roleSlug: string }> }): Promise<Metadata> {
  const { roleSlug } = await params;
  const role = await getSharedRoleBySlug(roleSlug);
  return role ? { title: `${role.name} — Prepare for Interview`, description: role.description || undefined } : { title: "Prepare for Interview" };
}

export default async function InterviewRolePage({ params }: { params: Promise<{ roleSlug: string }> }) {
  const { roleSlug } = await params;
  const role = await getSharedRoleBySlug(roleSlug);
  if (!role) notFound();
  return (
    <RoleIntroScreen
      scope={{ roleSlug: role.slug, orgSlug: null }}
      role={role}
      organisation={null}
      plannedSize={plannedTestSize({ organisationApproved: 0, shared: role.reviewedQuestionCount })}
      ownQuestionCount={0}
      sharedQuestionCount={role.reviewedQuestionCount}
    />
  );
}
