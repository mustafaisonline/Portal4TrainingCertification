import { describe, expect, it } from "vitest";
import { CERTIFICATE_STATUS_LABEL, ID_ALPHABET, isCertificateIdShaped, RENEWAL_WINDOW_DAYS, VALIDITY_MONTHS } from "@/modules/certificates/constants";
import { addDays, addMonths, dateColumnToIso, daysBetween, formatCalendarDate, isIsoDate, isoToDateColumn, todayIso, zonedLocalToInstant } from "@/modules/certificates/dates";
import { canRenew, classifySearch, documentUnlocked, initialExpiry, nameWords, normaliseId, normaliseName, renewedExpiry, statusOf } from "@/modules/certificates/rules";

/*
 * Every case COMPLETION_CERTIFICATE_REQUIREMENTS.md §4 lists (42 assertions
 * verified in the wireframe on 2026-09-20), carried into the backend suite
 * as M6 plan §6 criteria 2–4 require, plus the MYT boundary (E6) and the
 * revoked state (E8) the founder approved.
 */

const TODAY = "2026-09-22";

describe("calendar dates (dates.ts)", () => {
  it("month arithmetic clamps to month end", () => {
    expect(addMonths("2027-01-31", 1)).toBe("2027-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29"); // leap year
    expect(addMonths("2028-02-29", 12)).toBe("2029-02-28");
    expect(addMonths("2026-12-31", 2)).toBe("2027-02-28"); // year rollover
    expect(addMonths("2026-11-15", 3)).toBe("2027-02-15");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
  });

  it("± 12 months round-trips for an unclamped day", () => {
    expect(addMonths(addMonths("2026-03-15", 12), -12)).toBe("2026-03-15");
    expect(addMonths(addMonths("2026-09-22", VALIDITY_MONTHS), -VALIDITY_MONTHS)).toBe("2026-09-22");
  });

  it("day arithmetic and differences are whole calendar days", () => {
    expect(addDays("2026-09-22", 30)).toBe("2026-10-22");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(daysBetween("2026-09-22", "2026-10-23")).toBe(31);
    expect(daysBetween("2026-10-23", "2026-09-22")).toBe(-31);
    expect(daysBetween("2026-09-22", "2026-09-22")).toBe(0);
  });

  it("today is the calendar date in Asia/Kuala_Lumpur, not UTC (E6)", () => {
    expect(todayIso(new Date("2026-09-22T15:59:00Z"))).toBe("2026-09-22"); // 23:59 MYT
    expect(todayIso(new Date("2026-09-22T16:01:00Z"))).toBe("2026-09-23"); // 00:01 MYT
    expect(todayIso(new Date("2026-09-22T16:01:00Z"), "UTC")).toBe("2026-09-22");
  });

  it("the @db.Date convention round-trips: UTC midnight in, YYYY-MM-DD out", () => {
    const d = isoToDateColumn("2026-09-22");
    expect(d.toISOString()).toBe("2026-09-22T00:00:00.000Z");
    expect(dateColumnToIso(d)).toBe("2026-09-22");
    expect(isIsoDate("2026-02-29")).toBe(false);
    expect(isIsoDate("2028-02-29")).toBe(true);
    expect(isIsoDate("22/09/2026")).toBe(false);
  });

  it("prints en-GB calendar dates", () => {
    expect(formatCalendarDate("2026-09-22")).toMatch(/^22 Sept? 2026$/);
    expect(formatCalendarDate("2027-03-01")).toBe("1 Mar 2027");
  });

  it("reads a datetime-local value as MYT wall time", () => {
    expect(zonedLocalToInstant("2026-09-22T10:00")?.toISOString()).toBe("2026-09-22T02:00:00.000Z");
    expect(zonedLocalToInstant("2026-09-22T00:30:15")?.toISOString()).toBe("2026-09-21T16:30:15.000Z");
    expect(zonedLocalToInstant("2026-09-22T02:00:00Z")?.toISOString()).toBe("2026-09-22T02:00:00.000Z");
    expect(zonedLocalToInstant("2026-09-22T10:00", "UTC")?.toISOString()).toBe("2026-09-22T10:00:00.000Z");
    expect(zonedLocalToInstant("not a date")).toBeNull();
  });
});

describe("status boundaries (R-L1, E5, E8)", () => {
  const cert = (expiresOn: string, revokedAt: Date | null = null) => ({ expiresOn, revokedAt });

  it("31 days left → active; 30 → renewal due", () => {
    expect(statusOf(cert(addDays(TODAY, 31)), TODAY)).toEqual({ status: "active", days: 31 });
    expect(statusOf(cert(addDays(TODAY, RENEWAL_WINDOW_DAYS)), TODAY)).toEqual({ status: "renewal_due", days: 30 });
    expect(statusOf(cert(addDays(TODAY, 1)), TODAY)).toEqual({ status: "renewal_due", days: 1 });
  });

  it("expires today → still valid; yesterday → expired", () => {
    expect(statusOf(cert(TODAY), TODAY)).toEqual({ status: "renewal_due", days: 0 });
    expect(statusOf(cert(addDays(TODAY, -1)), TODAY)).toEqual({ status: "expired", days: 1 });
    expect(statusOf(cert(addDays(TODAY, -400)), TODAY)).toEqual({ status: "expired", days: 400 });
  });

  it("time of day never matters: the MYT boundary flips the status, not the clock inside the day", () => {
    const expiresOn = "2026-09-22";
    expect(statusOf(cert(expiresOn), todayIso(new Date("2026-09-22T15:59:00Z"))).status).toBe("renewal_due");
    expect(statusOf(cert(expiresOn), todayIso(new Date("2026-09-22T16:01:00Z"))).status).toBe("expired");
  });

  it("revoked wins over every other state", () => {
    const revoked = new Date("2026-09-01T00:00:00Z");
    expect(statusOf(cert(addDays(TODAY, 300), revoked), TODAY)).toEqual({ status: "revoked", days: 0 });
    expect(statusOf(cert(addDays(TODAY, -300), revoked), TODAY).status).toBe("revoked");
    expect(canRenew(cert(addDays(TODAY, -300), revoked), TODAY)).toBe(false);
  });

  it("labels never rely on colour alone", () => {
    expect(CERTIFICATE_STATUS_LABEL.renewal_due).toBe("Active · renewal due");
    expect(CERTIFICATE_STATUS_LABEL.revoked).toBe("Revoked");
  });
});

describe("renewal (E5 / D6 / D7)", () => {
  it("not allowed more than 30 days early; allowed in the window and after lapse", () => {
    expect(canRenew({ expiresOn: addDays(TODAY, 31), revokedAt: null }, TODAY)).toBe(false);
    expect(canRenew({ expiresOn: addDays(TODAY, 30), revokedAt: null }, TODAY)).toBe(true);
    expect(canRenew({ expiresOn: TODAY, revokedAt: null }, TODAY)).toBe(true);
    expect(canRenew({ expiresOn: addDays(TODAY, -500), revokedAt: null }, TODAY)).toBe(true);
  });

  it("on time extends from the OLD expiry; lapsed extends from today; the expiry day counts as on time", () => {
    expect(renewedExpiry("2026-10-01", TODAY)).toBe("2027-10-01");
    expect(renewedExpiry("2026-08-01", TODAY)).toBe("2027-09-22");
    expect(renewedExpiry(TODAY, TODAY)).toBe("2027-09-22");
    expect(renewedExpiry("2028-02-29", "2028-02-01")).toBe("2029-02-28");
  });

  it("first expiry is issue + 12 calendar months", () => {
    expect(initialExpiry("2026-09-22")).toBe("2027-09-22");
    expect(initialExpiry("2027-02-28")).toBe("2028-02-28");
    expect(initialExpiry("2028-02-29")).toBe("2029-02-28");
  });
});

describe("identifiers (R-D3)", () => {
  it("canonicalises what a person types", () => {
    expect(normaliseId("daa 2026 abcd efgh")).toBe("DAA-2026-ABCD-EFGH");
    expect(normaliseId("DAA2026ABCDEFGH")).toBe("DAA-2026-ABCD-EFGH");
    expect(normaliseId("  daa-2026-abcd-efgh ")).toBe("DAA-2026-ABCD-EFGH");
    expect(normaliseId("DAA–2026–ABCD–EFGH")).toBe("DAA-2026-ABCD-EFGH"); // en dashes
  });

  it("rejects the wrong shape", () => {
    expect(normaliseId("DAA-2026-ABC-EFGH")).toBeNull();
    expect(normaliseId("DAA-2026-ABCD-EFGH-1")).toBeNull();
    expect(normaliseId("XYZ-2026-ABCD-EFGH")).toBeNull();
    expect(normaliseId("Ayesha Khan")).toBeNull();
    expect(normaliseId("")).toBeNull();
  });

  it("the alphabet has 31 symbols and no look-alikes; the strict shape check is strict", () => {
    expect(ID_ALPHABET).toHaveLength(31);
    expect(new Set(ID_ALPHABET).size).toBe(31);
    for (const bad of "0O1IL") expect(ID_ALPHABET).not.toContain(bad);
    expect(isCertificateIdShaped("DAA-2026-ABCD-EFGH")).toBe(true);
    expect(isCertificateIdShaped("DAA-2026-ABC0-EFGH")).toBe(false);
    expect(isCertificateIdShaped("daa-2026-abcd-efgh")).toBe(false);
    expect(isCertificateIdShaped("DAA2026ABCDEFGH")).toBe(false);
  });
});

describe("names and search (§5, E3)", () => {
  it("normalises case, accents, punctuation and spacing the same way for the column and the query", () => {
    expect(normaliseName("  Ayşe  Núñez-Ortega ")).toBe("ayse nunez ortega");
    expect(normaliseName("O'Brien")).toBe("o brien");
    expect(normaliseName("Ahmad bin Abdullah")).toBe("ahmad bin abdullah");
    expect(nameWords("Núñez, Ortega")).toEqual(["nunez", "ortega"]);
    expect(nameWords("   ")).toEqual([]);
  });

  it("classifies the input: empty, too short (< 3 non-space characters), ID, or name words", () => {
    expect(classifySearch("")).toEqual({ kind: "empty" });
    expect(classifySearch("   ")).toEqual({ kind: "empty" });
    expect(classifySearch("ab")).toEqual({ kind: "too_short" });
    expect(classifySearch("a b")).toEqual({ kind: "too_short" });
    expect(classifySearch("a b c")).toEqual({ kind: "name", words: ["a", "b", "c"] });
    expect(classifySearch("abc")).toEqual({ kind: "name", words: ["abc"] });
    expect(classifySearch("daa 2026 abcd efgh")).toEqual({ kind: "id", id: "DAA-2026-ABCD-EFGH" });
    expect(classifySearch("Núñez Ortega")).toEqual({ kind: "name", words: ["nunez", "ortega"] });
    // Looks partly like an ID but is not one → a name search, never a partial-ID match.
    expect(classifySearch("DAA-2026").kind).toBe("name");
  });
});

describe("reviews gate (E9)", () => {
  it("unlocks the document unless a review is still required", () => {
    expect(documentUnlocked("satisfied")).toBe(true);
    expect(documentUnlocked("not_applicable")).toBe(true);
    expect(documentUnlocked("required")).toBe(false);
  });
});
