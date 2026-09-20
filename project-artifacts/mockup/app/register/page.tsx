import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/components/auth/AuthScreen";
import {
  BlockedConsent,
  Field,
  InertForm,
  PasswordField,
  WireframeNote,
} from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";

/**
 * S02 — Create account / user registration. WIREFRAME, added 2026-09-20 by
 * founder direction; no backend. Route is `/register`; the specification's
 * placeholder path was `/signup`.
 *
 * FIELDS. Name, email, country and password only — the identity fields the
 * approved data architecture already names for a user (email, name,
 * country). Target role, goals, weekly time budget etc. belong to the
 * separate onboarding step (S03) and are NOT collected here. No phone,
 * date of birth, organisation or ID number: none is required by any
 * approved source, and collecting personal data nobody has justified is
 * exactly what the (unwritten) privacy policy would have to explain.
 *
 * NOT DECIDED, so NOT DRAWN: password rules (authentication decision,
 * ADR-006, pending), a "verify your email" step (S04 — needs the
 * transactional-email decision, ADR-015), social sign-in.
 *
 * CONSENT. Terms and Privacy do not exist yet (docs/SITE_PAGES.md — legal
 * instruments an agent must not draft). The acceptance checkbox is
 * therefore drawn disabled with the reason beside it, rather than as a
 * working control that would "agree" to nothing.
 */

export const metadata: Metadata = {
  title: "Create an account — Data & AI Academy",
  description: "Create your Data & AI Academy account.",
};

export default function RegisterPage() {
  return (
    <AuthScreen
      eyebrow="Your account"
      title="Create your account"
      lead="One account for your registrations and receipts."
      width="max-w-[560px]"
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Sign in
          </Link>
        </>
      }
    >
      <InertForm
        aria-label="Create an account"
        aria-describedby="register-status"
        className="flex flex-col gap-5"
      >
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          hint="As you would like it to appear on any certificate of participation."
        />
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
        />
        <Field label="Country" name="country" autoComplete="country-name" />
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm password"
            name="password-confirm"
            autoComplete="new-password"
          />
        </div>
        <BlockedConsent reason="Cannot be ticked yet — the Terms of service and Privacy policy have not been published.">
          I agree to the Terms of service and have read the Privacy policy.
        </BlockedConsent>
        <Button type="submit" disabled className="w-full">
          Create account
        </Button>
        <div id="register-status">
          <WireframeNote>
            Not connected yet — no accounts can be created, and nothing typed
            is sent or stored. Password rules are not yet decided.
          </WireframeNote>
        </div>
      </InertForm>
    </AuthScreen>
  );
}
