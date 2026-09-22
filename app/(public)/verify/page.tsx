import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { getPrisma } from "@/db/prisma";
import { StatusChip } from "@/modules/certificates/components/StatusChip";
import { MAX_NAME_RESULTS, MIN_NAME_QUERY } from "@/modules/certificates/constants";
import { formatCalendarDate } from "@/modules/certificates/dates";
import type { PublicCertificateView } from "@/modules/certificates/repository";
import { classifySearch } from "@/modules/certificates/rules";
import { searchCertificates, type CertificateSearchOutcome } from "@/modules/certificates/search.service";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Field } from "@/shared/ui/forms";

/*
 * /verify — public certificate search (Milestone 6; MILESTONE_6_EXECUTION_
 * PLAN.md §5 "Search"; requirements §5). PORTED 2026-09-22 from project-
 * artifacts/mockup/components/certificates/VerifySearch.tsx and app/verify/
 * page.tsx. Changed: a server-rendered GET form (`?q=`) over the real
 * `searchCertificates()` — an ID finds its certificate exactly, listed or
 * not; a NAME finds only holders who opted in, needs ≥ 3 characters and is
 * capped at 10. "No results" reads the same for an unlisted holder and for
 * a name nobody has. The SampleBanner, the "try a sample" buttons and the
 * in-browser registry were NEVER ported. Each result shows the R-V1 fields
 * only. Rate-limited per client key: 10 searches a minute, counted in the
 * database (`auth_rate_limits`, prefix `verify:`) so a restart forgets
 * nothing — the same pattern as the enquiry form and reviews.
 */
export const metadata: Metadata = {
  title: "Verify a certificate",
  description: "Confirm a Data & AI Academy Certificate of Completion by certificate ID or, for listed holders, by name.",
};

export const dynamic = "force-dynamic";

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 10;
const NOT_EARNED = "This page confirms Certificates of Completion. It is not the Academy’s earned credential.";

async function overLimit(clientKey: string): Promise<boolean> {
  const prisma = getPrisma();
  const key = `verify:${clientKey}`;
  const now = Date.now();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!row || now - Number(row.lastRequest) > WINDOW_MS) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { id: key, key, count: 1, lastRequest: BigInt(now) },
      update: { count: 1, lastRequest: BigInt(now) },
    });
    return false;
  }
  if (row.count >= MAX_PER_WINDOW) return true;
  await prisma.authRateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return false;
}

async function clientKey(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0]!.trim();
}

function ResultCard({ c }: { c: PublicCertificateView }) {
  return (
    <li>
      <Card variant="panel" className="p-5" data-testid="verify-result">
        <div className="mb-3">
          <StatusChip status={c.status} />
        </div>
        <p className="text-body-lg font-medium" data-testid="verify-result-name">
          {c.holderName}
        </p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          {c.programmeTitle} · {c.formatName}
        </p>
        <p className="text-body-sm mt-1 text-[var(--color-ink-faint)]">
          Completed {formatCalendarDate(c.completedOn)} · <span className="text-mono">{c.certificateId}</span>
        </p>
        <Link
          href={`/verify/${c.certificateId}`}
          className="text-body-sm mt-3 inline-block py-1 font-medium text-[var(--color-primary)] underline underline-offset-4"
          data-testid="verify-result-link"
        >
          View certificate {c.certificateId}
        </Link>
      </Card>
    </li>
  );
}

function Results({ outcome, limited }: { outcome: CertificateSearchOutcome | null; limited: boolean }) {
  if (limited) {
    return (
      <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="verify-rate-limited" role="status">
        Too many searches — please wait a minute.
      </p>
    );
  }
  if (!outcome || outcome.kind === "empty") {
    return (
      <p className="text-body-sm text-[var(--color-ink-faint)]" data-testid="verify-hint">
        Enter a certificate ID (for example DAA-2026-XXXX-XXXX) or a holder&rsquo;s name to begin.
      </p>
    );
  }
  if (outcome.kind === "too_short") {
    return (
      <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="verify-too-short">
        Enter at least {MIN_NAME_QUERY} characters of a name, or a full certificate ID.
      </p>
    );
  }
  if (outcome.kind === "id") {
    return outcome.result ? (
      <ul className="flex flex-col gap-4" aria-label="Search results">
        <ResultCard c={outcome.result} />
      </ul>
    ) : (
      <Card variant="panel" className="p-5 sm:p-6" data-testid="verify-none">
        <h2 className="text-h1 mb-2">No certificate found for that ID</h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">Check the ID against the certificate and try again.</p>
      </Card>
    );
  }
  if (outcome.results.length === 0) {
    return (
      <Card variant="panel" className="p-5 sm:p-6" data-testid="verify-none">
        <h2 className="text-h1 mb-2">No listed certificate matches</h2>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Name search shows only holders who have chosen to be listed. If you have a certificate ID or link, search by that instead.
        </p>
      </Card>
    );
  }
  return (
    <div>
      <h2 className="text-h1 mb-1">
        {outcome.results.length} {outcome.results.length === 1 ? "result" : "results"}
      </h2>
      {outcome.truncated ? (
        <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]" data-testid="verify-truncated">
          Showing the first {MAX_NAME_RESULTS} — add another word to narrow your search.
        </p>
      ) : null}
      <ul className="mt-4 flex flex-col gap-4" aria-label="Search results">
        {outcome.results.map((c) => (
          <ResultCard key={c.certificateId} c={c} />
        ))}
      </ul>
    </div>
  );
}

export default async function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = typeof sp["q"] === "string" ? sp["q"] : "";
  const trimmed = q.trim();

  // Only a submission that would reach the database counts against the
  // limit; an empty or too-short query is answered without a lookup.
  let outcome: CertificateSearchOutcome | null = null;
  let limited = false;
  if (trimmed) {
    const shape = classifySearch(trimmed);
    if (shape.kind === "empty" || shape.kind === "too_short") outcome = shape;
    else if (await overLimit(await clientKey())) limited = true;
    else outcome = await searchCertificates(trimmed);
  }

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[760px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Verify</p>
        <h1 className="text-display mb-3" data-testid="verify-title">
          Verify a certificate
        </h1>
        <p className="text-body-lg mb-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Check that someone completed a programme and whether their Certificate of Completion is active. Search by the certificate ID
          printed on it, or by the holder&rsquo;s name where they have chosen to be listed.
        </p>
        <p className="text-body-sm mb-8 max-w-[60ch] text-[var(--color-ink-faint)]">{NOT_EARNED}</p>

        <Card variant="panel" className="mb-8 p-5 sm:p-8">
          <form method="get" action="/verify" role="search" aria-label="Search certificates" className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:flex-1">
                <Field
                  label="Certificate ID or holder's name"
                  name="q"
                  type="search"
                  defaultValue={q}
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  maxLength={200}
                  placeholder="e.g. DAA-2026-XXXX-XXXX, or a name"
                />
              </div>
              <Button type="submit" className="sm:shrink-0" data-testid="verify-submit">
                Search
              </Button>
            </div>
            <p className="text-body-sm text-[var(--color-ink-faint)]">
              An ID checks one certificate. A name search lists only people who have chosen to appear publicly and needs at least{" "}
              {MIN_NAME_QUERY} characters.
            </p>
          </form>
        </Card>

        <div aria-live="polite" className="min-h-[3rem]" data-testid="verify-results">
          <Results outcome={outcome} limited={limited} />
        </div>
      </div>
    </section>
  );
}
