import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { countryName } from "@/content/countries";
import { MODALITY_LABEL } from "@/modules/catalogue/offerings/repository";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { previewCheckout, type CheckoutPreview } from "@/modules/commerce/checkout.service";
import { LOCAL_PARTNER_PAYMENT_MESSAGE, PAYMENTS_NOT_CONFIGURED_MESSAGE } from "@/modules/commerce/messages";
import { regionForCountry, regionLabel } from "@/modules/commerce/pricing";
import { describeRefundTiers } from "@/modules/commerce/refund-policy";
import { paymentsConfigured } from "@/modules/commerce/stripe";
import { getProfile, isCompleteForCheckout } from "@/modules/identity/profile.repository";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatDateRange } from "@/shared/util/dates";
import { CheckoutForm } from "./CheckoutForm";

/*
 * Checkout — /checkout/<offeringId>.
 * PORTED 2026-09-21 (screen structure only: label, title, numbered steps in
 * a two-column grid with a summary panel) from
 * project-artifacts/mockup/components/account/CheckoutFlow.tsx (ADR-045).
 * Changed — everything that decided anything: the date is the REAL offering
 * in the URL (no picker); the price is the one for THIS person's region,
 * derived server-side from the profile country (M4 plan §3 D3) — there is
 * no currency choice; no "Your details" step (the account already holds
 * them); no payment-method picker (Stripe's hosted page offers what the
 * Dashboard enables); the refund tiers come from `describeRefundTiers()`;
 * the consent tick is real and required; Pay is the server action. The
 * mockup's simulated `pay()` was NEVER ported. `requireUser` gates the
 * screen server-side and returns the person here after sign-in.
 * Milestone 5a: the profile gate — an incomplete profile is sent to
 * /account/profile?complete=1&return-to=… (and `startCheckout` refuses too);
 * the price region comes from the ISO country on the profile.
 * 2026-09-26 (founder rule): a Pakistan-profile participant sees the
 * local-partner message and a Contact us link instead of a pay button —
 * `previewCheckout` returns `card_payment_unavailable`, and `startCheckout`
 * refuses the same way before any order or seat hold exists.
 */
export const metadata: Metadata = {
  title: "Register and pay",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function Step({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="text-h1 mb-5 flex items-center gap-3">
      <span
        aria-hidden="true"
        className="text-mono grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--color-primary)] text-[0.8rem] text-[var(--color-primary)]"
      >
        {n}
      </span>
      {title}
    </h2>
  );
}

const UNAVAILABLE: Record<Exclude<CheckoutPreview, { ok: true }>["reason"], { title: string; body: string }> = {
  offering_not_found: { title: "This date does not exist", body: "The link may be out of date. The schedule lists every date that is open." },
  offering_not_open: { title: "Registration is not open for this date", body: "This date is not taking registrations at the moment. Register interest and we will tell you when it opens." },
  offering_started: { title: "This date has already started", body: "Registration closes on the start date. The schedule lists the next dates." },
  offering_full: { title: "This date is full", body: "Every seat is taken or held. Choose another date, or register interest for the next one." },
  already_registered: { title: "You are already registered for this date", body: "Your place is confirmed. You can see it, transfer it or cancel it under My registrations." },
  order_pending: {
    title: "You already started a payment for this date",
    body: "Finish it in the Stripe page you opened, or come back in 30 minutes when that hold expires. Nothing is charged until Stripe confirms the payment.",
  },
  no_price_for_region: { title: "No price is published for your region yet", body: "Please contact us and we will help you register." },
  card_payment_unavailable: { title: "Card payment is not available in Pakistan", body: LOCAL_PARTNER_PAYMENT_MESSAGE },
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ offeringId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { offeringId } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/checkout/${offeringId}`);
  const profile = await getProfile(user.id);
  if (!isCompleteForCheckout(profile)) {
    redirect(`/account/profile?complete=1&return-to=${encodeURIComponent(`/checkout/${offeringId}`)}`);
  }
  const pricing = { id: user.id, country: profile?.countryCode ?? user.country };
  const preview = await previewCheckout(offeringId, pricing);
  const cancelled = sp["cancelled"] === "1";

  return (
    <section className="bg-[var(--color-ground-tint)]">
      <div className="mx-auto max-w-[1080px] px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Register</p>
        <h1 className="text-display mb-3">Register and pay</h1>
        <p className="text-body-sm mb-6 max-w-[60ch] text-[var(--color-ink-quiet)]">
          Check the date and price, agree to the policies, and pay on Stripe&rsquo;s secure page.
        </p>
        {cancelled ? (
          <p
            role="status"
            data-testid="checkout-cancelled"
            className="text-body-sm mb-8 rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground)] px-4 py-3 text-[var(--color-ink)]"
          >
            Payment was cancelled — nothing was charged. You can pay whenever you are ready.
          </p>
        ) : null}

        {preview.ok ? <Available preview={preview} user={pricing} /> : <Unavailable preview={preview} />}
      </div>
    </section>
  );
}

function Unavailable({ preview }: { preview: Exclude<CheckoutPreview, { ok: true }> }) {
  const copy = UNAVAILABLE[preview.reason];
  // The local-partner route (Pakistan): the enquiry carries the programme so
  // the partner knows which training the person wants to pay for.
  if (preview.reason === "card_payment_unavailable") {
    const o = preview.offering;
    return (
      <Card variant="panel" className="max-w-[640px] p-6 sm:p-8" data-testid="checkout-local-partner">
        <h2 className="text-h1 mb-2" data-testid="checkout-unavailable">
          {copy.title}
        </h2>
        <p className="text-body-sm mb-2 text-[var(--color-ink)]">
          {o.programmeTitle} · {o.format?.name ?? MODALITY_LABEL[o.modality]} · {formatDateRange(o.startsOn, o.endsOn)}
        </p>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">{copy.body}</p>
        <div className="flex flex-wrap gap-3">
          <Button href={`/contact-us?kind=programme_interest&programme=${o.programmeSlug}`}>Contact us</Button>
          <Button variant="secondary" href="/schedule">
            Upcoming dates
          </Button>
        </div>
      </Card>
    );
  }
  return (
    <Card variant="panel" className="max-w-[640px] p-6 sm:p-8">
      <h2 className="text-h1 mb-2" data-testid="checkout-unavailable">
        {copy.title}
      </h2>
      {"offering" in preview ? (
        <p className="text-body-sm mb-2 text-[var(--color-ink)]">
          {preview.offering.programmeTitle} · {preview.offering.format?.name ?? MODALITY_LABEL[preview.offering.modality]} ·{" "}
          {formatDateRange(preview.offering.startsOn, preview.offering.endsOn)}
        </p>
      ) : null}
      <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">{copy.body}</p>
      <div className="flex flex-wrap gap-3">
        <Button href="/schedule">Upcoming dates</Button>
        {preview.reason === "already_registered" || preview.reason === "order_pending" ? (
          <Button variant="secondary" href="/account/programmes">
            My registrations
          </Button>
        ) : (
          <Button variant="secondary" href="/contact-us?kind=programme_interest">
            Register interest
          </Button>
        )}
      </div>
    </Card>
  );
}

function Available({ preview, user }: { preview: Extract<CheckoutPreview, { ok: true }>; user: { country: string | null } }) {
  const { offering, price, seatsLeft } = preview;
  const f = offering.format;
  const region = regionForCountry(user.country);
  const countryLabel = countryName(user.country) ?? user.country;
  const amount = formatMoney(price.offerAmountMinor, price.currency);
  const discounted = price.offerAmountMinor !== price.listAmountMinor;
  const tiers = describeRefundTiers();
  const notConfigured = paymentsConfigured() ? null : PAYMENTS_NOT_CONFIGURED_MESSAGE;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
      <div className="flex flex-col gap-6">
        <Card variant="panel" className="p-6 sm:p-8">
          <Step n={1} title="Your date" />
          <div className="mb-2 flex flex-wrap gap-2">
            {f?.badge && <Chip tone="primary">{f.badge}</Chip>}
            <Chip>{MODALITY_LABEL[offering.modality]}</Chip>
            {seatsLeft !== null && <Chip>{seatsLeft === 1 ? "1 seat left" : `${seatsLeft} seats left`}</Chip>}
          </div>
          <p className="text-body-lg font-medium" data-testid="checkout-programme">
            {offering.programmeTitle}
          </p>
          <p className="text-body-sm text-[var(--color-ink)]">
            {f?.name ?? MODALITY_LABEL[offering.modality]} · {formatDateRange(offering.startsOn, offering.endsOn)}
            {offering.location && ` · ${offering.location}`}
          </p>
          {f && (
            <p className="text-body-sm text-[var(--color-ink-faint)]">
              {f.durationLabel} · {f.scheduleLabel} · {f.totalTimeLabel}
            </p>
          )}
          {offering.scheduleNote && <p className="text-body-sm text-[var(--color-ink-faint)]">{offering.scheduleNote}</p>}
        </Card>

        <Card variant="panel" className="p-6 sm:p-8">
          <Step n={2} title="Your price" />
          <p className="text-label mb-1">{regionLabel(region)}</p>
          <p className="text-display text-[var(--color-primary)]" data-testid="checkout-price">
            {amount}
          </p>
          {discounted && (
            <p className="text-body-sm text-[var(--color-ink-quiet)]">
              <span className="line-through">{formatMoney(price.listAmountMinor, price.currency)}</span> · {price.offerLabel} · {price.offerName}
            </p>
          )}
          <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]" data-testid="checkout-region-note">
            Prices are set by the country on your profile ({countryLabel ? countryLabel : "not set"} → {regionLabel(region)}
            {region === "international" && !countryLabel ? "; without a country the rest-of-the-world price applies" : ""}). If that is wrong,{" "}
            <Link href="/account/profile" className="underline underline-offset-4">
              update your profile
            </Link>{" "}
            before paying.
          </p>
        </Card>

        <Card variant="panel" className="p-6 sm:p-8">
          <Step n={3} title="Refund & cancellation" />
          <dl className="text-body-sm grid gap-3 sm:grid-cols-[1fr_auto]" data-testid="checkout-refund-tiers">
            {tiers.map((t) => (
              <div key={t.when} className="contents">
                <dt className="text-[var(--color-ink-quiet)]">{t.when}</dt>
                <dd className="font-medium">{t.outcome}</dd>
              </div>
            ))}
          </dl>
          <p className="text-body-sm mt-4 text-[var(--color-ink-faint)]">
            Days are counted to the start date. The full{" "}
            <Link href="/refund-policy" className="underline underline-offset-4">
              Refund &amp; cancellation policy
            </Link>{" "}
            applies.
          </p>
        </Card>

        <Card variant="panel" className="p-6 sm:p-8">
          <Step n={4} title="Agree and pay" />
          <CheckoutForm offeringId={offering.id} payLabel={`Pay ${amount} with Stripe`} notConfiguredMessage={notConfigured} />
        </Card>
      </div>

      <Card variant="feature" className="p-6! sm:p-8! lg:sticky lg:top-24">
        <p className="text-label mb-3 text-[var(--color-primary)]">Summary</p>
        <h2 className="text-h1 mb-1">{offering.programmeTitle}</h2>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          {f?.name ?? MODALITY_LABEL[offering.modality]} · {formatDateRange(offering.startsOn, offering.endsOn)}
        </p>
        <dl className="text-body-sm grid gap-3 border-t border-[var(--color-line)] pt-5">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[var(--color-ink-quiet)]">Region</dt>
            <dd>{regionLabel(region)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-[var(--color-ink-quiet)]">Total</dt>
            <dd className="text-h2">{amount}</dd>
          </div>
        </dl>
        <p className="text-body-sm mt-5 text-[var(--color-ink-faint)]">
          Charged in {price.currency}, as published. Your receipt comes from Stripe and appears under Orders &amp; receipts.
        </p>
      </Card>
    </div>
  );
}
