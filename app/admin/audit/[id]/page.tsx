import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { authorise } from "@/modules/identity/session";
import { getAuditForAdmin } from "@/modules/platform/audit/admin.repository";
import { Card } from "@/shared/ui/Card";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * /admin/audit/[id] — one audit row in full (M8 plan §2 item 5): who, what,
 * which entity, and the before/after snapshots as read-only JSON. Nothing
 * here writes. Unknown id → 404.
 */
export const metadata: Metadata = { title: "Audit row" };

export const dynamic = "force-dynamic";

function pretty(value: unknown): string {
  if (value === null || value === undefined) return "—";
  return JSON.stringify(value, null, 2);
}

export default async function AdminAuditDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await authorise("platform_admin");
  if (!result.ok) forbidden(); // M12: a Trainer may enter /admin but not this screen (403, never a blank page)
  const { id } = await params;
  const row = await getAuditForAdmin(id);
  if (!row) notFound();
  const entityLink =
    row.entityType === "user" ? `/admin/users/${row.entityId}` : row.entityType === "review" ? `/admin/reviews/${row.entityId}` : row.entityType === "certificate" ? `/admin/certificates/${row.entityId}` : null;

  return (
    <div className="flex flex-col gap-6" data-testid="audit-detail" data-audit-id={row.id}>
      <header>
        <Link href="/admin/audit" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Audit log
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Audit row</p>
        <h1 className="text-display" data-testid="admin-audit-action">
          {row.action}
        </h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">{formatTimestamp(row.createdAt)}</p>
      </header>

      <Card variant="panel" className="p-6">
        <h2 className="text-h2 mb-4">Details</h2>
        <dl className="text-body-sm grid gap-y-3 sm:grid-cols-2 sm:gap-x-6">
          <div>
            <dt className="text-label mb-1">Actor</dt>
            <dd className="break-all" data-testid="admin-audit-actor">
              {row.actorEmail ?? (row.actorUserId ? <span className="text-mono">{row.actorUserId}</span> : "system")}
              {row.actorEmail && row.actorUserId ? (
                <>
                  {" "}
                  ·{" "}
                  <Link href={`/admin/users/${row.actorUserId}`} className="text-[var(--color-primary)] underline underline-offset-4">
                    open person
                  </Link>
                </>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-label mb-1">Entity</dt>
            <dd className="break-all">
              {row.entityType} <span className="text-mono text-[var(--color-ink-quiet)]">{row.entityId}</span>
              {entityLink ? (
                <>
                  {" "}
                  ·{" "}
                  <Link href={entityLink} className="text-[var(--color-primary)] underline underline-offset-4">
                    open
                  </Link>
                </>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-label mb-1">Reason</dt>
            <dd className="whitespace-pre-line">{row.reason ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-label mb-1">Row id</dt>
            <dd className="text-mono break-all">{row.id}</dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-3">Before</h2>
          <pre className="text-body-sm overflow-x-auto rounded-[var(--radius-plate)] bg-[var(--color-ground)] p-4 whitespace-pre-wrap break-all" data-testid="admin-audit-before">
            {pretty(row.before)}
          </pre>
        </Card>
        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-3">After</h2>
          <pre className="text-body-sm overflow-x-auto rounded-[var(--radius-plate)] bg-[var(--color-ground)] p-4 whitespace-pre-wrap break-all" data-testid="admin-audit-after">
            {pretty(row.after)}
          </pre>
        </Card>
      </div>
    </div>
  );
}
