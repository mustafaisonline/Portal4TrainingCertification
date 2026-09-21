import type { Metadata } from "next";
import type { ReactNode } from "react";
import { forbidden, redirect } from "next/navigation";
import { AccountControls } from "@/modules/identity/components/AccountControls";
import { authorise } from "@/modules/identity/session";
import { PublicShell } from "@/shared/chrome/PublicShell";

/*
 * Trainer / admin area. SERVER-SIDE gate on every request (ADR-020; ADMIN
 * reqs AD-3): `platform_admin` from OUR `user_roles`, AND two-factor enrolled.
 *   signed out   → sign-in with return path
 *   no role      → HTTP 403 (app/forbidden.tsx) — not a redirect that hides it
 *   no MFA yet   → the enrolment page, the only admin-area step served
 * The wireframe's `AdminFrame` label-gate is replaced, not ported.
 */
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · Data & AI Academy" } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const result = await authorise("platform_admin");
  if (!result.ok) {
    if (result.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin")}`);
    if (result.reason === "mfa-required") redirect("/account/security/mfa?required=admin");
    forbidden();
  }
  return (
    <PublicShell accountSlot={<AccountControls />} mobileAccountSlot={<AccountControls variant="mobile" />}>
      <div className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6 lg:py-14">{children}</div>
      </div>
    </PublicShell>
  );
}
