import type { Metadata } from "next";
import Link from "next/link";
import { type AdminUserFilters, listUsersForAdmin, parseRoleFilter, ROLE_LABEL } from "@/modules/identity/admin-users.repository";
import { ROLES } from "@/modules/identity/roles.repository";
import { authorise } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { inputClass } from "@/shared/ui/forms";
import { formatCalendarDate } from "@/shared/util/dates";

/*
 * /admin/users — people list (M8 plan §2 item 4). The admin layout gates the
 * route (platform_admin). Search and the role filter are GET parameters so
 * a filtered view is a URL. Email is shown here and nowhere public; nothing
 * from the profile beyond the identity row appears in the list.
 */
export const metadata: Metadata = { title: "Users" };

export const dynamic = "force-dynamic";

const columns = ["Person", "Roles", "Registrations", "Certificates", "Joined", ""];

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const result = await authorise("platform_admin");
  if (!result.ok) return null; // the layout has already refused
  const sp = await searchParams;
  const param = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).trim() : null);
  const filters: AdminUserFilters = {
    q: param("q") || undefined,
    role: parseRoleFilter(param("role")),
    page: Math.max(1, Number.parseInt(param("page") ?? "1", 10) || 1),
  };
  const page = await listUsersForAdmin(filters);

  const query = (p: number) => {
    const q = new URLSearchParams();
    if (filters.q) q.set("q", filters.q);
    if (filters.role) q.set("role", filters.role);
    if (p > 1) q.set("page", String(p));
    const s = q.toString();
    return s ? `/admin/users?${s}` : "/admin/users";
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Operations
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">People</p>
        <h1 className="text-display" data-testid="admin-users-title">
          Users
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          Everyone with an account. Open a person to see their registrations, orders, certificates and roles, and to grant or revoke administrator access.
        </p>
      </header>

      <Card variant="panel" className="p-5">
        <form method="get" action="/admin/users" className="grid gap-4 sm:grid-cols-3" aria-label="Filter users">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="f-q" className="text-label">
              Search
            </label>
            <input id="f-q" name="q" type="search" defaultValue={filters.q ?? ""} placeholder="Name or email" className={inputClass} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="f-role" className="text-label">
              Role
            </label>
            <select id="f-role" name="role" defaultValue={filters.role ?? ""} className={inputClass}>
              <option value="">Any</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-3 sm:col-span-3">
            <Button type="submit">Apply</Button>
            <Button variant="text" href="/admin/users">
              Clear
            </Button>
            <span className="text-body-sm ml-auto text-[var(--color-ink-quiet)]" data-testid="admin-users-count">
              {page.total} {page.total === 1 ? "person" : "people"}
            </span>
          </div>
        </form>
      </Card>

      {page.items.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="admin-users-empty">
            No one matches
          </p>
          <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">Try a shorter search or clear the role filter.</p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[880px] border-collapse" data-testid="admin-users-table">
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
              {page.items.map((u) => (
                <tr key={u.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="user-row" data-user-id={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--color-ink)]">{u.name}</p>
                    <p className="break-all text-[var(--color-ink-quiet)]">{u.email}</p>
                    {u.emailVerifiedAt ? null : <p className="text-[var(--color-ink-faint)]">email not verified</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5" data-testid="user-row-roles">
                      {u.roles.map((r) => (
                        <Chip key={`${r.role}-${r.scopeType}-${r.scopeId ?? ""}`} tone={r.role === "platform_admin" ? "primary" : "neutral"}>
                          {ROLE_LABEL[r.role]}
                        </Chip>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">{u.registrationCount}</td>
                  <td className="px-4 py-3 text-[var(--color-ink)]">{u.certificateCount}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatCalendarDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u.id}`} className="text-[var(--color-primary)] underline underline-offset-4" aria-label={`Open ${u.name}`}>
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
