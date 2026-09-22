import type { Metadata } from "next";
import type { ReactNode } from "react";
import { forbidden, redirect } from "next/navigation";
import { AccountControls } from "@/modules/identity/components/AccountControls";
import { authorise } from "@/modules/identity/session";
import { AdminNav } from "@/shared/chrome/AdminNav";
import { PublicShell } from "@/shared/chrome/PublicShell";

/*
 * Trainer / admin area. SERVER-SIDE gate on every request (ADR-020; ADMIN
 * reqs AD-3): `platform_admin` from OUR `user_roles`.
 *   signed out   → sign-in with return path
 *   no role      → HTTP 403 (app/forbidden.tsx) — not a redirect that hides it
 * (The MFA requirement was removed for MVP 1 — founder, 2026-09-21.)
 * The wireframe's `AdminFrame` label-gate is replaced, not ported.
 * Milestone 8: the sub-navigation bar (src/shared/chrome/admin-nav.ts) sits
 * above every admin screen; the gate itself is unchanged.
 */
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Data & AI Academy" } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const result = await authorise("platform_admin");
  if (!result.ok) {
    if (result.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin")}`);
    forbidden();
  }
  return (
    <PublicShell accountSlot={<AccountControls />} mobileAccountSlot={<AccountControls variant="mobile" />}>
      <div className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
          <AdminNav />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </PublicShell>
  );
}
