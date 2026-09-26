import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { formatCalendarDate } from "@/modules/catalogue/offerings/dates";
import { listAllOfferings, MODALITY_LABEL, OFFERING_STATUS_LABEL } from "@/modules/catalogue/offerings/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { getTrainingForAdmin } from "@/modules/catalogue/programmes/admin.repository";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/* Dates tab (M12 WP2): this training's scheduled offerings — the existing
   offerings screens do the editing; "Add a date" pre-selects the training. */
export const metadata: Metadata = { title: "Dates" };
export const dynamic = "force-dynamic";

export default async function TrainingDatesPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await trainingAccess();
  const { id } = await params;
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/trainings/${id}/dates`)}`);
    forbidden();
  }
  const training = await getTrainingForAdmin(id, access.scope);
  if (!training) notFound();
  const offerings = (await listAllOfferings()).filter((o) => o.programmeId === training.id);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-body-sm max-w-[70ch] text-[var(--color-ink-quiet)]">
          A date with status <strong className="text-[var(--color-ink)]">Open</strong> takes registrations and payments on the public schedule; Planned shows &ldquo;register interest&rdquo;. Nothing is scheduled until you add it.
        </p>
        <Button href={`/admin/offerings/new?programmeId=${training.id}`} data-testid="training-add-date">
          Add a date
        </Button>
      </div>
      {offerings.length === 0 ? (
        <Card variant="panel" className="p-6">
          <p className="text-body-lg font-medium" data-testid="training-dates-empty">
            No dates yet
          </p>
        </Card>
      ) : (
        <Card variant="panel" className="overflow-x-auto p-0">
          <table className="text-body-sm w-full min-w-[720px] border-collapse" data-testid="training-dates-table">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {["Format", "Delivery", "Dates", "Capacity", "Confirmed", "Status", ""].map((c, i) => (
                  <th key={i} scope="col" className="text-label px-4 py-3 font-semibold">
                    {c || <span className="sr-only">Actions</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {offerings.map((o) => (
                <tr key={o.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="training-date-row">
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{o.format?.name ?? "—"}</td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{MODALITY_LABEL[o.modality]}</td>
                  <td className="px-4 py-3 align-top whitespace-nowrap text-[var(--color-ink-quiet)]">
                    {formatCalendarDate(o.startsOn)} – {formatCalendarDate(o.endsOn)}
                  </td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{o.capacity ?? "—"}</td>
                  <td className="px-4 py-3 align-top text-[var(--color-ink-quiet)]">{o.confirmedCount}</td>
                  <td className="px-4 py-3 align-top">
                    <Chip tone={o.status === "open" ? "primary" : "neutral"}>{OFFERING_STATUS_LABEL[o.status]}</Chip>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Link href={`/admin/offerings/${o.id}`} className="text-[var(--color-primary)] underline underline-offset-4">
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
