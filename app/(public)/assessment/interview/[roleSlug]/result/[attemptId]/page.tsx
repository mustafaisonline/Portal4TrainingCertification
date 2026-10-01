import type { Metadata } from "next";
import { RoleResultScreen } from "../../../../_role-test/RoleResultScreen";

/* /assessment/interview/[roleSlug]/result/[attemptId] — the result with every model answer (shared screen; see RoleResultScreen). */
export const metadata: Metadata = { title: "Interview practice result", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function InterviewResultPage({ params }: { params: Promise<{ roleSlug: string; attemptId: string }> }) {
  const { roleSlug, attemptId } = await params;
  return <RoleResultScreen scope={{ roleSlug, orgSlug: null }} attemptId={attemptId} />;
}
