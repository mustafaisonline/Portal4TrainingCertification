/*
 * Demo account constants — wireframe only, 2026-09-20. Split out of
 * lib/demoSession.ts because that file holds a React hook (client-only)
 * while server-rendered pages and data/demoParticipant.ts need just these
 * strings. See lib/demoSession.ts for the full warning: THESE PROTECT
 * NOTHING and are public by design. `example.com` is reserved by IANA for
 * documentation, so this address can never belong to a real person.
 */
export const DEMO_EMAIL = "demo.participant@example.com";
export const DEMO_PASSWORD = "Demo-Password-2026";

/** Second persona, added 2026-09-20 for the trainer/admin wireframe. Same
 *  warnings apply: public, protects nothing, delete with real auth. */
export const DEMO_ADMIN_EMAIL = "demo.admin@example.com";
export const DEMO_ADMIN_PASSWORD = "Demo-Admin-2026";

export type DemoRole = "participant" | "admin";
