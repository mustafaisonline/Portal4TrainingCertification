"use client";

import Link from "next/link";
import { useState } from "react";
import { CertificateDocument } from "@/components/certificates/CertificateDocument";
import { StatusChip } from "@/components/certificates/StatusChip";
import { demoCertificateRecord, verificationUrl } from "@/components/certificates/records";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatFee, RENEWAL_FEE, RENEWAL_WINDOW_DAYS, VALIDITY_MONTHS } from "@/data/certificateConfig";
import {
  clearDemoCertificate,
  demoExpiryIn,
  issueDemoCertificate,
  setDemoExpiry,
  setDemoListed,
  useDemoCertificate,
} from "@/lib/demoCertificate";
import { useDemoRegistrations } from "@/lib/demoRegistrations";
import { canRenew, daysBetween, formatDate, statusOf, toIso } from "@/lib/certificates";
import { useNow } from "@/lib/useNow";

/**
 * The holder's Certificate of Completion — signed-in wireframe, 2026-09-20.
 *
 * States: (1) not registered → explain + link to the programme; (2) registered,
 * not yet complete → explain the certificate and its yearly fee, plus a DEMO
 * control that simulates the completion the real product records server-side;
 * (3) issued → the certificate, live status, share/print, public-listing
 * consent, renewal, and history.
 *
 * Everything time-dependent (issue, "a year passes", renewal) is simulated
 * here in the browser tab — lib/demoCertificate.ts explains why the server
 * must own all of it. The "Demo tools" panel is labelled and dashed for that
 * reason.
 */
export function CertificateView() {
  const regs = useDemoRegistrations();
  const demo = useDemoCertificate();
  const now = useNow();
  const [copied, setCopied] = useState(false);

  if (regs === null || demo === undefined || !now) return null;

  const registered = regs[0];
  const feeText = formatFee();

  // ---- (1) / (2): no certificate yet -------------------------------------
  if (!demo) {
    return (
      <div className="flex flex-col gap-8">
        <header>
          <p className="text-label mb-2 text-[var(--color-primary)]">Certificate</p>
          <h1 className="text-display">Your certificate of completion</h1>
        </header>
        <Card variant="panel" className="p-6 sm:p-8">
          <h2 className="text-h1 mb-3">How it works</h2>
          <ol className="text-body-sm flex list-decimal flex-col gap-2 pl-5 text-[var(--color-ink-quiet)]">
            <li>When you complete the programme you receive a Certificate of Completion with a unique ID and its own web address.</li>
            <li>Anyone can check it on the public verification page and see whether it is active.</li>
            <li>
              It is active for {VALIDITY_MONTHS} months. To keep it active, renew it each year for{" "}
              <strong className="font-medium text-[var(--color-ink)]">{feeText}</strong>.
              The fee may change; you will always see the amount before you pay.
            </li>
          </ol>
          <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
            The certificate records that you completed the programme. It is
            not the Academy&rsquo;s earned credential.
          </p>
        </Card>

        {registered ? (
          <Card variant="panel" className="border-dashed p-6">
            <p className="text-label mb-2">Demo tools</p>
            <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
              In the real product your trainer records that you completed the
              programme and the certificate is issued to you automatically.
              Here, simulate that moment:
            </p>
            <Button type="button" onClick={() => issueDemoCertificate(registered.offeringId)}>
              Simulate completing the programme
            </Button>
          </Card>
        ) : (
          <Card variant="panel" className="p-6">
            <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
              You have not registered for the programme yet.
            </p>
            <Button href="/account/programme">View the programme</Button>
          </Card>
        )}
        <WireframeNote>Demo only — no certificate has been or can be issued.</WireframeNote>
      </div>
    );
  }

  // ---- (3): certificate issued -------------------------------------------
  const cert = demoCertificateRecord(demo);
  const st = statusOf(cert.expiresOn, now);
  const url = verificationUrl(cert.id);
  const renewable = canRenew(cert.expiresOn, now);
  const daysToOpen = Math.max(0, daysBetween(toIso(now), cert.expiresOn) - RENEWAL_WINDOW_DAYS);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the URL is shown on the page to copy by hand */
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Certificate</p>
        <h1 className="mb-4 text-display">Your certificate of completion</h1>
        <div className="mb-3">
          <StatusChip status={st.status} large />
        </div>
        <p role="status" className="text-body-sm max-w-[62ch] text-[var(--color-ink-quiet)]">
          {st.status === "expired"
            ? `Expired on ${formatDate(cert.expiresOn)}. It no longer shows as active. Renew it for ${feeText} to reactivate it.`
            : st.status === "renewal-due"
              ? `Active until ${formatDate(cert.expiresOn)} — ${st.days} ${st.days === 1 ? "day" : "days"} left. Renew now for ${feeText} to keep it active.`
              : `Active until ${formatDate(cert.expiresOn)}.`}
        </p>
      </header>

      <CertificateDocument cert={cert} url={url} />

      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </Button>
        <Button variant="secondary" type="button" onClick={copy}>
          {copied ? "Link copied" : "Copy verification link"}
        </Button>
        <Button variant="secondary" href={`/verify/${cert.id}`}>
          View public page
        </Button>
      </div>

      <Card variant="panel" className="p-5 sm:p-6">
        <h2 className="text-h1 mb-2">Renewal</h2>
        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
          Keep your certificate active with a yearly renewal of{" "}
          <strong className="font-medium text-[var(--color-ink)]">{feeText}</strong>{" "}
          (the fee may change; you see the amount before you pay). It is
          active until {formatDate(cert.expiresOn)}. Renewal opens{" "}
          {RENEWAL_WINDOW_DAYS} days before expiry.
        </p>
        {renewable ? (
          <Button href="/account/certificate/renew">Renew for {feeText}</Button>
        ) : (
          <>
            <Button type="button" disabled>
              Renew for {feeText}
            </Button>
            <p className="text-body-sm mt-3 text-[var(--color-ink-faint)]">
              Renewal opens in {daysToOpen} {daysToOpen === 1 ? "day" : "days"}.
            </p>
          </>
        )}
        <h3 className="text-label mb-2 mt-6">History</h3>
        <ul className="text-body-sm flex flex-col gap-2 text-[var(--color-ink-quiet)]">
          <li>Issued {formatDate(demo.issuedOn)}</li>
          {demo.renewals.map((r) => (
            <li key={r.on + r.to}>
              Renewed {formatDate(r.on)} · {r.currency} {r.amount} · active until {formatDate(r.to)}
            </li>
          ))}
        </ul>
      </Card>

      <Card variant="panel" className="p-5 sm:p-6">
        <h2 className="text-h1 mb-2">Public listing</h2>
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={demo.listed}
            onChange={(e) => setDemoListed(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
          />
          <span className="text-body-sm">
            <span className="block font-medium">Show my name in public search</span>
            <span className="block text-[var(--color-ink-quiet)]">
              When on, people can find this certificate by searching your
              name. When off, they can still verify it with your certificate
              ID or link — which you choose whom to share with. It shows only
              your name, the programme, the dates and the status.
            </span>
          </span>
        </label>
      </Card>

      <Card variant="panel" className="border-dashed p-5 sm:p-6">
        <p className="text-label mb-2">Demo tools</p>
        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
          In the real product time simply passes and expiry is worked out from
          stored dates. Here, jump the clock to see each state:
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" type="button" onClick={() => setDemoExpiry(demoExpiryIn(14, now))}>
            Renewal due (14 days left)
          </Button>
          <Button variant="secondary" type="button" onClick={() => setDemoExpiry(demoExpiryIn(-1, now))}>
            Expired (yesterday)
          </Button>
          <Button variant="secondary" type="button" onClick={() => setDemoExpiry(demoExpiryIn(300, now))}>
            Active (300 days left)
          </Button>
          <Button variant="secondary" type="button" onClick={clearDemoCertificate}>
            Reset certificate
          </Button>
        </div>
      </Card>

      <p className="text-body-sm text-[var(--color-ink-faint)]">
        Fee today: {formatFee(RENEWAL_FEE)} per year. Anyone can check this
        certificate at the{" "}
        <Link href="/verify" className="text-[var(--color-primary)] underline underline-offset-4">
          public verification page
        </Link>
        .
      </p>
      <WireframeNote>
        Sample data — nothing here is issued, charged or published. No one has
        completed a programme.
      </WireframeNote>
    </div>
  );
}
