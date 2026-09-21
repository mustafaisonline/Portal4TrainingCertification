import type { Metadata } from "next";
import Link from "next/link";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/for-organisations/page.tsx (ADR-045)
 * Changed: `PROGRAMME_TITLE` replaced by the flagship programme's title from the
 * repository; the inert team-enquiry form and the "Not connected yet" line
 * replaced by a CTA to the real enquiry form (/contact-us?kind=organisation);
 * `WireframeNote` dropped; the mockup's own <PublicShell> wrapper dropped
 * (app/(public)/layout.tsx provides it); metadata title shortened.
 */

/**
 * For Organisations (P17 Corporate Overview + team enquiry) — 2026-09-20,
 * founder direction. Team purchase and HRD Corp claiming are core to the
 * model (DR-02 §8) yet every corporate CTA ended at the contact form. This
 * page gives them a home: how a team engagement works, the honest HRD Corp
 * position (nothing is claimable today — /hrd-corp), and the route to a team
 * enquiry. No pricing, client names or claims are invented.
 */
export const metadata: Metadata = {
  title: "For Organisations",
  description: "Train your team: private cohorts, on-site delivery and HRD Corp.",
};

const steps = [
  { n: "01", title: "Tell us about the team", body: "Who they are, what they need to be able to do, and where they are." },
  { n: "02", title: "We shape the engagement", body: "Format, dates and location for your team — a private cohort, online or on-site." },
  { n: "03", title: "Invoice and paperwork", body: "Corporate invoicing and the documentation your finance or HRD Corp claim needs." },
  { n: "04", title: "Delivery and evidence", body: "Live sessions with the trainer, attendance records and completion certificates for each participant." },
];

export default async function ForOrganisationsPage() {
  const programme = await findFlagshipProgramme();

  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-4 text-[var(--color-primary)]">For organisations</p>
          <h1 className="text-display-lg mb-6 max-w-[760px]">Train your team</h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            {programme ? `${programme.title} delivered` : "Delivered"} as a private cohort for your
            organisation — online or at your location.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 py-14">
        <h2 className="text-h1 mb-6">How a team engagement works</h2>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li key={s.n}>
              <Card variant="panel" className="h-full p-5">
                <p className="text-mono mb-2 text-[var(--color-primary)]">{s.n}</p>
                <p className="text-body-lg mb-1 font-medium">{s.title}</p>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">{s.body}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-h1 mb-3">HRD Corp</h2>
            <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
              The trainer is an HRD Corp Accredited Trainer. The Academy&rsquo;s
              organisational registration is in progress, and{" "}
              <strong className="font-medium text-[var(--color-ink)]">
                no programme is currently registered as HRD Corp claimable
              </strong>
              . We will say plainly when that changes.
            </p>
            <Link href="/hrd-corp" className="text-body-sm inline-block py-2 text-[var(--color-primary)] underline underline-offset-4">
              Read the current HRD Corp status →
            </Link>
            <h2 className="text-h1 mb-3 mt-10">Team dashboard</h2>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Organisations will have a dashboard to see their cohort&rsquo;s
              attendance, completion and certificates, and to download the
              evidence pack a claim needs. Not built yet.
            </p>
          </div>
          <div>
            <h2 className="text-h1 mb-3">Team enquiry</h2>
            {/* The mockup's inert form is replaced by the real enquiry form on
                /contact-us, pre-set to an organisation enquiry. */}
            <Button href="/contact-us?kind=organisation">Send enquiry</Button>
          </div>
        </div>
      </section>
    </>
  );
}
