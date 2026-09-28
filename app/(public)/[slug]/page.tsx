import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BackLink } from "./BackLink";
import type { ReactNode } from "react";
import { findPublishedExpertBySlug } from "@/modules/catalogue/experts/repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * /[slug] — one trainer's dedicated page, at the TOP level (founder,
 * 2026-09-28 evening: "/trainers/mustafa-qizilbash becomes
 * /mustafa-qizilbash; no need for /trainers" — the directory page is
 * retired and redirects here, since both pages were the one trainer's
 * content). Any slug that is not a published trainer is a real 404, so
 * this catch-all cannot shadow a genuine page — static routes win first.
 * REVIVED 2026-09-28 as /trainers/[slug]; REDESIGNED the same day to the
 * founder's supplied mockup: icon-led cards, the HRD accreditation panel with a
 * stats tile beside it, About beside a Career Highlights timeline, the
 * chip sections, framework tiles, the podcast row with a pull-quote card,
 * and the Community Impact metrics. Every fact renders from the expert's
 * own published record (including the quote — founder-supplied wording
 * stored on the profile); a second trainer gets the same treatment from
 * their own record. Employer marks are NOT reproduced — the timeline uses
 * neutral initial tiles, never third-party logos. Published Books stay
 * off this page (founder, 2026-09-27: books live on the Knowledge Hub).
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

/* ── Original inline glyphs (no icon library — Rule 5), local to this page. ── */
const stroke = { stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
const glyph = (path: ReactNode) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    {path}
  </svg>
);
const GLYPHS = {
  check: glyph(<path d="M5 12.5l4.5 4.5L19 7.5" {...stroke} strokeWidth={2.2} />),
  tag: glyph(<><path d="M4 5.5A1.5 1.5 0 015.5 4h5l9 9-6.5 6.5-9-9v-5z" {...stroke} /><circle cx={8.5} cy={8.5} r={1.3} {...stroke} /></>),
  calendar: glyph(<><rect x={4} y={5.5} width={16} height={14} rx={2} {...stroke} /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" {...stroke} /></>),
  bank: glyph(<><path d="M4 10h16M5 10v8m4.5-8v8m5-8v8M19 10v8M3.5 20h17M12 4l8 5.5H4L12 4z" {...stroke} /></>),
  people: glyph(<><circle cx={9} cy={8.5} r={3} {...stroke} /><path d="M3.5 19c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5M16 6a2.6 2.6 0 110 5.2M17.5 14.6c1.7.5 2.7 1.7 3.2 3.4" {...stroke} /></>),
  book: glyph(<><path d="M5 5.5A1.5 1.5 0 016.5 4H19v15H6.5A1.5 1.5 0 015 17.5v-12z" {...stroke} /><path d="M5 17.5A1.5 1.5 0 016.5 16H19M9 8h6" {...stroke} /></>),
  bulb: glyph(<><path d="M9 18h6M10 21h4M12 3.5a5.8 5.8 0 00-3.4 10.4c.7.6 1.1 1.3 1.2 2.1h4.4c.1-.8.5-1.5 1.2-2.1A5.8 5.8 0 0012 3.5z" {...stroke} /></>),
  mic: glyph(<><rect x={9.2} y={3.5} width={5.6} height={10} rx={2.8} {...stroke} /><path d="M6 11.5a6 6 0 0012 0M12 17.5v3M9 20.5h6" {...stroke} /></>),
  person: glyph(<><circle cx={12} cy={8} r={3.4} {...stroke} /><path d="M5.5 19.5c.9-3.6 3.4-5.4 6.5-5.4s5.6 1.8 6.5 5.4" {...stroke} /></>),
  trophy: glyph(<><path d="M8 4h8v6a4 4 0 01-8 0V4zM8 5.5H5a3 3 0 003 4.3M16 5.5h3a3 3 0 01-3 4.3M12 14v3.5M8.5 20h7M10 17.5h4" {...stroke} /></>),
  layers: glyph(<path d="M12 4l8 4-8 4-8-4 8-4zM4.5 12.2L12 16l7.5-3.8M4.5 16.2L12 20l7.5-3.8" {...stroke} />),
  gear: glyph(<><circle cx={12} cy={12} r={3} {...stroke} /><path d="M12 3.5v2.6M12 17.9v2.6M3.5 12h2.6M17.9 12h2.6M6 6l1.8 1.8M16.2 16.2L18 18M18 6l-1.8 1.8M7.8 16.2L6 18" {...stroke} /></>),
  shield: glyph(<><path d="M12 3.5l7 2.6v5.4c0 4.4-2.9 7.4-7 9-4.1-1.6-7-4.6-7-9V6.1l7-2.6z" {...stroke} /><path d="M9 12l2.2 2.2L15.5 9.7" {...stroke} /></>),
  cap: glyph(<><path d="M12 5l9.5 4L12 13 2.5 9 12 5z" {...stroke} /><path d="M6.5 11v4.2c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8V11M21.5 9v5" {...stroke} /></>),
  grid: glyph(<><rect x={4.5} y={4.5} width={6} height={6} rx={1.2} {...stroke} /><rect x={13.5} y={4.5} width={6} height={6} rx={1.2} {...stroke} /><rect x={4.5} y={13.5} width={6} height={6} rx={1.2} {...stroke} /><rect x={13.5} y={13.5} width={6} height={6} rx={1.2} {...stroke} /></>),
  box: glyph(<path d="M12 3.5l7.5 4.3v8.4L12 20.5l-7.5-4.3V7.8L12 3.5zM12 12l7.5-4.2M12 12L4.5 7.8M12 12v8.5" {...stroke} />),
  target: glyph(<><circle cx={12} cy={12} r={8} {...stroke} /><circle cx={12} cy={12} r={4.6} {...stroke} /><circle cx={12} cy={12} r={1.4} fill="currentColor" stroke="none" /></>),
  play: glyph(<><rect x={3.5} y={5.5} width={17} height={13} rx={3.5} {...stroke} /><path d="M10.5 9.3l4.6 2.7-4.6 2.7V9.3z" fill="currentColor" stroke="none" /></>),
  wave: glyph(<><circle cx={12} cy={12} r={8.5} {...stroke} /><path d="M8 10.5c2.8-.8 5.4-.7 8 .4M8.4 13c2.3-.6 4.5-.5 6.8.4M8.9 15.3c1.8-.4 3.5-.3 5.2.3" {...stroke} strokeWidth={1.5} /></>),
  quote: glyph(<path d="M5 13.5a4.3 4.3 0 014.3-6.9c-.3 1.2-1.1 2-2.1 2.5 1.5.4 2.5 1.6 2.5 3.2A3 3 0 015 13.5zm9.5 0a4.3 4.3 0 014.3-6.9c-.3 1.2-1.1 2-2.1 2.5 1.5.4 2.5 1.6 2.5 3.2a3 3 0 01-4.7 1.2z" fill="currentColor" stroke="none" />),
} as const;

/** Blue icon tile + heading, as the mockup's section headers. */
function SectionHead({ icon, children, aside }: { icon: keyof typeof GLYPHS; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <span className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[var(--radius-plate)] bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
          {GLYPHS[icon]}
        </span>
        <h2 className="text-h2">{children}</h2>
      </span>
      {aside}
    </div>
  );
}

function ChipSection({ icon, label, items }: { icon: keyof typeof GLYPHS; label: string; items: string[] | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <SectionHead icon={icon}>{label}</SectionHead>
      <div className="flex flex-wrap gap-2">
        {items.map((t) => (
          <Chip key={t}>{t}</Chip>
        ))}
      </div>
    </div>
  );
}

/** Neutral initials tile for the timeline — never a third-party logo. */
function OrgTile({ org }: { org: string }) {
  const initials = org
    .split(/[\s,-]+/)
    .filter((w) => /^[A-Za-z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden="true"
      className="text-mono grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] text-[0.8rem] font-semibold text-[var(--color-primary)]"
    >
      {initials}
    </span>
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
  const stats: { value: string; label: string; icon: keyof typeof GLYPHS }[] = [
    { value: experienceHeadline?.split(" ")[0] ?? "", label: "Years Experience", icon: "people" as const },
    ...(profile.books?.length ? [{ value: String(profile.books.length), label: "Books Published", icon: "book" as const }] : []),
    ...(profile.frameworks?.length ? [{ value: String(profile.frameworks.length), label: "Innovations", icon: "bulb" as const }] : []),
    ...(podcastEpisodes ? [{ value: podcastEpisodes, label: "Podcast Episodes", icon: "mic" as const }] : []),
  ].filter((s) => s.value);
  const firstName = expert.name.split(" ")[0];

  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <BackLink />
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

      <section className="mx-auto max-w-[1280px] px-6 py-12 lg:py-16">
        <div className="flex flex-col gap-6">
          {/* ===== Row: HRD accreditation + the stats tile ===== */}
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
            <Card variant="panel" className="p-6 sm:p-8" id="hrd-corp-accreditation">
              <div className="flex flex-wrap items-center gap-3" data-testid="trainer-hrd-line">
                {accreditation ? (
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">{GLYPHS.check}</span>
                    <h2 className="text-h2">HRD Corp Authorised Trainer</h2>
                    <Chip tone="primary">Trainer ID {accreditation.trainerId}</Chip>
                    {/* The explicit yes, for assistive tech and the 2026-09-28
                        "state it either way" rule — visually the check says it. */}
                    <span className="sr-only">Yes</span>
                  </>
                ) : (
                  <>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-ground-tint)] text-[var(--color-ink-quiet)]">{GLYPHS.shield}</span>
                    <h2 className="text-h2">HRD Authorised Trainer: No</h2>
                  </>
                )}
              </div>
              {accreditation && (
                <div className="text-body-sm mt-5 grid gap-6 border-t border-[var(--color-line)] pt-5 sm:grid-cols-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-[var(--color-primary)]">{GLYPHS.tag}</span>
                    <span>
                      <span className="block text-[var(--color-ink-quiet)]">Accreditation</span>
                      <span className="font-medium">{accreditation.title}</span>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-[var(--color-primary)]">{GLYPHS.calendar}</span>
                    <span>
                      <span className="block text-[var(--color-ink-quiet)]">Valid</span>
                      <span className="font-medium">
                        {formatDate(accreditation.validFrom)} – {formatDate(accreditation.validTo)}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 text-[var(--color-primary)]">{GLYPHS.bank}</span>
                    <span>
                      <span className="block text-[var(--color-ink-quiet)]">Issued by</span>
                      <span className="font-medium">{accreditation.issuer}</span>
                      <a href={accreditation.verifyUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[var(--color-primary)] underline underline-offset-4">
                        Verify at HRD Corp registry ↗
                      </a>
                    </span>
                  </div>
                </div>
              )}
            </Card>

            {stats.length > 0 ? (
              <Card variant="panel" className="p-6" data-testid="trainer-stats">
                <ul className="grid grid-cols-2 gap-x-4 gap-y-6">
                  {stats.map((s) => (
                    <li key={s.label} className="flex items-start gap-3">
                      <span className="mt-1 shrink-0 text-[var(--color-primary)]">{GLYPHS[s.icon]}</span>
                      <span>
                        <span className="text-h1 block leading-none text-[var(--color-primary)]">{s.value}</span>
                        <span className="text-body-sm mt-1 block text-[var(--color-ink-quiet)]">{s.label}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}
          </div>

          {/* ===== Row: (About + the chip sections) beside Career Highlights.
              One grid, About and the chips stacked in the LEFT column — the
              mockup's arrangement, and it leaves no dead gap under About when
              the timeline on the right runs taller. ===== */}
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
            <div className="flex flex-col gap-6">
              <Card variant="panel" className="p-6 sm:p-8">
                <SectionHead icon="person">About {firstName}</SectionHead>
                <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">{expert.summary}</p>
                {profile.about.map((p) => (
                  <p key={p.slice(0, 40)} className="text-body-sm mb-3 text-[var(--color-ink-quiet)] last:mb-0">
                    {p}
                  </p>
                ))}
              </Card>

              <Card variant="panel" className="flex flex-col gap-8 p-6 sm:p-8">
                <ChipSection icon="layers" label="Expertise Areas" items={expert.expertise} />
                <ChipSection icon="gear" label="Technologies" items={profile.technologies} />
                <ChipSection icon="shield" label="Certifications" items={profile.certifications} />
                <ChipSection icon="cap" label="Education" items={profile.education} />
              </Card>
            </div>

            {profile.careerAchievements?.length ? (
              <Card variant="panel" className="p-6 sm:p-8" data-testid="trainer-achievements">
                <SectionHead icon="trophy">Career Highlights</SectionHead>
                <ol className="relative flex flex-col gap-6 border-l border-[var(--color-line)] pl-6">
                  {profile.careerAchievements.map((a) => (
                    <li key={a.org} className="relative">
                      <span aria-hidden="true" className="absolute -left-[1.83rem] top-3 h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                      <div className="flex items-start gap-3">
                        <OrgTile org={a.org} />
                        <span>
                          <p className="text-body-sm font-medium text-[var(--color-ink)]">{a.org}</p>
                          <p className="text-body-sm text-[var(--color-ink-quiet)]">{a.description}</p>
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            ) : null}
          </div>

          {/* ===== Innovations & Frameworks ===== */}
          {profile.frameworks?.length ? (
            <Card variant="panel" className="p-6 sm:p-8" data-testid="trainer-frameworks">
              <SectionHead
                icon="bulb"
                aside={
                  profile.frameworksUrl ? (
                    <a href={profile.frameworksUrl} target="_blank" rel="noopener noreferrer" className="text-body-sm whitespace-nowrap text-[var(--color-primary)] underline underline-offset-4">
                      View framework details →
                    </a>
                  ) : undefined
                }
              >
                Innovations &amp; Frameworks
              </SectionHead>
              <ul className="grid gap-4 sm:grid-cols-3">
                {profile.frameworks.map((f, i) => (
                  <li key={f.abbr} className="rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] p-5">
                    <span className="mb-3 grid h-10 w-10 place-items-center rounded-[var(--radius-plate)] bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                      {GLYPHS[(["grid", "box", "target"] as const)[i % 3]!]}
                    </span>
                    <p className="text-mono mb-1 text-[0.8rem] font-semibold text-[var(--color-primary)]">{f.abbr}</p>
                    <p className="text-body-sm mb-1 font-medium text-[var(--color-ink)]">{f.name}</p>
                    <p className="text-body-sm text-[var(--color-ink-quiet)]">{f.description}</p>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* ===== Row: Podcast + the pull quote ===== */}
          {profile.podcast || profile.quote ? (
            <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-stretch">
              {profile.podcast ? (
                <Card variant="panel" className="p-6 sm:p-8" data-testid="trainer-podcast">
                  <SectionHead
                    icon="mic"
                    aside={
                      <a href={profile.podcast.youtube} target="_blank" rel="noopener noreferrer" className="text-body-sm whitespace-nowrap text-[var(--color-primary)] underline underline-offset-4">
                        View all episodes →
                      </a>
                    }
                  >
                    Podcast
                  </SectionHead>
                  <p className="text-body-lg mb-2 font-medium">{profile.podcast.name}</p>
                  <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">{profile.podcast.description}</p>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="secondary" href={profile.podcast.youtube} target="_blank" rel="noopener noreferrer">
                      <span className="text-[#dc2626]">{GLYPHS.play}</span> Watch on YouTube ↗
                    </Button>
                    <Button variant="secondary" href={profile.podcast.spotify} target="_blank" rel="noopener noreferrer">
                      <span className="text-[var(--color-success)]">{GLYPHS.wave}</span> Listen on Spotify ↗
                    </Button>
                  </div>
                </Card>
              ) : null}
              {profile.quote ? (
                <Card variant="panel" className="flex flex-col justify-center p-6 sm:p-8" data-testid="trainer-quote">
                  <span aria-hidden="true" className="mb-3 text-[var(--color-primary)] opacity-70 [&>svg]:h-8 [&>svg]:w-8">
                    {GLYPHS.quote}
                  </span>
                  <blockquote className="text-body-lg italic text-[var(--color-ink)]">&ldquo;{profile.quote}&rdquo;</blockquote>
                  <p className="text-body-sm mt-4 border-l-2 border-[var(--color-primary)] pl-3 text-[var(--color-ink-quiet)]">{expert.name}</p>
                </Card>
              ) : null}
            </div>
          ) : null}

          {/* ===== Community Impact ===== */}
          {profile.communityImpact?.length ? (
            <Card variant="panel" className="p-6 sm:p-8" data-testid="trainer-community">
              <SectionHead icon="people">Community Impact</SectionHead>
              <ul className="grid gap-6 sm:grid-cols-3">
                {profile.communityImpact.map((c) => (
                  <li key={c.label} className="flex items-start gap-3">
                    <span className="mt-1 shrink-0 text-[var(--color-primary)]">{GLYPHS.people}</span>
                    <span>
                      <p className="text-h1 leading-none text-[var(--color-primary)]">{c.metric}</p>
                      <p className="text-body-sm mb-1 mt-1 font-medium text-[var(--color-ink)]">{c.label}</p>
                      <p className="text-body-sm text-[var(--color-ink-quiet)]">{c.description}</p>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* The three buttons — kept as-is (founder, 2026-09-28). */}
          <div className="flex flex-wrap justify-center gap-3">
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
