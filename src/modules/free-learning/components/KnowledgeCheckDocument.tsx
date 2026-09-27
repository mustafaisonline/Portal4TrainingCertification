import type { AttemptRecord } from "../knowledge-check.repository";

/*
 * The printable Knowledge Check result DOCUMENT (Milestone 14 Phase 5;
 * DR-03 §3). Deliberately NOT the Certificate of Completion's design: a
 * result statement — name, size, score, pass, date, ID, verification link —
 * headed "Knowledge Check result", with the not-a-credential sentence on the
 * document itself. Server component; prints from the page's Print button.
 */
export function KnowledgeCheckDocument({ attempt, verifyUrl }: { attempt: AttemptRecord; verifyUrl: string }) {
  const percent = attempt.score !== null ? Math.round((attempt.score * 100) / attempt.size) : 0;
  const finished = attempt.finishedAt ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" }).format(attempt.finishedAt) : "";
  return (
    <article
      className="mx-auto max-w-[760px] rounded-[var(--radius-panel)] border border-[var(--color-line-strong)] bg-[var(--color-ground-raised)] p-8 sm:p-12 print:border-0 print:p-0"
      aria-label="Knowledge Check result document"
      data-testid="kc-document"
    >
      <p className="text-label mb-2 text-[var(--color-primary)]">Data &amp; AI Academy · Free Learning</p>
      <h2 className="text-display mb-6">Knowledge Check result</h2>
      <p className="text-body-lg mb-2">This is to record that</p>
      <p className="text-display-lg mb-4" data-testid="kc-document-name">
        {attempt.holderName}
      </p>
      <p className="text-body-lg mb-6">
        answered <strong>{attempt.score} of {attempt.size}</strong> questions correctly ({percent} %) on the free Knowledge Check drawn from the reviewed topics of{" "}
        <em>I Am Datapedia!</em> on {finished} — <strong>{attempt.passed ? "a pass at the 70 % mark" : "below the 70 % pass mark"}</strong>.
      </p>
      <dl className="text-body-sm mb-8 grid gap-x-8 gap-y-2 sm:grid-cols-2">
        <div>
          <dt className="text-label">Knowledge Check ID</dt>
          <dd className="text-mono" data-testid="kc-document-id">
            {attempt.publicId}
          </dd>
        </div>
        <div>
          <dt className="text-label">Verify at</dt>
          <dd className="text-mono break-all">{verifyUrl}</dd>
        </div>
      </dl>
      <p className="text-body-sm text-[var(--color-ink-faint)]">
        A Knowledge Check is a free, self-paced test of reading. This document is not a Certificate of Completion and not the Academy&rsquo;s
        credential, which is earned by attending an expert-led training.
      </p>
    </article>
  );
}
