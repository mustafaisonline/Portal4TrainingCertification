import Link from "next/link";
import { definitionPath, type AgenticItem } from "@/content/agentic/types";
import { creditsLeft as getCredits, downloadAccess } from "@/modules/agentic/entitlements";
import { AGENTIC_CURRENCY, PRICE_ITEM_MINOR, skuOfItem } from "@/modules/agentic/products";
import { getCurrentUser } from "@/modules/identity/session";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { BuyForm, ClaimForm } from "./AgenticForms";

/*
 * The "get it" box on an item's page (CR-2026-10-04-0112): what the signed-in person can do right now — download (owned, or
 * an active pass), spend a credit, or buy it. Everything is read on the server from the database; a signed-out visitor is
 * sent to sign in and returns here.
 */
export async function ItemAccessPanel({ item, returnTo }: { item: AgenticItem; returnTo: string }) {
  const user = await getCurrentUser();
  const price = formatMoney(PRICE_ITEM_MINOR, AGENTIC_CURRENCY);
  if (!user) {
    return (
      <Card variant="panel" className="flex flex-col gap-3 p-5" data-testid="agentic-access" data-state="signed-out">
        <p className="text-h2">{price}</p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">One-off, yours to keep. Or download everything with a plan.</p>
        <Button href={`/sign-in?return-to=${encodeURIComponent(returnTo)}`} data-testid="agentic-signin">
          Sign in to get it
        </Button>
        <Link href="/subscription" className="text-body-sm text-[var(--color-primary)] underline underline-offset-4">
          See the plans
        </Link>
      </Card>
    );
  }
  const [access, credits] = await Promise.all([downloadAccess(user.id, item.slug), getCredits(user.id)]);
  if (access !== "none") {
    return (
      <Card variant="panel" className="flex flex-col gap-3 p-5" data-testid="agentic-access" data-state={access}>
        <p className="text-h2">{access === "pass" ? "Included in your plan" : "You own this"}</p>
        <Button href={`/api/agentic/download/${item.slug}`} data-testid="agentic-download">
          Download {item.slug}.zip
        </Button>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Contains <code>{definitionPath(item)}</code>, the manual, the install guide and the licence. Unzip it at the root of your project.
        </p>
      </Card>
    );
  }
  return (
    <Card variant="panel" className="flex flex-col gap-4 p-5" data-testid="agentic-access" data-state={credits > 0 ? "credit" : "buy"}>
      <p className="text-h2">{price}</p>
      {credits > 0 ? <ClaimForm slug={item.slug} creditsLeft={credits} /> : null}
      <BuyForm sku={skuOfItem(item.slug)} label={`Buy for ${price}`} testId="agentic-buy" variant={credits > 0 ? "secondary" : "primary"} payNote="Pay securely on Stripe." />
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        Want several?{" "}
        <Link href="/agentic-ai#pricing" className="text-[var(--color-primary)] underline underline-offset-4">
          The 10-pack
        </Link>{" "}
        or{" "}
        <Link href="/subscription" className="text-[var(--color-primary)] underline underline-offset-4">
          a plan
        </Link>{" "}
        cost less per item.
      </p>
    </Card>
  );
}
