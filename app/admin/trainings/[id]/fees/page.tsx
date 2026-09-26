import type { Metadata } from "next";
import { forbidden, notFound, redirect } from "next/navigation";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { FEE_REGIONS } from "@/modules/catalogue/programmes/constants";
import { getTrainingForAdmin } from "@/modules/catalogue/programmes/admin.repository";
import { formatMoney, priceRegionMeta } from "@/modules/catalogue/programmes/types";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { TrainingFeeForm } from "../../TrainingFeeForm";

/* Fees tab (M12 WP1/WP2): the four rows in the founder's order, each its
   own form. The Malaysia-not-via-HRD-Corp row is what a Malaysian card
   payment is charged (L6); the via-HRD-Corp row is display-only (L5). */
export const metadata: Metadata = { title: "Fees" };
export const dynamic = "force-dynamic";

const major = (minor: number) => (minor / 100).toFixed(minor % 100 === 0 ? 0 : 2);
const iso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function TrainingFeesPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await trainingAccess();
  const { id } = await params;
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/trainings/${id}/fees`)}`);
    forbidden();
  }
  const training = await getTrainingForAdmin(id, access.scope);
  if (!training) notFound();
  return (
    <div className="flex flex-col gap-6">
      <p className="text-body-sm max-w-[80ch] text-[var(--color-ink-quiet)]" data-testid="fees-summary">
        {training.feeRows.length} of {FEE_REGIONS.length} fee rows set. A Malaysian participant paying by card is charged the <strong className="text-[var(--color-ink)]">Malaysia</strong> row; the <strong className="text-[var(--color-ink)]">via HRD Corp</strong> figure is shown for employers claiming under HRD Corp and is never charged here. Pakistan pays through the local partner; everyone else pays by card in USD.
      </p>
      {FEE_REGIONS.map((region) => {
        const meta = priceRegionMeta(region);
        const row = training.feeRows.find((r) => r.region === region) ?? null;
        return (
          <Card key={region} variant="panel" className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-h2">{meta.label}</h2>
              {row ? (
                <Chip tone="primary">
                  {formatMoney(row.offerAmountMinor, row.currency)}
                  {row.listAmountMinor > row.offerAmountMinor ? ` (was ${formatMoney(row.listAmountMinor, row.currency)})` : ""}
                </Chip>
              ) : (
                <Chip>Not set</Chip>
              )}
            </div>
            <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">{meta.subtitle}.</p>
            <TrainingFeeForm
              id={training.id}
              slug={training.slug}
              region={region}
              exists={row !== null}
              values={
                row
                  ? {
                      currency: row.currency,
                      listAmount: major(row.listAmountMinor),
                      offerAmount: major(row.offerAmountMinor),
                      offerLabel: row.offerLabel,
                      offerName: row.offerName,
                      minParticipants: row.minParticipants === null ? "" : String(row.minParticipants),
                      note: row.note ?? "",
                      validFrom: iso(row.validFrom),
                      validTo: iso(row.validTo),
                    }
                  : null
              }
            />
          </Card>
        );
      })}
    </div>
  );
}
