import { useSyncExternalStore } from "react";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./demoCredentials";
import { clearDemoCertificate } from "./demoCertificate";
import { clearDemoRegistrations } from "./demoRegistrations";

/*
 * DEMO SESSION — wireframe only, added 2026-09-20, founder direction
 * ("pre-load a dummy username and password so in wireframe we can see how
 * the portal behaves after the user signs in").
 *
 * ⚠ THIS IS NOT AUTHENTICATION. It is a labelled, temporary simulation
 * that lets a reviewer walk the signed-in screens. Specifically:
 *
 * - The "credentials" are public constants (./demoCredentials). Anyone can read them.
 *   They protect nothing, and no page here may ever suggest otherwise.
 * - The "session" is one boolean in sessionStorage (this tab only,
 *   cleared when the tab closes or on sign-out). It is non-authoritative,
 *   holds no user data and gates only what the *browser* draws — every
 *   signed-in page is a static file anyone can fetch directly.
 * - Nothing is verified, hashed or sent anywhere.
 *
 * When real authentication exists (ADR-006, pending), DELETE this file and
 * `components/auth/SignInForm.tsx`; do not evolve them into it. See
 * docs/execution/ACCOUNT_AND_PAYMENT_REQUIREMENTS.md.
 *
 */
const KEY = "mockup:demo-session";

// In-memory fallback for browsers that block sessionStorage (private modes,
// storage disabled): the session then lasts for client-side navigation but
// not a reload, rather than sign-in silently failing.
let memory = false;
const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return memory;
  }
}

function write(on: boolean) {
  memory = on;
  try {
    if (on) sessionStorage.setItem(KEY, "1");
    else sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable — the in-memory flag above carries the session */
  }
  listeners.forEach((l) => l());
}

export function startDemoSession() {
  write(true);
}

/** Synchronous, non-hook read for event handlers (click-time decisions). */
export function isDemoSignedIn(): boolean {
  return read();
}

export function endDemoSession() {
  write(false);
  // The simulated registrations belong to the demo session (see
  // lib/demoRegistrations.ts) and must not outlive it.
  clearDemoRegistrations();
  clearDemoCertificate();
}

// Where to send the visitor after a successful demo sign-in — set when a
// signed-out visitor is stopped at a screen that needs an account (the
// checkout). sessionStorage, not a query string, so it works in the static
// export without Suspense. Only same-site absolute paths are honoured.
const RETURN_KEY = "mockup:demo-return-to";

export function setReturnTo(path: string) {
  try {
    sessionStorage.setItem(RETURN_KEY, path);
  } catch {
    /* no storage — sign-in falls back to /account */
  }
}

/** Look at the pending return path without clearing it (to word the sign-in
 *  screen). */
export function peekReturnTo(): string | null {
  try {
    return sessionStorage.getItem(RETURN_KEY);
  } catch {
    return null;
  }
}

export function consumeReturnTo(): string | null {
  try {
    const v = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return v && v.startsWith("/") && !v.startsWith("//") ? v : null;
  } catch {
    return null;
  }
}

export function credentialsMatch(email: string, password: string) {
  return (
    email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD
  );
}

/** "unknown" on the server and during hydration — callers must not flash a
 *  signed-out UI at someone who is signed in. */
export type DemoSessionState = "unknown" | "in" | "out";

export function useDemoSession(): DemoSessionState {
  return useSyncExternalStore<DemoSessionState>(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => (read() ? "in" : "out"),
    () => "unknown",
  );
}
