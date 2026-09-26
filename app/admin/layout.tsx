import type { Metadata } from "next";
import type { ReactNode } from "react";
import { forbidden, redirect } from "next/navigation";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { AccountControls } from "@/modules/identity/components/AccountControls";
import { AdminNav } from "@/shared/chrome/AdminNav";
import { adminNavItems, trainerNavItems } from "@/shared/chrome/admin-nav";
import { PublicShell } from "@/shared/chrome/PublicShell";

/*
 * Trainer / admin area. SERVER-SIDE gate on every request (ADR-020; ADMIN
 * reqs AD-3), from OUR `user_roles`:
 *   signed out                         → sign-in with return path
 *   platform_admin                     → everything, the full bar
 *   expert (Trainer, Milestone 12 L3)  → the shell with a reduced bar
 *     (Overview · Trainings); every other screen under /admin calls
 *     `forbidden()` itself, so the bar is a convenience, not the control
 *   anyone else                        → HTTP 403 (app/forbidden.tsx)
 * (The MFA requirement was removed for MVP 1 — founder, 2026-09-21.)
 * The wireframe's `AdminFrame` label-gate is replaced, not ported.
 */
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Data & AI Academy" } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin")}`);
    forbidden();
  }
  return (
    <PublicShell accountSlot={<AccountControls />} mobileAccountSlot={<AccountControls variant="mobile" />}>
      <div className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
          <AdminNav items={access.isAdmin ? adminNavItems : trainerNavItems} />
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </PublicShell>
  );
}
