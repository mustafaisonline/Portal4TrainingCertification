import type { Metadata } from "next";
import { requireUser } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { ChangePasswordForm } from "./ChangePasswordForm";

/* Security — change password (founder request 2026-09-21: no email provider
   exists, so "forgot password" cannot deliver a link yet; a signed-in person
   must be able to change their password here). Two-factor authentication
   was removed for MVP 1 the same day. */
export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage() {
  await requireUser("/account/security");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Security</p>
        <h1 className="text-display">Password</h1>
      </header>

      <Card variant="panel">
        <h2 className="text-h2 mb-2">Change password</h2>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          Confirm your current password, then choose a new one of at least 8 characters. Other devices signed in to
          your account will be signed out.
        </p>
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
