import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AccountFrame } from "@/components/account/AccountFrame";
import { PublicShell } from "@/components/PublicShell";

/**
 * Signed-in area — WIREFRAME, 2026-09-20, founder direction. Everything
 * under /account renders sample data for the DEMO session
 * (lib/demoSession.ts, data/demoParticipant.ts). See those files' headers,
 * docs/SITE_PAGES.md ("Signed-in wireframes") and
 * docs/MOCK_DATA_REGISTER.md before reusing anything here.
 *
 * Screen set follows DR-02 §3 (the portal supports live delivery; it is not
 * where learning happens): dashboard, programme participation, orders,
 * skills, profile. Deliberately absent: lesson player, AI tutor, learning
 * paths, community, content library — retired/deferred by DR-02 — and
 * "My credentials", because Certification is paused (founder, 2026-09-06).
 */

export const metadata: Metadata = {
  title: "My account — Data & AI Academy",
  description: "Your programmes, orders and profile (demo wireframe).",
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell>
      <AccountFrame>{children}</AccountFrame>
    </PublicShell>
  );
}
