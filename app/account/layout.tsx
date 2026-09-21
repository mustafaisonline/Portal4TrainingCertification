import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountControls } from "@/modules/identity/components/AccountControls";
import { requireUser } from "@/modules/identity/session";
import { AccountFrame } from "@/shared/chrome/AccountFrame";
import { PublicShell } from "@/shared/chrome/PublicShell";

/*
 * Signed-in area. SERVER-SIDE gate: `requireUser` redirects to sign-in (with a
 * validated return path) before anything under /account renders — the thing
 * the wireframe's client-side `SignInGate` only pretended to do
 * (BACKEND_HANDOFF_INDEX.md C18). Screen set grows in M5.
 */
// A nested `default` keeps the root "%s · Data & AI Academy" template for
// pages beneath (a bare string here would replace it).
export const metadata: Metadata = { title: { default: "My account", template: "%s · Data & AI Academy" } };

export default async function AccountLayout({ children }: { children: ReactNode }) {
  // Layouts do not know the leaf path; pages that need a precise return path
  // call requireUser themselves (e.g. /account/security/mfa).
  const user = await requireUser("/account");
  return (
    <PublicShell accountSlot={<AccountControls />} mobileAccountSlot={<AccountControls variant="mobile" />}>
      <AccountFrame userName={user.name}>{children}</AccountFrame>
    </PublicShell>
  );
}
