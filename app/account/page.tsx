import { redirect } from "next/navigation";
import { requireUser } from "@/modules/identity/session";

/*
 * /account — Milestone 13, founder decision N2 (a), 2026-09-27: the Dashboard
 * tab is gone and the account opens on Profile, the first tab. What the
 * dashboard used to show lives on: open dates → the schedule; the latest
 * order → Orders & receipts; the certificate → Certifications; the "Support
 * the Academy" card → the Profile page; the admin link → the header menu.
 * `requireUser` first, so a signed-out visitor still gets sign-in with
 * `return-to=/account`.
 */
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  await requireUser("/account");
  redirect("/account/profile");
}
