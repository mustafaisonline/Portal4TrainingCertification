/*
 * READ-ONLY Stripe readiness check (Milestone 15, Requirement 7).
 *
 *   set -a; . /etc/p4tc/production.env; set +a
 *   npm run stripe:check
 *
 * Reports the key MODE (live/test — from the key's prefix; the key is never
 * printed or logged), whether the account can take charges, and which
 * webhook events the endpoint for APP_BASE_URL subscribes to, against the
 * events the application handles. It only READS from Stripe (account,
 * webhook endpoints) — it creates and changes nothing. Exit 0 = no blocking
 * problem, 1 = a [FAIL] line, 2 = no key to check with.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import { buildReport, classifyKey, formatReport, type StripeFacts } from "../src/modules/commerce/stripe-check.ts";

const envFile = path.resolve(process.cwd(), ".env.local");
if (!process.env["STRIPE_SECRET_KEY"] && existsSync(envFile)) process.loadEnvFile(envFile);

const key = process.env["STRIPE_SECRET_KEY"];
const facts: StripeFacts = {
  ...classifyKey(key),
  webhookSecretPresent: Boolean(process.env["STRIPE_WEBHOOK_SECRET"]?.trim()),
  appBaseUrl: process.env["APP_BASE_URL"]?.trim() || null,
  account: null,
  endpoints: null,
};

/** Never echo anything that could carry the key: only the error's own message text, trimmed. */
function why(err: unknown): string {
  const raw = err instanceof Error ? err.message : "unknown error";
  return raw.replace(/(sk|rk|pk)_(live|test)_[A-Za-z0-9]+/g, "$1_$2_…").slice(0, 160);
}

async function main() {
  if (!key || facts.keyKind === "missing") {
    console.error(formatReport(buildReport(facts)));
    process.exitCode = 2;
    return;
  }
  if (facts.keyKind !== "invalid") {
    const stripe = new Stripe(key, { appInfo: { name: "Data & AI Academy Portal — stripe:check", version: "0.1.0" } });
    try {
      const a = await stripe.accounts.retrieveCurrent();
      facts.account = { chargesEnabled: a.charges_enabled, payoutsEnabled: a.payouts_enabled, country: a.country ?? null };
    } catch (err) {
      facts.accountNote = why(err);
    }
    try {
      const list = await stripe.webhookEndpoints.list({ limit: 100 });
      facts.endpoints = list.data.map((e) => ({ url: e.url, status: e.status, enabledEvents: e.enabled_events }));
    } catch (err) {
      facts.endpointsNote = why(err);
    }
  }
  const report = buildReport(facts);
  console.log(formatReport(report));
  process.exitCode = report.ok ? 0 : 1;
}

main().catch((err) => {
  console.error(`stripe:check failed: ${why(err)}`);
  process.exitCode = 1;
});
