import type { Metadata } from "next";
import { assetPath } from "@/lib/basePath";
import Image from "next/image";
import { PublicShell } from "@/components/PublicShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { ImageFrame } from "@/components/ImageFrame";
import { TrainerAtWorkIllustration } from "@/components/illustrations/DeliveryIllustrations";
import { practitioners } from "@/data/practitioners";

/**
 * Trainers — the P23 Expert Profile surface, redesigned 2026-09-02 by
 * founder direction. The per-trainer profile route (/trainers/[slug]) was
 * retired in the same change, so THIS page is now the whole trainer story
 * and links outward to each trainer's own published profile.
 *
 * Two rules govern what may appear here, and they pull in opposite
 * directions — both are honoured:
 *
 *  1. "Multiple cards" was the founder's instruction: the page must read as
 *     a directory, not a single lonely card.
 *  2. "No placeholder profiles, ghost cards or 'coming soon' profiles —
 *     ever" (DR-02 §7; P01_DESIGN_DECISIONS). No trainer may be invented.
 *
 * Resolved by making the grid genuinely scalable and giving the one unfilled
 * position the SAME visual language as a reserved image slot — ember tint,
 * dashed border, explicitly a slot rather than a person. It names nobody,
 * shows no silhouette, and says in plain words that it is empty and why.
 * Everything else on the page earns its space from real material.
 */

export const metadata: Metadata = {
  title: "Trainers — Data & AI Academy",
  description:
    "The practitioners who design and deliver Data & AI Academy courses.",
};

/** What a trainer must be able to show. Genuine selection criteria, not
 *  marketing claims — each is verifiable about a named individual. */
const standard = [
  {
    title: "Built it, not just taught it",
    body: "Delivery experience in real organisations, at senior level, on systems that went into production.",
  },
  {
    title: "Current in practice",
    body: "Still close to the architectures and decisions being taught — not describing a market they left years ago.",
  },
  {
    title: "Can be checked",
    body: "A public professional record a participant can verify independently, before committing time or budget.",
  },
  {
    title: "Can teach adults",
    body: "Able to answer the room's real situation, not recite a deck — because every session here is live.",
  },
];

export default function TrainersPage() {
  const lead = practitioners[0];
  const others = practitioners.slice(1);
  const accreditation = lead.hrdCorpAccreditation;

  return (
    <PublicShell>
      {/* ===== Hero ===== */}
      <section className="night relative">
        <div className="mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
          <p className="text-label mb-4 text-[var(--color-primary)]">
            Trainers
          </p>
          <h1 className="text-display-lg mb-5 max-w-[720px]">
            The people who actually built this work
          </h1>
          <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">
            Every course is designed and delivered by a practitioner with
            real enterprise delivery behind them — people who have built, led
            and operated data and AI capabilities, not only taught them. This
            is who they are, and how you can check.
          </p>
        </div>
      </section>

      {/* ===== The trainers ===== */}
      <section className="mx-auto max-w-[1280px] px-6 py-16">
        <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4">
          <h2 className="text-display">Who teaches here</h2>
          {/* An honest count, not a boast. It will read differently at n = 6,
              and it should — the number is the point. */}
          <p className="text-mono text-body-sm text-[var(--color-ink-faint)]">
            {practitioners.length} trainer
            {practitioners.length === 1 ? "" : "s"} · founder-led today
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Lead trainer: the full card ───────────────────────── */}
          <Card
            variant="panel"
            className="flex flex-col border border-[var(--color-line)]"
          >
            <div className="mb-5 flex gap-5">
              <Image
                src={assetPath(lead.photo)}
                alt={`Photograph of ${lead.name}`}
                width={800}
                height={800}
                className="h-28 w-28 shrink-0 rounded-[var(--radius-plate)] object-cover"
              />
              <div className="min-w-0">
                <p className="text-h1 mb-1">{lead.name}</p>
                <p className="text-body-sm mb-2 text-[var(--color-ink-quiet)]">
                  {lead.role}
                </p>
                <p className="text-mono text-body-sm text-[var(--color-ink-faint)]">
                  {lead.experienceLine}
                </p>
                <p className="text-body-sm mt-1 text-[var(--color-ink-faint)]">
                  {lead.location}
                </p>
              </div>
            </div>

            <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
              {lead.summary}
            </p>

            <div className="mb-6 flex flex-wrap gap-2">
              {lead.expertise.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
            </div>

            {lead.careerAchievements && (
              <div className="mb-6 border-t border-[var(--color-line)] pt-5">
                <p className="text-label mb-4">Selected delivery</p>
                <dl className="flex flex-col gap-3">
                  {lead.careerAchievements.map((item) => (
                    <div key={item.org}>
                      <dt className="text-body-sm font-semibold">{item.org}</dt>
                      <dd className="text-body-sm leading-snug text-[var(--color-ink-quiet)]">
                        {item.description}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Outbound only — the in-portal profile page was retired, so a
                reader verifies this record on the trainer's own platforms. */}
            <div className="mt-auto flex flex-wrap gap-3 border-t border-[var(--color-line)] pt-5">
              {lead.mediumProfile && (
                <Button
                  href={lead.mediumProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read ${lead.name}'s full profile on Medium (opens in a new tab)`}
                >
                  Read the full profile ↗
                </Button>
              )}
              {lead.linkedin && (
                <Button
                  variant="secondary"
                  href={lead.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${lead.name} on LinkedIn (opens in a new tab)`}
                >
                  LinkedIn ↗
                </Button>
              )}
            </div>
          </Card>

          {/* ── Any further genuine trainers, same treatment as data grows ── */}
          {others.map((person) => (
            <Card
              key={person.slug}
              variant="panel"
              className="flex flex-col border border-[var(--color-line)]"
            >
              <div className="mb-5 flex gap-5">
                <Image
                  src={assetPath(person.photo)}
                  alt={`Photograph of ${person.name}`}
                  width={800}
                  height={800}
                  className="h-28 w-28 shrink-0 rounded-[var(--radius-plate)] object-cover"
                />
                <div className="min-w-0">
                  <p className="text-h1 mb-1">{person.name}</p>
                  <p className="text-body-sm mb-2 text-[var(--color-ink-quiet)]">
                    {person.role}
                  </p>
                  <p className="text-mono text-body-sm text-[var(--color-ink-faint)]">
                    {person.experienceLine}
                  </p>
                </div>
              </div>
              <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
                {person.summary}
              </p>
              <div className="mb-6 flex flex-wrap gap-2">
                {person.expertise.slice(0, 3).map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>
              {(person.mediumProfile ?? person.linkedin) && (
                <div className="mt-auto border-t border-[var(--color-line)] pt-5">
                  <Button
                    href={person.mediumProfile ?? person.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read ${person.name}'s full profile (opens in a new tab)`}
                  >
                    Read the full profile ↗
                  </Button>
                </div>
              )}
            </Card>
          ))}

          {/* ── Reserved position ─────────────────────────────────────
              NOT a ghost profile. It names nobody, shows no silhouette and
              carries no invented credentials — it is the trainer equivalent
              of an empty ImageFrame, in the same ember language, saying in
              plain words that the position is open and that it will only
              ever be filled by a real person. Remove this block to return
              to a strict "only what exists" index. */}
          <div
            role="note"
            aria-label="Open trainer position — no trainer appointed yet"
            className="flex flex-col items-center justify-center rounded-[var(--radius-panel)] border-2 border-dashed border-[var(--color-accent-line)] bg-[var(--color-accent-soft)] p-8 text-center"
          >
            <span
              className="text-label mb-3"
              style={{ color: "var(--color-accent-ink)" }}
            >
              Position open — nobody appointed
            </span>
            <p className="text-h2 mb-3 max-w-[30ch]">
              The next trainer is not on this page yet
            </p>
            <p className="text-body-sm mb-6 max-w-[46ch] text-[var(--color-ink-quiet)]">
              We are deliberately slow here. A trainer appears only once they
              have genuinely been appointed and can meet the standard below —
              there are no placeholder profiles on this page, and there never
              will be.
            </p>
            <Button variant="secondary" href="/contact-us">
              Enquire about teaching with us
            </Button>
          </div>
        </div>
      </section>

      {/* ===== The standard ===== */}
      <section className="night">
        <div className="mx-auto max-w-[1280px] px-6 py-16">
          <p className="text-label mb-3 text-[var(--color-primary)]">
            How trainers are selected
          </p>
          <h2 className="text-display mb-5 max-w-[720px]">
            Four things a trainer has to be able to show
          </h2>
          <p className="text-body-lg mb-12 max-w-[640px] text-[var(--color-ink-quiet)]">
            The credential this Academy awards is only worth what the people
            assessing it are worth. So the bar for teaching here is the same
            bar we ask participants to clear: demonstrated capability, checkable
            by someone else.
          </p>
          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {standard.map(({ title, body }, i) => (
              <div
                key={title}
                className="border-t-2 border-[var(--color-primary)]/60 pt-5"
              >
                <p className="text-mono text-body-sm mb-3 text-[var(--color-ink-faint)]">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="text-h2 mb-2">{title}</h3>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Held today — HRD Corp Accredited Trainer =====
          Moved here from /hrd-corp, 2026-09-06, founder direction: this is
          the trainer's OWN accreditation, so it sits next to the person it
          belongs to rather than on the page about the organisation.
          /hrd-corp keeps the organisation-level facts (registration status,
          general HRD Corp background) and still links here for this.
          Content unchanged from its original section — see
          docs/HRD_CORP.md for the full research trail (evidence, the
          verification permalink, what is deliberately not reproduced). */}
      {accreditation && (
        <section className="night relative overflow-hidden">
          <div className="relative mx-auto max-w-[1280px] px-6 py-16 lg:py-20">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              Held today
            </p>
            <h2 className="text-display mb-10 max-w-[640px]">
              Our HRD Corp Accredited Trainer
            </h2>
            <div className="grid items-center gap-12 lg:grid-cols-[220px_1fr]">
              <Image
                src={assetPath(accreditation.badge)}
                alt="HRD Corp Accredited Trainer badge"
                width={220}
                height={220}
                className="mx-auto rounded-full lg:mx-0"
              />
              <div>
                <p className="text-h1 mb-1">{lead.name}</p>
                <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
                  {accreditation.title} · issued by {accreditation.issuer}
                </p>
                <dl className="mb-8 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-[var(--color-line)] pt-7 sm:grid-cols-3">
                  {[
                    ["Trainer ID", accreditation.trainerId],
                    ["Valid from", "8 July 2026"],
                    ["Valid to", "8 July 2029"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-label mb-1.5">{label}</dt>
                      <dd className="text-body-sm leading-snug">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="rounded-[var(--radius-panel)] border border-[var(--color-line-strong)] p-6">
                  <p className="text-label mb-3">Verify this accreditation</p>
                  <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
                    This links straight to HRD Corp&rsquo;s own official
                    verification result for this certificate — we would
                    rather you see it there than take our word for it.
                  </p>
                  <dl className="mb-4 flex flex-col gap-2">
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-body-sm font-medium">
                        Trainer ID:
                      </dt>
                      <dd className="text-mono text-body-sm text-[var(--color-ink-quiet)]">
                        {accreditation.trainerId}
                      </dd>
                    </div>
                    <div className="flex flex-wrap gap-x-2">
                      <dt className="text-body-sm font-medium">
                        Certificate ID:
                      </dt>
                      <dd className="text-mono text-body-sm text-[var(--color-ink-quiet)] break-all">
                        {accreditation.certificateId}
                      </dd>
                    </div>
                  </dl>
                  <Button
                    variant="secondary"
                    href={accreditation.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Verify this certificate at HRD Corp ↗
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===== Published work — REMOVED 2026-09-06, founder direction.
          `lead.books` is untouched in data/practitioners.ts (genuine,
          real data) — only this page's rendering of it is gone. Restoring
          it is a JSX addition, not a data operation, if wanted back. */}

      {/* ===== Seeing them teach ===== */}
      <section className="mx-auto max-w-[1280px] px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
          <div className="max-w-[560px]">
            <p className="text-label mb-3 text-[var(--color-primary)]">
              In the room
            </p>
            <h2 className="text-h1 mb-4">Trainers at work</h2>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              Photography of sessions being delivered belongs here. Until
              genuine photographs exist, the space stays visibly empty rather
              than being filled with stock imagery — the same rule that governs
              every image on this portal.
            </p>
          </div>
          <ImageFrame
            subject="A trainer mid-session — teaching, not posing"
            ratio="3 / 2"
            minWidth={1600}
            note="consent required"
            illustration={<TrainerAtWorkIllustration />}
          />
        </div>
      </section>
    </PublicShell>
  );
}
