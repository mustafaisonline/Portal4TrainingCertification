import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "@/db/prisma";
import { ENQUIRY_KIND_LABEL, ENQUIRY_STATUS_LABEL, getEnquiryForAdmin } from "@/modules/catalogue/enquiries/admin.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { EnquiryStatusActions } from "../EnquiryStatusActions";

/*
 * /admin/enquiries/[id] — one enquiry in full (Milestone 8 plan §2 item 3):
 * the message rendered as TEXT (never HTML), who sent it, the programme and
 * source page, the status controls, and the audit history for this row.
 * Unknown id → 404.
 */
export const metadata: Metadata = { title: "Enquiry" };

export const dynamic = "force-dynamic";

function describe(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v === null ? "null" : String(v)}`)
      .join(" · ");
  }
  return String(value);
}

export default async function AdminEnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enquiry = await getEnquiryForAdmin(id);
  if (!enquiry) notFound();
  const audit = await listAuditForEntity(getPrisma(), "enquiry", enquiry.id);

  return (
    <div className="flex flex-col gap-6" data-testid="enquiry-detail">
      <header>
        <Link href="/admin/enquiries" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Enquiries
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">{ENQUIRY_KIND_LABEL[enquiry.kind]}</p>
        <h1 className="text-display" data-testid="enquiry-title">
          {enquiry.name}
        </h1>
        <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
          <a href={`mailto:${enquiry.email}`} className="text-[var(--color-primary)] underline underline-offset-4">
            {enquiry.email}
          </a>
          {enquiry.organisation ? ` · ${enquiry.organisation}` : ""}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card variant="panel" className="p-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <span data-testid="enquiry-status">
              <Chip tone={enquiry.status === "new" ? "primary" : "neutral"}>{ENQUIRY_STATUS_LABEL[enquiry.status]}</Chip>
            </span>
          </div>
          <p className="text-body-sm whitespace-pre-line text-[var(--color-ink)]" data-testid="enquiry-message">
            {enquiry.message}
          </p>
          <div className="mt-6 border-t border-[var(--color-line)] pt-4">
            <EnquiryStatusActions enquiryId={enquiry.id} status={enquiry.status} />
            <p className="text-body-sm mt-3 text-[var(--color-ink-faint)]">Reply from your mailbox; nothing is emailed from this screen.</p>
          </div>
        </Card>

        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-4">Details</h2>
          <dl className="text-body-sm grid gap-y-3">
            <div>
              <dt className="text-label mb-1">Received</dt>
              <dd>{formatTimestamp(enquiry.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Kind</dt>
              <dd>{ENQUIRY_KIND_LABEL[enquiry.kind]}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Programme</dt>
              <dd>{enquiry.programmeTitle ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Source page</dt>
              <dd className="text-mono break-all">{enquiry.sourcePath}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Organisation</dt>
              <dd>{enquiry.organisation ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Reference</dt>
              <dd className="text-mono break-all">
                {enquiry.id.slice(0, 8).toUpperCase()} <span className="text-[var(--color-ink-faint)]">({enquiry.id})</span>
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card variant="panel" className="overflow-x-auto p-0">
        <h2 className="text-h2 px-6 pt-6">History</h2>
        <table className="text-body-sm w-full min-w-[640px] border-collapse" data-testid="enquiry-audit">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["When", "Action", "Before", "After"].map((c) => (
                <th key={c} scope="col" className="text-label px-6 py-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {audit.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                  No status changes yet.
                </td>
              </tr>
            ) : (
              audit.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="enquiry-audit-row">
                  <td className="px-6 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(a.createdAt)}</td>
                  <td className="px-6 py-3 text-[var(--color-ink)]">{a.action}</td>
                  <td className="px-6 py-3 text-[var(--color-ink-quiet)]">{describe(a.before)}</td>
                  <td className="px-6 py-3 text-[var(--color-ink-quiet)]">{describe(a.after)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
