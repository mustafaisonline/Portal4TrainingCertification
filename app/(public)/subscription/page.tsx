import type { Metadata } from "next";
import Link from "next/link";
import { activePasses } from "@/modules/agentic/entitlements";
import { AGENTIC_CURRENCY, PASS_DAYS, PASS_LABEL, PRICE_PASS_MINOR, skuOfPass, type PassPlan } from "@/modules/agentic/products";
import { BuyForm } from "@/modules/agentic/components/AgenticForms";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { getCurrentUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * /subscription — the two annual plans (CR-2026-10-04-0113; founder, 2026-10-04): Agentic AI Unlimited (USD 10/year) and
 * Portal Unlimited (USD 20/year, includes the first plus unlimited unlocks of Certificates of Achievement). One-off 365-day
 * passes, no automatic renewal (founder: "Ok" to the one-off pass). Buying again while active extends from the end date.
 */
export const metadata: Metadata = { title: "Subscription", description: "Two annual plans: Agentic AI Unlimited and Portal Unlimited. One payment, 365 days, no automatic renewal." };
export const dynamic = "force-dynamic";

const usd = (minor: number) => formatMoney(minor, AGENTIC_CURRENCY);

const FEATURES: Record<PassPlan, string[]> = {
  agentic_unlimited: ["Download every agent and skill, as often as you like", "New agents and skills added to the catalogue are included while your plan is active", "Full manuals and install guides in every download"],
  portal_unlimited: ["Everything in Agentic AI Unlimited", "Unlimited unlocks of your Certificates of Achievement — the printable certificate for a passed Free Assessment Check — with no unlock fee", "One plan for the whole portal"],
};

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const passes = user ? await activePasses(user.id) : [];
  const endOf = (plan: PassPlan) => passes.find((p) => p.plan === plan)?.endsAt ?? null;
  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Subscription</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="subscription-title">
            One payment. A whole year.
          </h1>
          <p className="text-body-lg max-w-[680px] text-[var(--color-ink-quiet)]">Two plans, each a single payment for {PASS_DAYS} days. They never renew by themselves — we email you before one ends, and you choose whether to continue.</p>
        </div>
      </section>
      {sp["cancelled"] ? (
        <section className="mx-auto max-w-[1280px] px-6 pt-8">
          <p role="status" className="text-body-sm rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] px-4 py-3" data-testid="subscription-cancelled">
            The payment was cancelled — nothing has been charged.
          </p>
        </section>
      ) : null}
      <section className="mx-auto max-w-[1280px] px-6 py-14">
        <div className="grid gap-6 lg:grid-cols-2">
          {(["agentic_unlimited", "portal_unlimited"] as const).map((plan) => {
            const ends = endOf(plan);
            return (
              <Card key={plan} variant="panel" className="flex flex-col gap-4 p-6" data-testid={`plan-${plan}`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-h1">{PASS_LABEL[plan]}</h2>
                  {ends ? <Chip tone="primary">Active until {ends.toISOString().slice(0, 10)}</Chip> : null}
                </div>
                <p className="text-display">
                  {usd(PRICE_PASS_MINOR[plan])}
                  <span className="text-body-sm ml-1 font-normal text-[var(--color-ink-quiet)]">/ year</span>
                </p>
                <ul className="text-body-sm flex list-disc flex-col gap-1.5 pl-5 text-[var(--color-ink-quiet)]">
                  {FEATURES[plan].map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-2">
                  {!user ? (
                    <Button href="/sign-in?return-to=%2Fsubscription" data-testid={`plan-signin-${plan}`}>
                      Sign in to subscribe
                    </Button>
                  ) : (
                    <BuyForm sku={skuOfPass(plan)} label={ends ? `Extend by ${PASS_DAYS} days — ${usd(PRICE_PASS_MINOR[plan])}` : `Get ${PASS_LABEL[plan]} — ${usd(PRICE_PASS_MINOR[plan])}`} testId={`buy-${plan}`} payNote="Pay securely on Stripe." />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
        <div className="text-body-sm mt-10 max-w-[80ch] text-[var(--color-ink-quiet)]" data-testid="subscription-terms">
          <p className="mb-2">
            <strong className="text-[var(--color-ink)]">How a plan works.</strong> You pay once; your plan starts today and lasts {PASS_DAYS} days. If you buy the same plan again while it is active, the new year starts when the current one ends — you lose nothing. When a plan ends you keep the items you bought; items you only downloaded through the plan are no longer available.
          </p>
          <p className="mb-2">
            <strong className="text-[var(--color-ink-quiet)]">Changes.</strong> We may change prices or what a plan includes. A change never affects a plan you have already paid for, and we tell existing plan holders at least 30 days before it takes effect.
          </p>
          <p>
            Full details in the{" "}
            <Link href="/agentic-ai/terms" className="text-[var(--color-primary)] underline underline-offset-4">
              Agentic AI terms
            </Link>
            . Your plan and downloads are in{" "}
            <Link href="/account/downloads" className="text-[var(--color-primary)] underline underline-offset-4">
              My Agentic AI
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
