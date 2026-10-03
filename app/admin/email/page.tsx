import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { EMAIL_LOG_STATUSES, emailLogCounts, isEmailLogStatus, listEmailLog, type EmailLogFilters } from "@/modules/notifications/email-log.repository";
import { emailDeliveryProblem } from "@/modules/notifications/email";
import { listSuppressions } from "@/modules/notifications/suppression";
import { authorise } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { inputClass } from "@/shared/ui/forms";
import { formatTimestamp } from "@/shared/util/dates";
import { AddSuppressionForm, RemoveSuppressionForm, RetryEmailForm } from "./EmailActions";

/*
 * /admin/email — the Email log and the do-not-send list (CR-2026-10-03-1225 slice 2). The log never shows an email's
 * body (it can hold a one-time link). Plain GET filters, as /admin/enquiries. Platform admins only.
 */
export const metadata: Metadata = { title: "Email" };
export const dynamic = "force-dynamic";

const STATUS_LABEL = { queued: "Waiting / retrying", sent: "Sent", failed: "Failed" } as const;
const columns = ["Created", "To", "Template", "Subject", "Status", "Tries", "Detail", ""];

export default async function AdminEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const gate = await authorise("platform_admin");
  if (!gate.ok) forbidden();
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : null);
  const statusRaw = param("status");
  const filters: EmailLogFilters = {
    status: statusRaw && isEmailLogStatus(statusRaw) ? statusRaw : undefined,
    q: param("q") || undefined,
    page: Math.min(10_000, Math.max(1, Number.parseInt(param("page") ?? "1", 10) || 1)),
  };
  const [result, counts, suppressions] = await Promise.all([listEmailLog(filters), emailLogCounts(), listSuppressions()]);
  const problem = emailDeliveryProblem();

  const query = (n: number) => {
    const q = new URLSearchParams();
    if (filters.q) q.set("q", filters.q);
    if (filters.status) q.set("status", filters.status);
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return s ? `/admin/email?${s}` : "/admin/email";
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Contact & interest</p>
        <h1 className="text-display" data-testid="admin-email-title">
          Email
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          Every email the portal sends is recorded here. A delivery error is retried automatically (after 1, 5 and 30 minutes); after four tries it shows as Failed and you can retry it by hand. Message bodies are not shown.
        </p>
      </header>

      {problem ? (
        <Card variant="panel" className="p-5" data-testid="admin-email-problem">
          <p className="text-body-lg font-medium">Email is not being delivered</p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">{problem}</p>
        </Card>
      ) : null}

      <Card variant="panel" className="p-5">
        <p className="text-body-sm" data-testid="admin-email-counts">
          <strong>{counts.queued}</strong> waiting or retrying · <strong>{counts.failed}</strong> failed
        </p>
        <form method="get" action="/admin/email" className="mt-4 grid gap-4 sm:grid-cols-3" aria-label="Filter the email log">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="f-q" className="text-label">
              Search
            </label>
            <input id="f-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Address, template or subject" className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-status" className="text-label">
              Status
            </label>
            <select id="f-status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
              <option value="">Any</option>
              {EMAIL_LOG_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3 sm:col-span-3">
            <Button type="submit">Apply</Button>
            <Button variant="text" href="/admin/email">
              Clear
            </Button>
            <span className="text-body-sm ml-auto text-[var(--color-ink-quiet)]" data-testid="admin-email-total">
              {result.total} {result.total === 1 ? "email" : "emails"}
            </span>
          </div>
        </form>
      </Card>

      {result.items.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="admin-email-empty">
            No emails match
          </p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[1000px] border-collapse" data-testid="admin-email-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {columns.map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Action</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.items.map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="email-row" data-email-id={e.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(e.createdAt)}</td>
                  <td className="px-4 py-3 break-all">{e.toEmail}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]">
                    <span className="text-mono break-all">{e.templateKey}</span>
                  </td>
                  <td className="px-4 py-3">{e.subject}</td>
                  <td className="px-4 py-3">
                    <span data-testid="email-row-status">
                      <Chip tone={e.status === "failed" ? "primary" : "neutral"}>{STATUS_LABEL[e.status]}</Chip>
                    </span>
                  </td>
                  <td className="px-4 py-3">{e.attempts}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]">
                    {e.status === "sent" && e.sentAt ? `Sent ${formatTimestamp(e.sentAt)}` : null}
                    {e.status === "queued" && e.nextAttemptAt ? `Next try ${formatTimestamp(e.nextAttemptAt)}` : null}
                    {e.status === "queued" && !e.nextAttemptAt ? "Waiting for the next run" : null}
                    {e.lastError && e.status !== "sent" ? <span className="block break-words">{e.lastError}</span> : null}
                  </td>
                  <td className="px-4 py-3">{e.status === "failed" ? <RetryEmailForm emailId={e.id} /> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {result.pageCount > 1 ? (
        <nav aria-label="Pages" className="flex flex-wrap items-center gap-3">
          {result.page > 1 ? (
            <Button variant="secondary" href={query(result.page - 1)}>
              Previous
            </Button>
          ) : null}
          <span className="text-body-sm text-[var(--color-ink-quiet)]">
            Page {result.page} of {result.pageCount}
          </span>
          {result.page < result.pageCount ? (
            <Button variant="secondary" href={query(result.page + 1)}>
              Next
            </Button>
          ) : null}
        </nav>
      ) : null}

      <section aria-labelledby="suppression-heading" className="flex flex-col gap-4" data-testid="suppression-section">
        <div>
          <h2 id="suppression-heading" className="text-title">
            Do-not-send list
          </h2>
          <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
            No email of any kind is sent to an address on this list — including sign-up and password emails. Add an address when a bounce notice says it does not exist, or when someone asks not to be written to. The mail services do not tell the portal about bounces, so this is done by hand.
          </p>
        </div>
        <Card variant="panel" className="p-5">
          <AddSuppressionForm />
        </Card>
        {suppressions.length === 0 ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="suppression-empty">
            No addresses on the list.
          </p>
        ) : (
          <Card variant="panel" className="overflow-x-auto p-0">
            <table className="text-body-sm w-full min-w-[640px] border-collapse" data-testid="suppression-table">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left">
                  {["Address", "Reason", "Added", ""].map((c, i) => (
                    <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                      {c || <span className="sr-only">Action</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {suppressions.map((s) => (
                  <tr key={s.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="suppression-row">
                    <td className="px-4 py-3 break-all">{s.email}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-quiet)]">{s.reason}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(s.createdAt)}</td>
                    <td className="px-4 py-3">
                      <RemoveSuppressionForm suppressionId={s.id} email={s.email} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
