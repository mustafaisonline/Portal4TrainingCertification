import { describe, expect, it } from "vitest";
import { isOrganisationUser } from "@/modules/identity/roles.repository";

/*
 * Who counts as an Organisation user (CR-2026-10-01-1711): anyone holding the
 * `org_admin` role in ANY scope. `holdsRole` alone would miss an
 * organisation-scoped grant, which is the normal shape once organisations exist.
 */
const role = (name: string, scopeType: "platform" | "organisation" | "offering", scopeId: string | null = null) => ({ role: name, scopeType, scopeId }) as never;

describe("isOrganisationUser", () => {
  it("is true for org_admin in any scope", () => {
    expect(isOrganisationUser([role("org_admin", "platform")])).toBe(true);
    expect(isOrganisationUser([role("org_admin", "organisation", "11111111-1111-4111-8111-111111111111")])).toBe(true);
  });
  it("is false for everyone else, including trainers and administrators", () => {
    expect(isOrganisationUser([])).toBe(false);
    expect(isOrganisationUser([role("participant", "platform"), role("expert", "platform"), role("platform_admin", "platform")])).toBe(false);
  });
});
