import type { Metadata } from "next";
import { AuthScreen } from "@/shared/chrome/AuthScreen";
import { Button } from "@/shared/ui/Button";
import { SignOut } from "./SignOut";

/*
 * Sign out. Structure and copy PORTED 2026-09-21 from
 * project-artifacts/mockup/app/sign-out/page.tsx. Unlike the wireframe, this
 * page performs the sign-out: the server-side session row is deleted
 * (Better Auth), so the cookie is dead everywhere, then the confirmation
 * below is shown.
 */
export const metadata: Metadata = {
  title: "Signed out",
  description: "You have been signed out of your Data & AI Academy account.",
};

export default function SignOutPage() {
  return (
    <AuthScreen eyebrow="Signed out" title="You have been signed out" lead="Your session has ended on this device.">
      <div className="flex flex-col items-center gap-6 text-center">
        <SignOut />
        <span
          aria-hidden="true"
          className="grid h-14 w-14 place-items-center rounded-full bg-[var(--color-ground-tint)] text-[var(--color-primary)]"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
            <path
              d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14.5 8.5 18 12l-3.5 3.5M18 12H9.5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="text-body-sm max-w-[38ch] text-[var(--color-ink-quiet)]">
          If you are using a shared or public computer, close the browser window as well.
        </p>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href="/sign-in">Sign in again</Button>
          <Button variant="secondary" href="/">
            Back to home
          </Button>
        </div>
      </div>
    </AuthScreen>
  );
}
