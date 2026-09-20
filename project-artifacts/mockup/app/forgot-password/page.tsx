import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { Field, InertForm, WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";

/**
 * Forgot password — WIREFRAME, added 2026-09-20 by founder direction; no
 * backend. The specification files password reset under S01 ("standard
 * recovery", MOCKUP_SPECIFICATION open issue 6); it is its own route here.
 *
 * Only the request step is drawn. The "check your email" confirmation and
 * the set-a-new-password step are not: the first would be a simulated
 * success state with nothing sent behind it, and both depend on the
 * transactional-email decision (ADR-015, deferred) and the authentication
 * decision (ADR-006, pending).
 *
 * The copy avoids saying whether an address is registered — the standard
 * way to keep the form from revealing who has an account.
 */

export const metadata: Metadata = {
  title: "Forgot password — Data & AI Academy",
  description: "Request a link to reset your Data & AI Academy password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthScreen
      eyebrow="Account recovery"
      title="Forgot your password?"
      lead="Enter the email address you registered with. If an account exists for it, we will send a link to choose a new password."
      footer={
        <Link
          href="/sign-in"
          className="inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
        >
          ← Back to sign in
        </Link>
      }
    >
      <InertForm
        aria-label="Request a password reset"
        aria-describedby="forgot-status"
        className="flex flex-col gap-5"
      >
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
        />
        <Button type="submit" disabled className="w-full">
          Send reset link
        </Button>
        <div id="forgot-status">
          <WireframeNote>
            Not connected yet — no email service exists, so no link is sent.
          </WireframeNote>
        </div>
      </InertForm>
    </AuthScreen>
  );
}
