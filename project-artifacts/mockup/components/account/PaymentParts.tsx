import type { ReactNode } from "react";

/**
 * Payment-step building blocks shared by the checkout (CheckoutFlow) and the
 * certificate-renewal screen (RenewFlow). Moved here 2026-09-20 from
 * CheckoutFlow.tsx unchanged. `CardFieldsPicture` is a NON-INTERACTIVE
 * picture — there are no card inputs anywhere in this project (see the header
 * of CheckoutFlow.tsx for why).
 */

/** A selectable card: native radio, styled via :has(). */
export function Choice({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] p-4 transition-colors hover:border-[var(--color-primary)] has-[:checked]:border-[var(--color-primary)] has-[:checked]:bg-[var(--color-ground-tint)] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-primary)]/35">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
      />
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  );
}

export function CardFieldsPicture() {
  const box =
    "rounded-[var(--radius-plate)] border border-dashed border-[var(--color-line-strong)] px-3.5 py-2.5 text-body-sm text-[var(--color-ink-faint)]";
  return (
    <div
      role="img"
      aria-label="Illustration only: Stripe's secure card fields will appear here"
      className="flex flex-col gap-3 rounded-[var(--radius-plate)] bg-[var(--color-ground)] p-4"
    >
      <div aria-hidden="true" className={box}>
        Card number
      </div>
      <div aria-hidden="true" className="grid grid-cols-2 gap-3">
        <div className={box}>MM / YY</div>
        <div className={box}>CVC</div>
      </div>
      <p aria-hidden="true" className="text-body-sm text-[var(--color-ink-faint)]">
        Illustration — Stripe&rsquo;s own secure fields appear here once the
        account is attached. Card details are typed into Stripe&rsquo;s fields,
        never into this page.
      </p>
    </div>
  );
}

