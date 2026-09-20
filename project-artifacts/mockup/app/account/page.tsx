"use client";

import Link from "next/link";
import { SampleTag } from "@/components/account/SampleTag";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  PROGRAMME_TITLE,
  SAMPLE_TRAINER,
  demoParticipant,
  describeRegistration,
  getFlagship,
} from "@/data/demoParticipant";
import { useDemoCertificate } from "@/lib/demoCertificate";
import { useDemoRegistrations } from "@/lib/demoRegistrations";
import { formatDate, statusOf } from "@/lib/certificates";
import { StatusChip } from "@/components/certificates/StatusChip";
import { useNow } from "@/lib/useNow";

/**
 * L01 — Participant Dashboard (wireframe, 2026-09-20; reworked the same day
 * for the single-programme / registration flow). Two states:
 *  • NOT REGISTERED (the demo participant starts here): led by an invitation
 *    to view and register for the programme.
 *  • REGISTERED: led by the NEXT SESSION, not a "Continue your lesson" card —
 *    DR-02 reframing of L01: the live session is the product.
 * Client component because the state lives in the demo session
 * (lib/demoRegistrations.ts). All dates/orders are sample data.
 */
export default function DashboardPage() {
  const regs = useDemoRegistrations();
  const cert = useDemoCertificate();
  const now = useNow();
  const course = getFlagship();
  if (regs === null || !course) return null;

  const latest = regs[regs.length - 1];
  const d = latest ? describeRegistration(latest) : undefined;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Dashboard</p>
        <h1 className="text-display">Welcome, {demoParticipant.name}</h1>
      </header>

      {d && latest ? (
        <Card variant="feature" className="p-5! sm:p-8!">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Your next session <SampleTag />
          </p>
          <h2 className="text-h1 mb-1">{PROGRAMME_TITLE}</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            {d.offering?.formatName} · starts {d.offering?.startsOn}
          </p>
          <dl className="text-body-sm mb-6 grid gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <dt className="text-label mb-1">Schedule</dt>
              <dd>{d.format?.schedule}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Trainer</dt>
              <dd>{SAMPLE_TRAINER}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Joining</dt>
              <dd className="text-[var(--color-ink-quiet)]">Emailed before the first session</dd>
            </div>
          </dl>
          <Button href={`/account/programmes/${latest.offeringId}`}>View my registration</Button>
        </Card>
      ) : (
        <Card variant="feature" className="p-5! sm:p-8!">
          <p className="text-label mb-3 text-[var(--color-primary)]">Get started</p>
          <h2 className="text-h1 mb-2">{PROGRAMME_TITLE}</h2>
          <p className="text-body-sm mb-6 max-w-[60ch] text-[var(--color-ink-quiet)]">
            {course.valueProposition}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/account/programme">View the programme</Button>
            <Button variant="secondary" href="/checkout">
              Register now
            </Button>
          </div>
        </Card>
      )}

      <section aria-labelledby="dash-regs">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="dash-regs" className="text-h1">
            Your registrations
          </h2>
          <Link
            href="/account/programmes"
            className="text-body-sm inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
          >
            View all
          </Link>
        </div>
        {regs.length === 0 ? (
          <p className="text-body-sm text-[var(--color-ink-faint)]">
            You are not registered for a programme yet.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {regs.map((reg) => {
              const x = describeRegistration(reg);
              return (
                <li key={reg.orderId}>
                  <Link href={`/account/programmes/${reg.offeringId}`} className="block h-full">
                    <Card variant="panel" className="h-full p-5 transition-colors hover:border-[var(--color-primary)]">
                      <div className="mb-3">
                        <Chip tone="primary">Registered</Chip>
                      </div>
                      <p className="text-body-lg font-medium">{PROGRAMME_TITLE}</p>
                      <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
                        {x.offering?.formatName} · {x.offering?.dates}
                        <SampleTag />
                      </p>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="panel" className="p-5">
          <h2 className="text-h1 mb-3">Latest order</h2>
          {latest ? (
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              {latest.orderId} · {latest.placedOn} · Paid
              <SampleTag />
            </p>
          ) : (
            <p className="text-body-sm text-[var(--color-ink-faint)]">No orders yet.</p>
          )}
          <Link
            href="/account/orders"
            className="text-body-sm -mb-2 mt-1 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
          >
            Orders &amp; receipts
          </Link>
        </Card>
        <Card variant="panel" className="p-5">
          <h2 className="text-h1 mb-3">Your certificate</h2>
          {cert && now ? (
            <>
              <div className="mb-2">
                <StatusChip status={statusOf(cert.expiresOn, now).status} />
              </div>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">
                Active until {formatDate(cert.expiresOn)}
                <SampleTag />
              </p>
            </>
          ) : (
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Issued when you complete the programme.
            </p>
          )}
          <Link
            href="/account/certificate"
            className="text-body-sm -mb-2 mt-1 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
          >
            {cert ? "View certificate" : "About the certificate"}
          </Link>
        </Card>
        <Card variant="panel" className="p-5">
          <h2 className="text-h1 mb-3">Your capability</h2>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            See where you stand across the five capability areas.
          </p>
          <Link
            href="/account/skills"
            className="text-body-sm -mb-2 mt-1 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
          >
            Skills profile
          </Link>
        </Card>
      </div>
    </div>
  );
}
