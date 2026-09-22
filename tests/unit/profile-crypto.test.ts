import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, last4, ProfileEncryptionNotConfiguredError } from "@/modules/identity/profile-crypto";

const saved = process.env["PROFILE_ENCRYPTION_KEY"];
beforeEach(() => {
  process.env["PROFILE_ENCRYPTION_KEY"] = Buffer.alloc(32, 7).toString("base64");
});
afterEach(() => {
  process.env["PROFILE_ENCRYPTION_KEY"] = saved;
});

describe("profile ID-number encryption (AES-256-GCM)", () => {
  it("round-trips and never stores the clear value", () => {
    const c = encryptSecret("900101-14-5678");
    expect(c.startsWith("v1:")).toBe(true);
    expect(c).not.toContain("900101");
    expect(decryptSecret(c)).toBe("900101-14-5678");
  });

  it("uses a fresh IV each time (same input → different ciphertext)", () => {
    expect(encryptSecret("A12345678")).not.toBe(encryptSecret("A12345678"));
  });

  it("detects tampering", () => {
    const c = encryptSecret("A12345678");
    const tampered = c.slice(0, -4) + (c.endsWith("AAAA") ? "BBBB" : "AAAA");
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it("refuses to run without a proper key — nothing is stored in clear", () => {
    delete process.env["PROFILE_ENCRYPTION_KEY"];
    expect(() => encryptSecret("x")).toThrow(ProfileEncryptionNotConfiguredError);
    process.env["PROFILE_ENCRYPTION_KEY"] = "tooshort";
    expect(() => encryptSecret("x")).toThrow(ProfileEncryptionNotConfiguredError);
  });

  it("last4 shows only the tail", () => {
    expect(last4("900101 14 5678")).toBe("5678");
    expect(last4("A1")).toBe("A1");
  });
});
