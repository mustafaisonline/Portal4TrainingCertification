import type { ReactNode } from "react";
import Link from "next/link";
import { formatMoney, type DeliveryFormatRecord } from "@/modules/catalogue/programmes/types";
import { getProfile } from "@/modules/identity/profile.repository";
import { getCurrentUser } from "@/modules/identity/session";
import { formatIdsWithoutOpenDate, enabledInterestSetting, interestStatusForUser } from "../interest.repository";
import { findInterestOrderForUser } from "../interest.service";
import { PAYMENTS_NOT_CONFIGURED_MESSAGE } from "../messages";
import { regionForCountry } from "../pricing";
import { paymentsConfigured } from "../stripe";
import { InterestForm } from "./InterestForm";

/*
 * The "Register your interest" action under each format of a published
 * training (CR-2026-10-01-2138). Built on the server so the amount, the
 * Pakistan rule and the person's current state are read from the database —
 * the browser is only shown them.
 *
 *   no fee setting in force / switched off   → nothing is shown
 *   the format has an open date              → "Dates are open" link (register for the training itself)
 *   signed out                               → a sign-in link that returns here
 *   already registered                       → "Your interest is registered"
 *   otherwise                                → the form (fee label, or "free for you" in Pakistan)
 */

const noteClass = "text-body-sm text-[var(--color-ink-quiet)]";

export type InterestSlots = { slots: Record<string, ReactNode>; banner: ReactNode | null };

export async function buildInterestSlots(input: { programmeSlug: string; formats: DeliveryFormatRecord[]; interestParam?: string; datesHref: string }): Promise<InterestSlots> {
  const now = new Date();
  const [user, setting] = await Promise.all([getCurrentUser(), enabledInterestSetting(now)]);
  const banner = user && input.interestParam ? await interestBanner(input.interestParam, user.id, now) : input.interestParam === "cancelled" ? cancelledBanner() : null;
  if (!setting || input.formats.length === 0) return { slots: {}, banner };

  const ids = input.formats.map((f) => f.id);
  const noDate = await formatIdsWithoutOpenDate(ids, now);
  const [statuses, profile] = user ? await Promise.all([interestStatusForUser(user.id, ids), getProfile(user.id)]) : [new Map<string, "pending" | "confirmed" | "expired">(), null];
  const waived = regionForCountry(profile?.countryCode ?? null) === "pakistan";
  const feeLabel = waived ? null : formatMoney(setting.amountMinor, setting.currency);

  const slots: Record<string, ReactNode> = {};
  for (const f of input.formats) {
    if (!noDate.has(f.id)) {
      slots[f.id] = (
        <p className={noteClass} data-testid={`interest-dates-${f.code}`}>
          Dates are open for this format — <Link href={input.datesHref} className="font-medium text-[var(--color-primary)] underline underline-offset-4">see the dates and register</Link>.
        </p>
      );
    } else if (!user) {
      slots[f.id] = (
        <p className={noteClass} data-testid={`interest-signin-${f.code}`}>
          No date is scheduled yet.{" "}
          <Link href={`/sign-in?return-to=${encodeURIComponent(`/programs/${input.programmeSlug}#formats`)}`} className="font-medium text-[var(--color-primary)] underline underline-offset-4" data-testid="interest-signin">
            Sign in to register your interest — {feeLabel ? `${feeLabel}, non-refundable` : "free for you"}
          </Link>
          .
        </p>
      );
    } else if (statuses.get(f.id) === "confirmed") {
      slots[f.id] = (
        <p className={noteClass} role="status" data-testid={`interest-done-${f.code}`}>
          <strong className="text-[var(--color-ink)]">✓ Your interest is registered.</strong> The trainer will email you when this format is scheduled.{" "}
          <Link href="/account/trainings#interests" className="font-medium text-[var(--color-primary)] underline underline-offset-4">
            My interests
          </Link>
        </p>
      );
    } else {
      slots[f.id] = (
        <InterestForm
          formatId={f.id}
          formatName={f.name}
          defaultEmail={user.email}
          defaultName={user.name}
          feeLabel={feeLabel}
          notConfiguredMessage={!waived && !paymentsConfigured() ? PAYMENTS_NOT_CONFIGURED_MESSAGE : null}
        />
      );
    }
  }
  return { slots, banner };
}

function cancelledBanner(): ReactNode {
  return (
    <p role="status" className="text-body-sm mb-8 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] px-4 py-3 text-[var(--color-ink-quiet)]" data-testid="interest-banner">
      The payment was cancelled — nothing has been charged, and your interest is not registered.
    </p>
  );
}

/** The `?interest=` banner's truth is the order row, never the redirect. */
async function interestBanner(param: string, userId: string, now: Date): Promise<ReactNode | null> {
  if (param === "cancelled") return cancelledBanner();
  const order = await findInterestOrderForUser(param, userId, now);
  if (!order) return null;
  const text =
    order.effectiveStatus === "paid"
      ? `Thank you — your interest is registered (${formatMoney(order.amountMinor, order.currency)}, non-refundable).${order.receiptUrl ? " Your Stripe receipt is in Orders & receipts." : ""}`
      : order.effectiveStatus === "pending"
        ? "We are confirming your payment with Stripe — refresh in a moment. Your interest is registered once the payment is confirmed."
        : "That payment did not complete, so your interest is not registered. Nothing has been charged.";
  return (
    <p role="status" className="text-body-sm mb-8 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] px-4 py-3 text-[var(--color-ink)]" data-testid="interest-banner" data-order-status={order.effectiveStatus}>
      {text}
    </p>
  );
}
