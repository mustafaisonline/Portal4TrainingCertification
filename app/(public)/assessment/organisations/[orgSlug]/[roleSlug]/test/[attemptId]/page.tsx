import type { Metadata } from "next";
import { RoleTestScreen } from "../../../../../_role-test/RoleTestScreen";

/* /assessment/organisations/[orgSlug]/[roleSlug]/test/[attemptId] — the running screening test (the same screen as the interview test). */
export const metadata: Metadata = { title: "Interview screening test", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function OrganisationTestPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; roleSlug: string; attemptId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orgSlug, roleSlug, attemptId } = await params;
  const sp = await searchParams;
  return <RoleTestScreen scope={{ roleSlug, orgSlug }} attemptId={attemptId} pageParam={typeof sp["page"] === "string" ? sp["page"] : undefined} />;
}
