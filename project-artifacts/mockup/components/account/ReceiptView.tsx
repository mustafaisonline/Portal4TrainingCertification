"use client";

import Link from "next/link";
import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PROGRAMME_TITLE, demoParticipant, describeRegistration } from "@/data/demoParticipant";
import { useDemoRegistrations } from "@/lib/demoRegistrations";

/**
 * Receipt — WIREFRAME, 2026-09-20 ("invoices/receipts" from the review). Shows
 * the shape of a receipt. ⚠ The issuer block is deliberately blank-labelled:
 * the legal entity, registration number, address and tax treatment are
 * undecided (B4, B5, A11) and NOT invented. Print uses the same `.print-area`
 * stylesheet as the certificate.
 */
export function ReceiptView({ offeringId }: { offeringId: string }) {
  const regs = useDemoRegistrations();
  if (regs === null) return null;
  const reg = regs.find((r) => r.offeringId === offeringId);
  if (!reg) {
    return (
      <Card variant="panel" className="p-6">
        <h1 className="text-h1 mb-2">No order for this date</h1>
        <Button href="/account/orders">Orders &amp; receipts</Button>
      </Card>
    );
  }
  const d = describeRegistration(reg);
  const rows: [string, string][] = [
    ["Receipt number", `${reg.orderId}-R`],
    ["Date", reg.placedOn],
    ["Billed to", `${demoParticipant.name} · ${demoParticipant.email}`],
    ["Item", `${PROGRAMME_TITLE} — ${d.offering?.formatName} (${d.offering?.dates})`],
    ["Payment method", d.method.label],
    ["Amount paid", `${d.price?.today} (${d.currency.name})`],
    ["Tax", "Not yet determined"],
  ];
  return (
    <div className="flex flex-col gap-6">
      <Link href="/account/orders" className="text-body-sm inline-block self-start py-2 text-[var(--color-primary)] underline underline-offset-4">
        ← Orders &amp; receipts
      </Link>
      <div className="print-area rounded-[var(--radius-panel)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)] pb-5">
          <div>
            <p className="text-label mb-1">Receipt</p>
            <p className="text-h1">Data &amp; AI Academy</p>
            <p className="text-body-sm text-[var(--color-ink-faint)]">
              [Legal entity name] · [Registration no.] · [Address] — to be added
            </p>
          </div>
          <SampleTag />
        </div>
        <dl className="text-body-sm grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-label mb-1">{k}</dt>
              <dd className="break-words">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
      </div>
      <WireframeNote>
        Sample receipt — no payment was taken. Issuer details, receipt
        numbering and tax are not yet decided and are shown as placeholders.
      </WireframeNote>
    </div>
  );
}
