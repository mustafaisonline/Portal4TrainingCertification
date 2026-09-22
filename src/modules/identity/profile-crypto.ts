import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/*
 * Application-level encryption for the ID-document number
 * (MILESTONE_5A_EXECUTION_PLAN.md §4). AES-256-GCM with a per-environment key
 * from PROFILE_ENCRYPTION_KEY (32 bytes, base64; ADR-030). Format:
 *   v1:<base64(iv[12] ‖ tag[16] ‖ ciphertext)>
 * Node's own `crypto` — no dependency. A missing or malformed key throws:
 * nothing is ever stored in clear because the key was absent.
 */

const VERSION = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export class ProfileEncryptionNotConfiguredError extends Error {
  constructor() {
    super("PROFILE_ENCRYPTION_KEY is not set or is not 32 bytes (base64) — see .env.example.");
    this.name = "ProfileEncryptionNotConfiguredError";
  }
}

function key(): Buffer {
  const raw = process.env["PROFILE_ENCRYPTION_KEY"];
  if (!raw) throw new ProfileEncryptionNotConfiguredError();
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new ProfileEncryptionNotConfiguredError();
  return buf;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}:${Buffer.concat([iv, tag, data]).toString("base64")}`;
}

export function decryptSecret(ciphertext: string): string {
  const [version, payload] = ciphertext.split(":", 2);
  if (version !== VERSION || !payload) throw new Error("unsupported ciphertext format");
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, IV_BYTES);
  const tag = buf.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const data = buf.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** What the UI may show: the last four characters, never more. */
export function last4(value: string): string {
  const clean = value.replace(/\s+/g, "");
  return clean.slice(-4);
}
