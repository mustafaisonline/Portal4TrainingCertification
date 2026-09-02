import type { Metadata } from "next";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ImageFrame } from "@/components/ImageFrame";
import { practitioners } from "@/data/practitioners";
import { programmes } from "@/data/programmes";

/**
 * About — added 2026-09-02 by founder direction.
 *
 * EVERY positioning claim on this page is taken from an approved source,
 * not written fresh: DR-02 §1 (organisation identity, and the "we are /
 * we are not" lists), §2 (delivery forms), §6 (certification
 * relationship) and §7 (the expert model). Nothing about scale, history,
 * client names, team size, founding date, revenue or accreditation is
 * stated, because none of that is established anywhere approved and none
 * of it may be invented.
 *
 * The page ends on the honest current state (State A: no confirmed public
 * inventory, founder-led delivery) rather than implying an operating
 * institution that does not yet exist.
 */

export const metadata: Metadata = {
  title: "About — Data & AI Academy",
  description:
    "An independent professional training and certification organisation for data and AI capability, built on expert-led delivery.",
};

/** DR-02 §1, verbatim in substance. The negative list is as load-bearing as
 *  the positive one — it is what keeps the model from drifting back to a
 *  course marketplace. */
const weAre = [
  "Independent",
  "Focused on data and AI capability",
  "Expert-led",
  "Practitioner-informed",
  "Live and human-centred",
  "Practical and applied",
  "Assessment-driven",
];
const weAreNot = [
  "A mass online course marketplace",
  "A video-first learning platform",
  "A self-paced content library",
  "A generic LMS",
  "A professional association replica",
  "A consulting firm that also trains",
];

export default function AboutPage() {
  const founder = practitioners[0];

  return (
    <PublicShell>
      {/* ===== Hero ===== */}
      <section className="night relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-4 text-[var(--color-primary)]">About us
          </p>
          <h1 className="text-display-lg mb-6 max-w-[860px]">
            An independent training and certification organisation for data
            and AI
          </h1>
          <p className="text-body-lg max-w-[680px] text-[var(--color-ink-quiet)]">
            Our core value comes from expert practitioners and expert-led
            delivery — live online, face-to-face, and through tailored
            corporate engagements. Digital resources support that learning.
            They are not a substitute for it.
          </p>
        </div>
      </section>

      {/* ===== Why this exists ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          <div className="max-w-[560px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Why this exists
            </p>
            <h2 className="text-display mb-5">
              Certificates are easy to get. Capability is not.
            </h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              Data and AI training has become abundant and, in the process,
              largely unaccountable. A recorded course can be finished without
              being understood, and a certificate of completion says only that
              a video reached its end.
            </p>
            <p className="text-body-lg text-[var(--color-ink-quiet)]">
              We built this the other way round. Programmes are taught live by
              someone who has done the work in real organisations, and the
              credential is earned through assessed applied work — judged by a
              qualified assessor against a published rubric, with written
              reasoning the candidate can read.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:pt-12">
            <Card variant="panel" className="border border-[var(--color-line)]">
              <p className="text-label mb-4 text-[var(--color-primary)]">
                We are
              </p>
              <ul className="flex flex-col gap-2.5">
                {weAre.map((item) => (
                  <li
                    key={item}
                    className="text-body-sm leading-snug text-[var(--color-ink-quiet)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
            {/* The negative list is deliberately given equal weight — it is
                the clearest statement of what this is, and the thing most
                often assumed wrongly. */}
            <Card variant="panel" className="border border-[var(--color-line)]">
              <p className="text-label mb-4">We are not</p>
              <ul className="flex flex-col gap-2.5">
                {weAreNot.map((item) => (
                  <li
                    key={item}
                    className="text-body-sm leading-snug text-[var(--color-ink-faint)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== What we hold ourselves to ===== */}
      <section className="night">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            What we hold ourselves to
          </p>
          <h2 className="text-display mb-5 max-w-[720px]">
            Four commitments, and each one costs us something
          </h2>
          <p className="text-body-lg mb-12 max-w-[640px] text-[var(--color-ink-quiet)]">
            These are constraints, not slogans. Each is a thing we have chosen
            not to do, because doing it would make the credential worth less.
          </p>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                t: "Live means live",
                b: "Every session is real-time and interactive. We do not sell recordings as though they were teaching.",
              },
              {
                t: "Taught by practitioners",
                b: "Programmes are delivered by people who have built these systems in real organisations — and who can be checked.",
              },
              {
                t: "The credential is earned",
                b: "Assessed applied work against a published rubric. Attendance alone never earns it.",
              },
              {
                t: "We say what is not true yet",
                b: "No invented dates, cohort numbers, client logos or testimonials. If something does not exist, this portal says so.",
              },
            ].map(({ t, b }, i) => (
              <div
                key={t}
                className="border-t-2 border-[var(--color-primary)]/60 pt-5"
              >
                <p className="text-mono text-body-sm mb-3 text-[var(--color-ink-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-h2 mb-2">{t}</h3>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">{b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Who is behind it ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div className="max-w-[560px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Who is behind it
            </p>
            <h2 className="text-display mb-5">Founder-led, and openly so</h2>
            <p className="text-body-lg mb-4 text-[var(--color-ink-quiet)]">
              {/* headline is used verbatim — an earlier .toLowerCase() here
                  turned "AI" into "ai". Never case-fold copy that contains
                  initialisms. */}
              The Academy was founded by {founder.name} — {founder.headline},
              with {founder.experienceLine.split("·")[0].trim()} of enterprise
              delivery across banking, energy, telecom and government.
            </p>
            <p className="text-body-sm mb-8 text-[var(--color-ink-quiet)]">
              Today he designs and delivers the programmes himself. As the
              practitioner network grows, trainers will be introduced on the
              trainers page — only ever real people, with records you can
              verify independently. There are no placeholder profiles.
            </p>
            <Button variant="secondary" href="/trainers">
              Meet the trainers
            </Button>
          </div>
          <ImageFrame
            subject="The founder teaching — a real session, not a portrait"
            ratio="3 / 2"
            minWidth={1600}
            note="consent required"
          />
        </div>
      </section>

      {/* ===== Where we are today — the honest close ===== */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto max-w-[1280px] px-6 py-16 text-center">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            Where we are today
          </p>
          <h2 className="text-display mb-5">
            {programmes.length} programmes designed. The first dates are being
            prepared.
          </h2>
          <p className="text-body-lg mx-auto mb-9 max-w-[620px] text-[var(--color-ink-quiet)]">
            Public schedules are not published yet. When they are, they will be
            real dates for real programmes — a small, genuine schedule rather
            than a padded catalogue. Everything on this portal follows the same
            rule.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/programmes">Explore programmes</Button>
            <Button variant="secondary" href="/contact">
              Talk to us
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
