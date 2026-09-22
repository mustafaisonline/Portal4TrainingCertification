import type { Metadata } from "next";
import Link from "next/link";
import { CERTIFICATE_TIMEZONE, VALIDITY_MONTHS } from "@/modules/certificates/constants";
import { currentFeeSetting, FEE_DEFAULT_CURRENCY, listFeeHistory } from "@/modules/certificates/fee.repository";
import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { formatTimestamp } from "@/shared/util/dates";
import { ChangeFeeForm } from "./ChangeFeeForm";

/*
 * /admin/certificates/fee — the renewal fee (M6 plan §3 E4; R-F1/R-F2): the
 * setting in force now with "in force since", the full insert-only history
 * (future-dated rows included) and a form for a new effective-dated fee.
 * The amount a holder is shown and charged is always read from this table
 * at the moment a renewal starts — never from a form or a constant.
 */
export const metadata: Metadata = { title: "Renewal fee" };

export const dynamic = "force-dynamic";

/** "USD 10.00" — the fee always shows two decimals so 10 and 10.50 read alike. */
function money(amountMinor: number, currency: string): string {
  return `${currency} ${(amountMinor / 100).toFixed(2)}`;
}

const myt = new Intl.DateTimeFormat("en-GB", { timeZone: CERTIFICATE_TIMEZONE, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** A fee instant in Malaysia time as well as UTC, since it is typed in MYT. */
function when(d: Date): string {
  return `${myt.format(d)} MYT (${formatTimestamp(d)})`;
}

export default async function AdminCertificateFeePage() {
  const result = await authorise("platform_admin");
  if (!result.ok) return null; // the layout has already refused
  const now = new Date();
  const [current, history] = await Promise.all([currentFeeSetting(now), listFeeHistory()]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/certificates" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Certificates
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Certificate of Completion</p>
        <h1 className="text-display" data-testid="fee-title">
          Renewal fee
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          A certificate is active for {VALIDITY_MONTHS} months from issue; the first year is included in the programme fee. Each renewal extends it by another {VALIDITY_MONTHS} months for
          the fee in force when the renewal starts. Changes apply to renewals started after the effective time; renewals already paid are unaffected.
        </p>
      </header>

      <Card variant="panel" className="p-6" data-testid="fee-current">
        <p className="text-label mb-2">In force now</p>
        {current ? (
          <>
            <p className="text-h2" data-testid="fee-current-amount">
              {money(current.amountMinor, current.currency)}
            </p>
            <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">In force since {when(current.effectiveFrom)}.</p>
            {current.note ? <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">Note: {current.note}</p> : null}
          </>
        ) : (
          <p className="text-body-sm text-[var(--color-danger)]" data-testid="fee-current-missing">
            No fee setting is in force. Renewals cannot start until one is set below.
          </p>
        )}
      </Card>

      <Card variant="panel" className="max-w-[760px] p-6">
        <h2 className="text-h2 mb-4">Set a new fee</h2>
        <ChangeFeeForm defaultCurrency={current?.currency ?? FEE_DEFAULT_CURRENCY} />
      </Card>

      <Card variant="panel" className="overflow-x-auto p-0">
        <h2 className="text-h2 px-6 pt-6">History</h2>
        <p className="text-body-sm px-6 pt-2 text-[var(--color-ink-quiet)]">Newest effective time first. A row whose effective time is still ahead takes over automatically when it arrives.</p>
        <table className="text-body-sm mt-4 w-full min-w-[720px] border-collapse" data-testid="fee-history">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["Amount", "Effective from", "Note", "Created"].map((c) => (
                <th key={c} scope="col" className="text-label px-6 py-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                  No fee has been set.
                </td>
              </tr>
            ) : (
              history.map((h) => {
                const inForce = current?.id === h.id;
                const future = h.effectiveFrom.getTime() > now.getTime();
                return (
                  <tr key={h.id} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="fee-history-row">
                    <td className="px-6 py-3 whitespace-nowrap font-medium text-[var(--color-ink)]">
                      {money(h.amountMinor, h.currency)}
                      {inForce ? <span className="text-label ml-2 text-[var(--color-primary)]">in force</span> : future ? <span className="text-label ml-2 text-[var(--color-ink-quiet)]">scheduled</span> : null}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{when(h.effectiveFrom)}</td>
                    <td className="px-6 py-3 text-[var(--color-ink-quiet)]">{h.note ?? "—"}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(h.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
