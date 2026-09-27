import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { searchPublishedProgrammes } from "@/modules/catalogue/programmes/repository";
import { KNOWLEDGE_CHECK_ID_RE } from "@/modules/free-learning/knowledge-check.repository";
import type { ProgrammeSummary } from "@/modules/catalogue/programmes/types";
import { StatusChip } from "@/modules/certificates/components/StatusChip";
import { MIN_NAME_QUERY } from "@/modules/certificates/constants";
import { formatCalendarDate } from "@/modules/certificates/dates";
import type { PublicCertificateView } from "@/modules/certificates/repository";
import { classifySearch } from "@/modules/certificates/rules";
import { certificateSearchOverLimit, searchClientKey } from "@/modules/certificates/search-limit";
import { searchCertificates, type CertificateSearchOutcome } from "@/modules/certificates/search.service";
import { siteSearch } from "@/shared/chrome/site-nav";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/forms";

/*
 * /search — the header search bar's results (Milestone 14 Phase 1, founder
 * decision P17: "Search Candidates or Training"). ONE query, two groups:
 *
 *   Trainings   — published programmes whose title, subtitle or summary
 *                 contains every word typed (catalogue repository).
 *   Candidates  — Certificates of Completion by exact ID, or by holder name
 *                 for holders who chose to be listed — the SAME rules,
 *                 wording and per-client rate limit as /verify (M6 E12), so
 *                 this page is never a faster path to the same rows.
 *
 * Nothing else is searched; nothing is stored about the search.
 */
export const metadata: Metadata = {
  title: "Search",
  description: "Search trainings, and confirm a Certificate of Completion by ID or listed holder name.",
  robots: { index: false, follow: true },
};

export const dynamic = "force-dynamic";

const MIN_TRAINING_QUERY = 2;

function TrainingResult({ p }: { p: ProgrammeSummary }) {
  return (
    <li>
      <Card variant="panel" className="p-5" data-testid="search-training" data-slug={p.slug}>
        <p className="text-body-lg font-medium">
          <Link href={`/programs/${p.slug}`} className="hover:text-[var(--color-primary)]">
            {p.title}
          </Link>
        </p>
        {p.subtitle ? <p className="text-body-sm text-[var(--color-ink-quiet)]">{p.subtitle}</p> : null}
        <p className="text-body-sm mt-1 text-[var(--color-ink-faint)]">
          {p.durationLabel}
          {p.certificateLabel ? ` · ${p.certificateLabel}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button href={`/programs/${p.slug}`}>Register or check course details</Button>
          <Button variant="secondary" href={`/schedule?training=${p.slug}`}>
            See dates
          </Button>
        </div>
      </Card>
    </li>
  );
}

function CertificateResult({ c }: { c: PublicCertificateView }) {
  return (
    <li>
      <Card variant="panel" className="p-5" data-testid="search-certificate">
        <div className="mb-3">
          <StatusChip status={c.status} />
        </div>
        <p className="text-body-lg font-medium" data-testid="search-certificate-name">
          {c.holderName}
        </p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          {c.programmeTitle} · {c.formatName}
        </p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Completed {formatCalendarDate(c.completedOn)} ·{" "}
          <Link href={`/verify/${c.certificateId}`} className="text-mono text-[var(--color-primary)] underline underline-offset-4">
            {c.certificateId}
          </Link>
        </p>
      </Card>
    </li>
  );
}

function Certificates({ outcome, limited, shape }: { outcome: CertificateSearchOutcome | null; limited: boolean; shape: "empty" | "too_short" | "id" | "name" }) {
  if (limited) {
    return (
      <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="search-rate-limited" role="status">
        Too many certificate searches — please wait a minute.
      </p>
    );
  }
  if (shape === "too_short") {
    return (
      <p className="text-body-sm text-[var(--color-ink-faint)]" data-testid="search-certificates-short">
        A name search needs at least {MIN_NAME_QUERY} characters; a certificate ID finds one certificate exactly.
      </p>
    );
  }
  if (!outcome || outcome.kind === "empty" || outcome.kind === "too_short") return null;
  const results = outcome.kind === "id" ? (outcome.result ? [outcome.result] : []) : outcome.results;
  if (results.length === 0) {
    return (
      <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="search-certificates-none">
        {outcome.kind === "id" ? "No certificate has that ID." : "No listed certificate holder matches. Name search shows only people who chose to be listed; a certificate ID always works."}
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-4" aria-label="Certificate results" data-testid="search-certificates">
      {results.map((c) => (
        <CertificateResult key={c.certificateId} c={c} />
      ))}
      {outcome.kind === "name" && outcome.truncated ? (
        <li className="text-body-sm text-[var(--color-ink-quiet)]">Showing the first results — add another word to narrow the search.</li>
      ) : null}
    </ul>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp["q"] === "string" ? sp["q"] : "";
  const trimmed = q.trim().slice(0, 200);
  // A Knowledge Check ID (M14 Phase 4) resolves straight to its page.
  if (KNOWLEDGE_CHECK_ID_RE.test(trimmed.toUpperCase())) redirect(`/verify/${trimmed.toUpperCase()}`);

  let trainings: ProgrammeSummary[] = [];
  let outcome: CertificateSearchOutcome | null = null;
  let limited = false;
  const shape = trimmed ? classifySearch(trimmed).kind : "empty";
  if (trimmed) {
    const [found, certs] = await Promise.all([
      trimmed.length >= MIN_TRAINING_QUERY ? searchPublishedProgrammes(trimmed) : Promise.resolve([]),
      (async () => {
        if (shape === "empty" || shape === "too_short") return null;
        if (await certificateSearchOverLimit(await searchClientKey())) {
          limited = true;
          return null;
        }
        return searchCertificates(trimmed);
      })(),
    ]);
    trainings = found;
    outcome = certs;
  }

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Search</p>
        <h1 className="text-display mb-3" data-testid="search-title">
          {trimmed ? `Results for “${trimmed}”` : "Search candidates or trainings"}
        </h1>
        <Card variant="panel" className="mb-10 p-5 sm:p-6">
          <form method="get" action={siteSearch.action} role="search" aria-label={siteSearch.label} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:flex-1">
              <Field label="Search" name="q" type="search" defaultValue={q} autoComplete="off" maxLength={200} placeholder={siteSearch.placeholder} />
            </div>
            <Button type="submit" className="sm:shrink-0" data-testid="search-submit">
              Search
            </Button>
          </form>
        </Card>

        {!trimmed ? (
          <p className="text-body-sm text-[var(--color-ink-faint)]" data-testid="search-hint">
            Type a training name, a certificate ID (for example DAA-2026-XXXX-XXXX) or a listed holder&rsquo;s name.
          </p>
        ) : (
          <div className="flex flex-col gap-10">
            <section aria-labelledby="search-trainings-h">
              <h2 id="search-trainings-h" className="text-h1 mb-4">
                Trainings
              </h2>
              {trainings.length > 0 ? (
                <ul className="flex flex-col gap-4" aria-label="Training results" data-testid="search-trainings">
                  {trainings.map((p) => (
                    <TrainingResult key={p.slug} p={p} />
                  ))}
                </ul>
              ) : (
                <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="search-trainings-none">
                  No training matches.{" "}
                  <Link href="/programs" className="text-[var(--color-primary)] underline underline-offset-4">
                    See all trainings
                  </Link>
                  .
                </p>
              )}
            </section>

            <section aria-labelledby="search-certificates-h">
              <h2 id="search-certificates-h" className="text-h1 mb-1">
                Candidates
              </h2>
              <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">
                Certificates of Completion, by ID or by the name of a holder who chose to be listed.{" "}
                <Link href="/verify" className="underline underline-offset-4">
                  Verify a certificate
                </Link>
                .
              </p>
              <Certificates outcome={outcome} limited={limited} shape={shape} />
            </section>
          </div>
        )}
      </div>
    </section>
  );
}
