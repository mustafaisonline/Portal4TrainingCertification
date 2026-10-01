import type { Metadata } from "next";
import { RoleTestScreen } from "../../../../_role-test/RoleTestScreen";

/* /assessment/interview/[roleSlug]/test/[attemptId] — the running test (shared screen; see RoleTestScreen). */
export const metadata: Metadata = { title: "Interview practice test", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function InterviewTestPage({ params, searchParams }: { params: Promise<{ roleSlug: string; attemptId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { roleSlug, attemptId } = await params;
  const sp = await searchParams;
  return <RoleTestScreen scope={{ roleSlug, orgSlug: null }} attemptId={attemptId} pageParam={typeof sp["page"] === "string" ? sp["page"] : undefined} />;
}
