import { describe, expect, it } from "vitest";
import { REVIEW_MODERATION_STATUSES, REVIEW_VISIBILITY_STATUSES } from "@/modules/reviews/constants";
import { isPubliclyVisible, publicWhere, reviewRequirement, REVIEWS_FEATURE_SINCE } from "@/modules/reviews/visibility";

/*
 * The ONE visibility rule (requirements §7.1) and the certificate gate
 * (§8): every combination of consent × moderation × visibility, and every
 * state of the requirement function (plan §4 criterion 8).
 */
describe("isPubliclyVisible", () => {
  it("is true only for consent + approved + visible", () => {
    const seen: string[] = [];
    for (const consentPublic of [true, false]) {
      for (const moderationStatus of REVIEW_MODERATION_STATUSES) {
        for (const visibilityStatus of REVIEW_VISIBILITY_STATUSES) {
          const visible = isPubliclyVisible({ consentPublic, moderationStatus, visibilityStatus });
          const expected = consentPublic && moderationStatus === "approved" && visibilityStatus === "visible";
          expect(visible, `${consentPublic}/${moderationStatus}/${visibilityStatus}`).toBe(expected);
          if (visible) seen.push(`${consentPublic}/${moderationStatus}/${visibilityStatus}`);
        }
      }
    }
    expect(seen).toEqual(["true/approved/visible"]);
  });

  it("publicWhere() encodes the same rule for the database query", () => {
    const where = publicWhere();
    expect(where).toEqual({ consentPublic: true, moderationStatus: "approved", visibilityStatus: "visible" });
    // The where-fragment and the predicate agree on the one visible row shape.
    expect(isPubliclyVisible(where)).toBe(true);
  });
});

describe("reviewRequirement — the certificate gate", () => {
  const after = new Date(REVIEWS_FEATURE_SINCE.getTime() + 24 * 3600 * 1000);
  const before = new Date(REVIEWS_FEATURE_SINCE.getTime() - 1);

  it("no review → required (certificate not yet issued, or issued after the feature)", () => {
    expect(reviewRequirement(null)).toBe("required");
    expect(reviewRequirement(null, { certificateIssuedAt: null })).toBe("required");
    expect(reviewRequirement(null, { certificateIssuedAt: after })).toBe("required");
  });

  it("any review satisfies it, whatever its moderation, visibility or consent", () => {
    for (const consentPublic of [true, false]) {
      for (const moderationStatus of REVIEW_MODERATION_STATUSES) {
        for (const visibilityStatus of REVIEW_VISIBILITY_STATUSES) {
          expect(reviewRequirement({ consentPublic, moderationStatus, visibilityStatus })).toBe("satisfied");
        }
      }
    }
    expect(reviewRequirement({ id: "any" })).toBe("satisfied");
  });

  it("a certificate issued before the feature is not applicable, review or not (D-7)", () => {
    expect(reviewRequirement(null, { certificateIssuedAt: before })).toBe("not_applicable");
    expect(reviewRequirement({ id: "x" }, { certificateIssuedAt: before })).toBe("not_applicable");
    expect(reviewRequirement(null, { certificateIssuedAt: REVIEWS_FEATURE_SINCE })).toBe("required");
  });

  it("honours an explicit featureSince", () => {
    const since = new Date("2030-01-01T00:00:00Z");
    expect(reviewRequirement(null, { certificateIssuedAt: after, featureSince: since })).toBe("not_applicable");
  });

  it("the feature date is the M5b go-live day", () => {
    expect(REVIEWS_FEATURE_SINCE.toISOString()).toBe("2026-09-22T00:00:00.000Z");
  });
});
