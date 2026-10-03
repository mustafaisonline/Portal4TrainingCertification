import type { Metadata } from "next";
import Link from "next/link";
import { AGENTIC_ITEMS } from "@/content/agentic/catalogue";
import { definitionPath } from "@/content/agentic/types";
import { findAgenticOrderForUser } from "@/modules/agentic/checkout";
import { activePasses, creditsLeft, ownedSlugs } from "@/modules/agentic/entitlements";
import { itemHref } from "@/modules/agentic/components/ItemCard";
import { PASS_LABEL } from "@/modules/agentic/products";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";

/*
 * My Agentic AI (CR-2026-10-04-0112 / -0113): the person's plan, their credits and every download they can take. Reads only
 * the database; the `?order=` banner's truth is the order row, never the redirect.
 */
export const metadata: Metadata = { title: "My Agentic AI" };
export const dynamic = "force-dynamic";

const fmtDate = (d: Date) => d.toISOString().slice(0, 10);

export default async function MyDownloadsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/account/downloads");
  const sp = await searchParams;
  const orderParam = typeof sp["order"] === "string" ? sp["order"] : "";
  const [passes, credits, owned, order] = await Promise.all([activePasses(user.id), creditsLeft(user.id), ownedSlugs(user.id), orderParam ? findAgenticOrderForUser(orderParam, user.id) : Promise.resolve(null)]);
  const hasPass = passes.length > 0;
  const items = hasPass ? AGENTIC_ITEMS : AGENTIC_ITEMS.filter((i) => owned.has(i.slug));
  const banner =
    order?.effectiveStatus === "paid"
      ? `Thank you — ${order.title} is ready.`
      : order?.effectiveStatus === "pending"
        ? "We are confirming your payment with Stripe — refresh in a moment. Your purchase appears here once the payment is confirmed."
        : order
          ? "That payment did not complete, so nothing was added. Nothing has been charged."
          : null;
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Agentic AI</p>
        <h1 className="text-display" data-testid="downloads-title">
          My Agentic AI
        </h1>
      </header>
      {banner ? (
        <Card variant="feature" className="p-5!" data-testid="downloads-banner" data-order-status={order?.effectiveStatus}>
          <p role="status" className="text-body-lg font-medium">
            {banner}
          </p>
        </Card>
      ) : null}

      <Card variant="panel" className="flex flex-col gap-3 p-5" data-testid="downloads-plan">
        <h2 className="text-h2">Your plan</h2>
        {hasPass ? (
          <ul className="flex flex-col gap-2">
            {passes.map((p) => (
              <li key={p.plan} className="text-body-sm" data-testid="downloads-pass">
                <Chip tone="primary">{PASS_LABEL[p.plan]}</Chip> <span className="ml-2">active until {fmtDate(p.endsAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="downloads-no-plan">
            No active plan. A plan lets you download every agent and skill for a year.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button href="/subscription" variant="secondary">
            {hasPass ? "Extend or change plan" : "See the plans"}
          </Button>
          <span className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="downloads-credits">
            {credits} download {credits === 1 ? "credit" : "credits"} left
          </span>
        </div>
      </Card>

      <section aria-labelledby="your-downloads">
        <h2 id="your-downloads" className="text-h1 mb-3">
          {hasPass ? "Everything you can download" : "Your downloads"}
        </h2>
        {items.length === 0 ? (
          <Card variant="panel" className="p-5" data-testid="downloads-empty">
            <p className="text-body-lg font-medium">Nothing yet</p>
            <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">
              Pick an <Link href="/agentic-ai/agents" className="text-[var(--color-primary)] underline underline-offset-4">agent</Link> or a{" "}
              <Link href="/agentic-ai/skills" className="text-[var(--color-primary)] underline underline-offset-4">skill</Link> — one download is USD 2.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3" data-testid="downloads-list">
            {items.map((i) => (
              <li key={i.slug}>
                <Card variant="panel" className="flex flex-wrap items-center justify-between gap-3 p-4" data-testid="download-row" data-slug={i.slug}>
                  <div className="min-w-0">
                    <Link href={itemHref(i)} className="text-body-lg font-medium underline-offset-4 hover:underline">
                      {i.title}
                    </Link>
                    <p className="text-body-sm text-[var(--color-ink-faint)]">
                      <code>{definitionPath(i)}</code>
                    </p>
                  </div>
                  <Button href={`/api/agentic/download/${i.slug}`} variant="secondary" data-testid="download-link">
                    Download<span className="sr-only"> {i.title}</span>
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
