import { describe, expect, it } from "vitest";
import { describeValidation, stripeKeyMode, validateEnv } from "@/config/env";

/*
 * Configuration validation (M9 plan §2 item 3; §5 criterion 3). Pure function
 * over a plain object — no process.env, no I/O.
 */

const KEY32 = Buffer.alloc(32, 7).toString("base64");

function complete(): Record<string, string> {
  return {
    DATABASE_URL: "postgresql://portal:secret@db.example.internal:5432/p4tc",
    BETTER_AUTH_SECRET: "x".repeat(48),
    APP_BASE_URL: "https://portal.example.com",
    PROFILE_ENCRYPTION_KEY: KEY32,
    EMAIL_TRANSPORT: "log",
    JOBS_SECRET: "y".repeat(24),
    STRIPE_SECRET_KEY: "sk_live_0123456789abcdef",
    STRIPE_WEBHOOK_SECRET: "whsec_0123456789abcdef",
    LEGAL_DOCUMENT_VERSIONS: '{"terms":"2026-10-01","privacy":"2026-10-01"}',
  };
}

describe("validateEnv — production", () => {
  it("accepts a complete, well-formed environment", () => {
    const r = validateEnv(complete(), "production");
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.invalid).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it("names every missing required variable (an empty object is all-missing)", () => {
    const r = validateEnv({}, "production");
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual([
      "DATABASE_URL",
      "BETTER_AUTH_SECRET",
      "APP_BASE_URL",
      "PROFILE_ENCRYPTION_KEY",
      "EMAIL_TRANSPORT",
      "JOBS_SECRET",
      "STRIPE_SECRET_KEY",
      "STRIPE_WEBHOOK_SECRET",
    ]);
  });

  it("a blank value counts as missing", () => {
    const r = validateEnv({ ...complete(), BETTER_AUTH_SECRET: "   " }, "production");
    expect(r.missing).toEqual(["BETTER_AUTH_SECRET"]);
  });

  it("flags malformed values with a reason and never echoes the value", () => {
    const env = {
      ...complete(),
      DATABASE_URL: "mysql://nope",
      BETTER_AUTH_SECRET: "short",
      APP_BASE_URL: "http://portal.example.com",
      PROFILE_ENCRYPTION_KEY: "not-base64-of-32-bytes",
      EMAIL_TRANSPORT: "sendgrid",
      JOBS_SECRET: "tiny",
      STRIPE_SECRET_KEY: "pk_live_wrong_kind",
      STRIPE_WEBHOOK_SECRET: "nope",
      LEGAL_DOCUMENT_VERSIONS: '{"terms":"2026-10-01"}',
    };
    const r = validateEnv(env, "production");
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual([]);
    expect(r.invalid.map((p) => p.name).sort()).toEqual(
      [
        "APP_BASE_URL",
        "BETTER_AUTH_SECRET",
        "DATABASE_URL",
        "EMAIL_TRANSPORT",
        "JOBS_SECRET",
        "LEGAL_DOCUMENT_VERSIONS",
        "PROFILE_ENCRYPTION_KEY",
        "STRIPE_SECRET_KEY",
        "STRIPE_WEBHOOK_SECRET",
      ].sort(),
    );
    const text = describeValidation(r);
    for (const value of Object.values(env)) {
      if (value.length > 6) expect(text).not.toContain(value);
    }
    expect(text).toContain("https in production");
  });

  it("LEGAL_DOCUMENT_VERSIONS absent is a WARNING, not a failure (registration closed)", () => {
    const env = complete();
    delete env["LEGAL_DOCUMENT_VERSIONS"];
    const r = validateEnv(env, "production");
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.name)).toEqual(["LEGAL_DOCUMENT_VERSIONS"]);
  });

  it("LEGAL_DOCUMENT_VERSIONS set but unparsable IS a failure", () => {
    const r = validateEnv({ ...complete(), LEGAL_DOCUMENT_VERSIONS: "not json" }, "production");
    expect(r.ok).toBe(false);
    expect(r.invalid.map((p) => p.name)).toEqual(["LEGAL_DOCUMENT_VERSIONS"]);
  });

  it("a Stripe TEST key in production is a warning, not a crash", () => {
    const r = validateEnv({ ...complete(), STRIPE_SECRET_KEY: "sk_test_0123456789" }, "production");
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.name)).toContain("STRIPE_SECRET_KEY");
  });
});

describe("validateEnv — Stripe key kinds (M11 decision K1: restricted keys accepted)", () => {
  it("accepts a live RESTRICTED key in production with no warning", () => {
    const r = validateEnv({ ...complete(), STRIPE_SECRET_KEY: "rk_live_0123456789abcdef" }, "production");
    expect(r.ok).toBe(true);
    expect(r.invalid).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it("a test RESTRICTED key in production is the same warning as a test secret key", () => {
    const r = validateEnv({ ...complete(), STRIPE_SECRET_KEY: "rk_test_0123456789abcdef" }, "production");
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.name)).toEqual(["STRIPE_SECRET_KEY"]);
    expect(r.warnings[0]!.why).toMatch(/TEST-mode/);
  });

  it("accepts a test restricted key in development", () => {
    const env = { ...complete(), APP_BASE_URL: "http://localhost:3100", STRIPE_SECRET_KEY: "rk_test_0123456789abcdef" };
    expect(validateEnv(env, "development").ok).toBe(true);
  });

  it.each([
    ["pk_live_publishable", "a publishable key"],
    ["pk_test_publishable", "a test publishable key"],
    ["rk_0123456789", "a restricted key without a mode segment"],
    ["sk_prod_0123456789", "an unknown mode"],
    ["whsec_0123456789", "a webhook secret in the key slot"],
    ["RK_LIVE_0123456789", "wrong case"],
    [" rk_live_0123456789", "leading whitespace"],
  ])("rejects %s (%s)", (key) => {
    const r = validateEnv({ ...complete(), STRIPE_SECRET_KEY: key }, "production");
    expect(r.ok).toBe(false);
    expect(r.invalid.map((p) => p.name)).toEqual(["STRIPE_SECRET_KEY"]);
    expect(describeValidation(r)).not.toContain(key.trim());
  });

  it("stripeKeyMode names the mode of an accepted key and null otherwise", () => {
    expect(stripeKeyMode("sk_live_x")).toBe("live");
    expect(stripeKeyMode("rk_live_x")).toBe("live");
    expect(stripeKeyMode("sk_test_x")).toBe("test");
    expect(stripeKeyMode("rk_test_x")).toBe("test");
    expect(stripeKeyMode("pk_live_x")).toBeNull();
    expect(stripeKeyMode("")).toBeNull();
  });
});

describe("validateEnv — development / test", () => {
  it("does not require the production-only variables and allows http", () => {
    const env = {
      DATABASE_URL: "postgresql://me@localhost:5432/p4tc_dev",
      BETTER_AUTH_SECRET: "x".repeat(40),
      APP_BASE_URL: "http://localhost:3100",
      PROFILE_ENCRYPTION_KEY: KEY32,
      EMAIL_TRANSPORT: "log",
    };
    const r = validateEnv(env, "development");
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
    // Registration closed → warning, same as production.
    expect(r.warnings.map((w) => w.name)).toEqual(["LEGAL_DOCUMENT_VERSIONS"]);
  });

  it("still reports what is missing so the warning line is useful", () => {
    const r = validateEnv({ APP_BASE_URL: "http://localhost:3100" }, "development");
    expect(r.ok).toBe(false);
    expect(r.missing).toEqual(["DATABASE_URL", "BETTER_AUTH_SECRET", "PROFILE_ENCRYPTION_KEY", "EMAIL_TRANSPORT"]);
  });

  it("Stripe values must come as a pair", () => {
    const base: Record<string, string> = { ...complete(), APP_BASE_URL: "http://localhost:3100" };
    delete base["STRIPE_WEBHOOK_SECRET"];
    const r = validateEnv(base, "development");
    expect(r.invalid.map((p) => p.name)).toEqual(["STRIPE_WEBHOOK_SECRET"]);
    delete base["STRIPE_SECRET_KEY"];
    expect(validateEnv(base, "development").invalid).toEqual([]);
  });

  it("defaults the mode from NODE_ENV in the given object", () => {
    expect(validateEnv({ NODE_ENV: "production" }).mode).toBe("production");
    expect(validateEnv({}).mode).toBe("development");
  });
});

describe("validateEnv — EMAIL_TRANSPORT=smtp (CR-2026-10-03-1225)", () => {
  const smtp = { EMAIL_TRANSPORT: "smtp", SMTP_HOST: "mail.dataainexus.com", SMTP_PORT: "465", SMTP_USER: "sales@dataainexus.com", SMTP_PASSWORD: "p".repeat(12), EMAIL_FROM: "sales@dataainexus.com" };

  it("accepts a complete SMTP configuration in production", () => {
    const r = validateEnv({ ...complete(), ...smtp }, "production");
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.invalid).toEqual([]);
  });

  it("incomplete SMTP settings are a WARNING, never a refusal to start (incident 2026-10-03) — each is named, no value is", () => {
    const { SMTP_HOST: _h, SMTP_PASSWORD: _p, ...partial } = { ...complete(), ...smtp };
    const r = validateEnv(partial, "production");
    expect(r.ok).toBe(true);
    expect(r.missing).toEqual([]);
    expect(r.warnings.map((w) => w.name).sort()).toEqual(["SMTP_HOST", "SMTP_PASSWORD"]);
    expect(describeValidation(r)).not.toContain("p".repeat(12));
  });

  it("EMPTY SMTP settings (the exact incident) start the server with warnings instead of taking it down", () => {
    const r = validateEnv({ ...complete(), EMAIL_TRANSPORT: "smtp", SMTP_HOST: "", SMTP_PORT: "", SMTP_USER: "", SMTP_PASSWORD: "''", EMAIL_FROM: "sales@dataainexus.com" }, "production");
    expect(r.ok).toBe(true);
    expect(r.warnings.map((w) => w.name).sort()).toEqual(["SMTP_HOST", "SMTP_PORT", "SMTP_USER"]);
  });

  it("a malformed port or sender address is a warning too", () => {
    const r = validateEnv({ ...complete(), ...smtp, SMTP_PORT: "mail", EMAIL_FROM: "not-an-address" }, "production");
    expect(r.ok).toBe(true);
    expect(r.warnings.map((p) => p.name).sort()).toEqual(["EMAIL_FROM", "SMTP_PORT"]);
  });

  it("the log transport needs no SMTP settings; resend and postmark are gone", () => {
    expect(validateEnv(complete(), "production").ok).toBe(true);
    for (const old of ["resend", "postmark"]) {
      const r = validateEnv({ ...complete(), EMAIL_TRANSPORT: old }, "production");
      expect(r.invalid.map((p) => p.name)).toEqual(["EMAIL_TRANSPORT"]);
    }
  });
});
