import { ORG_QUESTION_CAP, ROLE_TEST_SIZE, ROLE_TEST_TIME_LIMIT_MS } from "./constants";
import { getOrganisationById } from "./organisations.repository";
import { getRoleById } from "./roles.repository";
import type { AttemptRecord } from "./attempts.repository";

/*
 * Where a role test lives (CR-2026-10-01-1711). ONE definition of the candidate
 * addresses, shared by the Prepare for Interview pages and the Organisation
 * Interview Screening pages (the same components and actions serve both), plus
 * the planned size of a test. SERVER-ONLY (it reads the role and organisation of
 * an attempt) — client components receive addresses as props and never import it.
 *
 *   Prepare for Interview:  /assessment/interview/[roleSlug]
 *   Organisation screening: /assessment/organisations/[orgSlug]/[roleSlug]
 *   (each with /test/[attemptId] and /result/[attemptId] beneath it)
 */

export type RoleTestScope = { roleSlug: string; orgSlug: string | null };

export function roleBasePath(scope: RoleTestScope): string {
  return scope.orgSlug ? `/assessment/organisations/${scope.orgSlug}/${scope.roleSlug}` : `/assessment/interview/${scope.roleSlug}`;
}

/** The running test; `page` > 1 adds `?page=`. */
export function roleTestPath(scope: RoleTestScope, attemptId: string, page = 1): string {
  return `${roleBasePath(scope)}/test/${attemptId}${page > 1 ? `?page=${page}` : ""}`;
}

export function roleResultPath(scope: RoleTestScope, attemptId: string): string {
  return `${roleBasePath(scope)}/result/${attemptId}`;
}

/** The scope an existing attempt belongs to (its role's and organisation's URL names); null when either record is gone. */
export async function scopeOfAttempt(attempt: Pick<AttemptRecord, "roleId" | "organisationId">): Promise<(RoleTestScope & { roleName: string; organisationName: string | null }) | null> {
  const role = await getRoleById(attempt.roleId);
  if (!role) return null;
  if (attempt.organisationId === null) return { roleSlug: role.slug, orgSlug: null, roleName: role.name, organisationName: null };
  const org = await getOrganisationById(attempt.organisationId);
  if (!org) return null;
  return { roleSlug: role.slug, orgSlug: org.slug, roleName: role.name, organisationName: org.name };
}

/** How many questions a test would have: the organisation's own approved ones (at most 20) plus the shared bank, at most 100 — the rule `startRoleAttempt` applies. */
export function plannedTestSize(input: { organisationApproved: number; shared: number }): number {
  return Math.min(ROLE_TEST_SIZE, Math.min(Math.max(0, input.organisationApproved), ORG_QUESTION_CAP) + Math.max(0, input.shared));
}

export const TEST_MINUTES = ROLE_TEST_TIME_LIMIT_MS / 60_000;
