import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { listUpcomingPublicOfferings, MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { scopeWhere } from "@/modules/catalogue/programmes/admin.repository";
import { getPrisma } from "@/db/prisma";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { bccMailto, emailList, interestEmailDraft } from "@/modules/commerce/interest-rules";
import { listInterests } from "@/modules/commerce/interest.repository";
import { CopyLinkButton } from "@/modules/certificates/components/CopyLinkButton";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { inputClass } from "@/shared/ui/forms";
import { formatDateRange, formatTimestamp } from "@/shared/util/dates";
import { InterestTable, type InterestTableRow } from "./InterestTable";

/*
 * /admin/interest — "Users Interest" (CR-2026-10-01-2138, F3/F4; founder: "Trainer
 * will have a new tab: Users Interest to see interested candidates … Trainer
 * should email to all these interested people about the schedule … Admin should
 * also have a tab"). A Trainer sees the people interested in their OWN
 * trainings; the administrator sees everyone — the same scope as the Trainings
 * area, applied in the repository. Date of birth appears only here.
 *
 * The portal has no email provider yet (EMAIL_TRANSPORT=log), so telling people
 * about a schedule is: copy the addresses, open a ready-made BCC message, or
 * download the CSV — then "Mark as notified". Real sending is a separate decision.
 */
export const metadata: Metadata = { title: "Users Interest" };
export const dynamic = "force-dynamic";

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function AdminInterestPage({ searchParams }: { searchParams: Promise<Search> }) {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/interest")}`);
    forbidden();
  }
  const sp = await searchParams;
  const formatId = one(sp["format"]);
  const programmeId = one(sp["training"]);
  const notified = one(sp["notified"]) === "yes" ? "yes" : one(sp["notified"]) === "no" ? "no" : undefined;

  const prisma = getPrisma();
  const [trainings, rows] = await Promise.all([
    prisma.programme.findMany({
      where: scopeWhere(access.scope),
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true, title: true, formatsDelivery: { orderBy: { position: "asc" }, select: { id: true, name: true } } },
    }),
    listInterests(access.scope, { formatId: formatId || undefined, programmeId: programmeId || undefined, notified }),
  ]);

  const tableRows: InterestTableRow[] = rows.map((r) => ({
    id: r.id,
    name: r.fullName ?? "",
    email: r.email,
    mobile: r.mobile ?? "",
    dateOfBirth: r.dateOfBirth ? r.dateOfBirth.toISOString().slice(0, 10) : "",
    training: r.programmeTitle,
    format: r.formatName,
    registered: formatTimestamp(r.confirmedAt),
    fee: r.feeWaived ? "Fee waived" : "Paid",
    notified: r.notifiedAt ? formatTimestamp(r.notifiedAt) : "",
  }));

  // A ready-made message needs ONE format (its schedule goes in the body).
  const single = formatId && rows.length > 0 && rows.every((r) => r.formatId === formatId) ? rows[0]! : null;
  let draft = null as ReturnType<typeof interestEmailDraft> | null;
  if (single) {
    const offerings = (await listUpcomingPublicOfferings(single.programmeId)).filter((o) => o.deliveryFormatId === single.formatId && o.status === "open");
    draft = interestEmailDraft({
      trainingTitle: single.programmeTitle,
      formatName: single.formatName,
      scheduleLines: offerings.map((o) => `${formatDateRange(o.startsOn, o.endsOn)} · ${MODALITY_LABEL[o.modality]}${o.location ? ` · ${o.location}` : ""}`),
      registerUrl: `${appBaseUrl()}/programs/${single.programmeSlug}`,
      trainerName: access.user.name,
    });
  }
  const emails = emailList(rows.map((r) => r.email));
  const mailto = draft ? bccMailto(rows.map((r) => r.email), draft) : null;
  const csvQuery = new URLSearchParams();
  if (formatId) csvQuery.set("format", formatId);
  if (programmeId) csvQuery.set("training", programmeId);
  if (notified) csvQuery.set("notified", notified);
  const csvHref = `/admin/interest/export.csv${csvQuery.size ? `?${csvQuery}` : ""}`;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">{access.isAdmin ? "Admin" : "Trainer"}</p>
        <h1 className="text-display" data-testid="interest-title">
          Users Interest
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          People who registered their interest in a training format.{" "}
          {access.isAdmin ? "You see everyone." : "You see the people interested in your own trainings."} Use this to plan a training; once a format is scheduled, email them the dates
          and ask them to register on the portal, then mark them as notified. These details are personal data — use them only for this purpose.
        </p>
      </header>

      <Card variant="panel" className="p-5">
        <form method="get" action="/admin/interest" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Filter the list">
          <div className="flex flex-col gap-2">
            <label htmlFor="i-training" className="text-label">Training</label>
            <select id="i-training" name="training" defaultValue={programmeId} className={inputClass}>
              <option value="">All trainings</option>
              {trainings.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="i-format" className="text-label">Format</label>
            <select id="i-format" name="format" defaultValue={formatId} className={inputClass}>
              <option value="">All formats</option>
              {trainings.flatMap((t) => t.formatsDelivery.map((f) => (
                <option key={f.id} value={f.id}>{t.title} — {f.name}</option>
              )))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="i-notified" className="text-label">Told about a date</label>
            <select id="i-notified" name="notified" defaultValue={notified ?? ""} className={inputClass}>
              <option value="">Any</option>
              <option value="no">Not yet</option>
              <option value="yes">Already told</option>
            </select>
          </div>
          <div className="flex items-end gap-3">
            <Button type="submit" data-testid="interest-filter">Filter</Button>
            <Link href="/admin/interest" className="text-body-sm py-2 text-[var(--color-primary)] underline underline-offset-4">Clear</Link>
          </div>
        </form>
      </Card>

      {rows.length === 0 ? (
        <Card variant="panel" className="p-6" data-testid="interest-empty">
          <p className="text-body-lg font-medium">No one has registered interest{formatId || programmeId || notified ? " matching this filter" : " yet"}.</p>
          <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">People can register interest in a format that has no open date, from its training page.</p>
        </Card>
      ) : (
        <>
          <Card variant="panel" className="flex flex-col gap-4 p-5" data-testid="interest-tools">
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="interest-count">
              {rows.length} {rows.length === 1 ? "person" : "people"} listed.
            </p>
            <div className="flex flex-wrap items-start gap-4">
              <CopyLinkButton href={emails} literal label="Copy all emails" testId="interest-copy-emails" />
              {mailto ? (
                <Button variant="secondary" href={mailto} data-testid="interest-mailto">
                  Open an email to all (BCC)
                </Button>
              ) : null}
              <Button variant="secondary" href={csvHref} data-testid="interest-csv">
                Download CSV
              </Button>
            </div>
            {!single ? (
              <p className="text-body-sm text-[var(--color-ink-faint)]" data-testid="interest-draft-hint">
                Choose one format in the filter to get a ready-made message with its schedule.
              </p>
            ) : null}
            {single && !mailto ? (
              <p className="text-body-sm text-[var(--color-ink-faint)]" data-testid="interest-mailto-long">
                There are too many people for one email link — use &ldquo;Copy all emails&rdquo; and paste them into the BCC line.
              </p>
            ) : null}
            {draft ? (
              <div className="flex flex-col gap-2" data-testid="interest-draft">
                <label htmlFor="interest-draft-text" className="text-label">Message (edit before sending)</label>
                <textarea id="interest-draft-text" readOnly rows={12} defaultValue={`Subject: ${draft.subject}\n\n${draft.body}`} className={inputClass} />
              </div>
            ) : null}
          </Card>
          <InterestTable rows={tableRows} />
        </>
      )}
    </div>
  );
}
