"use client";

import Link from "next/link";
import { SampleTag } from "@/components/account/SampleTag";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { PROGRAMME_TITLE, describeRegistration } from "@/data/demoParticipant";
import { useDemoRegistrations } from "@/lib/demoRegistrations";

/** L02 reframed — My registrations (wireframe, 2026-09-20). One programme, so
 *  this lists the demo participant's registrations for its start dates —
 *  empty until they register (lib/demoRegistrations.ts). Sample data. */
export default function MyRegistrationsPage() {
  const regs = useDemoRegistrations();
  if (regs === null) return null;
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">My registrations</p>
        <h1 className="text-display">Your registrations</h1>
      </header>
      {regs.length === 0 ? (
        <Card variant="panel" className="p-6 sm:p-8">
          <h2 className="text-h1 mb-2">You are not registered yet</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            Register for the programme to see your sessions, materials and
            certificate here.
          </p>
          <Button href="/account/programme">View the programme</Button>
        </Card>
      ) : (
        <ul className="flex flex-col gap-4">
          {regs.map((reg) => {
            const d = describeRegistration(reg);
            return (
              <li key={reg.orderId}>
                <Link href={`/account/programmes/${reg.offeringId}`} className="block">
                  <Card variant="panel" className="p-5 transition-colors hover:border-[var(--color-primary)] sm:p-6">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Chip tone="primary">Registered</Chip>
                      <Chip>{d.offering?.formatName}</Chip>
                    </div>
                    <p className="text-body-lg font-medium">{PROGRAMME_TITLE}</p>
                    <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
                      {d.offering?.dates}
                      <SampleTag />
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
