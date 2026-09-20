import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { SignInForm } from "@/components/auth/SignInForm";

/**
 * S01 — Sign in. WIREFRAME, added 2026-09-20 by founder direction.
 * Route is `/sign-in` (the specification's placeholder path was `/login`).
 *
 * UPDATED 2026-09-20, later the same day, founder direction: the form now
 * carries a pre-loaded DEMO ACCOUNT so a reviewer can walk the signed-in
 * screens under /account. This supersedes the earlier "submit button is
 * genuinely disabled" convention for THIS page only — deliberately, and
 * labelled: see components/auth/SignInForm.tsx and lib/demoSession.ts. It
 * is a simulation, not authentication.
 *
 * Still deliberately NOT included, because each would invent a decision
 * that belongs to the pending authentication ADR (ADR-006 /
 * docs/architecture/DECISION_B_AUTHENTICATION.md): social sign-in
 * providers, "remember me" / session length, MFA prompts, SSO.
 */

export const metadata: Metadata = {
  title: "Sign in — Data & AI Academy",
  description: "Sign in to your Data & AI Academy account.",
};

export default function SignInPage() {
  return (
    <AuthScreen
      eyebrow="Your account"
      title="Sign in"
      lead="Welcome back. Sign in to see your programmes, orders and profile."
      footer={
        <>
          New to the Academy?{" "}
          <Link
            href="/register"
            className="font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm />
    </AuthScreen>
  );
}
