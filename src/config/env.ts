/*
 * Configuration validation (MILESTONE_9_EXECUTION_PLAN.md §2 item 3).
 *
 * One pure function over an environment object — no I/O, no process exit —
 * so it is unit-testable and can be called from `instrumentation.ts` at
 * server start. The names checked here are exactly the names listed in
 * `.env.example` (ADR-030: names in the repository, values only in the
 * environment / platform secret store).
 *
 * Messages NEVER contain a value. They name the variable and say why it was
 * rejected (absent, too short, wrong scheme, …) — nothing else. A validation
 * message may end up in a hosting log; a secret must not.
 *
 * Severity:
 *  - `missing` / `invalid` → in production the server refuses to start
 *    (instrumentation.ts throws); in any other mode a single warning line.
 *  - `warnings` → never fatal. Today the only warning is LEGAL_DOCUMENT_
 *    VERSIONS: the founder may deliberately launch with registration CLOSED
 *    (the consent gate stays shut until counsel publishes the Terms and
 *    Privacy policy — src/modules/identity/legal-documents.ts), so its
 *    absence is a state the product supports, not a defect. When it IS set
 *    it must parse, or it is `invalid`.
 */

export type EnvMode = "production" | "development" | "test" | (string & {});

export type EnvProblem = { name: string; why: string };

export type EnvValidation = {
  /** True when nothing is missing and nothing is invalid (warnings allowed). */
  ok: boolean;
  missing: string[];
  invalid: EnvProblem[];
  warnings: EnvProblem[];
  mode: string;
};

type EnvLike = Record<string, string | undefined>;

/** The variables the application needs in every environment. */
export const REQUIRED_ALWAYS = ["DATABASE_URL", "BETTER_AUTH_SECRET", "APP_BASE_URL", "PROFILE_ENCRYPTION_KEY", "EMAIL_TRANSPORT"] as const;
/** Additionally required in production (optional but validated elsewhere). */
export const REQUIRED_IN_PRODUCTION = ["JOBS_SECRET", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"] as const;

export const EMAIL_TRANSPORTS = ["log", "resend", "postmark"] as const;

const MIN_AUTH_SECRET = 32;
const MIN_JOBS_SECRET = 16;
const ENCRYPTION_KEY_BYTES = 32;
const VERSION_RE = /^[A-Za-z0-9._-]{1,64}$/;

function present(env: EnvLike, name: string): boolean {
  const v = env[name];
  return typeof v === "string" && v.trim().length > 0;
}

function isPostgresUrl(value: string): boolean {
  return /^postgres(ql)?:\/\//.test(value);
}

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/** Mirrors the check in src/modules/identity/profile-crypto.ts: base64 of
 *  exactly 32 bytes. `Buffer.from(x, "base64")` is lenient, so also require
 *  the string to be canonical base64 of that length (44 chars with padding). */
function isBase64Of32Bytes(value: string): boolean {
  if (!/^[A-Za-z0-9+/]{43}=$/.test(value)) return false;
  return Buffer.from(value, "base64").length === ENCRYPTION_KEY_BYTES;
}

/** Same acceptance rule as legal-documents.ts: JSON object with well-formed
 *  `terms` and `privacy` strings; `refund` optional but well-formed if present. */
function legalVersionsValid(raw: string): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
  const obj = parsed as Record<string, unknown>;
  for (const key of ["terms", "privacy"]) {
    if (typeof obj[key] !== "string" || !VERSION_RE.test(obj[key] as string)) return false;
  }
  if (obj["refund"] !== undefined && (typeof obj["refund"] !== "string" || !VERSION_RE.test(obj["refund"] as string))) return false;
  return true;
}

export function validateEnv(env: EnvLike = process.env, mode: EnvMode = env["NODE_ENV"] ?? "development"): EnvValidation {
  const production = mode === "production";
  const missing: string[] = [];
  const invalid: EnvProblem[] = [];
  const warnings: EnvProblem[] = [];

  const required: string[] = [...REQUIRED_ALWAYS, ...(production ? REQUIRED_IN_PRODUCTION : [])];
  for (const name of required) {
    if (!present(env, name)) missing.push(name);
  }

  // ── Well-formedness: checked whenever the variable is present ────────────
  if (present(env, "DATABASE_URL") && !isPostgresUrl(env["DATABASE_URL"]!)) {
    invalid.push({ name: "DATABASE_URL", why: "must start with postgres:// or postgresql://" });
  }

  if (present(env, "BETTER_AUTH_SECRET") && env["BETTER_AUTH_SECRET"]!.length < MIN_AUTH_SECRET) {
    invalid.push({ name: "BETTER_AUTH_SECRET", why: `must be at least ${MIN_AUTH_SECRET} characters (openssl rand -base64 32)` });
  }

  if (present(env, "APP_BASE_URL")) {
    const url = parseUrl(env["APP_BASE_URL"]!);
    if (!url) invalid.push({ name: "APP_BASE_URL", why: "must be an absolute URL" });
    else if (production && url.protocol !== "https:") invalid.push({ name: "APP_BASE_URL", why: "must use https in production" });
    else if (url.protocol !== "https:" && url.protocol !== "http:") invalid.push({ name: "APP_BASE_URL", why: "must be http or https" });
  }

  if (present(env, "PROFILE_ENCRYPTION_KEY") && !isBase64Of32Bytes(env["PROFILE_ENCRYPTION_KEY"]!)) {
    invalid.push({ name: "PROFILE_ENCRYPTION_KEY", why: "must be base64 of exactly 32 bytes (openssl rand -base64 32)" });
  }

  if (present(env, "EMAIL_TRANSPORT") && !(EMAIL_TRANSPORTS as readonly string[]).includes(env["EMAIL_TRANSPORT"]!)) {
    invalid.push({ name: "EMAIL_TRANSPORT", why: `must be one of ${EMAIL_TRANSPORTS.join(", ")}` });
  }

  if (present(env, "JOBS_SECRET") && env["JOBS_SECRET"]!.length < MIN_JOBS_SECRET) {
    invalid.push({ name: "JOBS_SECRET", why: `must be at least ${MIN_JOBS_SECRET} characters` });
  }

  // Stripe: both or neither. In production both are required (listed above).
  const hasKey = present(env, "STRIPE_SECRET_KEY");
  const hasWebhook = present(env, "STRIPE_WEBHOOK_SECRET");
  if (hasKey !== hasWebhook && !production) {
    invalid.push({
      name: hasKey ? "STRIPE_WEBHOOK_SECRET" : "STRIPE_SECRET_KEY",
      why: "STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET must be set together or not at all",
    });
  }
  if (hasKey && !/^sk_(live|test)_/.test(env["STRIPE_SECRET_KEY"]!)) {
    invalid.push({ name: "STRIPE_SECRET_KEY", why: "must be a Stripe secret key (sk_live_… or sk_test_…)" });
  }
  if (hasWebhook && !/^whsec_/.test(env["STRIPE_WEBHOOK_SECRET"]!)) {
    invalid.push({ name: "STRIPE_WEBHOOK_SECRET", why: "must be a Stripe webhook signing secret (whsec_…)" });
  }
  if (production && hasKey && /^sk_test_/.test(env["STRIPE_SECRET_KEY"]!)) {
    // A test key in production is not a crash, but it must be loud: no real
    // payment can succeed and every checkout would fail at Stripe.
    warnings.push({ name: "STRIPE_SECRET_KEY", why: "is a TEST-mode key; production payments will not work" });
  }

  // Consent gate: absent = registration closed (supported state) → warning.
  if (!present(env, "LEGAL_DOCUMENT_VERSIONS")) {
    warnings.push({ name: "LEGAL_DOCUMENT_VERSIONS", why: "not set — registration stays CLOSED until the legal documents are published" });
  } else if (!legalVersionsValid(env["LEGAL_DOCUMENT_VERSIONS"]!)) {
    invalid.push({ name: "LEGAL_DOCUMENT_VERSIONS", why: 'must be JSON like {"terms":"<version>","privacy":"<version>"}' });
  }

  return { ok: missing.length === 0 && invalid.length === 0, missing, invalid, warnings, mode: String(mode) };
}

/** One line, names only, for a log. */
export function describeValidation(result: EnvValidation): string {
  const parts: string[] = [];
  if (result.missing.length) parts.push(`missing: ${result.missing.join(", ")}`);
  if (result.invalid.length) parts.push(`invalid: ${result.invalid.map((p) => `${p.name} (${p.why})`).join("; ")}`);
  if (result.warnings.length) parts.push(`warnings: ${result.warnings.map((p) => `${p.name} (${p.why})`).join("; ")}`);
  return parts.length ? parts.join(" · ") : "all required configuration present";
}
