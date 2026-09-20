"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CardFieldsPicture, Choice } from "@/components/account/PaymentParts";
import { WireframeNote } from "@/components/auth/FormParts";
import { demoCertificateRecord } from "@/components/certificates/records";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RENEWAL_FEE, formatFee } from "@/data/certificateConfig";
import { paymentMethods, type PaymentMethodKey } from "@/data/demoParticipant";
import { renewDemoCertificate, useDemoCertificate } from "@/lib/demoCertificate";
import { canRenew, formatDate, renewedExpiry, statusOf } from "@/lib/certificates";
import { useNow } from "@/lib/useNow";

/**
 * Certificate renewal payment — WIREFRAME with a SIMULATED payment, 2026-09-20.
 * Same rules as the checkout (components/account/CheckoutFlow.tsx header): no
 * card inputs, no Stripe.js, Pay simulates success in the demo session only
 * and says so. The fee is read from data/certificateConfig.ts (RENEWAL_FEE) —
 * in the real product an admin-managed, effective-dated setting; the amount
 * shown here is what the server must charge and record on the renewal.
 * Renewal is allowed only inside the renewal window or after expiry
 * (lib/certificates.ts `canRenew`).
 */
export function RenewFlow() {
  const demo = useDemoCertificate();
  const now = useNow();
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethodKey>("card");
  const [paying, setPaying] = useState(false);

  if (demo === undefined || !now) return null;
  if (!demo) {
    return (
      <Card variant="panel" className="p-6 sm:p-8">
        <h1 className="text-h1 mb-2">No certificate to renew</h1>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          You do not have a certificate yet.
        </p>
        <Button href="/account/certificate">Go to your certificate</Button>
      </Card>
    );
  }

  const cert = demoCertificateRecord(demo);
  const st = statusOf(cert.expiresOn, now);
  const open = canRenew(cert.expiresOn, now);
  const newExpiry = renewedExpiry(cert.expiresOn, now);
  const fee = formatFee(RENEWAL_FEE);

  function pay() {
    setPaying(true);
    window.setTimeout(() => {
      renewDemoCertificate(method);
      router.push("/account/certificate");
    }, 900);
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link
          href="/account/certificate"
          className="text-body-sm inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
        >
          ← Your certificate
        </Link>
        <h1 className="mt-2 text-display">Renew your certificate</h1>
      </header>

      <Card variant="feature" className="p-5! sm:p-8!">
        <dl className="text-body-sm grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-label mb-1">Certificate</dt>
            <dd className="text-mono break-all">{cert.id}</dd>
          </div>
          <div>
            <dt className="text-label mb-1">Current status</dt>
            <dd>
              {st.status === "expired"
                ? `Expired ${formatDate(cert.expiresOn)}`
                : `Active until ${formatDate(cert.expiresOn)}`}
            </dd>
          </div>
          <div>
            <dt className="text-label mb-1">After renewal, active until</dt>
            <dd>{formatDate(newExpiry)}</dd>
          </div>
          <div>
            <dt className="text-label mb-1">Renewal fee</dt>
            <dd className="text-h1 text-[var(--color-primary)]">{fee}</dd>
          </div>
        </dl>
        <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
          {st.status === "expired"
            ? "Because the certificate has lapsed, the new year starts today."
            : "Renewing before it expires adds a full year to the current expiry date — no time is lost."}{" "}
          The fee may change in future; you always see the amount before you pay.
        </p>
      </Card>

      {!open ? (
        <Card variant="panel" className="p-6">
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            Renewal is not open yet. It opens 30 days before your certificate expires.
          </p>
        </Card>
      ) : (
        <Card variant="panel" className="p-5 sm:p-8">
          <h2 className="text-h1 mb-5">Payment method</h2>
          <div role="radiogroup" aria-label="Payment method" className="flex flex-col gap-3">
            {paymentMethods.map((m) => (
              <Choice
                key={m.key}
                name="renew-method"
                value={m.key}
                checked={method === m.key}
                onChange={() => setMethod(m.key)}
              >
                <span className="text-body-sm block font-medium">{m.label}</span>
                <span className="text-body-sm block text-[var(--color-ink-quiet)]">{m.note}</span>
              </Choice>
            ))}
          </div>
          <div className="mt-5">
            {method === "card" ? (
              <CardFieldsPicture />
            ) : (
              <p
                role="note"
                className="text-body-sm rounded-[var(--radius-plate)] border border-dashed border-[var(--color-line-strong)] px-4 py-4 text-[var(--color-ink-faint)]"
              >
                Illustration — you would be taken to a secure page to complete
                this payment, then returned here.
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-col gap-4">
            <Button type="button" className="w-full" disabled={paying} onClick={pay}>
              {paying ? "Processing (demo)…" : `Pay ${fee} (demo)`}
            </Button>
            <WireframeNote>
              Demo only — no payment will be taken and Stripe is not attached.
              Paying simulates a renewal in this demo session.
            </WireframeNote>
          </div>
        </Card>
      )}
    </div>
  );
}
