import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { readZip } from "../../src/modules/agentic/zip";
import { deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Agentic AI (CR-2026-10-04-0111/0112/0113) through the screens: the public pages read without signing in; a signed-out
 * visitor and a signed-in person without access are never given the file; an owner, a credit-holder and a plan-holder are;
 * the buy form needs the digital-goods tick; the My Agentic AI page and the Subscription page tell the truth from the
 * database. Payment itself is covered by the integration tests (a fake Stripe gateway) — here Stripe is not configured, so
 * the buy button answers with the honest "not configured" message instead of charging anything.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const ownerEmail = uniqueEmail(`e2e-agentic-owner-${run}`);
const noAccessEmail = uniqueEmail(`e2e-agentic-none-${run}`);
const packEmail = uniqueEmail(`e2e-agentic-pack-${run}`);
const passEmail = uniqueEmail(`e2e-agentic-pass-${run}`);
const emails = [ownerEmail, noAccessEmail, packEmail, passEmail];
const IDS: Record<string, string> = {};

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  for (const e of emails) {
    const user = await prisma.user.findUnique({ where: { email: e.toLowerCase() }, select: { id: true } });
    if (user) {
      const orders = (await prisma.order.findMany({ where: { userId: user.id }, select: { id: true } })).map((o) => o.id);
      await prisma.auditLog.deleteMany({ where: { OR: [{ entityType: "order", entityId: { in: orders } }, { actorUserId: user.id }] } });
      await prisma.agenticOwnership.deleteMany({ where: { userId: user.id } });
      await prisma.agenticCreditPack.deleteMany({ where: { userId: user.id } });
      await prisma.accessPass.deleteMany({ where: { userId: user.id } });
      await prisma.payment.deleteMany({ where: { orderId: { in: orders } } });
      await prisma.order.deleteMany({ where: { id: { in: orders } } });
    }
    await deleteTestUser(e);
  }
  await disconnectPrisma();
});

async function register(page: Page, address: string, name: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/, { timeout: 30_000 });
  const { getPrisma } = await import("../../src/db/prisma");
  IDS[address] = (await getPrisma().user.findUniqueOrThrow({ where: { email: address.toLowerCase() }, select: { id: true } })).id;
}
async function signIn(page: Page, address: string) {
  await page.context().clearCookies();
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}
async function axeClean(page: Page, scope?: string) {
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  await expect.poll(async () => (await page.title()).trim().length, { timeout: 10_000 }).toBeGreaterThan(0);
  let b = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  if (scope) b = b.include(scope);
  const r = await b.analyze();
  expect(r.violations, JSON.stringify(r.violations, null, 2)).toEqual([]);
}
async function paidOrder(userId: string, kind: "agentic_item" | "agentic_pack" | "access_pass", sku: string, amountMinor: bigint) {
  const { getPrisma } = await import("../../src/db/prisma");
  return getPrisma().order.create({ data: { userId, kind, productSku: sku, status: "paid", region: "international", currency: "USD", amountMinor, expiresAt: new Date(), paidAt: new Date() } });
}

test("anyone can read the Agentic AI section: landing with pricing, the lists, an item page and the terms — all accessible", async ({ page }) => {
  await page.goto("/agentic-ai");
  await expect(page.getByTestId("agentic-landing-title")).toHaveText("Agents and skills for Claude Code.");
  await expect(page.getByTestId("price-item")).toContainText("USD 2");
  await expect(page.getByTestId("price-pack")).toContainText("USD 10");
  await expect(page.getByTestId("price-agentic_unlimited")).toContainText("USD 10");
  await expect(page.getByTestId("price-portal_unlimited")).toContainText("USD 20");
  await axeClean(page);

  await page.goto("/agentic-ai/agents");
  await expect(page.getByTestId("agentic-card")).toHaveCount(5);
  await axeClean(page);
  await page.goto("/agentic-ai/skills");
  await expect(page.getByTestId("agentic-card")).toHaveCount(8);
  await page.getByTestId("agentic-card").filter({ hasText: "Impact Analysis" }).getByTestId("agentic-card-link").click();
  await expect(page).toHaveURL(/\/agentic-ai\/skills\/impact-analysis$/);
  await expect(page.getByTestId("agentic-title")).toHaveText("Impact Analysis");
  await expect(page.getByTestId("agentic-example")).toContainText("Example");
  await expect(page.getByTestId("agentic-contents")).toContainText(".claude/skills/impact-analysis/SKILL.md");
  await axeClean(page);

  expect((await page.request.get("/agentic-ai/agents/not-an-agent")).status()).toBe(404);
  expect((await page.request.get("/agentic-ai/skills/delivery-advisor")).status()).toBe(404); // an agent is not under /skills
  await page.goto("/agentic-ai/terms");
  await expect(page.getByTestId("agentic-terms-title")).toBeVisible();
  await expect(page.getByText(/non-refundable once you have downloaded/)).toBeVisible();
  await axeClean(page);
  await page.goto("/subscription");
  await expect(page.getByTestId("plan-agentic_unlimited")).toContainText("USD 10");
  await expect(page.getByTestId("plan-portal_unlimited")).toContainText("Certificates of Achievement");
  await expect(page.getByTestId("subscription-terms")).toContainText("30 days");
  await axeClean(page);
});

test("signed out: the item page offers sign-in, and the download is refused (401) — never the file", async ({ page }) => {
  await page.goto("/agentic-ai/agents/delivery-advisor");
  await expect(page.getByTestId("agentic-access")).toHaveAttribute("data-state", "signed-out");
  await expect(page.getByTestId("agentic-signin")).toHaveAttribute("href", /\/sign-in\?return-to=%2Fagentic-ai%2Fagents%2Fdelivery-advisor/);
  const res = await page.request.get("/api/agentic/download/delivery-advisor");
  expect(res.status()).toBe(401);
  expect(res.headers()["content-type"]).not.toContain("zip");
});

test("signed in without access: the buy form needs the tick, Stripe unconfigured answers honestly, and the download is refused (403)", async ({ page }) => {
  await register(page, noAccessEmail, "Nora NoAccess");
  await signIn(page, noAccessEmail);
  await page.goto("/agentic-ai/agents/delivery-advisor");
  await expect(page.getByTestId("agentic-access")).toHaveAttribute("data-state", "buy");
  await expect(page.getByTestId("agentic-buy")).toContainText("Buy for USD 2");
  const ack = page.getByTestId("agentic-buy-ack");
  await expect(ack).toHaveAttribute("required", "");
  await ack.check();
  await page.getByTestId("agentic-buy").click();
  await expect(page.getByText(/Online payments are not configured/)).toBeVisible();
  const { getPrisma } = await import("../../src/db/prisma");
  expect(await getPrisma().order.count({ where: { userId: IDS[noAccessEmail]!, kind: "agentic_item" } })).toBe(0); // payments are not configured: no order is created and nothing is charged
  const denied = await page.request.get("/api/agentic/download/delivery-advisor");
  expect(denied.status()).toBe(403);
  expect(denied.headers()["content-type"]).not.toContain("zip");
  expect((await page.request.get("/api/agentic/download/not-real")).status()).toBe(404);
  await page.goto("/account/downloads");
  await expect(page.getByTestId("downloads-empty")).toBeVisible();
  await expect(page.getByTestId("downloads-no-plan")).toBeVisible();
});

test("an owner downloads a ZIP with the agent file, the manual, the install guide and the licence; the account page lists it", async ({ page }) => {
  await register(page, ownerEmail, "Omar Owner");
  const { getPrisma } = await import("../../src/db/prisma");
  const order = await paidOrder(IDS[ownerEmail]!, "agentic_item", "item:test-runner", 200n);
  await getPrisma().agenticOwnership.create({ data: { userId: IDS[ownerEmail]!, itemSlug: "test-runner", via: "purchase", orderId: order.id } });
  await signIn(page, ownerEmail);
  await page.goto("/agentic-ai/agents/test-runner");
  await expect(page.getByTestId("agentic-access")).toHaveAttribute("data-state", "owned");
  await expect(page.getByTestId("agentic-download")).toHaveAttribute("href", "/api/agentic/download/test-runner");
  const res = await page.request.get("/api/agentic/download/test-runner");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("application/zip");
  expect(res.headers()["content-disposition"]).toContain('attachment; filename="test-runner.zip"');
  expect(res.headers()["cache-control"]).toBe("no-store");
  const files = readZip(await res.body());
  expect(files.map((f) => f.path).sort()).toEqual([".claude/agents/test-runner.md", "INSTALL.md", "LICENSE.txt", "MANUAL.md"]);
  expect(files.find((f) => f.path === ".claude/agents/test-runner.md")!.data.toString("utf8")).toMatch(/^---\nname: test-runner\n/);
  // An item they do not own is still refused.
  expect((await page.request.get("/api/agentic/download/next-steps")).status()).toBe(403);
  await page.goto("/account/downloads");
  await expect(page.getByTestId("download-row")).toHaveCount(1);
  await expect(page.getByTestId("download-row")).toContainText("Test Runner");
  await axeClean(page);
  // The order shows its product name in Orders & receipts.
  await page.goto("/account/orders");
  await expect(page.getByText("Agentic AI — Test Runner")).toBeVisible();
});

test("a credit pack: claiming spends one credit, downloads the file, and the item stays theirs", async ({ page }) => {
  await register(page, packEmail, "Pia Pack");
  const { getPrisma } = await import("../../src/db/prisma");
  const order = await paidOrder(IDS[packEmail]!, "agentic_pack", "pack:10", 1000n);
  await getPrisma().agenticCreditPack.create({ data: { userId: IDS[packEmail]!, orderId: order.id, creditsTotal: 10 } });
  await signIn(page, packEmail);
  await page.goto("/agentic-ai/skills/next-steps");
  await expect(page.getByTestId("agentic-access")).toHaveAttribute("data-state", "credit");
  await expect(page.getByTestId("agentic-claim-form")).toContainText("10 credits left");
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("agentic-claim").click()]);
  expect(download.suggestedFilename()).toBe("next-steps.zip");
  expect(await getPrisma().agenticCreditPack.findFirstOrThrow({ where: { userId: IDS[packEmail]! } })).toMatchObject({ creditsUsed: 1 });
  await page.goto("/agentic-ai/skills/next-steps");
  await expect(page.getByTestId("agentic-access")).toHaveAttribute("data-state", "owned");
  await page.goto("/account/downloads");
  await expect(page.getByTestId("downloads-credits")).toContainText("9 download credits left");
  await expect(page.getByTestId("download-row")).toHaveCount(1);
});

test("a plan covers every item: the item page says included, the account page lists all 13, the subscription page shows the end date", async ({ page }) => {
  await register(page, passEmail, "Pax Pass");
  const { getPrisma } = await import("../../src/db/prisma");
  const order = await paidOrder(IDS[passEmail]!, "access_pass", "pass:portal_unlimited", 2000n);
  const ends = new Date(Date.now() + 200 * 86_400_000);
  await getPrisma().accessPass.create({ data: { userId: IDS[passEmail]!, plan: "portal_unlimited", orderId: order.id, startsAt: new Date(Date.now() - 165 * 86_400_000), endsAt: ends } });
  await signIn(page, passEmail);
  await page.goto("/agentic-ai/agents/change-reviewer");
  await expect(page.getByTestId("agentic-access")).toHaveAttribute("data-state", "pass");
  expect((await page.request.get("/api/agentic/download/change-reviewer")).status()).toBe(200);
  await page.goto("/account/downloads");
  await expect(page.getByTestId("download-row")).toHaveCount(13);
  await expect(page.getByTestId("downloads-pass")).toContainText(`active until ${ends.toISOString().slice(0, 10)}`);
  await page.goto("/subscription");
  await expect(page.getByTestId("plan-portal_unlimited")).toContainText(`Active until ${ends.toISOString().slice(0, 10)}`);
  await expect(page.getByTestId("buy-portal_unlimited")).toContainText("Extend by 365 days");
  await axeClean(page);
});
