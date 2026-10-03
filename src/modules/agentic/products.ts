import { findAgenticItemBySlug } from "@/content/agentic/catalogue";

/*
 * What Agentic AI sells and for how much (CR-2026-10-04-0112 / -0113). THE ONE PLACE the prices live: they are the founder's
 * fixed prices (2026-10-04) — changing one is a code change with a CR, never a value from the browser. Pure: no database,
 * safe to import anywhere (including client components for display).
 *
 *   one agent or skill ........ USD 2
 *   a pack of 10 credits ....... USD 10   (50 and 100 packs later, when the catalogue is that big)
 *   Agentic AI Unlimited ....... USD 10 / year  (every agent and skill; one-off 365-day pass, no automatic renewal)
 *   Portal Unlimited ........... USD 20 / year  (everything above + unlimited unlocks of the paid assessment result documents)
 */

export const AGENTIC_CURRENCY = "USD";
export const PASS_DAYS = 365;
export const PACK_CREDITS = 10;

export type PassPlan = "agentic_unlimited" | "portal_unlimited";
export const PASS_PLANS: readonly PassPlan[] = ["agentic_unlimited", "portal_unlimited"];

export const PRICE_ITEM_MINOR = 200;
export const PRICE_PACK10_MINOR = 1000;
export const PRICE_PASS_MINOR: Record<PassPlan, number> = { agentic_unlimited: 1000, portal_unlimited: 2000 };

export const PASS_LABEL: Record<PassPlan, string> = { agentic_unlimited: "Agentic AI Unlimited", portal_unlimited: "Portal Unlimited" };
export const PASS_BLURB: Record<PassPlan, string> = {
  agentic_unlimited: "Download every agent and skill for a year.",
  portal_unlimited: "Everything in Agentic AI Unlimited, plus unlimited unlocks of the Free Assessment Check result document.",
};

export type Sku = { kind: "agentic_item"; slug: string } | { kind: "agentic_pack" } | { kind: "access_pass"; plan: PassPlan };

export const skuOfItem = (slug: string) => `item:${slug}`;
export const SKU_PACK10 = "pack:10";
export const skuOfPass = (plan: PassPlan) => `pass:${plan}`;

/** Parses a stored SKU; null for anything that is not a product we sell (an unknown item slug included). */
export function parseSku(raw: string | null | undefined): Sku | null {
  if (!raw) return null;
  if (raw === SKU_PACK10) return { kind: "agentic_pack" };
  const pass = /^pass:(agentic_unlimited|portal_unlimited)$/.exec(raw);
  if (pass) return { kind: "access_pass", plan: pass[1] as PassPlan };
  const item = /^item:([a-z0-9-]+)$/.exec(raw);
  if (item && findAgenticItemBySlug(item[1]!)) return { kind: "agentic_item", slug: item[1]! };
  return null;
}

/** The amount in minor units (cents) for a SKU — the server's, never the browser's. */
export function amountFor(sku: Sku): number {
  return sku.kind === "agentic_item" ? PRICE_ITEM_MINOR : sku.kind === "agentic_pack" ? PRICE_PACK10_MINOR : PRICE_PASS_MINOR[sku.plan];
}

/** The order list's two lines for an Agentic AI order. */
export function describeSku(sku: Sku): { title: string; detail: string } {
  if (sku.kind === "agentic_item") return { title: `Agentic AI — ${findAgenticItemBySlug(sku.slug)?.title ?? sku.slug}`, detail: "One download · non-refundable once downloaded" };
  if (sku.kind === "agentic_pack") return { title: `Agentic AI — pack of ${PACK_CREDITS}`, detail: `${PACK_CREDITS} download credits · non-refundable once used` };
  return { title: PASS_LABEL[sku.plan], detail: `One-off ${PASS_DAYS}-day pass · no automatic renewal` };
}

export const AGENTIC_ORDER_KINDS = ["agentic_item", "agentic_pack", "access_pass"] as const;
export const isAgenticKind = (k: string): k is (typeof AGENTIC_ORDER_KINDS)[number] => (AGENTIC_ORDER_KINDS as readonly string[]).includes(k);
