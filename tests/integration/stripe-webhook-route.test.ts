import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { POST } from "../../app/api/stripe/webhook/route";
import { disconnectPrisma, getPrisma } from "@/db/prisma";

/*
 * The webhook ROUTE itself over its real handler — Milestone 15, Requirement
 * 7 verification matrix ("webhook signature failure → 400", "duplicate webhook
 * is a no-op"). The service-level cases live in commerce.test.ts; this proves
 * the HTTP contract Stripe sees: 400 with no or a wrong signature, 200 once
 * stored, `duplicate: true` on a replay, and an honest 500 when the signing
 * secret is not configured. The secret used here is a throwaway test value.
 */
const SECRET = "whsec_test_" + "route".repeat(6);
const prisma = getPrisma();
const eventIds: string[] = [];
const original = process.env["STRIPE_WEBHOOK_SECRET"];

beforeAll(() => {
  process.env["STRIPE_WEBHOOK_SECRET"] = SECRET;
});
afterEach(() => {
  process.env["STRIPE_WEBHOOK_SECRET"] = SECRET;
});
afterAll(async () => {
  if (eventIds.length > 0) await prisma.stripeEvent.deleteMany({ where: { id: { in: eventIds } } });
  if (original === undefined) delete process.env["STRIPE_WEBHOOK_SECRET"];
  else process.env["STRIPE_WEBHOOK_SECRET"] = original;
  await disconnectPrisma();
});

function unhandledEvent(): { id: string; body: string } {
  const id = `evt_test_${randomUUID().replace(/-/g, "")}`;
  eventIds.push(id);
  return { id, body: JSON.stringify({ id, object: "event", type: "customer.created", data: { object: { id: "cus_test_1", object: "customer" } } }) };
}
const sign = (body: string, secret = SECRET) => Stripe.webhooks.generateTestHeaderString({ payload: body, secret });
const post = (body: string, signature?: string) =>
  POST(new Request("http://localhost/api/stripe/webhook", { method: "POST", body, headers: signature ? { "stripe-signature": signature } : {} }));

describe("POST /api/stripe/webhook", () => {
  it("refuses a request with no signature header (400) and stores nothing", async () => {
    const { id, body } = unhandledEvent();
    const res = await post(body);
    expect(res.status).toBe(400);
    expect(await prisma.stripeEvent.findUnique({ where: { id } })).toBeNull();
  });

  it("refuses a wrong or tampered signature (400) and stores nothing", async () => {
    const { id, body } = unhandledEvent();
    expect((await post(body, sign(body, "whsec_someone_else"))).status).toBe(400);
    expect((await post(body + " ", sign(body))).status).toBe(400); // altered after signing
    expect(await prisma.stripeEvent.findUnique({ where: { id } })).toBeNull();
  });

  it("a correctly signed event is stored and answered 200; the replay is a no-op", async () => {
    const { id, body } = unhandledEvent();
    const first = await post(body, sign(body));
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({ received: true, duplicate: false, status: "ignored" });
    const second = await post(body, sign(body));
    expect(second.status).toBe(200);
    expect(await second.json()).toMatchObject({ received: true, duplicate: true });
    expect(await prisma.stripeEvent.count({ where: { id } })).toBe(1);
  });

  it("with no signing secret configured, answers 500 'payments not configured' — never a fake success", async () => {
    delete process.env["STRIPE_WEBHOOK_SECRET"];
    const { id, body } = unhandledEvent();
    const res = await post(body, sign(body));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "payments not configured" });
    expect(await prisma.stripeEvent.findUnique({ where: { id } })).toBeNull();
  });
});
