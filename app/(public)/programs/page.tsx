import type { Metadata } from "next";
import { listPublishedProgrammesWithPrices } from "@/modules/catalogue/programmes/repository";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { formatIdsWithoutOpenDate } from "@/modules/commerce/interest.repository";
import { enabledSupportSetting } from "@/modules/commerce/support.repository";
import { contactUsHref } from "@/content/contact";
import { HRD_CLAIM_NOTE } from "@/content/hrd-corp";
import { TrainingTile } from "@/shared/marketing/TrainingTile";
import { HrdCorpSections } from "@/shared/marketing/HrdCorpSections";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * /programs — "Professional Trainings" (renamed 2026-09-28, twice in one
 * day: "Trainings & HRD Corp" → "Paid Trainings" in the morning, then
 * "Paid Trainings" → "Professional Trainings" in the founder's "New change"
 * item 4, which also moved the header item next to Free Certifications; the
 * page was merged here 2026-09-27, Milestone 14 Phase 1, founder decision
 * P16 — /hrd-corp redirects to #hrd-corp here). Lists every PUBLISHED
 * programme in `sortOrder` (Learn Vibe Coding first, the flagship second —
 * the founder's order, set in the seed), read through the catalogue
 * repository (ADR-023: nothing here knows a slug, title or price). Each
 * card links to /programs/<slug>; an unlisted programme is absent here and
 * 404s there. Below the cards: the HRD Corp sections
 * (src/shared/marketing/HrdCorpSections.tsx).
 *
 * MERGED 2026-09-28 (founder: "merge content of For Organisation and Paid
 * Trainings into Paid Trainings page. Remove 'For Organisation' dedicated
 * page and menu items from everywhere. On this page, we need to give offer
 * same trainings to Individual, Organisations and lets add Education
 * sector as well.") — the "Who this is for" section below, the team
 * engagement steps and the team enquiry CTA are carried over from the
 * retired app/(public)/for-organisations/page.tsx (content unchanged
 * except as noted); /for-organisations now redirects here.
 *
 * No dates or capacity — scheduled offerings live on /schedule.
 */

export const metadata: Metadata = {
  title: "Professional Trainings",
  description:
    "Expert-led trainings, delivered face-to-face and live online, each with its own Certificate of Completion — for individuals, organisations and education, with an honest account of what our trainer's HRD Corp accreditation means.",
};

export const dynamic = "force-dynamic";

const teamSteps = [
  { n: "01", title: "Tell us about the team", body: "Who they are, what they need to be able to do, and where they are." },
  { n: "02", title: "We shape the engagement", body: "Format, dates and location for your team — a private cohort, online or on-site." },
  { n: "03", title: "Invoice and paperwork", body: `Corporate invoicing and the documentation your finance or HRD Corp claim needs. ${HRD_CLAIM_NOTE}` },
  { n: "04", title: "Delivery and evidence", body: "Live sessions with the trainer, attendance records and completion certificates for each participant." },
];

const audiences = [
  { label: "Individuals", body: "Register yourself for any training above, at the individual price for your region." },
  { label: "Organisations", body: "The same trainings as a private cohort for your team — on-site or live online, invoiced to your organisation." },
  { label: "Education", body: "Schools, colleges and universities: we offer a special discount for the education sector. Contact us for it." },
];

export default async function TrainingsPage() {
  const [programmes, support] = await Promise.all([listPublishedProgrammesWithPrices(), enabledSupportSetting()]);
  // The tile's graph: which pace formats have no open date yet (one query for the whole list).
  const noDate = await formatIdsWithoutOpenDate(programmes.flatMap((p) => p.deliveryFormats.map((f) => f.id)));

  return (
    <>
      {/* ===== Hero ===== `night hero-band` is the dark navy hero. */}
      <section className="night hero-band relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 80% at 80% 20%, rgba(47,95,224,0.12), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Professional Trainings</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]">Trainings</h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            Expert-led trainings, delivered face-to-face and live online, each
            with its own Certificate of Completion.{" "}
            <a href="#hrd-corp" className="font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]">
              About HRD Corp ↓
            </a>
          </p>
          {/* Founder, 2026-09-30 (M8): the sentence wherever HRD Corp is mentioned. */}
          <p className="text-body-sm mt-3 max-w-[640px] text-[var(--color-ink-quiet)]" data-testid="programs-hrd-note">
            {HRD_CLAIM_NOTE}
          </p>
        </div>
      </section>

      {/* ===== The trainings ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        {programmes.length === 0 ? (
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            No training is published yet.
          </p>
        ) : (
          <ol
            data-testid="trainings-list"
            className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {programmes.map((p) => (
              <li key={p.slug} className="min-w-0">
                <TrainingTile course={p} noDate={noDate} />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ===== Who this is for (merged from For Organisations, 2026-09-28) ===== */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]" data-testid="who-this-is-for">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">Who this is for</p>
          <h2 className="text-h1 mb-6">The same trainings, three ways</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {audiences.map((a) => (
              <Card key={a.label} variant="panel" className="h-full p-5">
                <p className="text-body-lg mb-1 font-medium">{a.label}</p>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">{a.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How a team engagement works (merged from For Organisations) ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-14" id="for-organisations">
        <h2 className="text-h1 mb-6">How a team engagement works</h2>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {teamSteps.map((s) => (
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

      {/* ===== HRD Corp (merged here 2026-09-27) ===== */}
      <HrdCorpSections />

      {/* ===== Team dashboard + enquiry (merged from For Organisations) ===== */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-6 py-14 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="text-h1 mb-3">Team dashboard</h2>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Organisations will have a dashboard to see their cohort&rsquo;s attendance, completion and certificates, and to
              download the evidence pack a claim needs. Not built yet.
            </p>
          </div>
          <div>
            <h2 className="text-h1 mb-3">Team or education enquiry</h2>
            {/* Founder, 2026-09-29: no contact form — the enquiry is an email
                with the subject pre-set. */}
            <Button href={contactUsHref({ kind: "organisation" })}>Contact our team</Button>
          </div>
        </div>
      </section>

      {/* ===== Support the Academy (2026-09-27, M5) — shown only while the setting is enabled ===== */}
      {support ? (
        <section className="border-t border-[var(--color-line)] bg-[var(--color-ground)]" data-testid="programs-support">
          <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-10">
            <div>
              <p className="text-label mb-1 text-[var(--color-primary)]">Support</p>
              <h2 className="text-h1 mb-1">{support.label}</h2>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">Like what we do? A one-off {formatMoney(support.amountMinor, support.currency)} by card helps keep the free material free. Nothing is unlocked.</p>
            </div>
            <Button variant="secondary" href="/support">
              Support the Academy
            </Button>
          </div>
        </section>
      ) : null}

      {/* ===== Closing CTA row ===== */}
      {/* Founder, 2026-09-28 ("New change" item 1): the free diagnostic's only
          entry point is the home page's own band, so the "Take the free
          diagnostic" button that sat here is gone. */}
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-12">
          <div>
            <h2 className="text-h1 mb-1">Training for a team?</h2>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              The same trainings, delivered for your organisation or institution.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="#for-organisations">See how team delivery works</Button>
          </div>
        </div>
      </section>
    </>
  );
}
