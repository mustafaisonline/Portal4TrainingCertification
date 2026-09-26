import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import Link from "next/link";
import { CERTIFICATE_STATUS_LABEL, CERTIFICATE_STATUSES, isCertificateStatus } from "@/modules/certificates/constants";
import { formatCalendarDate } from "@/modules/certificates/dates";
import { formatRunTime } from "@/modules/certificates/reminders";
import { lastReminderRun } from "@/modules/certificates/reminders.service";
import { listCertificatesForAdmin, type AdminCertificateFilters } from "@/modules/certificates/repository";
import { authorise } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { inputClass } from "@/shared/ui/forms";
import { CertificateStatusLabel } from "./StatusLabel";

/*
 * /admin/certificates — every Certificate of Completion (M6 plan §5
 * "Admin"): search by printed ID, holder name or email; status filter;
 * pagination. Plain GET parameters so a filtered view is a URL, as
 * /admin/reviews does. Status is computed on read against today's MYT date
 * (no status column — plan §4). Email appears here and never publicly.
 */
export const metadata: Metadata = { title: "Certificates" };

export const dynamic = "force-dynamic";

const columns = ["Certificate ID", "Holder", "Email", "Programme", "Issued", "Expires", "Status"];

export default async function AdminCertificatesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const result = await authorise("platform_admin");
  if (!result.ok) forbidden(); // M12: a Trainer may enter /admin but not this screen (403, never a blank page)
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : null);
  const statusRaw = param("status");
  const filters: AdminCertificateFilters = {
    q: param("q") || undefined,
    status: statusRaw && isCertificateStatus(statusRaw) ? statusRaw : undefined,
    page: Math.max(1, Number.parseInt(param("page") ?? "1", 10) || 1),
  };
  const [page, lastRun] = await Promise.all([listCertificatesForAdmin(filters), lastReminderRun()]);

  const query = (n: number) => {
    const q = new URLSearchParams();
    if (filters.q) q.set("q", filters.q);
    if (filters.status) q.set("status", filters.status);
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return s ? `/admin/certificates?${s}` : "/admin/certificates";
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
            ← Operations
          </Link>
          <p className="text-label mb-2 text-[var(--color-primary)]">Completion records</p>
          <h1 className="text-display" data-testid="admin-certificates-title">
            Certificates
          </h1>
          <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
            Every Certificate of Completion issued from an offering&apos;s roster. Status is worked out from the expiry date in Malaysia time: active, renewal due in the last 30 days,
            expired the day after, or revoked.
          </p>
          {/* M7 plan §2.4: the newest job.run row of the reminder job. */}
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]" data-testid="reminders-last-run">
            {lastRun
              ? `Reminders: last run ${formatRunTime(lastRun.ranAt)} · considered ${lastRun.considered} · queued ${lastRun.queued}${lastRun.failed > 0 ? ` · failed ${lastRun.failed}` : ""}`
              : "Reminders have not run yet."}
          </p>
        </div>
        <Button variant="secondary" href="/admin/certificates/fee" data-testid="admin-certificates-fee-link">
          Renewal fee
        </Button>
      </header>

      <Card variant="panel" className="p-5">
        <form method="get" action="/admin/certificates" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter certificates">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="f-q" className="text-label">
              Search
            </label>
            <input id="f-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Certificate ID, holder name or email" className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-status" className="text-label">
              Status
            </label>
            <select id="f-status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
              <option value="">Any</option>
              {CERTIFICATE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CERTIFICATE_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit">Apply</Button>
            <Button variant="text" href="/admin/certificates">
              Clear
            </Button>
          </div>
          <p className="text-body-sm text-[var(--color-ink-quiet)] sm:col-span-2 lg:col-span-4" data-testid="admin-certificates-count">
            {page.total} {page.total === 1 ? "certificate" : "certificates"}
          </p>
        </form>
      </Card>

      {page.items.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="admin-certificates-empty">
            No certificates match
          </p>
          <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">
            {filters.q || filters.status
              ? "Nothing has been issued with these filters."
              : "Nothing has been issued yet. A certificate appears here when completion is recorded on an offering's participants screen."}
          </p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[1000px] border-collapse" data-testid="admin-certificates-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {columns.map((c) => (
                  <th key={c} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.items.map((c) => (
                <tr key={c.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="admin-certificate-row">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/admin/certificates/${c.id}`} className="text-mono text-[var(--color-primary)] underline underline-offset-4" data-testid="admin-certificate-id">
                      {c.certificateId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-[var(--color-ink)]" data-testid="admin-certificate-holder">
                    {c.holderName}
                  </td>
                  <td className="px-4 py-3 break-all text-[var(--color-ink-quiet)]">{c.userEmail}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]">
                    <p className="text-[var(--color-ink)]">{c.programmeTitle}</p>
                    <p>{c.formatName}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatCalendarDate(c.issuedOn)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatCalendarDate(c.expiresOn)}</td>
                  <td className="px-4 py-3">
                    <CertificateStatusLabel status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {page.pageCount > 1 ? (
        <nav aria-label="Pages" className="flex flex-wrap items-center gap-3">
          {page.page > 1 ? (
            <Button variant="secondary" href={query(page.page - 1)}>
              Previous
            </Button>
          ) : null}
          <span className="text-body-sm text-[var(--color-ink-quiet)]">
            Page {page.page} of {page.pageCount}
          </span>
          {page.page < page.pageCount ? (
            <Button variant="secondary" href={query(page.page + 1)}>
              Next
            </Button>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
