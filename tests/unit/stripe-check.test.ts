import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildReport, classifyKey, formatReport, HANDLED_WEBHOOK_EVENTS, missingEvents, type StripeFacts } from "@/modules/commerce/stripe-check";

/*
 * The read-only Stripe readiness report — Milestone 15, Requirement 7. Pure:
 * no network, no key. The one thing that must never happen is a secret
 * appearing in a report line.
 */
const LIVE_KEY = "sk_live_" + "A1b2C3d4E5f6G7h8I9j0";
const base: StripeFacts = {
  keyKind: "restricted",
  keyMode: "live",
  webhookSecretPresent: true,
  appBaseUrl: "https://portal.example.test",
  account: { chargesEnabled: true, payoutsEnabled: true, country: "MY" },
  endpoints: [{ url: "https://portal.example.test/api/stripe/webhook", status: "enabled", enabledEvents: [...HANDLED_WEBHOOK_EVENTS] }],
};
const levels = (f: StripeFacts) => buildReport(f).lines.filter((l) => l.level === "fail").map((l) => l.text);

describe("classifyKey", () => {
  it("reads kind and mode from the prefix only", () => {
    expect(classifyKey("rk_live_abc")).toEqual({ keyKind: "restricted", keyMode: "live" });
    expect(classifyKey("sk_live_abc")).toEqual({ keyKind: "standard", keyMode: "live" });
    expect(classifyKey("sk_test_abc")).toEqual({ keyKind: "standard", keyMode: "test" });
    expect(classifyKey("pk_live_abc")).toEqual({ keyKind: "invalid", keyMode: null });
    expect(classifyKey("")).toEqual({ keyKind: "missing", keyMode: null });
    expect(classifyKey(undefined)).toEqual({ keyKind: "missing", keyMode: null });
  });
});

describe("HANDLED_WEBHOOK_EVENTS", () => {
  it("is exactly the set of event types webhook.service.ts acts on", () => {
    const src = readFileSync(path.resolve(__dirname, "../../src/modules/commerce/webhook.service.ts"), "utf8");
    const inSwitch = [...src.slice(src.indexOf("switch (event.type)")).matchAll(/case "([a-z_.]+)":/g)].map((m) => m[1]).sort();
    expect([...HANDLED_WEBHOOK_EVENTS].sort()).toEqual(inSwitch);
  });
});

describe("missingEvents", () => {
  it("lists what an endpoint would not deliver; * delivers everything", () => {
    expect(missingEvents([...HANDLED_WEBHOOK_EVENTS])).toEqual([]);
    expect(missingEvents(["*"])).toEqual([]);
    expect(missingEvents(["checkout.session.completed", "refund.updated"])).toContain("charge.refunded");
    expect(missingEvents([])).toHaveLength(HANDLED_WEBHOOK_EVENTS.length);
  });
});

describe("buildReport", () => {
  it("live key, charges enabled, the endpoint subscribed to every handled event → ready", () => {
    const r = buildReport(base);
    expect(r.ok).toBe(true);
    expect(r.lines.some((l) => /LIVE/.test(l.text) && l.level === "ok")).toBe(true);
    expect(formatReport(r)).toContain("no blocking problem");
  });

  it("a test key in production is a failure; a missing or invalid key is a failure", () => {
    expect(levels({ ...base, keyMode: "test", keyKind: "standard" }).join(" ")).toMatch(/TEST/);
    expect(levels({ ...base, keyKind: "missing", keyMode: null }).join(" ")).toMatch(/not set/);
    expect(levels({ ...base, keyKind: "invalid", keyMode: null }).join(" ")).toMatch(/not a Stripe API key/);
  });

  it("no signing secret, charges disabled, no matching endpoint, disabled endpoint, or a missing event each fail", () => {
    expect(levels({ ...base, webhookSecretPresent: false }).join(" ")).toMatch(/STRIPE_WEBHOOK_SECRET/);
    expect(levels({ ...base, account: { chargesEnabled: false, payoutsEnabled: true, country: "MY" } }).join(" ")).toMatch(/cannot take charges/);
    expect(levels({ ...base, endpoints: [] }).join(" ")).toMatch(/No webhook endpoint/);
    expect(levels({ ...base, endpoints: [{ ...base.endpoints![0]!, status: "disabled" }] }).join(" ")).toMatch(/not enabled/);
    expect(levels({ ...base, endpoints: [{ ...base.endpoints![0]!, enabledEvents: ["checkout.session.completed"] }] }).join(" ")).toMatch(/charge\.refunded/);
  });

  it("matches the endpoint URL ignoring case and a trailing slash, and ignores other endpoints", () => {
    const other = { url: "https://elsewhere.example.test/hook", status: "enabled", enabledEvents: ["*"] };
    const mine = { url: "HTTPS://Portal.Example.test/api/stripe/webhook/", status: "enabled", enabledEvents: [...HANDLED_WEBHOOK_EVENTS] };
    expect(buildReport({ ...base, endpoints: [other, mine] }).ok).toBe(true);
    expect(buildReport({ ...base, endpoints: [other] }).ok).toBe(false);
  });

  it("a restricted key that cannot read the account or endpoints is a warning with the dashboard route, not a failure", () => {
    const r = buildReport({ ...base, account: null, accountNote: "permission denied", endpoints: null, endpointsNote: "permission denied" });
    expect(r.ok).toBe(true);
    expect(r.lines.filter((l) => l.level === "warn").map((l) => l.text).join(" ")).toMatch(/Dashboard/);
  });

  it("always says it cannot prove the signing secret matches, and never prints a secret", () => {
    const text = formatReport(buildReport({ ...base, appBaseUrl: `https://portal.example.test` }));
    expect(text).toMatch(/cannot confirm the signing secret/);
    expect(text).not.toContain(LIVE_KEY);
    expect(text).not.toMatch(/(sk|rk|pk)_(live|test)_[A-Za-z0-9]/);
    expect(text).not.toMatch(/whsec_/);
  });
});
