import type { ReactNode } from "react";
import { ASSESSMENT_SIZE, ASSESSMENT_TIME_LIMIT_MS } from "@/modules/free-learning/assessment-rules";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { plusCount } from "./plus-count";

/*
 * HOW THIS PORTAL WORKS — Milestone 15, Requirement 1 (founder, 2026-09-29).
 * Sits directly under the hero's YOUR LEARNING JOURNEY strip: three equal
 * cards that read as one path — Knowledge Hub → Free Certification →
 * Professional Training.
 *
 * Copy is the founder's, verbatim, with two exceptions that are deliberate:
 *  - the figures ("380+ topics", "3,800+ questions") are read from the
 *    database by the caller and formatted with `plusCount`, so they stay true
 *    as the book and the bank grow (and are simply omitted if a count is 0);
 *  - no passing percentage is written anywhere — the copy says "the required
 *    passing score", and the real threshold lives in one constant
 *    (`ASSESSMENT_PASS_PERCENT`, `src/modules/free-learning/assessment-rules.ts`).
 * The Amazon link is the URL already on the trainer's record (never typed
 * here); it is omitted if no such book is on file.
 *
 * Layout: 3 cards in a row (lg) · 2 + 1 (md) · a single column (mobile), the
 * step order shown by numbered labels at every width and by arrows where they
 * make sense (between cards at lg, downwards on mobile). Original inline
 * icons — no icon library.
 */

const stroke = { stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };

function IconBook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path d="M4.5 5.5A1.5 1.5 0 016 4h5.5v15H6a1.5 1.5 0 00-1.5 1.5v-15zM19.5 5.5A1.5 1.5 0 0018 4h-5.5v15H18a1.5 1.5 0 011.5 1.5v-15z" {...stroke} />
    </svg>
  );
}
function IconCertificate() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <rect x={3.5} y={4.5} width={17} height={12} rx={1.8} {...stroke} />
      <path d="M7.5 8.5h9M7.5 11.5h5" {...stroke} />
      <path d="M9 16.5l-1.2 3.5 3.2-1.6 3.2 1.6L13 16.5" {...stroke} />
    </svg>
  );
}
function IconTraining() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path d="M12 4.5l9 4-9 4-9-4 9-4z" {...stroke} />
      <path d="M6.5 10.8v4.4c0 1.3 2.5 2.6 5.5 2.6s5.5-1.3 5.5-2.6v-4.4M21 8.5V14" {...stroke} />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--color-primary)]">
      <path d="M5 12.5l4.2 4.2L19 7.2" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}
function IconChevron({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-4 w-4 ${className}`}>
      <path d="M9 5.5l6.5 6.5L9 18.5" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}

type Step = {
  key: "knowledge" | "certification" | "training";
  label: string;
  icon: ReactNode;
  title: string;
  free: boolean;
  stat?: { value: string; caption: string } | null;
  description: string;
  support?: string;
  highlights?: string[];
  /** A short, muted line under the highlights (the certificate-document fee). */
  note?: string | null;
  cta: { label: string; href: string };
};

export function HowPortalWorks({
  topicCount,
  questionCount,
  bookUrl,
  certificateFee,
}: {
  /** Published book topics (database). */
  topicCount: number;
  /** Reviewed questions of published topics (database). */
  questionCount: number;
  /** The trainer's own URL for the book, or null when none is on file. */
  bookUrl: string | null;
  /** The result-certificate document fee as shown to a visitor ("USD 10"), read
   *  from the admin-managed unlock setting; null when the fee is switched off. */
  certificateFee: string | null;
}) {
  const topics = plusCount(topicCount, 10);
  const questions = plusCount(questionCount, 100);

  const steps: Step[] = [
    {
      key: "knowledge",
      label: "Step 1 · Learn",
      icon: <IconBook />,
      title: "Knowledge Hub",
      free: true,
      stat: topics ? { value: topics, caption: "Topics" } : null,
      description: `Explore ${topics ? `${topics} ` : ""}Data & AI topics available free of charge. Learn concepts, frameworks, technologies and practical ideas at your own pace.`,
      support: "Content inspired by I Am Datapedia.",
      cta: { label: "Explore Knowledge Hub", href: "/free-trainings" },
    },
    {
      key: "certification",
      label: "Step 2 · Validate",
      icon: <IconCertificate />,
      title: "Free Assessment",
      free: true,
      description: `Test your Data & AI knowledge with The Free Assessment Check — ${ASSESSMENT_SIZE} questions in ${ASSESSMENT_TIME_LIMIT_MS / 3_600_000} hours, drawn from our growing question bank of ${questions ? `${questions} ` : ""}questions. Take it free of charge and earn a graded certificate when you achieve the required passing score.`,
      highlights: [questions ? `${questions} Questions` : "A growing question bank", "The Free Assessment Check", "Graded Certificate on Passing"],
      // Founder, 2026-09-29: "add this line as well" — the attempt is free but the
      // certificate document is paid (Q1), so say so up front. Read from the
      // admin-managed setting, never typed: change or switch off the fee and this follows.
      note: certificateFee ? `Certificate document: ${certificateFee}` : null,
      cta: { label: "Start an Assessment", href: "/assessment" },
    },
    {
      key: "training",
      label: "Step 3 · Grow",
      icon: <IconTraining />,
      title: "Professional Training",
      free: false,
      description: "Build practical Data & AI capabilities through structured professional training designed for practitioners, professionals and organizations.",
      highlights: ["Expert-led Training", "Practical Learning", "Certificate of Completion"],
      cta: { label: "Explore Professional Training", href: "/programs" },
    },
  ];

  return (
    <section className="border-t border-[var(--color-line)] bg-[var(--color-ground)]" data-testid="how-portal-works" aria-labelledby="how-portal-works-title">
      <div className="mx-auto max-w-[1280px] px-6 py-14">
        <h2 id="how-portal-works-title" className="mb-3 text-xs font-bold tracking-[0.2em] text-[var(--color-ink-faint)]">
          HOW THIS PORTAL WORKS
        </h2>
        <p className="mb-10 max-w-[760px] text-xl font-medium leading-snug text-[var(--color-ink)]" data-testid="how-portal-works-intro">
          Learn, test your knowledge, and build your professional capabilities — all in one place. Start with free Data &amp; AI knowledge, validate your
          understanding through an assessment, or take a professional training program to deepen your skills.
        </p>

        <ol className="grid list-none gap-6 p-0 md:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.key} className="relative flex" data-testid={`portal-card-${step.key}`}>
              <Card variant="panel" className="flex w-full flex-col p-6 sm:p-7">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-plate)] bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                      {step.icon}
                    </span>
                    <span className="text-label text-[var(--color-primary)]">{step.label}</span>
                  </span>
                  {step.free ? <Chip tone="primary">Free</Chip> : null}
                </div>

                <h3 className="text-h1 mb-3">{step.title}</h3>

                {step.stat ? (
                  <p className="mb-3 flex items-baseline gap-2" data-testid={`portal-stat-${step.key}`}>
                    <span className="text-display leading-none text-[var(--color-primary)]">{step.stat.value}</span>
                    <span className="text-label">{step.stat.caption}</span>
                  </p>
                ) : null}

                <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">{step.description}</p>
                {step.support ? <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">{step.support}</p> : null}

                {step.highlights ? (
                  <ul className={`flex list-none flex-col gap-2 p-0 ${step.note ? "mb-3" : "mb-6"}`} data-testid={`portal-highlights-${step.key}`}>
                    {step.highlights.map((h) => (
                      <li key={h} className="text-body-sm flex items-center gap-2 font-medium text-[var(--color-ink)]">
                        <IconCheck />
                        {h}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {step.note ? (
                  <p className="text-body-sm mb-6 text-[var(--color-ink-faint)]" data-testid={`portal-note-${step.key}`}>
                    {step.note}
                  </p>
                ) : null}

                {step.key === "knowledge" && bookUrl ? (
                  <a
                    href={bookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-sm mb-6 inline-block w-fit py-1 font-medium text-[var(--color-primary)] underline underline-offset-4 hover:text-[var(--color-primary-strong)]"
                    data-testid="portal-amazon"
                  >
                    I Am Datapedia — on Amazon →
                  </a>
                ) : null}

                {/* The arrow is glued to the last word with a no-break space so a
                    narrow card never strands it alone on a second line. */}
                <div className="mt-auto pt-2">
                  <Button href={step.cta.href} data-testid={`portal-cta-${step.key}`}>
                    {step.cta.label}
                    {"\u00A0→"}
                  </Button>
                </div>
              </Card>

              {/* The journey, shown as direction: an arrow between cards on a
                  three-across row, a downward one on a single column. Hidden at
                  the 2 + 1 tablet layout, where "next" is ambiguous — the
                  numbered labels carry the order there. */}
              {i < steps.length - 1 ? (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute -right-[1.75rem] top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-[var(--color-line-strong)] bg-[var(--color-ground)] text-[var(--color-primary)] lg:grid"
                  >
                    <IconChevron />
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-[1.75rem] left-1/2 z-10 grid h-8 w-8 -translate-x-1/2 place-items-center rounded-full border border-[var(--color-line-strong)] bg-[var(--color-ground)] text-[var(--color-primary)] md:hidden"
                  >
                    <IconChevron className="rotate-90" />
                  </span>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
