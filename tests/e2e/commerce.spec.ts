import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { completeProfileByEmail, deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Registration & payment — end to end through the real screens against the
 * test database (M4 plan §7 criteria 3, 6, 9, 10). Stripe is NEVER reached:
 * playwright.config.ts starts the app with STRIPE_SECRET_KEY blank, so the
 * checkout screen states that payments are not configured and the action
 * creates no order. The schedule offers "Register" for an open date; the
 * checkout shows the price for THIS person's region (a US profile country →
 * USD) and the refund tiers; submitting without consent is refused. The
 * profile gate itself is covered by tests/e2e/profile.spec.ts (M5a); here
 * the profile is completed through the repository so checkout renders.
 * 2026-09-26 (founder rule): a Pakistan-profile participant sees the
 * local-partner message and no pay button.
 */

test.describe.configure({ mode: "serial" });

const emails: string[] = [];
function newEmail(prefix: string) {
  const e = uniqueEmail(prefix);
  emails.push(e);
  return e;
}

let offeringId: string;
let flagshipTitle: string;
let usdPriceLabel: string;

test.beforeAll(async () => {
  const { getPrisma } = await import("../../src/db/prisma");
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const { formatMoney } = await import("../../src/modules/catalogue/programmes/types");
  const flagship = await findFlagshipProgramme();
  if (!flagship) throw new Error("seeded flagship programme required");
  flagshipTitle = flagship.title;
  const usd = flagship.prices.find((p) => p.region === "international")!;
  usdPriceLabel = formatMoney(usd.offerAmountMinor, usd.currency);

  const startsOn = new Date();
  startsOn.setUTCHours(0, 0, 0, 0);
  startsOn.setUTCDate(startsOn.getUTCDate() + 45);
  const endsOn = new Date(startsOn);
  endsOn.setUTCDate(endsOn.getUTCDate() + 2);
  const row = await getPrisma().scheduledOffering.create({
    data: {
      programmeId: flagship.id,
      deliveryFormatId: flagship.deliveryFormats[0]?.id ?? null,
      modality: "live_online",
      timezone: "Asia/Kuala_Lumpur",
      startsOn,
      endsOn,
      capacity: 5,
      status: "open",
    },
  });
  offeringId = row.id;
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  for (const e of emails) {
    const user = await prisma.user.findUnique({ where: { email: e.toLowerCase() }, select: { id: true } });
    if (user) {
      const orderIds = (await prisma.order.findMany({ where: { userId: user.id }, select: { id: true } })).map((o) => o.id);
      await prisma.review.deleteMany({ where: { userId: user.id } }); // M5b: reviews restrict registrations
      await prisma.registration.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      await prisma.auditLog.deleteMany({ where: { entityId: { in: orderIds } } });
    }
    await deleteTestUser(e);
  }
  if (offeringId) await prisma.scheduledOffering.delete({ where: { id: offeringId } });
  await disconnectPrisma();
});

async function registerViaUi(page: Page, email: string, name = "Cara Checkout") {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  // Country deliberately left empty at registration; the profile completed
  // below sets "US" → the international (USD) price applies.
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
}

async function signInViaUi(page: Page, email: string, password = STRONG_PASSWORD) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("the schedule offers Register for an open date, leading to its checkout", async ({ page }) => {
  await page.goto("/schedule");
  const register = page.getByTestId("register").first();
  await expect(register).toHaveText("Register");
  await expect(register).toHaveAttribute("href", `/checkout/${offeringId}`);
});

test("checkout requires sign-in and returns the person to it", async ({ page }) => {
  await page.goto(`/checkout/${offeringId}`);
  await expect(page).toHaveURL(new RegExp(`/sign-in\\?return-to=${encodeURIComponent(`/checkout/${offeringId}`)}`));
});

test("checkout shows the USD price for a person with an international profile country, the refund tiers, and refuses to pay without consent or keys", async ({ page }) => {
  const email = newEmail("e2e-m4");
  await registerViaUi(page, email);
  await completeProfileByEmail(email, { countryCode: "US", nationalityCode: "US" });
  await signInViaUi(page, email);

  await page.goto(`/checkout/${offeringId}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Register and pay");
  await expect(page.getByTestId("checkout-programme")).toHaveText(flagshipTitle);
  await expect(page.getByTestId("checkout-price")).toHaveText(usdPriceLabel);
  await expect(page.getByTestId("checkout-region-note")).toContainText("United States");
  await expect(page.getByTestId("checkout-region-note")).toContainText("Rest of the world");
  const tiers = page.getByTestId("checkout-refund-tiers");
  await expect(tiers).toContainText("100 % refund");
  await expect(tiers).toContainText("50 % refund");
  await expect(tiers).toContainText("No refund");
  await expect(tiers).toContainText("Free, once");
  await expectNoAxeViolations(page);

  // Without the tick, the server refuses and nothing is created.
  await page.getByTestId("pay").click();
  await expect(page.getByText("Please tick the box to agree")).toBeVisible();

  // With the tick but no Stripe keys, the screen says so — Stripe is never
  // called and no order exists.
  await page.getByTestId("checkout-consent").check();
  await page.getByTestId("pay").click();
  // (Next's route announcer is also role="alert" — match on the text.)
  await expect(page.getByText("Online payments are not configured")).toBeVisible();

  const { getPrisma } = await import("../../src/db/prisma");
  const user = await getPrisma().user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  expect(await getPrisma().order.count({ where: { userId: user!.id } })).toBe(0);

  // The cancel return from Stripe reads honestly.
  await page.goto(`/checkout/${offeringId}?cancelled=1`);
  await expect(page.getByTestId("checkout-cancelled")).toContainText("nothing was charged");

  // My registrations and Orders render their honest empty states.
  await page.goto("/account/programmes");
  await expect(page.getByText("You are not registered for a programme yet")).toBeVisible();
  await expectNoAxeViolations(page);
  await page.goto("/account/orders");
  await expect(page.getByText("No orders yet.")).toBeVisible();
});

test("a Pakistan-profile participant sees the local-partner message and no pay button (founder rule 2026-09-26)", async ({ page }) => {
  const email = newEmail("e2e-pk");
  await registerViaUi(page, email, "Parveen Pakistan");
  await completeProfileByEmail(email, { countryCode: "PK", nationalityCode: "PK", phoneE164: "+923001234567", city: "Karachi", postalCode: "74000" });
  await signInViaUi(page, email);

  await page.goto(`/checkout/${offeringId}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Register and pay");
  const block = page.getByTestId("checkout-local-partner");
  await expect(block).toBeVisible();
  await expect(block.getByTestId("checkout-unavailable")).toHaveText("Card payment is not available in Pakistan");
  await expect(block).toContainText(flagshipTitle);
  await expect(block).toContainText("Please contact us — our local partner will contact you to arrange payment through local banks or in cash.");
  await expect(block.getByRole("link", { name: "Contact us" })).toHaveAttribute(
    "href",
    "/contact-us?kind=programme_interest&programme=data-blueprint-ai-vibe-coding",
  );
  await expect(page.getByTestId("pay")).toHaveCount(0);
  await expect(page.getByTestId("checkout-consent")).toHaveCount(0);
  await expect(page.getByTestId("checkout-price")).toHaveCount(0);
  await expectNoAxeViolations(page);

  const { getPrisma } = await import("../../src/db/prisma");
  const user = await getPrisma().user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  expect(await getPrisma().order.count({ where: { userId: user!.id } })).toBe(0);
});

test("the confirmation page never trusts the redirect: an unknown order says so", async ({ page }) => {
  const email = newEmail("e2e-m4-order");
  await registerViaUi(page, email, "Orla Order");
  await signInViaUi(page, email);
  await page.goto("/account/programmes?order=00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("We could not find that order.")).toBeVisible();
});
