import type { Metadata } from "next";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { ProfileForm } from "./ProfileForm";

/*
 * S06 — Profile & security.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/profile/page.tsx
 * (ADR-045). Changed: server component on the real session; "Personal
 * details" is the real ProfileForm (server action, audited); the inert
 * "Change password" form is replaced by a link to /account/security, where
 * the working one lives; "Sign out" is a link to /sign-out. NOT ported: the
 * "Your data" card (download / delete account) — what those must do is
 * undecided until the Privacy policy is published (Rule 8), so nothing is
 * drawn for them — and the WireframeNote.
 */
export const metadata: Metadata = { title: "Profile & security" };

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Profile &amp; security</p>
        <h1 className="text-display">Your profile</h1>
      </header>

      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-5">Personal details</h2>
        <ProfileForm name={user.name} email={user.email} country={user.country} />
      </Card>

      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-2">Password</h2>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          Change your password from the Security page. Other devices signed in to your account will be signed out.
        </p>
        <Button variant="secondary" href="/account/security">
          Change password
        </Button>
      </Card>

      <div>
        <Button variant="secondary" href="/sign-out">
          Sign out
        </Button>
      </div>
    </div>
  );
}
