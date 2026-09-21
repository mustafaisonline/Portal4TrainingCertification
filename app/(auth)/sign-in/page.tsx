import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/identity/session";
import { AuthScreen } from "@/shared/chrome/AuthScreen";
import { safeReturnTo } from "@/shared/util/return-to";
import { SignInForm } from "./SignInForm";

/*
 * S01 — Sign in. Structure and copy PORTED 2026-09-21 from
 * project-artifacts/mockup/app/sign-in/page.tsx. The demo-account form
 * (components/auth/SignInForm.tsx, lib/demoSession.ts) was NOT ported —
 * NEVER-PORT list. `return-to` is validated server-side to a same-site path.
 */
export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Data & AI Academy account.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ "return-to"?: string; reset?: string }>;
}) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params["return-to"]);
  if (await getCurrentUser()) redirect(returnTo);
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
            className="inline-block py-2 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
          >
            Create an account
          </Link>
        </>
      }
    >
      <SignInForm returnTo={returnTo} passwordWasReset={params.reset === "1"} />
    </AuthScreen>
  );
}
