"use client";

import Link from "next/link";
import { useState } from "react";
import { CertificateDocument } from "@/components/certificates/CertificateDocument";
import { SampleBanner } from "@/components/certificates/SampleBanner";
import { StatusChip } from "@/components/certificates/StatusChip";
import { useRegistry, verificationUrl } from "@/components/certificates/records";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatDate, statusOf, toIso } from "@/lib/certificates";

/**
 * Public verification page for ONE certificate — the page the certificate's
 * unique URL opens. Shows the certificate and its LIVE status (active /
 * renewal due / expired), computed from stored dates against today.
 *
 * Data minimisation (PDPA; requirement R-V2): shows only what verification
 * needs — holder name, programme, format, completion / issue / expiry dates,
 * status, ID. No email, country, payment, order or contact detail, ever.
 *
 * An EXPIRED certificate is not removed: the completion remains a fact.
 * The page says the certificate is no longer active, and that the holder
 * did complete the programme (decision D8).
 */
export function VerifyDetail({ id }: { id: string }) {
  const { ready, now, registry } = useRegistry();
  const [copied, setCopied] = useState(false);

  if (!ready || !now) {
    return <div className="min-h-[50vh]" aria-hidden="true" />;
  }
  const cert = registry.find((c) => c.id === id);

  if (!cert) {
    return (
      <Card variant="panel" className="p-6 sm:p-8">
        <h1 className="text-h1 mb-2">No certificate found</h1>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          We found no certificate with this ID. Check the link and try again.
        </p>
        <Button href="/verify">Search certificates</Button>
      </Card>
    );
  }

  const st = statusOf(cert.expiresOn, now);
  const url = verificationUrl(cert.id);
  const sentence =
    st.status === "expired"
      ? `This certificate expired on ${formatDate(cert.expiresOn)}. ${cert.holderName} completed the programme on ${formatDate(cert.completedOn)}, but the certificate is not currently active.`
      : st.status === "renewal-due"
        ? `This certificate is active until ${formatDate(cert.expiresOn)} (${st.days} ${st.days === 1 ? "day" : "days"} left). The holder can renew it to keep it active.`
        : `This certificate is active until ${formatDate(cert.expiresOn)}.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the URL is visible on the page to copy by hand */
    }
  }

  const rows: [string, string][] = [
    ["Holder", cert.holderName],
    ["Programme", cert.programmeTitle],
    ["Format", cert.formatName],
    ["Completed", formatDate(cert.completedOn)],
    ["Issued", formatDate(cert.issuedOn)],
    [st.status === "expired" ? "Expired" : "Active until", formatDate(cert.expiresOn)],
  ];

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/verify"
        className="text-body-sm inline-block self-start py-2 text-[var(--color-primary)] underline underline-offset-4"
      >
        ← Search certificates
      </Link>

      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Certificate verification</p>
        <h1 className="mb-4 text-display">{cert.holderName}</h1>
        <div className="mb-3">
          <StatusChip status={st.status} large />
        </div>
        <p role="status" className="text-body-lg max-w-[62ch] text-[var(--color-ink-quiet)]">
          {sentence}
        </p>
        <p className="text-body-sm mt-2 text-[var(--color-ink-faint)]">
          Checked today, {formatDate(toIso(now))}. Status can change; this page is always current.
        </p>
      </header>

      <SampleBanner />

      <CertificateDocument cert={cert} url={url} />

      <Card variant="panel" className="p-5 sm:p-6">
        <h2 className="text-h1 mb-4">Details</h2>
        <dl className="text-body-sm grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-label mb-1">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          <div className="sm:col-span-2">
            <dt className="text-label mb-1">Certificate ID</dt>
            <dd className="text-mono break-all">{cert.id}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-label mb-1">Verification link</dt>
            <dd className="break-all text-[var(--color-ink-quiet)]">{url}</dd>
          </div>
        </dl>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" type="button" onClick={copy}>
            {copied ? "Link copied" : "Copy link"}
          </Button>
          <Button variant="secondary" type="button" onClick={() => window.print()}>
            Print / Save as PDF
          </Button>
        </div>
        <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
          This certificate records completion of the programme. It is not the
          Academy&rsquo;s earned credential.
        </p>
      </Card>
    </div>
  );
}
