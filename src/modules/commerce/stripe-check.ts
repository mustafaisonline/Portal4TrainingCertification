import { stripeKeyMode } from "@/config/env";

/*
 * The read-only Stripe readiness check — Milestone 15, Requirement 7.
 * `npm run stripe:check` (scripts/stripe-check.ts) gathers three facts from
 * Stripe with READ-ONLY calls; this module turns them into a report and an
 * exit status. It is pure: nothing here reads the environment, the network or
 * the key, and no report line can contain a secret (only the key's prefix
 * shape — "live"/"test", "restricted"/"standard" — is ever described).
 *
 * WARN is used where a restricted key legitimately cannot read something
 * (the dashboard shows it instead); FAIL only where going live would be
 * wrong or broken.
 */

/** The webhook events the application acts on (webhook.service.ts). Any other
 *  event is stored and marked `ignored`, so subscribing to more is harmless
 *  and to fewer loses payments. A test asserts this list against the source. */
export const HANDLED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
  "checkout.session.async_payment_failed",
  "charge.succeeded",
  "charge.updated",
  "charge.refunded",
  "refund.created",
  "refund.updated",
] as const;

export const WEBHOOK_PATH = "/api/stripe/webhook";

export type WebhookEndpointFact = { url: string; status: string; enabledEvents: string[] };

export type StripeFacts = {
  /** Raw STRIPE_SECRET_KEY presence and value are judged by the caller; here only its shape. */
  keyKind: "restricted" | "standard" | "invalid" | "missing";
  keyMode: "live" | "test" | null;
  webhookSecretPresent: boolean;
  appBaseUrl: string | null;
  /** null = the key could not read the account (say why in `accountNote`). */
  account: { chargesEnabled: boolean; payoutsEnabled: boolean; country: string | null } | null;
  accountNote?: string;
  /** null = the key could not list endpoints. */
  endpoints: WebhookEndpointFact[] | null;
  endpointsNote?: string;
};

export type CheckLine = { level: "ok" | "warn" | "fail"; text: string };
export type CheckReport = { lines: CheckLine[]; ok: boolean };

/** Shape of a key, from its prefix only. */
export function classifyKey(key: string | undefined): Pick<StripeFacts, "keyKind" | "keyMode"> {
  if (!key || !key.trim()) return { keyKind: "missing", keyMode: null };
  const mode = stripeKeyMode(key.trim());
  if (!mode) return { keyKind: "invalid", keyMode: null };
  return { keyKind: key.trim().startsWith("rk_") ? "restricted" : "standard", keyMode: mode };
}

/** The events of `handled` that this endpoint will NOT deliver. `*` = all. */
export function missingEvents(enabledEvents: string[], handled: readonly string[] = HANDLED_WEBHOOK_EVENTS): string[] {
  if (enabledEvents.includes("*")) return [];
  return handled.filter((e) => !enabledEvents.includes(e));
}

function sameUrl(a: string, b: string): boolean {
  return a.replace(/\/+$/, "").toLowerCase() === b.replace(/\/+$/, "").toLowerCase();
}

export function buildReport(f: StripeFacts): CheckReport {
  const lines: CheckLine[] = [];
  const add = (level: CheckLine["level"], text: string) => lines.push({ level, text });

  // 1. The key.
  if (f.keyKind === "missing") add("fail", "STRIPE_SECRET_KEY is not set in this environment.");
  else if (f.keyKind === "invalid") add("fail", "STRIPE_SECRET_KEY is not a Stripe API key (expected sk_live_…, rk_live_…, sk_test_… or rk_test_…).");
  else if (f.keyMode === "live") add("ok", `Key mode: LIVE (${f.keyKind} key).`);
  else add("fail", `Key mode: TEST (${f.keyKind} key) — real payments will not work. Production needs a live key.`);

  // 2. The signing secret.
  if (f.webhookSecretPresent) add("ok", "STRIPE_WEBHOOK_SECRET is set.");
  else add("fail", "STRIPE_WEBHOOK_SECRET is not set — no payment can be confirmed.");

  // 3. The account.
  if (f.account) {
    add(f.account.chargesEnabled ? "ok" : "fail", f.account.chargesEnabled ? "Account can take charges." : "Account cannot take charges yet — finish activation in the Stripe Dashboard.");
    add(f.account.payoutsEnabled ? "ok" : "warn", f.account.payoutsEnabled ? "Payouts are enabled." : "Payouts are not enabled yet — money will not reach the bank until they are.");
  } else if (f.keyKind === "restricted" || f.keyKind === "standard") {
    add("warn", `Could not read the account (${f.accountNote ?? "no detail"}). Check "charges enabled" in the Stripe Dashboard instead.`);
  }

  // 4. The webhook endpoint.
  const expected = f.appBaseUrl ? `${f.appBaseUrl.replace(/\/+$/, "")}${WEBHOOK_PATH}` : null;
  if (f.endpoints === null) {
    if (f.keyKind === "restricted" || f.keyKind === "standard") {
      add("warn", `Could not list webhook endpoints (${f.endpointsNote ?? "no detail"}). In the Dashboard, confirm an endpoint for ${expected ?? WEBHOOK_PATH} subscribes to: ${HANDLED_WEBHOOK_EVENTS.join(", ")}.`);
    }
  } else if (!expected) {
    add("warn", "APP_BASE_URL is not set, so the endpoint URL cannot be matched.");
  } else {
    const mine = f.endpoints.filter((e) => sameUrl(e.url, expected));
    if (mine.length === 0) add("fail", `No webhook endpoint for ${expected}. Create one in the Stripe Dashboard (live mode) — see docs/operations/STRIPE_GO_LIVE_CHECKLIST.md.`);
    for (const e of mine) {
      if (e.status !== "enabled") add("fail", `Endpoint ${e.url} is "${e.status}", not enabled.`);
      const missing = missingEvents(e.enabledEvents);
      if (missing.length > 0) add("fail", `Endpoint ${e.url} does not subscribe to: ${missing.join(", ")}.`);
      else if (e.status === "enabled") add("ok", `Endpoint ${e.url} is enabled and subscribes to every event the application handles.`);
    }
  }
  add("warn", "This check cannot confirm the signing secret matches the endpoint — use Send test webhook in the Dashboard (expect 200) and then the RM 2.00 support payment.");

  return { lines, ok: lines.every((l) => l.level !== "fail") };
}

export function formatReport(report: CheckReport): string {
  const tag = { ok: "[ OK ]", warn: "[WARN]", fail: "[FAIL]" } as const;
  return [...report.lines.map((l) => `${tag[l.level]} ${l.text}`), "", report.ok ? "Result: no blocking problem found." : "Result: NOT ready — fix the [FAIL] lines above."].join("\n");
}
