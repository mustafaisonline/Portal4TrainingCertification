import type { Metadata } from "next";
import { forbidden } from "next/navigation";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { couponDisplayStatus, getCoupon, listCoupons } from "@/modules/commerce/coupons.repository";
import { authorise } from "@/modules/identity/session";
import { getPrisma } from "@/db/prisma";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { EditCouponForm, GenerateCouponForm, RowActions, type TrainingOption } from "./CouponForms";

/*
 * /admin/coupons — coupon management (founder specification + N1–N8,
 * approved 2026-09-28). Platform administrators only (N7; a Trainer gets
 * 403 like every other admin screen outside their area). The table is the
 * spec's §2 row, with one honest difference: prices are per REGION on this
 * portal, so the money columns show the REAL recorded figures once a coupon
 * is redeemed, and a dash before then — never a projection that could be
 * wrong for the person's region.
 */
export const metadata: Metadata = { title: "Coupons" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, "primary" | "neutral"> = { Active: "primary", Used: "neutral", Expired: "neutral", Disabled: "neutral" };

export default async function AdminCouponsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const gate = await authorise("platform_admin");
  if (!gate.ok) forbidden();
  const sp = await searchParams;
  const editId = typeof sp["edit"] === "string" ? sp["edit"] : "";

  const [coupons, trainingRows] = await Promise.all([
    listCoupons(),
    getPrisma().programme.findMany({ select: { id: true, title: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  const trainings: TrainingOption[] = trainingRows;
  const editing = editId ? await getCoupon(editId) : null;
  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Payments</p>
        <h1 className="text-display" data-testid="coupons-title">
          Coupons
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          A coupon gives ONE person a percentage off ONE training, once. The person enters the code at checkout; the discount is
          computed server-side and the card charge never falls below 2.00 of the order currency. A redeemed coupon is a permanent
          record — it can never be edited or deleted.
        </p>
      </header>

      {editing && !editing.redeemedAt ? (
        <Card variant="plate" className="p-6" data-testid="coupon-edit-card">
          <h2 className="text-h2 mb-1">Edit {editing.code}</h2>
          <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">Assigned details can change until the coupon is redeemed.</p>
          <EditCouponForm
            id={editing.id}
            trainings={trainings}
            defaults={{
              email: editing.email,
              programmeId: editing.programmeId,
              discountPercent: editing.discountPercent,
              expiresAt: editing.expiresAt ? editing.expiresAt.toISOString().slice(0, 10) : "",
            }}
          />
        </Card>
      ) : (
        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-1">Generate a new coupon</h2>
          <p className="text-body-sm mb-4 text-[var(--color-ink-quiet)]">
            The code is generated for you — unique, uppercase, not guessable. Give it to the person named here; nobody else can use it.
          </p>
          <GenerateCouponForm trainings={trainings} />
        </Card>
      )}

      <Card variant="panel" className="overflow-x-auto p-0" data-testid="coupons-table">
        {coupons.length === 0 ? (
          <p className="text-body-sm p-6 text-[var(--color-ink-quiet)]" data-testid="coupons-empty">
            No coupons yet — generate the first one above.
          </p>
        ) : (
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-line)]">
                {["Coupon code", "Email", "Training", "Discount", "Original", "Deducted", "Paid", "Status", "Created", "Used", "Actions"].map((h) => (
                  <th key={h} className="text-label px-4 py-3 font-medium text-[var(--color-ink-quiet)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => {
                const status = couponDisplayStatus(c, now);
                const dash = <span className="text-[var(--color-ink-faint)]">—</span>;
                return (
                  <tr key={c.id} className="border-b border-[var(--color-line)] align-top last:border-b-0" data-testid="coupon-row" data-code={c.code}>
                    <td className="text-mono px-4 py-3 text-[0.8rem]">{c.code}</td>
                    <td className="text-body-sm px-4 py-3">{c.email}</td>
                    <td className="text-body-sm px-4 py-3">{c.programmeTitle}</td>
                    <td className="text-body-sm px-4 py-3">{c.discountPercent}%</td>
                    <td className="text-body-sm px-4 py-3">{c.amountBeforeCouponMinor !== null && c.paidCurrency ? formatMoney(c.amountBeforeCouponMinor, c.paidCurrency) : dash}</td>
                    <td className="text-body-sm px-4 py-3">
                      {c.amountBeforeCouponMinor !== null && c.paidAmountMinor !== null && c.paidCurrency
                        ? `−${formatMoney(c.amountBeforeCouponMinor - c.paidAmountMinor, c.paidCurrency)}`
                        : dash}
                    </td>
                    <td className="text-body-sm px-4 py-3">{c.paidAmountMinor !== null && c.paidCurrency ? formatMoney(c.paidAmountMinor, c.paidCurrency) : dash}</td>
                    <td className="px-4 py-3">
                      <Chip tone={STATUS_TONE[status] ?? "neutral"}>{status}</Chip>
                    </td>
                    <td className="text-body-sm whitespace-nowrap px-4 py-3">{formatTimestamp(c.createdAt)}</td>
                    <td className="text-body-sm whitespace-nowrap px-4 py-3">
                      {c.redeemedAt ? (
                        <>
                          {formatTimestamp(c.redeemedAt)}
                          {c.redeemedByEmail ? <span className="block text-[var(--color-ink-faint)]">{c.redeemedByEmail}</span> : null}
                        </>
                      ) : (
                        dash
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RowActions id={c.id} status={c.status} redeemed={c.redeemedAt !== null} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
      <p className="text-body-sm max-w-[80ch] text-[var(--color-ink-faint)]">
        Prices on this portal are per region, so the money columns show the real recorded figures once a coupon is redeemed — not a
        projection. Every creation, edit, status change, deletion and redemption is in the audit log.
      </p>
    </div>
  );
}
