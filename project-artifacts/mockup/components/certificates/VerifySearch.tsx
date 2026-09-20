"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { SampleBanner } from "@/components/certificates/SampleBanner";
import { StatusChip } from "@/components/certificates/StatusChip";
import { useRegistry } from "@/components/certificates/records";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SAMPLE_IDS } from "@/data/certificates";
import { inputClass } from "@/components/auth/FormParts";
import {
  MIN_NAME_QUERY,
  formatDate,
  search,
  statusOf,
} from "@/lib/certificates";

/**
 * Public certificate search — added 2026-09-20, founder requirement: "a page
 * where anyone can come and search anyone who has completed the training …
 * by user name or unique ID".
 *
 * The rules (lib/certificates.ts `search`, tested) are PROPOSED best
 * practice, not founder-specified — see docs/execution/
 * COMPLETION_CERTIFICATE_REQUIREMENTS.md §5 and decisions D3/D4:
 *   • an ID finds its certificate exactly, whether or not the holder is listed;
 *   • a NAME search finds only holders who opted in to be listed, needs
 *     ≥ 3 characters, and is capped — so the page cannot be used to list or
 *     harvest everyone (PDPA). The message for "no results" never reveals
 *     whether an unlisted holder exists.
 * The search runs over the sample registry in this browser tab. The real
 * product searches on the server, rate-limited.
 */
export function VerifySearch() {
  const { ready, now, registry } = useRegistry();
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const outcome = useMemo(
    () => (submitted === null ? null : search(submitted, registry)),
    [submitted, registry],
  );

  function run(q: string) {
    setText(q);
    setSubmitted(q);
  }
  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(text);
  }

  return (
    <div className="flex flex-col gap-8">
      <SampleBanner />

      <Card variant="panel" className="p-5 sm:p-8">
        <form onSubmit={onSubmit} role="search" aria-label="Search certificates" className="flex flex-col gap-4">
          <label htmlFor="verify-q" className="text-label">
            Certificate ID or holder&rsquo;s name
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="verify-q"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. DAA-2026-XXXX-XXXX, or a name"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              className={`${inputClass} sm:flex-1`}
            />
            <Button type="submit" className="sm:shrink-0">
              Search
            </Button>
          </div>
          <p className="text-body-sm text-[var(--color-ink-faint)]">
            Search by ID to check one certificate. Searching by name lists only
            people who have chosen to appear publicly, and needs at least{" "}
            {MIN_NAME_QUERY} characters.
          </p>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            Try a sample:{" "}
            <button
              type="button"
              onClick={() => run("Alex")}
              className="inline-block px-2 py-1.5 text-[var(--color-primary)] underline underline-offset-4"
            >
              Alex
            </button>{" "}
            ·{" "}
            <button
              type="button"
              onClick={() => run("Sample")}
              className="inline-block px-2 py-1.5 text-[var(--color-primary)] underline underline-offset-4"
            >
              Sample
            </button>{" "}
            ·{" "}
            <button
              type="button"
              onClick={() => run(SAMPLE_IDS[0].toLowerCase())}
              className="inline-block px-2 py-1.5 text-[var(--color-primary)] underline underline-offset-4"
            >
              an ID
            </button>{" "}
            ·{" "}
            <button
              type="button"
              onClick={() => run("Priya")}
              className="inline-block px-2 py-1.5 text-[var(--color-primary)] underline underline-offset-4"
            >
              an expired one
            </button>
          </p>
        </form>
      </Card>

      <div aria-live="polite" className="min-h-[3rem]">
        {!ready || !now ? null : outcome === null || outcome.kind === "empty" ? null : outcome.kind === "too-short" ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            Enter at least {MIN_NAME_QUERY} characters of a name, or a full certificate ID.
          </p>
        ) : outcome.results.length === 0 ? (
          <Card variant="panel" className="p-5 sm:p-6">
            <h2 className="text-h1 mb-2">No certificate found</h2>
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              {outcome.kind === "id"
                ? `We found no certificate with ID ${outcome.query}. Check the ID and try again.`
                : "We found no matching certificate. Name searches show only people who have chosen to be listed. If you have a certificate ID or link, search by that instead."}
            </p>
          </Card>
        ) : (
          <div>
            <h2 className="text-h1 mb-1">
              {outcome.results.length} {outcome.results.length === 1 ? "result" : "results"}
            </h2>
            {outcome.kind === "name" && outcome.truncated && (
              <p className="text-body-sm mb-3 text-[var(--color-ink-quiet)]">
                Showing the first {outcome.results.length}. Add more of the name to narrow it down.
              </p>
            )}
            <ul className="mt-4 flex flex-col gap-4">
              {outcome.results.map((c) => {
                const st = statusOf(c.expiresOn, now);
                return (
                  <li key={c.id}>
                    <Link href={`/verify/${c.id}`} className="block">
                      <Card variant="panel" className="p-5 transition-colors hover:border-[var(--color-primary)]">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <StatusChip status={st.status} />
                          <span className="text-label rounded-full border border-dashed border-[var(--color-line-strong)] px-2 py-0.5 text-[0.6rem]">
                            Sample
                          </span>
                        </div>
                        <p className="text-body-lg font-medium">{c.holderName}</p>
                        <p className="text-body-sm text-[var(--color-ink-quiet)]">
                          {c.programmeTitle} · {c.formatName}
                        </p>
                        <p className="text-body-sm mt-1 text-[var(--color-ink-faint)]">
                          Completed {formatDate(c.completedOn)} · <span className="text-mono">{c.id}</span>
                        </p>
                        <p className="text-body-sm mt-3 font-medium text-[var(--color-primary)]">
                          View certificate →
                        </p>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
