import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { landingPathFor } from "@/modules/identity/roles.repository";
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
  searchParams: Promise<{ "return-to"?: string; reset?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const requested = params["return-to"];
  const returnTo = safeReturnTo(requested);
  // An explicit, accepted return path always wins; without one, the landing
  // page depends on the person's roles (founder direction 2026-09-27: an
  // administrator lands on the admin dashboard, everyone else on /account).
  const explicit = typeof requested === "string" && returnTo === requested;
  const user = await getCurrentUser();
  if (user) redirect(explicit ? returnTo : landingPathFor(user.roles));
  return (
    <AuthScreen
      eyebrow="Your account"
      title="Sign in"
      lead="Welcome back. Sign in to see your trainings, orders and profile."
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
      <SignInForm returnTo={explicit ? returnTo : null} passwordWasReset={params.reset === "1"} justRegistered={params.registered === "1"} />
    </AuthScreen>
  );
}
