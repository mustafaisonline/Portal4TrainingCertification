import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import Link from "next/link";
import {
  ENQUIRY_KIND_LABEL,
  ENQUIRY_KINDS,
  ENQUIRY_STATUS_LABEL,
  ENQUIRY_STATUSES,
  isEnquiryKind,
  isEnquiryStatus,
  listEnquiriesForAdmin,
  type AdminEnquiryFilters,
} from "@/modules/catalogue/enquiries/admin.repository";
import { authorise } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { inputClass } from "@/shared/ui/forms";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * /admin/enquiries — contact and register-interest submissions (Milestone 8
 * plan §2 item 3): status filter, kind filter, search; newest first. Plain
 * GET parameters, as /admin/reviews. The message itself is on the detail
 * screen. Replies happen from the founder's mailbox — nothing is sent here.
 */
export const metadata: Metadata = { title: "Enquiries" };

export const dynamic = "force-dynamic";

const columns = ["Received", "From", "Kind", "Programme", "Source page", "Status", ""];

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const gate = await authorise("platform_admin");
  if (!gate.ok) forbidden(); // M12: a Trainer may enter /admin but not this screen (403, never a blank page)
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : null);
  const statusRaw = param("status");
  const kindRaw = param("kind");
  const filters: AdminEnquiryFilters = {
    status: statusRaw && isEnquiryStatus(statusRaw) ? statusRaw : undefined,
    kind: kindRaw && isEnquiryKind(kindRaw) ? kindRaw : undefined,
    q: param("q") || undefined,
    page: Math.max(1, Number.parseInt(param("page") ?? "1", 10) || 1),
  };
  const result = await listEnquiriesForAdmin(filters);

  const query = (n: number) => {
    const q = new URLSearchParams();
    if (filters.q) q.set("q", filters.q);
    if (filters.status) q.set("status", filters.status);
    if (filters.kind) q.set("kind", filters.kind);
    if (n > 1) q.set("page", String(n));
    const s = q.toString();
    return s ? `/admin/enquiries?${s}` : "/admin/enquiries";
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Contact & interest</p>
        <h1 className="text-display" data-testid="admin-enquiries-title">
          Enquiries
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          Messages from the contact form and register-interest forms. Reply from your mailbox, then mark the enquiry replied or closed here so the board stays accurate.
        </p>
      </header>

      <Card variant="panel" className="p-5">
        <form method="get" action="/admin/enquiries" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter enquiries">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="f-q" className="text-label">
              Search
            </label>
            <input id="f-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Name, email, organisation or words in the message" className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-status" className="text-label">
              Status
            </label>
            <select id="f-status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
              <option value="">Any</option>
              {ENQUIRY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ENQUIRY_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-kind" className="text-label">
              Kind
            </label>
            <select id="f-kind" name="kind" defaultValue={filters.kind ?? ""} className={inputClass}>
              <option value="">Any</option>
              {ENQUIRY_KINDS.map((k) => (
                <option key={k} value={k}>
                  {ENQUIRY_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-4">
            <Button type="submit">Apply</Button>
            <Button variant="text" href="/admin/enquiries">
              Clear
            </Button>
            <span className="text-body-sm ml-auto text-[var(--color-ink-quiet)]" data-testid="admin-enquiries-count">
              {result.total} {result.total === 1 ? "enquiry" : "enquiries"}
            </span>
          </div>
        </form>
      </Card>

      {result.items.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="admin-enquiries-empty">
            No enquiries match
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">Nothing has been submitted with these filters.</p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[960px] border-collapse" data-testid="admin-enquiries-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {columns.map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Open</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.items.map((e) => (
                <tr key={e.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="enquiry-row" data-enquiry-id={e.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(e.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-ink)]">{e.name}</p>
                    <p className="break-all text-[var(--color-ink-quiet)]">{e.email}</p>
                    {e.organisation ? <p className="text-[var(--color-ink-quiet)]">{e.organisation}</p> : null}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{ENQUIRY_KIND_LABEL[e.kind]}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]">{e.programmeTitle ?? "—"}</td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]">
                    <span className="text-mono break-all">{e.sourcePath}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span data-testid="enquiry-row-status">
                      <Chip tone={e.status === "new" ? "primary" : "neutral"}>{ENQUIRY_STATUS_LABEL[e.status]}</Chip>
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link href={`/admin/enquiries/${e.id}`} className="text-[var(--color-primary)] underline underline-offset-4" aria-label={`Open enquiry from ${e.name}`} data-testid="enquiry-open">
                      Open
                    </Link>
                  </td>
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
    </div>
  );
}
