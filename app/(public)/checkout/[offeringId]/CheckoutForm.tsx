"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { beginCheckoutAction, type CheckoutFormState } from "@/modules/commerce/checkout.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * PORTED 2026-09-21 (structure only) from the consent + Pay step of
 * project-artifacts/mockup/components/account/CheckoutFlow.tsx (ADR-045).
 * Changed: the mockup's `pay()` (a sessionStorage simulation — NEVER-PORT)
 * is replaced by the `beginCheckoutAction` server action, which creates the
 * pending order server-side and redirects to Stripe's hosted page. The form
 * carries ONLY the offering id and the consent tick — no amount, currency or
 * region. The consent box is required and enabled (the policies are
 * published as drafts; the gate is LEGAL_DOCUMENT_VERSIONS, server-side).
 */

const initial: CheckoutFormState = { status: "idle" };

const DOCUMENTS = [
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/refund-policy", label: "Refund & cancellation policy" },
] as const;

export function CheckoutForm({ offeringId, payLabel, notConfiguredMessage }: { offeringId: string; payLabel: string; notConfiguredMessage: string | null }) {
  const [state, action, pending] = useActionState(beginCheckoutAction, initial);
  const consentId = useId();
  const statusId = useId();

  return (
    <form action={action} aria-label="Agree and pay" aria-describedby={statusId} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="offeringId" value={offeringId} />
      <div className="flex items-start gap-3">
        <input
          id={consentId}
          type="checkbox"
          name="consent"
          required
          data-testid="checkout-consent"
          className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
        />
        <label htmlFor={consentId} className="text-body-sm text-[var(--color-ink-quiet)]">
          I agree to the{" "}
          {DOCUMENTS.map((d, i) => (
            <span key={d.href}>
              {i === 0 ? "" : i === DOCUMENTS.length - 1 ? " and the " : ", the "}
              <Link href={d.href} className="underline underline-offset-4" target="_blank" rel="noopener">
                {d.label}
              </Link>
            </span>
          ))}
          .
        </label>
      </div>

      {notConfiguredMessage ? (
        <p role="status" className="text-body-sm rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] px-4 py-3 text-[var(--color-ink-quiet)]">
          {notConfiguredMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="pay">
          {pending ? "Taking you to Stripe…" : payLabel}
        </Button>
        <span id={statusId}>{state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}</span>
      </div>
      <p className="text-body-sm text-[var(--color-ink-faint)]">
        Payment is taken on Stripe&rsquo;s secure page; card or bank details are never entered on this site. Your place is
        confirmed only when Stripe reports the payment as complete.
      </p>
    </form>
  );
}
