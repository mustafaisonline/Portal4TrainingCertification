import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import Link from "next/link";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { authorise } from "@/modules/identity/session";
import { findUserByEmail } from "@/modules/identity/users.repository";
import { type AuditAdminFilters, listAuditFilterValues, listAuditForAdmin } from "@/modules/platform/audit/admin.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { inputClass } from "@/shared/ui/forms";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * /admin/audit — the audit log, newest first (M8 plan §2 item 5). Filters
 * are GET parameters. READ-ONLY by construction: this page and its detail
 * render no form that posts anywhere and import no write. The actor column
 * shows the email resolved from `users`, or "system".
 */
export const metadata: Metadata = { title: "Audit log" };

export const dynamic = "force-dynamic";

/** A uuid that matches no row: what an unknown actor email filters to. */
const NO_ONE = "00000000-0000-0000-0000-000000000000";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function summarise(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "object") return String(value);
  const entries = Object.entries(value as Record<string, unknown>);
  const text = entries.map(([k, v]) => `${k}: ${v === null ? "null" : typeof v === "object" ? JSON.stringify(v) : String(v)}`).join(" · ");
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

export default async function AdminAuditPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const result = await authorise("platform_admin");
  if (!result.ok) forbidden(); // M12: a Trainer may enter /admin but not this screen (403, never a blank page)
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : null);

  const actorRaw = param("actor") || null;
  let actorUserId: string | null | undefined;
  if (actorRaw === "system") actorUserId = null;
  else if (actorRaw && isUuid(actorRaw)) actorUserId = actorRaw;
  else if (actorRaw) actorUserId = (await findUserByEmail(actorRaw))?.id ?? NO_ONE;

  const fromRaw = param("from");
  const toRaw = param("to");
  const filters: AuditAdminFilters = {
    action: param("action") || undefined,
    entityType: param("entityType") || undefined,
    entityId: param("entityId") || undefined,
    actorUserId,
    from: fromRaw && ISO_DATE.test(fromRaw) ? new Date(`${fromRaw}T00:00:00.000Z`) : undefined,
    to: toRaw && ISO_DATE.test(toRaw) ? new Date(`${toRaw}T23:59:59.999Z`) : undefined,
    page: Math.max(1, Number.parseInt(param("page") ?? "1", 10) || 1),
  };
  const [page, values] = await Promise.all([listAuditForAdmin(filters), listAuditFilterValues()]);

  const query = (p: number) => {
    const q = new URLSearchParams();
    if (filters.action) q.set("action", filters.action);
    if (filters.entityType) q.set("entityType", filters.entityType);
    if (filters.entityId) q.set("entityId", filters.entityId);
    if (actorRaw) q.set("actor", actorRaw);
    if (fromRaw) q.set("from", fromRaw);
    if (toRaw) q.set("to", toRaw);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/admin/audit?${s}` : "/admin/audit";
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Operations
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Traceability</p>
        <h1 className="text-display" data-testid="admin-audit-title">
          Audit log
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          Every change the portal records, newest first. Rows are written once and never edited or deleted; this screen only reads them.
        </p>
      </header>

      <Card variant="panel" className="p-5">
        <form method="get" action="/admin/audit" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Filter audit log">
          <div className="flex flex-col gap-2">
            <label htmlFor="f-action" className="text-label">
              Action
            </label>
            <select id="f-action" name="action" defaultValue={filters.action ?? ""} className={inputClass}>
              <option value="">Any</option>
              {values.actions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-entity-type" className="text-label">
              Entity type
            </label>
            <select id="f-entity-type" name="entityType" defaultValue={filters.entityType ?? ""} className={inputClass}>
              <option value="">Any</option>
              {values.entityTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-entity-id" className="text-label">
              Entity id
            </label>
            <input id="f-entity-id" name="entityId" type="text" defaultValue={filters.entityId ?? ""} placeholder="Exact id" className={`${inputClass} text-mono`} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-actor" className="text-label">
              Actor
            </label>
            <input id="f-actor" name="actor" type="text" defaultValue={actorRaw ?? ""} placeholder="Email, user id, or “system”" className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-from" className="text-label">
              From
            </label>
            <input id="f-from" name="from" type="date" defaultValue={fromRaw ?? ""} className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-to" className="text-label">
              To
            </label>
            <input id="f-to" name="to" type="date" defaultValue={toRaw ?? ""} className={inputClass} />
          </div>
          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
            <Button type="submit">Apply</Button>
            <Button variant="text" href="/admin/audit">
              Clear
            </Button>
            <span className="text-body-sm ml-auto text-[var(--color-ink-quiet)]" data-testid="admin-audit-count">
              {page.total} {page.total === 1 ? "row" : "rows"}
            </span>
          </div>
        </form>
      </Card>

      {page.items.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="admin-audit-empty">
            No rows match
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">Nothing has been recorded with these filters.</p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[1000px] border-collapse" data-testid="admin-audit-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {["Time", "Actor", "Action", "Entity", "Change", "Reason", ""].map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Open</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {page.items.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="audit-row" data-audit-id={a.id} data-action={a.action}>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(a.createdAt)}</td>
                  <td className="px-4 py-3 break-all text-[var(--color-ink)]" data-testid="audit-row-actor">
                    {a.actorEmail ?? (a.actorUserId ? <span className="text-mono">{a.actorUserId}</span> : "system")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink)]">{a.action}</td>
                  <td className="px-4 py-3">
                    <p>{a.entityType}</p>
                    <p className="text-mono break-all text-[var(--color-ink-quiet)]">{a.entityId}</p>
                  </td>
                  <td className="max-w-[360px] px-4 py-3 text-[var(--color-ink-quiet)]">
                    {a.before !== null && a.before !== undefined ? <p>before: {summarise(a.before)}</p> : null}
                    {a.after !== null && a.after !== undefined ? <p>after: {summarise(a.after)}</p> : null}
                  </td>
                  <td className="max-w-[240px] px-4 py-3 text-[var(--color-ink-quiet)]">{a.reason ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/audit/${a.id}`} className="text-[var(--color-primary)] underline underline-offset-4" aria-label={`Open audit row ${a.id}`}>
                      Open
                    </Link>
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
