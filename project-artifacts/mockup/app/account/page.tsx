import Link from "next/link";
import { SampleTag } from "@/components/account/SampleTag";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  SAMPLE_TRAINER,
  demoParticipant,
  orders,
  registrations,
  withCourse,
} from "@/data/demoParticipant";

/**
 * L01 — Participant Dashboard (wireframe, 2026-09-20). Led by the
 * participant's NEXT SESSION, not a "Continue your lesson" card — DR-02
 * reframing of L01: the live session is the product; the portal supports it.
 * All dates/orders are sample data (data/demoParticipant.ts).
 */
export default function DashboardPage() {
  const upcoming = registrations.filter((r) => r.status === "upcoming");
  const next = upcoming[0] && withCourse(upcoming[0]);
  const last = orders[0];

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Dashboard</p>
        <h1 className="text-display">Welcome, {demoParticipant.name}</h1>
      </header>

      {next?.course && (
        <Card variant="feature" className="p-6 sm:p-8">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Your next session <SampleTag />
          </p>
          <h2 className="text-h1 mb-1">{next.course.title}</h2>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            {next.reg.sessions[0].label} · {next.reg.sessions[0].date} ·{" "}
            {next.reg.sessions[0].time}
          </p>
          <dl className="text-body-sm mb-6 grid gap-x-8 gap-y-3 sm:grid-cols-3">
            <div>
              <dt className="text-label mb-1">Format</dt>
              <dd>{next.reg.format}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Trainer</dt>
              <dd>{SAMPLE_TRAINER}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Joining</dt>
              <dd className="text-[var(--color-ink-quiet)]">
                Link is emailed before the session
              </dd>
            </div>
          </dl>
          <Button href={`/account/programmes/${next.reg.id}`}>
            View programme details
          </Button>
        </Card>
      )}

      <section aria-labelledby="dash-programmes">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="dash-programmes" className="text-h1">
            Your programmes
          </h2>
          <Link
            href="/account/programmes"
            className="text-body-sm text-[var(--color-primary)] underline underline-offset-4"
          >
            View all
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {registrations.map((reg) => {
            const { course } = withCourse(reg);
            if (!course) return null;
            return (
              <li key={reg.id}>
                <Link href={`/account/programmes/${reg.id}`} className="block h-full">
                  <Card variant="panel" className="h-full p-5 transition-colors hover:border-[var(--color-primary)]">
                    <div className="mb-3">
                      <Chip tone={reg.status === "upcoming" ? "primary" : "neutral"}>
                        {reg.status === "upcoming" ? "Upcoming" : "Completed"}
                      </Chip>
                    </div>
                    <p className="text-body-lg font-medium">{course.title}</p>
                    <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
                      {reg.sessions[0].date}
                      <SampleTag />
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card variant="panel" className="p-5">
          <h2 className="text-h1 mb-3">Latest order</h2>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            {last.id} · {last.date} · {last.status}
            <SampleTag />
          </p>
          <Link
            href="/account/orders"
            className="text-body-sm mt-3 inline-block text-[var(--color-primary)] underline underline-offset-4"
          >
            Orders &amp; receipts
          </Link>
        </Card>
        <Card variant="panel" className="p-5">
          <h2 className="text-h1 mb-3">Your capability</h2>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            See where you stand across the five capability areas.
          </p>
          <Link
            href="/account/skills"
            className="text-body-sm mt-3 inline-block text-[var(--color-primary)] underline underline-offset-4"
          >
            Skills profile
          </Link>
        </Card>
      </div>
    </div>
  );
}
