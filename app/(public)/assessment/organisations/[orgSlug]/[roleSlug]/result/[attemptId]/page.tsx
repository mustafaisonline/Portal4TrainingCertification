import type { Metadata } from "next";
import { RoleResultScreen } from "../../../../../_role-test/RoleResultScreen";

/* /assessment/organisations/[orgSlug]/[roleSlug]/result/[attemptId] — the screening result (the same screen as the interview result). */
export const metadata: Metadata = { title: "Interview screening result", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrganisationResultPage({ params }: { params: Promise<{ orgSlug: string; roleSlug: string; attemptId: string }> }) {
  const { orgSlug, roleSlug, attemptId } = await params;
  return <RoleResultScreen scope={{ roleSlug, orgSlug }} attemptId={attemptId} />;
}
