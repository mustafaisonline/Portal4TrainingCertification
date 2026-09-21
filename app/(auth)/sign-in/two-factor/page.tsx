import type { Metadata } from "next";
import { AuthScreen } from "@/shared/chrome/AuthScreen";
import { safeReturnTo } from "@/shared/util/return-to";
import { TwoFactorForm } from "./TwoFactorForm";

/* Second step of sign-in for accounts with two-factor authentication. */
export const metadata: Metadata = { title: "Two-factor code" };

export default async function TwoFactorPage({
  searchParams,
}: {
  searchParams: Promise<{ "return-to"?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthScreen
      eyebrow="Two-factor authentication"
      title="Enter your code"
      lead="Open your authenticator app and enter the six-digit code, or use one of your backup codes."
    >
      <TwoFactorForm returnTo={safeReturnTo(params["return-to"])} />
    </AuthScreen>
  );
}
