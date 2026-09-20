import type { Metadata } from "next";
import { CheckoutFlow } from "@/components/account/CheckoutFlow";
import { PublicShell } from "@/components/PublicShell";

/**
 * Checkout / registration — WIREFRAME, 2026-09-20 (founder direction), then
 * REWORKED the same day: it now checks out THE programme, in a currency and
 * with a payment method the participant chooses, and simulates a confirmed
 * payment inside the demo session. All behaviour, the reasons for what is and
 * is not drawn, and the warnings live in components/account/CheckoutFlow.tsx —
 * read its header before changing anything. Signed-out visitors see a
 * sign-in gate that returns them here.
 */

export const metadata: Metadata = {
  title: "Register — Data & AI Academy",
  description: "Choose your start date, currency and payment method.",
};

export default function CheckoutPage() {
  return (
    <PublicShell>
      <CheckoutFlow />
    </PublicShell>
  );
}
