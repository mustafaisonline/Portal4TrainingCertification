import { describe, expect, it } from "vitest";
import {
  dobBounds,
  isValidTimezone,
  splitE164,
  toE164,
  validateDateOfBirth,
  validateIdNumber,
  validateLinkedinUrl,
  validateProfile,
  type RawProfileForm,
} from "@/modules/identity/profile-validation";

const NOW = new Date("2026-09-22T10:00:00Z");
const LISTS = { industries: ["banking", "other"], experienceBands: ["0-2", "10+"], heardAbout: ["search", "other"] };

describe("phone → E.164", () => {
  it("joins the prefix and the national number, dropping formatting and a trunk zero", () => {
    expect(toE164("+60", "012-345 6789")).toEqual({ ok: true, value: "+60123456789" });
    expect(toE164("+92", "(0300) 1234567")).toEqual({ ok: true, value: "+923001234567" });
    expect(toE164("+1", "415 555 2671")).toEqual({ ok: true, value: "+14155552671" });
  });
  it("rejects an unknown prefix, letters and wrong lengths", () => {
    expect(toE164("+999", "123456789").ok).toBe(false);
    expect(toE164("+60", "12ab34").ok).toBe(false);
    expect(toE164("+60", "12").ok).toBe(false);
    expect(toE164("+60", "1234567890123456").ok).toBe(false);
    expect(toE164("+60", "").ok).toBe(false);
  });
  it("splits a stored number back to prefix + national (longest prefix wins)", () => {
    expect(splitE164("+60123456789")).toEqual({ dial: "+60", national: "123456789" });
    expect(splitE164("+8801712345678")).toEqual({ dial: "+880", national: "1712345678" });
    expect(splitE164(null)).toEqual({ dial: "", national: "" });
  });
});

describe("ID number", () => {
  it("NRIC: exactly 12 digits, dashes and spaces stripped", () => {
    expect(validateIdNumber("nric", "900101-14-5678")).toEqual({ ok: true, value: "900101145678" });
    expect(validateIdNumber("nric", "900101 14 5678")).toEqual({ ok: true, value: "900101145678" });
    expect(validateIdNumber("nric", "90010114567").ok).toBe(false);
    expect(validateIdNumber("nric", "A00101145678").ok).toBe(false);
  });
  it("passport: 6–12 alphanumerics, upper-cased", () => {
    expect(validateIdNumber("passport", "a1234567")).toEqual({ ok: true, value: "A1234567" });
    expect(validateIdNumber("passport", "A12345").ok).toBe(true);
    expect(validateIdNumber("passport", "A1234").ok).toBe(false);
    expect(validateIdNumber("passport", "A123456789012").ok).toBe(false);
    expect(validateIdNumber("passport", "A12-4567").ok).toBe(false);
  });
});

describe("date of birth", () => {
  it("bounds are 100 and 16 years before today", () => {
    expect(dobBounds(NOW)).toEqual({ min: "1926-09-22", max: "2010-09-22" });
  });
  it("accepts a real date inside the range and rejects the rest", () => {
    expect(validateDateOfBirth("1990-01-01", NOW)).toEqual({ ok: true, value: "1990-01-01" });
    expect(validateDateOfBirth("2010-09-22", NOW).ok).toBe(true);
    expect(validateDateOfBirth("2010-09-23", NOW).ok).toBe(false); // younger than 16
    expect(validateDateOfBirth("1926-09-21", NOW).ok).toBe(false); // older than 100
    expect(validateDateOfBirth("1990-02-30", NOW).ok).toBe(false); // not a calendar date
    expect(validateDateOfBirth("01/01/1990", NOW).ok).toBe(false);
  });
});

describe("LinkedIn URL", () => {
  it("accepts only https linkedin.com links", () => {
    expect(validateLinkedinUrl("https://www.linkedin.com/in/ada").ok).toBe(true);
    expect(validateLinkedinUrl("https://linkedin.com/in/ada").ok).toBe(true);
    expect(validateLinkedinUrl("http://www.linkedin.com/in/ada").ok).toBe(false);
    expect(validateLinkedinUrl("https://evil.com/linkedin.com").ok).toBe(false);
    expect(validateLinkedinUrl("https://www.linkedin.com.evil.com/in/ada").ok).toBe(false);
    expect(validateLinkedinUrl("linkedin.com/in/ada").ok).toBe(false);
  });
});

describe("time zone", () => {
  it("accepts IANA names and rejects junk", () => {
    expect(isValidTimezone("Asia/Kuala_Lumpur")).toBe(true);
    expect(isValidTimezone("Not/AZone")).toBe(false);
  });
});

describe("validateProfile (the whole form)", () => {
  const full: RawProfileForm = {
    legalName: "Ada Lovelace",
    displayName: "Ada",
    phoneDial: "+60",
    phone: "012-345 6789",
    addressLine1: "1 Jalan Test",
    city: "Kuala Lumpur",
    postalCode: "50000",
    countryCode: "my",
    timezone: "Asia/Kuala_Lumpur",
    organisation: "Analytical Engines",
    jobTitle: "Engineer",
    industry: "banking",
    experienceBand: "10+",
    linkedinUrl: "https://www.linkedin.com/in/ada",
    idType: "nric",
    idNumber: "900101-14-5678",
    nationalityCode: "MY",
    dateOfBirth: "1990-01-01",
    marketingConsent: "on",
    heardAbout: "search",
  };

  it("normalises a complete form", () => {
    const r = validateProfile(full, LISTS, NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.input).toMatchObject({
      legalName: "Ada Lovelace",
      phoneE164: "+60123456789",
      countryCode: "MY",
      idType: "nric",
      idNumber: "900101145678",
      marketingConsent: true,
      addressLine2: null,
      state: null,
    });
  });

  it("only the legal name is required to save; an empty ID number means keep the stored one", () => {
    const r = validateProfile({ legalName: "Ada Lovelace", idType: "passport" }, LISTS, NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.input.idNumber).toBeNull();
    expect(r.input.phoneE164).toBeNull();
    expect(r.input.marketingConsent).toBe(false);
  });

  it("reports every invalid field at once", () => {
    const r = validateProfile(
      {
        ...full,
        legalName: "A",
        displayName: "x".repeat(101),
        phone: "12",
        countryCode: "ZZ",
        timezone: "Mars/Olympus",
        industry: "farming",
        linkedinUrl: "https://example.com",
        idType: "nric",
        idNumber: "123",
        nationalityCode: "Malaysia",
        dateOfBirth: "2020-01-01",
        heardAbout: "tv",
      },
      LISTS,
      NOW,
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.fieldErrors).sort()).toEqual(
      ["countryCode", "dateOfBirth", "displayName", "heardAbout", "idNumber", "industry", "legalName", "linkedinUrl", "nationalityCode", "phone", "timezone"].sort(),
    );
  });

  it("an ID number without a document type is refused", () => {
    const r = validateProfile({ legalName: "Ada Lovelace", idNumber: "A1234567" }, LISTS, NOW);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.fieldErrors.idType).toBeDefined();
  });
});
