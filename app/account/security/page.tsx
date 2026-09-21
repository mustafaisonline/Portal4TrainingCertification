import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { ChangePasswordForm } from "./ChangePasswordForm";

/* Security — change password (founder request 2026-09-21: no email provider
   exists, so "forgot password" cannot deliver a link yet; a signed-in person
   must be able to change their password here) and the two-factor status. */
export const metadata: Metadata = { title: "Security" };

export default async function SecurityPage() {
  const user = await requireUser("/account/security");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Security</p>
        <h1 className="text-display">Password and two-factor</h1>
      </header>

      <Card variant="panel">
        <h2 className="text-h2 mb-2">Change password</h2>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          Confirm your current password, then choose a new one of at least 8 characters. Other devices signed in to
          your account will be signed out.
        </p>
        <ChangePasswordForm />
      </Card>

      <Card variant="panel">
        <h2 className="text-h2 mb-2">Two-factor authentication</h2>
        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
          Status: {user.mfaEnabled ? <Chip tone="primary">On</Chip> : <Chip>Off</Chip>}
        </p>
        <Link href="/account/security/mfa" className="text-body-sm text-[var(--color-primary)] underline underline-offset-4">
          {user.mfaEnabled ? "Manage two-factor authentication" : "Set up two-factor authentication"}
        </Link>
      </Card>
    </div>
  );
}
