import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { certificateBrand } from "@/content/certificate-brand";
import { CONTACT_EMAIL } from "@/content/contact";
import { headOffice, infocentric, locations, partnerLocations } from "@/content/locations";

/*
 * The locations shown on /contact-us (CR-2026-10-01-0712). The data is typed
 * content, so the rules that keep it honest are checked here: the head office
 * comes first and is ours, every link is well formed, nothing is empty, and the
 * partner's details are exactly what its own site publishes.
 */
describe("locations", () => {
  it("the head office is first, and the only one", () => {
    expect(locations[0]).toBe(headOffice);
    expect(locations.filter((l) => l.kind === "head_office")).toHaveLength(1);
    expect(partnerLocations).toEqual([infocentric]);
  });

  it("the head office is exactly the founder's record — company number, address, sales email — and has no invented phone", () => {
    expect(headOffice.name).toBe(certificateBrand.legalName);
    expect(headOffice.registration).toBe("202401023226 (1569075-K)");
    expect(headOffice.address).toBe(certificateBrand.address);
    expect(headOffice.email).toBe(CONTACT_EMAIL);
    expect(headOffice.phone).toBeUndefined();
    expect(headOffice.website.url).toBe("https://yourpartnertechnologies.com");
  });

  it("Infocentric is exactly what its own site publishes (read 2026-10-01)", () => {
    expect(infocentric).toMatchObject({
      name: "Infocentric",
      tagline: "Digital Transformation using AI",
      address: "Plaza 241, Spring North Commercial, Bahria Town Phase 7, Rawalpindi, Pakistan",
      phone: { display: "(+92-51) 8890717", tel: "+92518890717" },
      email: "info@infocentric.pk",
      website: { url: "https://infocentric.pk/", label: "infocentric.pk" },
      roleLabel: "Local training partner — Pakistan",
    });
  });

  it.each(locations.map((l) => [l.id, l] as const))("%s: every field is present and every link is well formed", (_id, l) => {
    for (const v of [l.id, l.name, l.roleLabel, l.address, l.email, l.logo.alt, l.logo.src]) expect(v.trim().length).toBeGreaterThan(0);
    expect(l.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(l.website.url).toMatch(/^https:\/\/[^\s]+$/); // https only
    if (l.phone) {
      expect(l.phone.tel).toMatch(/^\+\d{8,15}$/); // E.164-style digits for tel:
      expect(l.phone.display.replace(/\D/g, "")).toBe(l.phone.tel.replace(/\D/g, "")); // the shown number IS the dialled one
    }
    expect(l.logo.width).toBeGreaterThan(0);
    expect(l.logo.height).toBeGreaterThan(0);
  });

  it("every logo file exists under /public", () => {
    for (const l of locations) {
      expect(() => readFileSync(path.resolve(__dirname, "../../public", `.${l.logo.src}`)), l.logo.src).not.toThrow();
    }
  });

  it("ids are unique", () => {
    expect(new Set(locations.map((l) => l.id)).size).toBe(locations.length);
  });
});
