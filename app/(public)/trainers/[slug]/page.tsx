import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findPublishedExpertBySlug } from "@/modules/catalogue/experts/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * /trainers/[slug] — one trainer's dedicated page (founder, 2026-09-28:
 * "every trainer will have a dedicated page … add a button or a link on
 * each [training] card"). REVIVES the route retired 2026-09-02 on the
 * founder's current instruction; /trainers stays as the directory.
 *
 * Content (founder, same day): "keep the HRD Authorised Trainer section
 * and for the rest of the page get the relevant content from
 * yourpartnertechnologies.com/team/mustafa-qizilbash.html; keep the three
 * buttons as-is." The company page's sections — About with the stats
 * strip, Career Achievements, Technologies & Expertise, Innovations &
 * Frameworks, Podcast, Community Impact — all render from the expert's own
 * published record (the seed already carries them; nothing is copied
 * loose into this page, and a second trainer gets the same treatment from
 * their own record). The Published Books section is deliberately NOT
 * rendered — founder, 2026-09-27: the books stay on the Knowledge Hub only.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const expert = await findPublishedExpertBySlug(slug);
  return expert ? { title: expert.name, description: expert.headline } : { title: "Trainer" };
}

/** ISO date (YYYY-MM-DD) → "8 July 2026". */
function formatDate(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ChipSection({ label, items }: { label: string; items: string[] | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-label mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <Chip key={t}>{t}</Chip>
        ))}
      </div>
    </div>
  );
}

export default async function TrainerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const expert = await findPublishedExpertBySlug(slug);
  if (!expert) notFound();

  const accreditation = expert.hrdCorpAccreditation;
  const profile = expert.profile;
  const [experienceHeadline] = expert.experienceLine.split(" · ");
  const [city, deliveryNote] = expert.location.split(" · ");
  const podcastEpisodes = profile.communityImpact?.find((c) => c.label.toLowerCase().includes("podcast"))?.metric ?? null;
  // The company page's stats strip, from the record's own facts.
  const stats: { value: string; label: string }[] = [
    { value: experienceHeadline?.replace(/[^0-9+]/g, "") || experienceHeadline || "", label: "Years experience" },
    ...(profile.books?.length ? [{ value: String(profile.books.length), label: "Books published" }] : []),
    ...(profile.frameworks?.length ? [{ value: String(profile.frameworks.length), label: "Innovations" }] : []),
    ...(podcastEpisodes ? [{ value: podcastEpisodes, label: "Podcast episodes" }] : []),
  ].filter((s) => s.value);

  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <Link href="/trainers" className="text-body-sm mb-4 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
            ← All trainers
          </Link>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="relative shrink-0">
              <Image src={expert.photoPath} alt={`Photograph of ${expert.name}`} width={800} height={800} className="h-40 w-40 rounded-[var(--radius-plate)] object-cover" />
              {accreditation && (
                <a
                  href="#hrd-corp-accreditation"
                  title="HRD Corp Accredited Trainer — see details below"
                  aria-label="HRD Corp Accredited Trainer — see accreditation details below"
                  className="absolute -bottom-1.5 -right-1.5 rounded-full bg-[var(--color-ground-raised)] p-0.5 shadow-md ring-1 ring-[var(--color-line-strong)]"
                >
                  <Image src={accreditation.badge} alt="HRD Corp Accredited Trainer badge" width={44} height={44} className="h-11 w-11 rounded-full object-cover" />
                </a>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-label mb-2 text-[var(--color-primary)]">Trainer</p>
              <h1 className="text-display-lg mb-2" data-testid="trainer-name">
                {expert.name}
              </h1>
              <p className="text-label mb-3">{expert.roleTitle}</p>
              <p className="text-body-lg max-w-[640px] text-[var(--color-ink-quiet)]">{expert.headline}</p>
              <p className="text-body-sm mt-3 text-[var(--color-ink-quiet)]">
                {experienceHeadline}
                {city ? ` · ${city}` : ""}
                {deliveryNote ? ` · ${capitalize(deliveryNote)}` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-6 py-16">
        <div className="flex flex-col gap-8">
          {/* HRD Authorised — kept exactly as before (founder, 2026-09-28). */}
          <Card variant="panel" className="p-6 sm:p-8" id="hrd-corp-accreditation">
            <p className="text-body-sm" data-testid="trainer-hrd-line">
              <span className="font-medium text-[var(--color-ink)]">HRD Authorised Trainer:</span>{" "}
              {accreditation ? (
                <span className="text-[var(--color-success)]">Yes — Trainer ID {accreditation.trainerId}</span>
              ) : (
                <span className="text-[var(--color-ink-quiet)]">No</span>
              )}
            </p>
            {accreditation && (
              <dl className="text-body-sm mt-4 grid gap-x-8 gap-y-2 border-t border-[var(--color-line)] pt-4 sm:grid-cols-2">
                <div className="flex items-baseline justify-between gap-4 sm:justify-start">
                  <dt className="text-[var(--color-ink-quiet)]">Accreditation</dt>
                  <dd>{accreditation.title}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 sm:justify-start">
                  <dt className="text-[var(--color-ink-quiet)]">Issued by</dt>
                  <dd>{accreditation.issuer}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 sm:justify-start">
                  <dt className="text-[var(--color-ink-quiet)]">Valid</dt>
                  <dd>
                    {formatDate(accreditation.validFrom)} — {formatDate(accreditation.validTo)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 sm:justify-start">
                  <dt className="text-[var(--color-ink-quiet)]">Verify</dt>
                  <dd>
                    <a href={accreditation.verifyUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] underline underline-offset-4">
                      HRD Corp registry ↗
                    </a>
                  </dd>
                </div>
              </dl>
            )}
          </Card>

          {/* ===== About + the stats strip ===== */}
          <Card variant="panel" className="p-6 sm:p-8">
            <p className="text-label mb-3">About</p>
            <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">{expert.summary}</p>
            {profile.about.map((p) => (
              <p key={p.slice(0, 40)} className="text-body-sm mb-3 text-[var(--color-ink-quiet)] last:mb-0">
                {p}
              </p>
            ))}
            {stats.length > 0 ? (
              <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--color-line)] pt-5 sm:grid-cols-4" data-testid="trainer-stats">
                {stats.map((s) => (
                  <div key={s.label}>
                    <dd className="text-h1 text-[var(--color-primary)]">{s.value}</dd>
                    <dt className="text-label mt-1">{s.label}</dt>
                  </div>
                ))}
              </dl>
            ) : null}
          </Card>

          {/* ===== Career achievements ===== */}
          {profile.careerAchievements?.length ? (
            <Card variant="panel" className="p-6 sm:p-8" data-testid="trainer-achievements">
              <p className="text-label mb-4">Career achievements</p>
              <ul className="grid gap-5 sm:grid-cols-3">
                {profile.careerAchievements.map((a) => (
                  <li key={a.org}>
                    <p className="text-body-sm mb-1 font-medium text-[var(--color-ink)]">{a.org}</p>
                    <p className="text-body-sm text-[var(--color-ink-quiet)]">{a.description}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* ===== Technologies & expertise ===== */}
          <Card variant="panel" className="flex flex-col gap-6 p-6 sm:p-8">
            <ChipSection label="Expertise areas" items={expert.expertise} />
            <ChipSection label="Technologies" items={profile.technologies} />
            <ChipSection label="Certifications" items={profile.certifications} />
            <ChipSection label="Education" items={profile.education} />
          </Card>

          {/* ===== Innovations & frameworks ===== */}
          {profile.frameworks?.length ? (
            <Card variant="panel" className="p-6 sm:p-8" data-testid="trainer-frameworks">
              <p className="text-label mb-4">Innovations &amp; frameworks</p>
              <ul className="grid gap-5 sm:grid-cols-3">
                {profile.frameworks.map((f) => (
                  <li key={f.abbr}>
                    <p className="text-mono mb-1 text-[0.8rem] text-[var(--color-primary)]">{f.abbr}</p>
                    <p className="text-body-sm mb-1 font-medium text-[var(--color-ink)]">{f.name}</p>
                    <p className="text-body-sm text-[var(--color-ink-quiet)]">{f.description}</p>
                  </li>
                ))}
              </ul>
              {profile.frameworksUrl ? (
                <p className="text-body-sm mt-4">
                  <a href={profile.frameworksUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--color-primary)] underline underline-offset-4">
                    Read more about these frameworks on Medium ↗
                  </a>
                </p>
              ) : null}
            </Card>
          ) : null}

          {/* ===== Podcast ===== */}
          {profile.podcast ? (
            <Card variant="panel" className="p-6 sm:p-8" data-testid="trainer-podcast">
              <p className="text-label mb-2">Podcast</p>
              <p className="text-body-lg mb-2 font-medium">{profile.podcast.name}</p>
              <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">{profile.podcast.description}</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" href={profile.podcast.youtube} target="_blank" rel="noopener noreferrer">
                  Watch on YouTube ↗
                </Button>
                <Button variant="secondary" href={profile.podcast.spotify} target="_blank" rel="noopener noreferrer">
                  Listen on Spotify ↗
                </Button>
              </div>
            </Card>
          ) : null}

          {/* ===== Community impact ===== */}
          {profile.communityImpact?.length ? (
            <Card variant="panel" className="p-6 sm:p-8" data-testid="trainer-community">
              <p className="text-label mb-4">Community impact</p>
              <ul className="grid gap-5 sm:grid-cols-3">
                {profile.communityImpact.map((c) => (
                  <li key={c.label}>
                    <p className="text-h1 text-[var(--color-primary)]">{c.metric}</p>
                    <p className="text-body-sm mb-1 font-medium text-[var(--color-ink)]">{c.label}</p>
                    <p className="text-body-sm text-[var(--color-ink-quiet)]">{c.description}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* The three buttons — kept as-is (founder, 2026-09-28). */}
          <div className="flex flex-wrap gap-3">
            {profile.mediumProfile && (
              <Button href={profile.mediumProfile} target="_blank" rel="noopener noreferrer">
                Full profile on Medium ↗
              </Button>
            )}
            {profile.linkedin && (
              <Button variant="secondary" href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn ↗
              </Button>
            )}
            <Button variant="secondary" href="/programs">
              Trainings by this trainer
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
