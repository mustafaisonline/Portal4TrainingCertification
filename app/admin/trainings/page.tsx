import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { FEE_REGIONS, PROGRAMME_STATUS_LABEL } from "@/modules/catalogue/programmes/constants";
import { listTrainings } from "@/modules/catalogue/programmes/admin.repository";
import { levelLabel } from "@/modules/catalogue/programmes/types";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";

/*
 * /admin/trainings — every training in the caller's scope (M12 WP2): an
 * administrator sees all; a Trainer sees the ones linked to their profile
 * (L7). Each row shows what a launch still needs — modules, pace formats,
 * the four fee rows, an open date — so an incomplete training is obvious
 * before it is published.
 */
export const metadata: Metadata = { title: "Trainings" };
export const dynamic = "force-dynamic";

const columns = ["Training", "Level", "Status", "Modules", "Formats", "Fees", "Open dates", "Updated", ""];

export default async function AdminTrainingsPage() {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/trainings")}`);
    forbidden();
  }
  const trainings = await listTrainings(access.scope);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
            ← Operations
          </Link>
          <p className="text-label mb-2 text-[var(--color-primary)]">Catalogue</p>
          <h1 className="text-display" data-testid="trainings-title">
            {access.isAdmin ? "Trainings" : "My trainings"}
          </h1>
          <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
            Everything a training publishes lives here — details, editorial sections, curriculum, pace formats, the four fee rows and its dates. A new training starts as a draft and appears on the public site only once an administrator publishes it.
          </p>
        </div>
        <Button href="/admin/trainings/new" data-testid="new-training">
          New training
        </Button>
      </header>

      {trainings.length === 0 ? (
        <Card variant="panel" className="p-5 sm:p-6">
          <p className="text-body-lg font-medium" data-testid="trainings-empty">
            No trainings yet
          </p>
          <p className="text-body-sm mt-2 max-w-[60ch] text-[var(--color-ink-quiet)]">Create the first one; it stays a draft until it is published.</p>
          <div className="mt-5">
            <Button href="/admin/trainings/new">New training</Button>
          </div>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[960px] border-collapse" data-testid="trainings-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {columns.map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trainings.map((t) => (
                <tr key={t.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="training-row" data-slug={t.slug}>
                  <td className="px-4 py-3 align-top">
                    <span className="block text-[var(--color-ink)]">{t.title}</span>
                    <span className="text-mono block text-[var(--color-ink-faint)]">/programs/{t.slug}</span>
                    {t.flagship ? <Chip>Flagship</Chip> : null}
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{levelLabel(t.level)}</td>
                  <td className="px-4 py-3 align-top">
                    <Chip tone={t.status === "published" ? "primary" : "neutral"}>{PROGRAMME_STATUS_LABEL[t.status]}</Chip>
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{t.moduleCount}</td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{t.formatCount}</td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]" data-testid="training-fees">
                    {t.feeCount} of {FEE_REGIONS.length}
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{t.openDates}</td>
                  <td className="px-4 py-3 align-top whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(t.updatedAt)}</td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/admin/trainings/${t.id}`} className="text-[var(--color-primary)] underline underline-offset-4" aria-label={`Edit ${t.title}`}>
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
