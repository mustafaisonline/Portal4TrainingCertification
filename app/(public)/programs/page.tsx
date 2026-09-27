import type { Metadata } from "next";
import { listPublishedProgrammesWithPrices } from "@/modules/catalogue/programmes/repository";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { regionForCountry } from "@/modules/commerce/pricing";
import { enabledSupportSetting } from "@/modules/commerce/support.repository";
import { getProfile } from "@/modules/identity/profile.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { CourseCard } from "@/shared/marketing/CourseCard";
import { HrdCorpSections } from "@/shared/marketing/HrdCorpSections";
import { Button } from "@/shared/ui/Button";

/*
 * /programs — "Trainings & HRD Corp" (Milestone 14 Phase 1, founder decision
 * P16, 2026-09-27: the Trainings and HRD Corp pages merged; /hrd-corp
 * redirects to #hrd-corp here). Lists every PUBLISHED programme in
 * `sortOrder` (Learn Vibe Coding first, the flagship second — the founder's
 * order, set in the seed), read through the catalogue repository (ADR-023:
 * nothing here knows a slug, title or price). Each card links to
 * /programs/<slug>; an unlisted programme is absent here and 404s there.
 * Below the cards: the HRD Corp sections, copy unchanged from the retired
 * page (src/shared/marketing/HrdCorpSections.tsx).
 *
 * No dates or capacity — scheduled offerings live on /schedule.
 */

export const metadata: Metadata = {
  title: "Trainings & HRD Corp",
  description:
    "Expert-led trainings, delivered face-to-face and live online, each with its own Certificate of Completion — and an honest account of what our trainer's HRD Corp accreditation means.",
};

export const dynamic = "force-dynamic";

export default async function TrainingsPage() {
  const [programmes, support, user] = await Promise.all([listPublishedProgrammesWithPrices(), enabledSupportSetting(), getCurrentUser()]);
  // UX review 2026-09-27 U4: lead each card with the visitor's own fee region.
  const profile = user ? await getProfile(user.id) : null;
  const leadCard = profile?.countryCode ? regionForCountry(profile.countryCode) : "malaysia";

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
          <p className="text-label mb-4 text-[var(--color-primary)]">Trainings &amp; HRD Corp</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]">Trainings</h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            Expert-led trainings, delivered face-to-face and live online, each
            with its own Certificate of Completion.{" "}
            <a href="#hrd-corp" className="font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]">
              About HRD Corp ↓
            </a>
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
            className="grid list-none gap-6 p-0 md:grid-cols-2"
          >
            {programmes.map((p) => (
              <li key={p.slug} className="min-w-0">
                <CourseCard course={p} showAllRegions leadCard={leadCard} />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ===== HRD Corp (merged here 2026-09-27) ===== */}
      <HrdCorpSections />

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
      <section className="border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-6 px-6 py-12">
          <div>
            <h2 className="text-h1 mb-1">Not sure which?</h2>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Ten minutes, free, no account to start.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button href="/free-learning/diagnostic">Take the free diagnostic</Button>
            <Button variant="secondary" href="/for-organisations">
              Training for a team?
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
