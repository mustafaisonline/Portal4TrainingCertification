import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * "Have a coupon code?" — the reusable coupon entry (spec §5/§13, N6).
 * A plain GET form: Apply reloads the page with `?coupon=<code>` and the
 * SERVER validates and prices it on render (spec §15 — the browser never
 * computes or sends an amount). Used on every surface that takes a card
 * payment for a training; today that is the checkout page, the one place a
 * training fee is collected by card.
 */

export type CouponFieldResult =
  | { ok: true; code: string; discountPercent: number }
  | { ok: false; message: string };

export function CouponField({ action, result }: { action: string; result: CouponFieldResult | null }) {
  return (
    <div data-testid="coupon-field">
      <p className="text-body-sm mb-2 font-medium text-[var(--color-ink)]">Have a coupon code?</p>
      <form method="get" action={action} className="flex flex-wrap items-center gap-3" aria-label="Apply a coupon code">
        <label htmlFor="coupon-code" className="sr-only">
          Coupon code
        </label>
        <input
          id="coupon-code"
          name="coupon"
          type="text"
          autoComplete="off"
          maxLength={40}
          placeholder="Enter Coupon Code"
          className="text-body-sm w-48 rounded-[var(--radius-plate)] border border-[var(--color-line-strong)] bg-[var(--color-ground)] px-3 py-2 uppercase text-[var(--color-ink)] placeholder:normal-case placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <Button type="submit" variant="secondary" data-testid="coupon-apply">
          Apply
        </Button>
      </form>
      {result ? (
        <div className="mt-3" data-testid={result.ok ? "coupon-applied" : "coupon-error"}>
          {result.ok ? (
            <FormStatus tone="success">
              Coupon applied successfully. You received a {result.discountPercent}% discount.
            </FormStatus>
          ) : (
            <FormStatus tone="error">{result.message}</FormStatus>
          )}
        </div>
      ) : null}
    </div>
  );
}
