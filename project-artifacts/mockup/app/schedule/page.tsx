import type { Metadata } from "next";
import { SampleTag } from "@/components/account/SampleTag";
import { RegisterInterestButton } from "@/components/account/RegisterInterestButton";
import { WireframeNote } from "@/components/auth/FormParts";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { PROGRAMME_TITLE, getDeliveryFormat, offerings } from "@/data/demoParticipant";

/**
 * Schedule / upcoming dates (P24 Scheduled Offerings) — WIREFRAME, 2026-09-20,
 * founder direction ("add these as sections or pages … data we will add
 * later"). Shows how dated offerings with seat availability and a waitlist
 * will appear. ⚠ Every date and seat count is a SAMPLE (data/demoParticipant.ts
 * offerings; seat numbers below are illustrative literals) — no real offering
 * exists (DR-02 §4.1, HD-7). "Join waitlist" is inert.
 */
export const metadata: Metadata = {
  title: "Schedule — Data & AI Academy",
  description: "Upcoming programme dates, formats and seat availability.",
};

const sampleSeats: Record<string, { total: number; left: number }> = {
  bootcamp: { total: 16, left: 5 },
  accelerator: { total: 12, left: 0 },
  mastery: { total: 20, left: 14 },
};

export default function SchedulePage() {
  return (
    <PublicShell>
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">Schedule</p>
          <h1 className="mb-3 text-display">Upcoming dates</h1>
          <p className="text-body-lg mb-8 max-w-[60ch] text-[var(--color-ink-quiet)]">
            {PROGRAMME_TITLE}, delivered live. Choose the format that fits
            your week.
          </p>
          <ul className="flex flex-col gap-4">
            {offerings.map((o) => {
              const f = getDeliveryFormat(o);
              const seats = sampleSeats[o.id];
              const full = seats.left === 0;
              return (
                <li key={o.id}>
                  <Card variant="panel" className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap gap-2">
                          {f?.badge && <Chip tone="primary">{f.badge}</Chip>}
                          <Chip>Live online</Chip>
                          <Chip tone={full ? "neutral" : "primary"}>
                            {full ? "Full — waitlist open" : `${seats.left} of ${seats.total} seats left`}
                          </Chip>
                        </div>
                        <p className="text-body-lg font-medium">{o.formatName}</p>
                        <p className="text-body-sm text-[var(--color-ink-quiet)]">
                          {o.dates}
                          <SampleTag />
                        </p>
                        <p className="text-body-sm text-[var(--color-ink-faint)]">
                          {f?.duration} · {f?.schedule} · {f?.totalTime}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {full ? (
                          <Button variant="secondary" type="button" disabled>
                            Join waitlist
                          </Button>
                        ) : (
                          <RegisterInterestButton>Register</RegisterInterestButton>
                        )}
                      </div>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
          <div className="mt-8">
            <WireframeNote>
              Sample dates and seat counts — no public dates are published
              yet. Waitlist is not connected.
            </WireframeNote>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
