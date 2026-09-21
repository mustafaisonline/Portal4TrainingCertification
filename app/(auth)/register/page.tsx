import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DOCUMENT_ROUTES, publishedDocuments } from "@/modules/identity/legal-documents";
import { getCurrentUser } from "@/modules/identity/session";
import { AuthScreen } from "@/shared/chrome/AuthScreen";
import { RegisterForm } from "./RegisterForm";

/*
 * S02 — Create account. Structure and copy PORTED 2026-09-21 from
 * project-artifacts/mockup/app/register/page.tsx; the inert form is replaced
 * by a real one. Fields are the identity fields the data architecture names
 * (name, email, country) plus the password — nothing else is collected.
 *
 * The consent control follows the mockup's convention exactly: it is blocked,
 * with the reason shown, until the legal documents are published
 * (legal-documents.ts). The endpoint enforces the same rule server-side.
 */
export const metadata: Metadata = {
  title: "Create an account",
  description: "Create your Data & AI Academy account.",
};

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/account");
  const published = publishedDocuments();
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
      <RegisterForm
        registrationOpen={published !== null}
        documents={Object.values(DOCUMENT_ROUTES)}
      />
    </AuthScreen>
  );
}
