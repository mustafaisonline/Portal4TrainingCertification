"use client";

import { useActionState } from "react";
import { startRenewalAction, type CertificateActionState } from "@/modules/certificates/certificate.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * "Renew for 12 months — <amount>" (M6 plan §3 E4/E5, §5 "Renewal"). The
 * amount shown is the fee in force, read by the SERVER page; the browser
 * posts only the certificate's row id — `startRenewalCheckout` re-reads the
 * fee, re-checks the window and creates the order before redirecting to
 * Stripe Checkout. Refusals (window closed, order pending, payments not
 * configured) come back as sentences here; nothing is charged.
 */

const initial: CertificateActionState = { status: "idle" };

export function RenewForm({ certificateId, label }: { certificateId: string; label: string }) {
  const [state, action, pending] = useActionState(startRenewalAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3" aria-label="Renew this certificate" data-testid="renew-form">
      <input type="hidden" name="certificateId" value={certificateId} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} data-testid="renew-submit">
          {pending ? "Starting payment…" : label}
        </Button>
      </div>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      <p className="text-body-sm text-[var(--color-ink-faint)]">You pay on Stripe&rsquo;s secure page and return here; the extension is applied once the payment is confirmed.</p>
    </form>
  );
}
