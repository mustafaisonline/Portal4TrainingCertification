import type { Metadata } from "next";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * L02 reframed — My registrations.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/programmes/
 * page.tsx (ADR-045). Changed: server component on the real session; the demo
 * registration list (`useDemoRegistrations`, `SampleTag`) is gone. There is
 * no registrations table yet (a later milestone), so the screen is the
 * wireframe's own empty state, honestly; the button leads to the public
 * schedule, where the real dates will publish.
 */
export const metadata: Metadata = { title: "My registrations" };

export default async function MyRegistrationsPage() {
  await requireUser("/account/programmes");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">My registrations</p>
        <h1 className="text-display">Your registrations</h1>
      </header>
      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-2">You are not registered for a programme yet</h2>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          Register for the programme to see your sessions, materials and certificate here.
        </p>
        <Button href="/schedule">Upcoming dates</Button>
      </Card>
    </div>
  );
}
