import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";
import { PACK_CREDITS, PASS_DAYS, parseSku, type PassPlan } from "./products";

/*
 * Who may download what (CR-2026-10-04-0112 / -0113). All state is in the database (restart-safe):
 *   - an ACTIVE PASS (either plan) lets a person download every agent and skill — no ownership row is needed;
 *   - otherwise a person owns the items they bought singly or claimed with a pack credit (`agentic_ownerships`);
 *   - a pack credit is spent by ONE atomic statement, so a credit can never be spent twice or go negative.
 * A pass bought while another is active EXTENDS it (it starts when the current one of that plan ends).
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export type ActivePass = { plan: PassPlan; endsAt: Date };

/** The person's active passes (a Portal pass also covers everything an Agentic AI pass does). */
export async function activePasses(userId: string, now: Date = new Date(), db: Db = getPrisma()): Promise<ActivePass[]> {
  const rows = await db.accessPass.findMany({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } }, orderBy: { endsAt: "desc" }, select: { plan: true, endsAt: true } });
  return rows.map((r) => ({ plan: r.plan as PassPlan, endsAt: r.endsAt }));
}
export async function hasActivePass(userId: string, now: Date = new Date(), db: Db = getPrisma()): Promise<boolean> {
  return (await db.accessPass.count({ where: { userId, startsAt: { lte: now }, endsAt: { gt: now } } })) > 0;
}
/** Portal Unlimited: the plan that also unlocks the paid assessment result documents. */
export async function hasActivePortalPass(userId: string, now: Date = new Date(), db: Db = getPrisma()): Promise<boolean> {
  return (await db.accessPass.count({ where: { userId, plan: "portal_unlimited", startsAt: { lte: now }, endsAt: { gt: now } } })) > 0;
}

export async function ownedSlugs(userId: string, db: Db = getPrisma()): Promise<Set<string>> {
  const rows = await db.agenticOwnership.findMany({ where: { userId }, select: { itemSlug: true } });
  return new Set(rows.map((r) => r.itemSlug));
}

export async function creditsLeft(userId: string, db: Db = getPrisma()): Promise<number> {
  const rows = await db.agenticCreditPack.findMany({ where: { userId }, select: { creditsTotal: true, creditsUsed: true } });
  return rows.reduce((n, r) => n + (r.creditsTotal - r.creditsUsed), 0);
}

export type DownloadAccess = "pass" | "owned" | "none";
export async function downloadAccess(userId: string, slug: string, now: Date = new Date(), db: Db = getPrisma()): Promise<DownloadAccess> {
  if (await hasActivePass(userId, now, db)) return "pass";
  return (await db.agenticOwnership.count({ where: { userId, itemSlug: slug } })) > 0 ? "owned" : "none";
}

export type ClaimResult = { ok: true; how: "already_owned" | "pass" | "credit" } | { ok: false; reason: "no_credit" };

/** Spend one pack credit on an item (if the person has a credit and does not already have access). Atomic. */
export async function claimWithCredit(tx: Tx, userId: string, slug: string, now: Date = new Date()): Promise<ClaimResult> {
  if (await hasActivePass(userId, now, tx)) return { ok: true, how: "pass" };
  if ((await tx.agenticOwnership.count({ where: { userId, itemSlug: slug } })) > 0) return { ok: true, how: "already_owned" };
  // The oldest pack with a credit left. A plain row lock (NOT skip-locked): parallel requests wait their turn, and the WHERE is
  // re-checked after the lock — so a credit can never be spent twice, and nobody is wrongly told "no credit" while one remains.
  const spent = await tx.$queryRaw<{ id: string }[]>`
    UPDATE agentic_credit_packs SET credits_used = credits_used + 1
    WHERE id = (SELECT id FROM agentic_credit_packs WHERE user_id = ${userId}::uuid AND credits_used < credits_total ORDER BY created_at LIMIT 1 FOR UPDATE)
      AND credits_used < credits_total
    RETURNING id`;
  if (spent.length === 0) return { ok: false, reason: "no_credit" };
  await tx.agenticOwnership.create({ data: { userId, itemSlug: slug, via: "pack" } });
  await writeAudit(tx, { actorUserId: userId, action: "agentic.credit_spent", entityType: "agentic_item", entityId: slug, after: { packId: spent[0]!.id } });
  return { ok: true, how: "credit" };
}

/** What a PAID order produces (called by the Stripe webhook inside the order's transaction — idempotent). */
export async function fulfilPaidAgenticOrder(tx: Tx, order: { id: string; userId: string; kind: string; productSku: string | null }, now: Date): Promise<{ note: string; kind: "item" | "pack" | "pass"; summary: string }> {
  const sku = parseSku(order.productSku);
  if (!sku) throw new Error(`agentic order ${order.id} carries no valid product SKU (${order.productSku ?? "null"})`);
  if (sku.kind === "agentic_item") {
    await tx.agenticOwnership.upsert({ where: { userId_itemSlug: { userId: order.userId, itemSlug: sku.slug } }, create: { userId: order.userId, itemSlug: sku.slug, via: "purchase", orderId: order.id }, update: {} });
    return { note: `agentic item ${sku.slug} granted`, kind: "item", summary: sku.slug };
  }
  if (sku.kind === "agentic_pack") {
    await tx.agenticCreditPack.upsert({ where: { orderId: order.id }, create: { userId: order.userId, orderId: order.id, creditsTotal: PACK_CREDITS }, update: {} });
    return { note: `agentic credit pack of ${PACK_CREDITS} granted`, kind: "pack", summary: String(PACK_CREDITS) };
  }
  // A pass: starts now, or when this person's current pass of the same plan ends (so an early renewal loses nothing).
  const current = await tx.accessPass.findFirst({ where: { userId: order.userId, plan: sku.plan, endsAt: { gt: now } }, orderBy: { endsAt: "desc" }, select: { endsAt: true } });
  const startsAt = current ? current.endsAt : now;
  const endsAt = new Date(startsAt.getTime() + PASS_DAYS * DAY_MS);
  await tx.accessPass.upsert({ where: { orderId: order.id }, create: { userId: order.userId, plan: sku.plan, orderId: order.id, startsAt, endsAt }, update: {} });
  return { note: `access pass ${sku.plan} granted until ${endsAt.toISOString().slice(0, 10)}`, kind: "pass", summary: `${sku.plan}|${endsAt.toISOString()}` };
}
