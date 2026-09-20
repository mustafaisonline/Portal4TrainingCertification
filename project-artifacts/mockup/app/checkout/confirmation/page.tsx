import type { Metadata } from "next";
import { ConfirmationView } from "@/components/account/ConfirmationView";
import { PublicShell } from "@/components/PublicShell";

/** Simulated payment confirmation — see components/account/ConfirmationView.tsx.
 *  Added 2026-09-20, founder direction. Demo session only. */
export const metadata: Metadata = {
  title: "Registration confirmed — Data & AI Academy",
  description: "Your registration (demo).",
};

export default function ConfirmationPage() {
  return (
    <PublicShell>
      <ConfirmationView />
    </PublicShell>
  );
}
