import { describe, expect, it } from "vitest";
import { certificateBrand, certificateBrandGaps, type CertificateBrand } from "@/content/certificate-brand";
import { fitStep, formatTimeTaken } from "@/shared/certificate/format";
import { certificateQrSvg } from "@/shared/certificate/qr";

/*
 * The certificate design system's pure parts — Milestone 15, Requirement 2
 * (founder, 2026-09-29). The sheet itself is covered end to end
 * (tests/e2e/certificate-preview.spec.ts).
 */
describe("formatTimeTaken (Time Taken, HH:MM:SS)", () => {
  it("formats a span the founder's way", () => {
    expect(formatTimeTaken(0)).toBe("00:00:00");
    expect(formatTimeTaken(24 * 60_000 + 31_000)).toBe("00:24:31");
    expect(formatTimeTaken(3_600_000 + 5 * 60_000 + 9_000)).toBe("01:05:09");
  });

  it("does not cap hours at 24 — a check left open overnight prints honestly", () => {
    expect(formatTimeTaken(14 * 3_600_000 + 2 * 60_000 + 11_000)).toBe("14:02:11");
    expect(formatTimeTaken(100 * 3_600_000)).toBe("100:00:00");
  });

  it("drops the sub-second part and never prints a negative or broken span", () => {
    expect(formatTimeTaken(1_999)).toBe("00:00:01");
    expect(formatTimeTaken(-5000)).toBe("00:00:00");
    expect(formatTimeTaken(Number.NaN)).toBe("00:00:00");
  });
});

describe("fitStep (long values shrink instead of overflowing)", () => {
  it("steps by length against the thresholds", () => {
    expect(fitStep("Aisha Rahman", [26, 40])).toBe("base");
    expect(fitStep("A".repeat(27), [26, 40])).toBe("small");
    expect(fitStep("A".repeat(41), [26, 40])).toBe("smaller");
    expect(fitStep("  " + "A".repeat(26) + "  ", [26, 40])).toBe("base"); // measured trimmed
  });
});

describe("certificate brand — the founder's details, nothing invented", () => {
  it("carries exactly what the founder supplied (2026-09-29), verbatim", () => {
    expect(certificateBrand.legalName).toBe("Your Partner Technologies");
    expect(certificateBrand.logoPath).toBe("/brand/ypt-logo.jpg");
    expect(certificateBrand.registrationNumber).toBe("202401023226 (1569075-K)");
    expect(certificateBrand.address).toBe("15-03A, One Jelatek Condominium, Jalan Jelatek, Kementah, 54200 Kuala Lumpur W.P. Kuala Lumpur Malaysia");
    // No signature, no signatory — the certificate is system-generated.
    expect(certificateBrand).not.toHaveProperty("signatory");
    // Not supplied, so not invented.
    expect(certificateBrand.contactLine).toBeNull();
    expect(certificateBrand.hrdCorpLogoPath).toBeNull();
    expect(certificateBrand.hrdCorpLogoAuthorised).toBe(false);
  });

  it("the only thing still missing is the HRD Corp organisation logo (Professional certificate only)", () => {
    const gaps = certificateBrandGaps(certificateBrand);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toMatch(/HRD Corp organisation logo/);
    expect(gaps[0]).toMatch(/Professional Training certificate only/);
  });

  it("an HRD Corp logo file is not enough — the founder's authorisation must also be recorded", () => {
    const b: CertificateBrand = { ...certificateBrand, hrdCorpLogoPath: "/brand/hrd.svg", hrdCorpLogoAuthorised: false };
    expect(certificateBrandGaps(b)).toHaveLength(1);
    expect(certificateBrandGaps({ ...b, hrdCorpLogoAuthorised: true })).toEqual([]);
  });

  it("removing a supplied detail reports it as a gap again", () => {
    const gaps = certificateBrandGaps({ ...certificateBrand, logoPath: null, registrationNumber: null, address: null, hrdCorpLogoPath: "/x", hrdCorpLogoAuthorised: true });
    expect(gaps).toEqual(["YPT logo file", "YPT company registration number", "YPT registered address"]);
  });
});

describe("certificateQrSvg", () => {
  it("returns vector SVG markup for an http(s) verification URL", async () => {
    const svg = await certificateQrSvg("https://example.test/verify/DAA-2026-ABCD-EFGH");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("<path");
    expect(svg).not.toMatch(/<script|onload|onerror|<image|<foreignObject/i); // safe to inline
  });

  it("is deterministic for a URL, and different URLs give different codes", async () => {
    const a1 = await certificateQrSvg("https://example.test/verify/A");
    const a2 = await certificateQrSvg("https://example.test/verify/A");
    const b = await certificateQrSvg("https://example.test/verify/B");
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
  });

  it("refuses a relative URL or a non-http(s) scheme", async () => {
    await expect(certificateQrSvg("/verify/DAA-2026-ABCD-EFGH")).rejects.toThrow(/absolute/);
    await expect(certificateQrSvg("javascript:alert(1)")).rejects.toThrow(/http/);
    await expect(certificateQrSvg("data:text/html,x")).rejects.toThrow(/http/);
  });
});
