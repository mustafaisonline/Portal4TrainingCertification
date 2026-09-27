import type { Metadata } from "next";
import Link from "next/link";
import { forbidden } from "next/navigation";
import { currentUnlockSetting, listUnlockHistory, UNLOCK_DEFAULT_AMOUNT_MINOR, UNLOCK_DEFAULT_CURRENCY, UNLOCK_DEFAULT_LABEL } from "@/modules/commerce/unlock.repository";
import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { UnlockSettingForm } from "./UnlockSettingForm";

/*
 * /admin/orders/unlock — the Knowledge Check result-document unlock fee
 * (Milestone 14 Phase 5; founder: US$10, Pakistan exempt, non-refundable):
 * the setting in force, the insert-only history, a form for a new
 * effective-dated one. The amount charged is read from this table at the
 * moment an order starts — never from a form.
 */
export const metadata: Metadata = { title: "Knowledge Check unlock fee" };
export const dynamic = "force-dynamic";

const money = (minor: number, currency: string) => `${currency} ${(minor / 100).toFixed(2)}`;

export default async function AdminUnlockSettingPage() {
  const result = await authorise("platform_admin");
  if (!result.ok) forbidden();
  const now = new Date();
  const [current, history] = await Promise.all([currentUnlockSetting(now), listUnlockHistory()]);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/orders" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Orders
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Payments</p>
        <h1 className="text-display" data-testid="unlock-setting-title">
          Knowledge Check unlock fee
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          The one-time fee that unlocks the printable result document of a free Knowledge Check. Participants whose profile country is Pakistan
          are exempt (the card-payment rule); the result, its ID and its verification page are free for everyone. Off refuses new unlock payments
          — documents already unlocked stay unlocked.
        </p>
      </header>

      <Card variant="panel" className="p-6" data-testid="unlock-setting-current">
        <h2 className="text-h2 mb-2">In force now</h2>
        {current ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            <Chip tone={current.enabled ? "primary" : "neutral"}>{current.enabled ? "Enabled" : "Disabled"}</Chip>{" "}
            <strong className="text-[var(--color-ink)]" data-testid="unlock-setting-amount">{money(current.amountMinor, current.currency)}</strong> · {current.label} · since{" "}
            {formatTimestamp(current.effectiveFrom)}
          </p>
        ) : (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">No setting yet — save one below.</p>
        )}
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h2 mb-4">Change the setting</h2>
        <UnlockSettingForm
          current={{
            enabled: current?.enabled ?? true,
            amount: ((current?.amountMinor ?? UNLOCK_DEFAULT_AMOUNT_MINOR) / 100).toFixed(2),
            currency: current?.currency ?? UNLOCK_DEFAULT_CURRENCY,
            label: current?.label ?? UNLOCK_DEFAULT_LABEL,
          }}
        />
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h2 mb-3">History</h2>
        {history.length === 0 ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">No settings recorded.</p>
        ) : (
          <ul className="text-body-sm flex flex-col gap-2" data-testid="unlock-setting-history">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center gap-2 text-[var(--color-ink-quiet)]">
                <Chip tone={h.enabled ? "primary" : "neutral"}>{h.enabled ? "Enabled" : "Disabled"}</Chip>
                <span className="text-[var(--color-ink)]">{money(h.amountMinor, h.currency)}</span> · {h.label} · from {formatTimestamp(h.effectiveFrom)}
                {h.note ? <span className="text-[var(--color-ink-faint)]">— {h.note}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
