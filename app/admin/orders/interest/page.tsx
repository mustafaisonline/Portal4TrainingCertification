import type { Metadata } from "next";
import Link from "next/link";
import { forbidden } from "next/navigation";
import { currentInterestSetting, listInterestHistory, INTEREST_DEFAULT_AMOUNT_MINOR, INTEREST_DEFAULT_CURRENCY, INTEREST_DEFAULT_LABEL } from "@/modules/commerce/interest.repository";
import { authorise } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatTimestamp } from "@/shared/util/dates";
import { InterestSettingForm } from "./InterestSettingForm";

/*
 * /admin/orders/interest — the "Register your interest" fee (CR-2026-10-01-2138;
 * founder: USD 2, non-refundable, not credited against a later fee): the
 * setting in force, the insert-only history, a form for a new effective-dated
 * one. The amount charged is read from this table at the moment an order
 * starts — never from a form.
 */
export const metadata: Metadata = { title: "Interest registration fee" };
export const dynamic = "force-dynamic";

const money = (minor: number, currency: string) => `${currency} ${(minor / 100).toFixed(2)}`;

export default async function AdminInterestSettingPage() {
  const result = await authorise("platform_admin");
  if (!result.ok) forbidden();
  const now = new Date();
  const [current, history] = await Promise.all([currentInterestSetting(now), listInterestHistory()]);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/orders" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Orders
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Payments</p>
        <h1 className="text-display" data-testid="interest-setting-title">
          Interest registration fee
        </h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          The small non-refundable fee a signed-in person pays to say they want a training in a given format, so the trainer can plan it (it is
          not a seat and is not credited against the training fee). Participants whose profile country is Pakistan register without the fee (the
          card-payment rule). Off hides &ldquo;Register your interest&rdquo; and refuses new registrations — interests already registered stay.
        </p>
      </header>

      <Card variant="panel" className="p-6" data-testid="interest-setting-current">
        <h2 className="text-h2 mb-2">In force now</h2>
        {current ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            <Chip tone={current.enabled ? "primary" : "neutral"}>{current.enabled ? "Enabled" : "Disabled"}</Chip>{" "}
            <strong className="text-[var(--color-ink)]" data-testid="interest-setting-amount">{money(current.amountMinor, current.currency)}</strong> · {current.label} · since{" "}
            {formatTimestamp(current.effectiveFrom)}
          </p>
        ) : (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">No setting yet — save one below.</p>
        )}
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h2 mb-4">Change the setting</h2>
        <InterestSettingForm
          current={{
            enabled: current?.enabled ?? true,
            amount: ((current?.amountMinor ?? INTEREST_DEFAULT_AMOUNT_MINOR) / 100).toFixed(2),
            currency: current?.currency ?? INTEREST_DEFAULT_CURRENCY,
            label: current?.label ?? INTEREST_DEFAULT_LABEL,
          }}
        />
      </Card>

      <Card variant="panel" className="p-6">
        <h2 className="text-h2 mb-3">History</h2>
        {history.length === 0 ? (
          <p className="text-body-sm text-[var(--color-ink-quiet)]">No settings recorded.</p>
        ) : (
          <ul className="text-body-sm flex flex-col gap-2" data-testid="interest-setting-history">
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
