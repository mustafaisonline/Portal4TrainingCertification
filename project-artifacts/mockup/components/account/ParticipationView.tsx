"use client";

import Link from "next/link";
import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  PROGRAMME_TITLE,
  SAMPLE_TRAINER,
  describeRegistration,
  getDeliveryFormat,
  getFlagship,
  getOffering,
} from "@/data/demoParticipant";
import { useDemoRegistrations } from "@/lib/demoRegistrations";

/**
 * Programme participation — one registration: sessions, joining information,
 * supporting materials and certificate of participation. The screen DR-02 §3
 * says the portal is for ("joining information, schedule, roster, attendance,
 * supporting materials"). Not a lesson player.
 *
 * MATERIALS obey DR-02 §5. The names are REAL — the programme's own
 * "included" list (PromptOS Starter Edition, templates, prompt libraries,
 * capstone…) — attached to the programme; there is no content library and
 * nothing here can be "completed" instead of attending. The certificate is
 * the Certificate OF PARTICIPATION only, kept distinct from the earned
 * credential (OQ-21 boundary). Dates are samples. If the demo participant is
 * not registered for this start date, the screen says so and offers the
 * checkout.
 */
export function ParticipationView({ offeringId }: { offeringId: string }) {
  const regs = useDemoRegistrations();
  if (regs === null) return null;

  const offering = getOffering(offeringId);
  const reg = regs.find((r) => r.offeringId === offeringId);
  const course = getFlagship();
  if (!offering || !course) return null;

  const back = (
    <Link
      href="/account/programmes"
      className="text-body-sm inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
    >
      ← My registrations
    </Link>
  );

  if (!reg) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <Card variant="panel" className="p-6 sm:p-8">
          <h1 className="text-h1 mb-2">You are not registered for this start date</h1>
          <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
            {offering.formatName} · {offering.dates}
            <SampleTag />
          </p>
          <Button href="/checkout">Register</Button>
        </Card>
      </div>
    );
  }

  const d = describeRegistration(reg);
  const format = getDeliveryFormat(offering);

  return (
    <div className="flex flex-col gap-8">
      <header>
        {back}
        <div className="mb-3 mt-4 flex flex-wrap gap-2">
          <Chip tone="primary">Registered</Chip>
          <Chip>{offering.formatName}</Chip>
        </div>
        <h1 className="text-display">{PROGRAMME_TITLE}</h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
          Trainer: {SAMPLE_TRAINER} · Registered {reg.placedOn}
          <SampleTag />
        </p>
      </header>

      <Card variant="panel" className="p-6">
        <h2 className="text-h1 mb-4">Schedule</h2>
        <dl className="text-body-sm grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-label mb-1">Dates</dt>
            <dd>
              {offering.dates}
              <SampleTag />
            </dd>
          </div>
          <div>
            <dt className="text-label mb-1">Format</dt>
            <dd>
              {format?.duration} · {format?.schedule}
            </dd>
          </div>
          <div>
            <dt className="text-label mb-1">Total time</dt>
            <dd>{format?.totalTime}</dd>
          </div>
          <div>
            <dt className="text-label mb-1">Attendance</dt>
            <dd className="text-[var(--color-ink-quiet)]">Recorded by the trainer once sessions begin</dd>
          </div>
        </dl>
        <p className="text-body-sm mt-5 text-[var(--color-ink-quiet)]">
          <strong className="font-medium text-[var(--color-ink)]">Joining information.</strong>{" "}
          Emailed to you before the first session, and shown here too.
        </p>
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h1 mb-2">Included with your registration</h2>
        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
          Supporting materials that prepare for, and reinforce, the live
          sessions. They accompany the programme — they do not replace it.
        </p>
        <ul className="text-body-sm flex list-disc flex-col gap-2 pl-5 text-[var(--color-ink-quiet)]">
          {course.included?.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h1 mb-2">Certificate of completion</h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Issued when you complete the programme, with a unique ID and a public
          verification page. It is active for a year and renewed yearly to keep
          it active. It records completion; it is not the Academy&rsquo;s
          earned credential.
        </p>
        <Link
          href="/account/certificate"
          className="text-body-sm -mb-2 mt-1 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
        >
          Your certificate
        </Link>
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h1 mb-2">Order</h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          {reg.orderId} · {d.price?.today} · {d.method.label}
          <SampleTag />
        </p>
        <Link
          href="/account/orders"
          className="text-body-sm -mb-2 mt-1 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
        >
          Orders &amp; receipts
        </Link>
      </Card>

      <WireframeNote>
        Sample data — no session, attendance or download is real.
      </WireframeNote>
    </div>
  );
}
