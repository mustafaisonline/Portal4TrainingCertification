import { getPrisma, withTransaction } from "@/db/prisma";
import { appBaseUrl } from "@/modules/commerce/checkout.service";
import { ORDER_HOLD_MINUTES } from "@/modules/commerce/capacity";
import { CommerceError, PaymentsNotConfiguredError } from "@/modules/commerce/errors";
import { paymentsConfigured, stripeGateway, type PaymentGateway } from "@/modules/commerce/stripe";
import { findUserById } from "@/modules/identity/users.repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import { downloadAccess, hasActivePass } from "./entitlements";
import { AGENTIC_CURRENCY, amountFor, describeSku, parseSku, type Sku } from "./products";

/*
 * Buying an Agentic AI product (CR-2026-10-04-0112 / -0113). The same shape as every other paid product here: ONE transaction
 * creates the pending order (kind and SKU from OUR catalogue, amount from products.ts — never the browser) and its audit row,
 * then Stripe is asked for a Checkout Session; the signed webhook marks it paid and grants the product
 * (entitlements.fulfilPaidAgenticOrder). Digital goods: the buyer must acknowledge "non-refundable once downloaded".
 */

export type StartAgenticCheckoutInput = { userId: string; sku: string; acknowledged: boolean; gateway?: PaymentGateway; now?: Date };
export type StartAgenticCheckoutResult = { orderId: string; url: string };

function orderKindOf(sku: Sku): "agentic_item" | "agentic_pack" | "access_pass" {
  return sku.kind;
}

export async function startAgenticCheckout(input: StartAgenticCheckoutInput): Promise<StartAgenticCheckoutResult> {
  const sku = parseSku(input.sku);
  if (!sku) throw new CommerceError("agentic_unknown_product", `Unknown Agentic AI product "${input.sku}".`);
  if (!input.acknowledged) throw new CommerceError("agentic_not_acknowledged", "The non-refundable digital-goods notice was not acknowledged.");
  if (!input.gateway && !paymentsConfigured()) throw new PaymentsNotConfiguredError("STRIPE_SECRET_KEY");
  const gateway = input.gateway ?? stripeGateway();
  const now = input.now ?? new Date();
  const user = await findUserById(input.userId);
  if (!user) throw new Error(`user ${input.userId} not found`);
  const baseUrl = appBaseUrl();
  const amountMinor = amountFor(sku);

  const order = await withTransaction(async (tx) => {
    // Nothing to buy when access already exists.
    if (sku.kind === "agentic_item") {
      const access = await downloadAccess(user.id, sku.slug, now, tx);
      if (access === "owned") throw new CommerceError("agentic_already_owned", `User ${user.id} already owns ${sku.slug}.`);
      if (access === "pass") throw new CommerceError("agentic_covered_by_pass", `User ${user.id} has an active pass that already includes ${sku.slug}.`);
    }
    if (sku.kind === "agentic_pack" && (await hasActivePass(user.id, now, tx))) throw new CommerceError("agentic_covered_by_pass", `User ${user.id} has an active pass; a pack adds nothing.`);
    // One open checkout per product at a time (the Stripe tab may still be open).
    const pending = await tx.order.findFirst({ where: { userId: user.id, productSku: input.sku, status: "pending", expiresAt: { gt: now } }, select: { id: true } });
    if (pending) throw new CommerceError("agentic_order_pending", `User ${user.id} already has pending order ${pending.id} for ${input.sku}.`);
    const created = await tx.order.create({
      data: {
        userId: user.id,
        offeringId: null,
        programmeId: null,
        kind: orderKindOf(sku),
        productSku: input.sku,
        status: "pending",
        region: "international",
        currency: AGENTIC_CURRENCY,
        amountMinor: BigInt(amountMinor),
        expiresAt: new Date(now.getTime() + ORDER_HOLD_MINUTES * 60_000),
      },
    });
    await writeAudit(tx, { actorUserId: user.id, action: "order.created", entityType: "order", entityId: created.id, after: { kind: created.kind, sku: input.sku, amountMinor, currency: AGENTIC_CURRENCY, acknowledgedNonRefundable: true, termsUpdated: "2026-10-04", expiresAt: created.expiresAt.toISOString() } });
    return created;
  });

  const prisma = getPrisma();
  try {
    const back = sku.kind === "access_pass" ? "/subscription" : "/agentic-ai";
    const session = await gateway.createCheckoutSession({
      orderId: order.id,
      amountMinor,
      currency: AGENTIC_CURRENCY,
      productName: `${describeSku(sku).title} — digital download, non-refundable once downloaded`,
      customerEmail: user.email,
      expiresAt: order.expiresAt,
      successUrl: `${baseUrl}/account/downloads?order=${order.id}`,
      cancelUrl: `${baseUrl}${back}?cancelled=1`,
    });
    await prisma.order.update({ where: { id: order.id }, data: { stripeCheckoutSessionId: session.id } });
    return { orderId: order.id, url: session.url };
  } catch (err) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "failed" } });
    console.error(`[agentic] Stripe Checkout Session creation failed for order ${order.id}`, err);
    throw err;
  }
}

/** The `?order=` banner's truth: the row, never the redirect; only the person's own Agentic AI orders. */
export async function findAgenticOrderForUser(orderId: string, userId: string, now = new Date()): Promise<{ id: string; effectiveStatus: string; title: string } | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return null;
  const o = await getPrisma().order.findUnique({ where: { id: orderId }, select: { id: true, userId: true, kind: true, status: true, expiresAt: true, productSku: true } });
  if (!o || o.userId !== userId || !["agentic_item", "agentic_pack", "access_pass"].includes(o.kind)) return null;
  const sku = parseSku(o.productSku);
  return { id: o.id, effectiveStatus: o.status === "pending" && o.expiresAt.getTime() <= now.getTime() ? "expired" : o.status, title: sku ? describeSku(sku).title : "Agentic AI" };
}
