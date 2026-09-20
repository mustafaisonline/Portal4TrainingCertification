import Link from "next/link";
import { notFound } from "next/navigation";
import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import {
  SAMPLE_TRAINER,
  getRegistration,
  registrations,
  withCourse,
} from "@/data/demoParticipant";

/**
 * Programme participation (wireframe, 2026-09-20) — one registration: its
 * sessions, joining information, supporting materials and (once attended)
 * certificate of participation. This is the screen DR-02 §3 says the
 * portal is for: "joining information, schedule, roster, attendance,
 * supporting materials". Not a lesson player.
 *
 * MATERIALS obey DR-02 §5: attached to the programme, they prepare for or
 * reinforce the live sessions — there is no content library and nothing
 * here can be "completed" instead of attending. The certificate is the
 * Certificate OF PARTICIPATION only, kept distinct from the earned
 * credential (OQ-21 boundary). Every date/time is a sample.
 */

export function generateStaticParams() {
  return registrations.map((r) => ({ id: r.id }));
}

export default async function ProgrammeParticipationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reg = getRegistration(id);
  if (!reg) notFound();
  const { course } = withCourse(reg);
  if (!course) notFound();
  const done = reg.status === "completed";

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link
          href="/account/programmes"
          className="text-body-sm text-[var(--color-primary)] underline underline-offset-4"
        >
          ← My programmes
        </Link>
        <div className="mb-3 mt-4 flex flex-wrap gap-2">
          <Chip tone={done ? "neutral" : "primary"}>{done ? "Completed" : "Upcoming"}</Chip>
          <Chip>{course.level}</Chip>
          <Chip>{reg.format}</Chip>
        </div>
        <h1 className="text-display">{course.title}</h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
          Trainer: {SAMPLE_TRAINER} · Registered {reg.registeredOn}
          <SampleTag />
        </p>
      </header>

      <Card variant="panel" className="p-6">
        <h2 className="text-h1 mb-4">Sessions</h2>
        <ul className="flex flex-col">
          {reg.sessions.map((s) => (
            <li
              key={s.label}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-[var(--color-line)] py-3 first:border-t-0 first:pt-0"
            >
              <span className="text-body-sm font-medium">{s.label}</span>
              <span className="text-body-sm text-[var(--color-ink-quiet)]">
                {s.date} · {s.time}
                <SampleTag />
              </span>
              <span className="text-label">{done ? "Attended" : "Registered"}</span>
            </li>
          ))}
        </ul>
        {!done && (
          <p className="text-body-sm mt-4 text-[var(--color-ink-quiet)]">
            <strong className="font-medium text-[var(--color-ink)]">Joining information.</strong>{" "}
            The joining link is emailed to you before the first session and
            will appear here too.
          </p>
        )}
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h1 mb-2">Supporting materials</h2>
        <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
          Materials to prepare for, and reinforce, the live sessions. They
          accompany the programme — they do not replace it.
        </p>
        <ul className="flex flex-col">
          {reg.materials.map((m) => (
            <li
              key={m.title}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-[var(--color-line)] py-3 first:border-t-0 first:pt-0"
            >
              <span className="text-body-sm">
                {m.title} <span className="text-[var(--color-ink-faint)]">· {m.kind}</span>
              </span>
              <span className="text-body-sm text-[var(--color-ink-faint)]">
                {m.availability}
                <SampleTag />
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h1 mb-2">Certificate of participation</h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          {done
            ? "Issued after attending the programme. This records attendance; it is not the Academy's earned credential."
            : "Issued after you attend the programme. It records attendance; it is not the Academy's earned credential."}
          {done && <SampleTag />}
        </p>
      </Card>

      <WireframeNote>
        Sample data — no downloads exist, and no session or attendance is real.
      </WireframeNote>
    </div>
  );
}
