import { describe, expect, it } from "vitest";
import { plannedTestSize, roleBasePath, roleResultPath, roleTestPath, TEST_MINUTES } from "@/modules/assessment/role-test-scope";

/*
 * The candidate addresses of the role tests and the planned test size
 * (CR-2026-10-01-1711): one definition shared by the interview and organisation
 * journeys, so a link can never point into the wrong one.
 */
describe("role test addresses", () => {
  it("Prepare for Interview lives under /assessment/interview", () => {
    const scope = { roleSlug: "data-engineer", orgSlug: null };
    expect(roleBasePath(scope)).toBe("/assessment/interview/data-engineer");
    expect(roleTestPath(scope, "abc")).toBe("/assessment/interview/data-engineer/test/abc");
    expect(roleTestPath(scope, "abc", 1)).toBe("/assessment/interview/data-engineer/test/abc");
    expect(roleTestPath(scope, "abc", 3)).toBe("/assessment/interview/data-engineer/test/abc?page=3");
    expect(roleResultPath(scope, "abc")).toBe("/assessment/interview/data-engineer/result/abc");
  });

  it("an organisation's screening lives under /assessment/organisations/[org]/[role]", () => {
    const scope = { roleSlug: "ai-engineer", orgSlug: "ypt" };
    expect(roleBasePath(scope)).toBe("/assessment/organisations/ypt/ai-engineer");
    expect(roleTestPath(scope, "abc", 2)).toBe("/assessment/organisations/ypt/ai-engineer/test/abc?page=2");
    expect(roleResultPath(scope, "abc")).toBe("/assessment/organisations/ypt/ai-engineer/result/abc");
  });
});

describe("planned test size", () => {
  it("shared mode: the whole bank up to 100", () => {
    expect(plannedTestSize({ organisationApproved: 0, shared: 0 })).toBe(0);
    expect(plannedTestSize({ organisationApproved: 0, shared: 30 })).toBe(30);
    expect(plannedTestSize({ organisationApproved: 0, shared: 1000 })).toBe(100);
  });

  it("organisation mode: its own approved questions (at most 20) plus the shared bank, up to 100", () => {
    expect(plannedTestSize({ organisationApproved: 5, shared: 30 })).toBe(35);
    expect(plannedTestSize({ organisationApproved: 50, shared: 10 })).toBe(30); // 20 own + 10 shared
    expect(plannedTestSize({ organisationApproved: 50, shared: 500 })).toBe(100);
    expect(plannedTestSize({ organisationApproved: 12, shared: 0 })).toBe(12); // a private role
  });

  it("is 90 minutes", () => {
    expect(TEST_MINUTES).toBe(90);
  });
});
