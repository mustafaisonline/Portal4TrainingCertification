import { useMemo, useSyncExternalStore } from "react";
import type { RegionKey } from "@/data/courses";
import type { PaymentMethodKey } from "@/data/demoParticipant";

/*
 * DEMO REGISTRATIONS — wireframe only, added 2026-09-20, founder direction
 * ("show a dummy confirmation simulating a successful payment").
 *
 * ⚠ THIS SIMULATES A SUCCESSFUL PAYMENT. Nothing is charged, nothing is sent
 * to Stripe, no order exists anywhere. Walking the checkout in the DEMO
 * session appends a record here so the rest of the signed-in area (dashboard,
 * registrations, orders) can show what a registered participant sees.
 *
 * Read the same warnings as lib/demoSession.ts, which this depends on:
 * the list lives in sessionStorage (this tab only), is non-authoritative,
 * and is wiped on sign-out (endDemoSession calls clearDemoRegistrations).
 * The Pay button is only ever enabled inside the demo session.
 *
 * This file is the exact thing the real product must NOT do: in production a
 * registration is created by the server ONLY after a signature-verified
 * Stripe webhook confirms payment — never by the browser. DELETE this file
 * when the backend exists (docs/execution/ACCOUNT_AND_PAYMENT_REQUIREMENTS.md).
 */
export type DemoRegistration = {
  orderId: string;
  /** Offering id — see data/demoParticipant.ts */
  offeringId: string;
  /** Currency the participant chose to pay in. */
  currency: RegionKey;
  method: PaymentMethodKey;
  /** Real calendar date the demo action happened, formatted. Still shown
   *  with a "Sample" tag: the order is not real. */
  placedOn: string;
};

const KEY = "mockup:demo-registrations";

// In-memory fallback when sessionStorage is blocked — same rationale as
// lib/demoSession.ts.
let memory: string | null = null;
const listeners = new Set<() => void>();

function readRaw(): string {
  try {
    return sessionStorage.getItem(KEY) ?? memory ?? "[]";
  } catch {
    return memory ?? "[]";
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

function parse(raw: string): DemoRegistration[] {
  try {
    const v: unknown = JSON.parse(raw);
    return Array.isArray(v) ? (v as DemoRegistration[]) : [];
  } catch {
    return [];
  }
}

export function addDemoRegistration(
  input: Omit<DemoRegistration, "orderId" | "placedOn">,
): DemoRegistration {
  const list = parse(readRaw());
  const reg: DemoRegistration = {
    ...input,
    orderId: `SAMPLE-${String(list.length + 1).padStart(4, "0")}`,
    placedOn: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };
  write(JSON.stringify([...list, reg]));
  return reg;
}

export function clearDemoRegistrations() {
  write(null);
}

/** `null` on the server and during hydration — render nothing rather than
 *  flash an empty state at someone who has registrations. */
export function useDemoRegistrations(): DemoRegistration[] | null {
  const raw = useSyncExternalStore<string | null>(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readRaw,
    () => null,
  );
  return useMemo(() => (raw === null ? null : parse(raw)), [raw]);
}
