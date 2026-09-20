import type { Metadata } from "next";
import Link from "next/link";
import { Field, InertForm, WireframeNote } from "@/components/auth/FormParts";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PROGRAMME_TITLE } from "@/data/demoParticipant";

/**
 * For Organisations (P17 Corporate Overview + team enquiry) — WIREFRAME,
 * 2026-09-20, founder direction. Team purchase and HRD Corp claiming are core
 * to the model (DR-02 §8) yet every corporate CTA ended at the contact form.
 * This page gives them a home: how a team engagement works, the honest HRD
 * Corp position (nothing is claimable today — /hrd-corp), and an inert team
 * enquiry form. No pricing, client names or claims are invented.
 */
export const metadata: Metadata = {
  title: "For Organisations — Data & AI Academy",
  description: "Train your team: private cohorts, on-site delivery and HRD Corp.",
};

const steps = [
  { n: "01", title: "Tell us about the team", body: "Who they are, what they need to be able to do, and where they are." },
  { n: "02", title: "We shape the engagement", body: "Format, dates and location for your team — a private cohort, online or on-site." },
  { n: "03", title: "Invoice and paperwork", body: "Corporate invoicing and the documentation your finance or HRD Corp claim needs." },
  { n: "04", title: "Delivery and evidence", body: "Live sessions with the trainer, attendance records and completion certificates for each participant." },
];

export default function ForOrganisationsPage() {
  return (
    <PublicShell>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-4 text-[var(--color-primary)]">For organisations</p>
          <h1 className="text-display-lg mb-6 max-w-[760px]">Train your team</h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            {PROGRAMME_TITLE} delivered as a private cohort for your
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
            <InertForm aria-describedby="org-status" className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" name="name" autoComplete="name" />
                <Field label="Work email" name="email" type="email" autoComplete="email" inputMode="email" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Organisation" name="organisation" autoComplete="organization" />
                <Field label="Team size" name="size" inputMode="numeric" />
              </div>
              <Field label="Preferred format" name="format" optional hint="Bootcamp, Accelerator, Mastery, or on-site" />
              <div className="flex flex-wrap items-center gap-4">
                <Button type="submit" disabled>
                  Send enquiry
                </Button>
                <p id="org-status" className="text-body-sm text-[var(--color-ink-faint)]">
                  Not connected yet — no backend.
                </p>
              </div>
            </InertForm>
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <WireframeNote>
          Wireframe — no client, price or HRD Corp claim is stated here that
          is not established elsewhere on the portal.
        </WireframeNote>
      </div>
    </PublicShell>
  );
}
