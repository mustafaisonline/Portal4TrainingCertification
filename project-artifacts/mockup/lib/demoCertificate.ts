import { useMemo, useSyncExternalStore } from "react";
import { RENEWAL_FEE } from "@/data/certificateConfig";
import {
  addDays,
  initialExpiry,
  renewedExpiry,
  toIso,
} from "@/lib/certificates";

/*
 * DEMO CERTIFICATE — wireframe only, added 2026-09-20, founder requirement
 * ("once a user completes a training we give them a Training Completion
 * Certificate …").
 *
 * ⚠ THIS SIMULATES THINGS THE SERVER MUST OWN. Issuing a certificate, letting
 * time pass, and taking a renewal payment all happen here at the click of a
 * button in the browser tab, stored in sessionStorage (this tab only, wiped on
 * sign-out — see lib/demoSession.ts). In the real product:
 *   • a certificate is issued by the SERVER when a trainer/admin records
 *     completion — never requested by the holder;
 *   • expiry is computed by the SERVER from stored dates — "simulate a year
 *     passing" does not exist;
 *   • a renewal is recorded only after a signature-verified Stripe webhook
 *     confirms payment (docs/execution/COMPLETION_CERTIFICATE_REQUIREMENTS.md).
 * DELETE this file when the backend exists.
 */
export type DemoRenewal = {
  /** ISO date the (simulated) renewal happened. */
  on: string;
  amount: number;
  currency: string;
  method: string;
  /** Expiry before / after — kept so history explains itself. */
  from: string;
  to: string;
};

export type DemoCertificate = {
  offeringId: string;
  issuedOn: string;
  expiresOn: string;
  listed: boolean;
  renewals: DemoRenewal[];
};

const KEY = "mockup:demo-certificate";

let memory: string | null = null;
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return sessionStorage.getItem(KEY) ?? memory ?? "null";
  } catch {
    return memory ?? "null";
  }
}

function write(value: string | null) {
  memory = value;
  try {
    if (value === null) sessionStorage.removeItem(KEY);
    else sessionStorage.setItem(KEY, value);
  } catch {
    /* storage unavailable — the in-memory copy carries the demo */
  }
  listeners.forEach((l) => l());
}

function parse(raw: string): DemoCertificate | null {
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === "object" ? (v as DemoCertificate) : null;
  } catch {
    return null;
  }
}

function current(): DemoCertificate | null {
  return parse(readRaw());
}

/** Issue the demo certificate (idempotent — one per demo session). */
export function issueDemoCertificate(offeringId: string, now = new Date()) {
  if (current()) return;
  const issuedOn = toIso(now);
  write(
    JSON.stringify({
      offeringId,
      issuedOn,
      expiresOn: initialExpiry(issuedOn),
      listed: true,
      renewals: [],
    } satisfies DemoCertificate),
  );
}

export function renewDemoCertificate(method: string, now = new Date()) {
  const c = current();
  if (!c) return;
  const to = renewedExpiry(c.expiresOn, now);
  write(
    JSON.stringify({
      ...c,
      expiresOn: to,
      renewals: [
        ...c.renewals,
        {
          on: toIso(now),
          amount: RENEWAL_FEE.amount,
          currency: RENEWAL_FEE.currency,
          method,
          from: c.expiresOn,
          to,
        },
      ],
    } satisfies DemoCertificate),
  );
}

export function setDemoListed(listed: boolean) {
  const c = current();
  if (c) write(JSON.stringify({ ...c, listed }));
}

/** DEMO TOOL ONLY — jump the clock by moving the expiry. */
export function setDemoExpiry(expiresOn: string) {
  const c = current();
  if (c) write(JSON.stringify({ ...c, expiresOn }));
}

export function demoExpiryIn(days: number, now = new Date()) {
  return addDays(toIso(now), days);
}

export function clearDemoCertificate() {
  write(null);
}

/** `undefined` on the server / during hydration; `null` = none issued. */
export function useDemoCertificate(): DemoCertificate | null | undefined {
  const raw = useSyncExternalStore<string | undefined>(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readRaw,
    () => undefined,
  );
  return useMemo(() => (raw === undefined ? undefined : parse(raw)), [raw]);
}
