"use client";

import { useRouter } from "next/navigation";
import {
  Field,
  InertForm,
  PasswordField,
  WireframeNote,
} from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { demoParticipant } from "@/data/demoParticipant";
import { endDemoSession } from "@/lib/demoSession";

/**
 * S06 — Profile & security (wireframe, 2026-09-20). Client component only
 * because "Sign out" needs the router. Save / update / export / delete are
 * genuinely disabled — no backend. Export and delete are drawn because a
 * PDPA-facing product needs them; what they must do (and the privacy
 * policy that governs them) is undecided, so they do nothing.
 */
export default function ProfilePage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Profile &amp; security</p>
        <h1 className="text-display">Your profile</h1>
      </header>

      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-5">Personal details</h2>
        <InertForm aria-label="Personal details" className="flex flex-col gap-5">
          <Field label="Full name" name="name" defaultValue={demoParticipant.name} autoComplete="name" />
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={demoParticipant.email}
            readOnly
            hint="Changing your email will need re-verification once accounts are real."
          />
          <Field label="Country" name="country" defaultValue={demoParticipant.country} autoComplete="country-name" />
          <div>
            <Button type="submit" disabled>
              Save changes
            </Button>
          </div>
        </InertForm>
      </Card>

      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-5">Change password</h2>
        <InertForm aria-label="Change password" className="flex flex-col gap-5">
          <PasswordField label="Current password" name="current" autoComplete="current-password" />
          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordField label="New password" name="new" autoComplete="new-password" />
            <PasswordField label="Confirm new password" name="confirm" autoComplete="new-password" />
          </div>
          <div>
            <Button type="submit" disabled>
              Update password
            </Button>
          </div>
        </InertForm>
      </Card>

      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-2">Your data</h2>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          Download a copy of your data or delete your account. What each does
          will be set out in the Privacy policy, which is not yet published.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" type="button" disabled>
            Download my data
          </Button>
          <Button variant="secondary" type="button" disabled>
            Delete my account
          </Button>
        </div>
      </Card>

      <div className="flex flex-col items-start gap-4">
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            endDemoSession();
            router.push("/sign-out");
          }}
        >
          Sign out
        </Button>
        <WireframeNote>
          Not connected — nothing on this page is saved, and there is no real
          account behind it.
        </WireframeNote>
      </div>
    </div>
  );
}
