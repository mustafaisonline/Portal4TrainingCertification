import type { Metadata } from "next";
import Link from "next/link";
import { itemsOfKind } from "@/content/agentic/catalogue";
import { creditsLeft, hasActivePass } from "@/modules/agentic/entitlements";
import { AGENTIC_CURRENCY, PACK_CREDITS, PASS_DAYS, PASS_LABEL, PRICE_ITEM_MINOR, PRICE_PACK10_MINOR, PRICE_PASS_MINOR, SKU_PACK10 } from "@/modules/agentic/products";
import { BuyForm } from "@/modules/agentic/components/AgenticForms";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { getCurrentUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

/*
 * /agentic-ai — the new Agentic AI section (CR-2026-10-04-0111/0112; founder, 2026-10-04): agents and skills for Claude Code,
 * downloadable with a full manual and install guide. Public to read; downloading needs sign-in and payment (or a plan).
 */
export const metadata: Metadata = {
  title: "Agentic AI",
  description: "Agents and skills for Claude Code — downloadable, with a full manual and install guide. USD 2 each, 10 for USD 10, or a plan for a year.",
};
export const dynamic = "force-dynamic";

const usd = (minor: number) => formatMoney(minor, AGENTIC_CURRENCY);

export default async function AgenticAiPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [pass, credits] = user ? await Promise.all([hasActivePass(user.id), creditsLeft(user.id)]) : [false, 0];
  const agents = itemsOfKind("agent").length;
  const skills = itemsOfKind("skill").length;
  return (
    <>
      <section className="night hero-band relative overflow-hidden">
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 lg:py-16">
          <p className="text-label mb-4 text-[var(--color-primary)]">Agentic AI</p>
          <h1 className="text-display-lg mb-4 max-w-[820px]" data-testid="agentic-landing-title">
            Agents and skills for Claude Code.
          </h1>
          <p className="text-body-lg max-w-[680px] text-[var(--color-ink-quiet)]">
            Ready-made specialists and procedures you add to your own projects — each with a full user manual and a step-by-step install guide. Built from the way we work ourselves, generalised for you.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/agentic-ai/agents" data-testid="agentic-browse-agents">
              Browse {agents} agents
            </Button>
            <Button href="/agentic-ai/skills" variant="secondary" data-testid="agentic-browse-skills">
              Browse {skills} skills
            </Button>
          </div>
        </div>
      </section>

      {sp["cancelled"] ? (
        <section className="mx-auto max-w-[1280px] px-6 pt-8">
          <p role="status" className="text-body-sm rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-tint)] px-4 py-3" data-testid="agentic-cancelled">
            The payment was cancelled — nothing has been charged.
          </p>
        </section>
      ) : null}

      <section className="mx-auto max-w-[1280px] px-6 py-14">
        <h2 className="text-h1 mb-6">How it works</h2>
        <ol className="grid gap-5 sm:grid-cols-3">
          {[
            ["1", "Choose", "Read what each agent or skill does, who it is for, and its limits — before you pay."],
            ["2", "Get it", "Buy one, use a pack credit, or get a plan. You pay once on Stripe's secure page."],
            ["3", "Install it", "Download a small ZIP, unzip it at the root of your project, and follow INSTALL.md. Your manual is inside."],
          ].map(([n, h, b]) => (
            <li key={n}>
              <Card variant="panel" className="h-full p-5">
                <p className="text-label mb-2 text-[var(--color-primary)]">Step {n}</p>
                <p className="text-body-lg mb-1 font-medium">{h}</p>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">{b}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="scroll-mt-24 border-t border-[var(--color-line)] bg-[var(--color-ground-raised)]" data-testid="agentic-pricing">
        <div className="mx-auto max-w-[1280px] px-6 py-14">
          <h2 className="text-h1 mb-2">Pricing</h2>
          <p className="text-body-sm mb-8 max-w-[70ch] text-[var(--color-ink-quiet)]">
            One-off payments in US dollars. Downloads are non-refundable once downloaded. See the{" "}
            <Link href="/agentic-ai/terms" className="text-[var(--color-primary)] underline underline-offset-4">
              Agentic AI terms
            </Link>
            .
          </p>
          <div className="grid gap-5 lg:grid-cols-4">
            <Card variant="panel" className="flex flex-col gap-2 p-5" data-testid="price-item">
              <p className="text-label">One download</p>
              <p className="text-display">{usd(PRICE_ITEM_MINOR)}</p>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">Any single agent or skill. Yours to download again whenever you sign in.</p>
            </Card>
            <Card variant="panel" className="flex flex-col gap-3 p-5" data-testid="price-pack">
              <p className="text-label">Pack of {PACK_CREDITS}</p>
              <p className="text-display">{usd(PRICE_PACK10_MINOR)}</p>
              <p className="text-body-sm text-[var(--color-ink-quiet)]">{PACK_CREDITS} credits — pick any {PACK_CREDITS} agents or skills, whenever you like. Credits do not expire.</p>
              <div className="mt-auto">
                {!user ? (
                  <Button href="/sign-in?return-to=%2Fagentic-ai%23pricing" variant="secondary" data-testid="pack-signin">
                    Sign in to buy
                  </Button>
                ) : pass ? (
                  <p className="text-body-sm text-[var(--color-success)]" data-testid="pack-covered">
                    Your plan already covers everything.
                  </p>
                ) : (
                  <>
                    {credits > 0 ? (
                      <p className="text-body-sm mb-2 text-[var(--color-ink-quiet)]" data-testid="pack-credits">
                        You have {credits} {credits === 1 ? "credit" : "credits"} left.
                      </p>
                    ) : null}
                    <BuyForm sku={SKU_PACK10} label={`Buy the pack — ${usd(PRICE_PACK10_MINOR)}`} testId="agentic-buy-pack" variant="secondary" />
                  </>
                )}
              </div>
            </Card>
            {(["agentic_unlimited", "portal_unlimited"] as const).map((plan) => (
              <Card key={plan} variant="panel" className="flex flex-col gap-2 p-5" data-testid={`price-${plan}`}>
                <p className="text-label">{PASS_LABEL[plan]}</p>
                <p className="text-display">
                  {usd(PRICE_PASS_MINOR[plan])}
                  <span className="text-body-sm ml-1 font-normal text-[var(--color-ink-quiet)]">/ year</span>
                </p>
                <p className="text-body-sm text-[var(--color-ink-quiet)]">
                  {plan === "agentic_unlimited" ? "Download every agent and skill." : "Everything in Agentic AI Unlimited, plus unlimited unlocks of your Certificates of Achievement."} One payment, {PASS_DAYS} days, no automatic renewal.
                </p>
                <div className="mt-auto pt-2">
                  <Button href="/subscription" variant="secondary" data-testid={`see-${plan}`}>
                    See the plan
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
