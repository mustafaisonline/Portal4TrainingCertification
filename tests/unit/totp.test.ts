import { describe, expect, it } from "vitest";
import { base32Decode, hotp, totp } from "../helpers/totp";

// RFC 4226 appendix D (secret "12345678901234567890") and RFC 6238 appendix B.
const SECRET_ASCII = "12345678901234567890";
const SECRET_B32 = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

describe("test TOTP helper matches the RFCs", () => {
  it("base32 decodes the RFC secret", () => {
    expect(base32Decode(SECRET_B32).toString("ascii")).toBe(SECRET_ASCII);
  });

  it("HOTP vectors (RFC 4226)", () => {
    const s = Buffer.from(SECRET_ASCII, "ascii");
    expect(hotp(s, 0)).toBe("755224");
    expect(hotp(s, 1)).toBe("287082");
    expect(hotp(s, 9)).toBe("520489");
  });

  it("TOTP vectors (RFC 6238, SHA-1, 8 digits)", () => {
    expect(totp(SECRET_B32, 59_000, 30, 8)).toBe("94287082");
    expect(totp(SECRET_B32, 1_111_111_109_000, 30, 8)).toBe("07081804");
    expect(totp(SECRET_B32, 1_234_567_890_000, 30, 8)).toBe("89005924");
  });
});
