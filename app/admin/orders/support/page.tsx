import type { Metadata } from "next";
import Link from "next/link";
import { forbidden } from "next/navigation";
import { currentSupportSetting, listSupportHistory } from "@/modules/commerce/support.repository";
import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { SupportSettingForm } from "./SupportSettingForm";

/*
 * /admin/orders/support — the "Support the Academy" payment setting (M5,
 * 2026-09-27): the setting in force, the insert-only history, and a form
 * for a new effective-dated one. The amount a person is shown and charged
 * is read from this table at the moment an order starts — never from a form.
 */
export const metadata: Metadata = { title: "Support payment" };
export const dynamic = "force-dynamic";

const money = (minor: number, currency: string) => `${currency} ${(minor / 100).toFixed(2)}`;

export default async function AdminSupportSettingPage() {
  const result = await authorise("platform_admin");
  if (!result.ok) forbidden();
  const now = new Date();
  const [current, history] = await Promise.all([currentSupportSetting(now), listSupportHistory()]);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/orders" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Orders
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Payments</p>
        <h1 className="text-display" data-testid="support-setting-title">
          Support payment
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          The small &ldquo;Support the Academy&rdquo; card payment — the portal&rsquo;s way of proving card payments end to end (Stripe test mode here; the real check at go-live). It grants nothing and can be switched off at any time.
        </p>
      </header>

      <Card variant="panel" className="p-6" data-testid="support-setting-current">
        <h2 className="text-h2 mb-2">In force now</h2>
        {current ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            <Chip tone={current.enabled ? "primary" : "neutral"}>{current.enabled ? "Enabled" : "Disabled"}</Chip>{" "}
            <strong className="text-[var(--color-ink)]" data-testid="support-setting-amount">{money(current.amountMinor, current.currency)}</strong> · {current.label} · since {formatTimestamp(current.effectiveFrom)}
          </p>
        ) : (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">No setting yet — save one below.</p>
        )}
        <p className="text-body-sm mt-3">
          <Link href="/support" className="text-[var(--color-primary)] underline underline-offset-4">
            Open the public page
          </Link>
        </p>
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h2 mb-4">Change the setting</h2>
        <SupportSettingForm
          current={{
            enabled: current?.enabled ?? true,
            amount: current ? (current.amountMinor / 100).toFixed(2) : "2.00",
            currency: current?.currency ?? "MYR",
            label: current?.label ?? "Support the Academy",
          }}
        />
      </Card>

      <Card variant="panel" className="overflow-x-auto p-0">
        <h2 className="text-h2 px-6 pt-6">History</h2>
        <table className="text-body-sm w-full min-w-[720px] border-collapse" data-testid="support-setting-history">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["Effective from", "Enabled", "Amount", "Label", "Note", "Recorded"].map((c) => (
                <th key={c} scope="col" className="text-label px-6 py-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {history.map((h) => (
              <tr key={h.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="support-setting-row">
                <td className="px-6 py-3 whitespace-nowrap">{formatTimestamp(h.effectiveFrom)}</td>
                <td className="px-6 py-3">{h.enabled ? "Yes" : "No"}</td>
                <td className="px-6 py-3 whitespace-nowrap">{money(h.amountMinor, h.currency)}</td>
                <td className="px-6 py-3">{h.label}</td>
                <td className="px-6 py-3 text-[var(--color-ink-quiet)]">{h.note ?? "—"}</td>
                <td className="px-6 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]">{formatTimestamp(h.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
