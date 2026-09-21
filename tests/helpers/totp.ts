import { createHmac } from "node:crypto";

/*
 * RFC 6238 TOTP (SHA-1, 6 digits, 30 s) for tests only — so the two-factor
 * flow can be exercised end to end without adding an authenticator library
 * to the product. Verified against the RFC 4226/6238 test vectors in
 * tests/unit/totp.test.ts.
 */

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, "").replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function hotp(secret: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const mac = createHmac("sha1", secret).update(buf).digest();
  const offset = mac[mac.length - 1]! & 0x0f;
  const code =
    ((mac[offset]! & 0x7f) << 24) | ((mac[offset + 1]! & 0xff) << 16) | ((mac[offset + 2]! & 0xff) << 8) | (mac[offset + 3]! & 0xff);
  return String(code % 10 ** digits).padStart(digits, "0");
}

export function totp(base32Secret: string, nowMs = Date.now(), period = 30, digits = 6): string {
  return hotp(base32Decode(base32Secret), Math.floor(nowMs / 1000 / period), digits);
}

/** The secret from an otpauth:// URI. */
export function secretFromOtpauth(uri: string): string {
  const s = new URL(uri).searchParams.get("secret");
  if (!s) throw new Error("otpauth URI has no secret");
  return s;
}
