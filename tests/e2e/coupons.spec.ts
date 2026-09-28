import { expect, test, type Page } from "@playwright/test";
import { completeProfileByEmail, deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Coupons through the real screens (founder specification + N1–N8 approved
 * 2026-09-28): an administrator generates a coupon on /admin/coupons and
 * disables/enables it; the assigned participant applies it at checkout and
 * sees the server-priced discount in the summary; a wrong code and the
 * wrong account get the spec's §14 sentences. Stripe is never reached
 * (playwright.config starts the app with no Stripe key), so the pay press
 * itself is out of scope here — the discount maths and redemption are
 * covered by tests/integration/coupons.test.ts.
 */

test.describe.configure({ mode: "serial" });

const adminEmail = uniqueEmail("e2e-coupon-admin");
const buyerEmail = uniqueEmail("e2e-coupon-buyer");
const strangerEmail = uniqueEmail("e2e-coupon-other");

let offeringId = "";
let couponCode = "";
let flagshipTitle = "";
let discountedLabel = "";

test.beforeAll(async () => {
  const { getPrisma } = await import("../../src/db/prisma");
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const { formatMoney } = await import("../../src/modules/catalogue/programmes/types");
  const { priceWithCoupon } = await import("../../src/modules/commerce/coupons.repository");
  const flagship = await findFlagshipProgramme();
  if (!flagship) throw new Error("seeded flagship programme required");
  flagshipTitle = flagship.title;
  const usd = flagship.prices.find((p) => p.region === "international")!;
  discountedLabel = formatMoney(priceWithCoupon(usd.offerAmountMinor, 98).finalMinor, usd.currency);

  const startsOn = new Date();
  startsOn.setUTCHours(0, 0, 0, 0);
  startsOn.setUTCDate(startsOn.getUTCDate() + 50);
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
  const coupons = await prisma.coupon.findMany({ where: { email: buyerEmail.toLowerCase() }, select: { id: true } });
  const couponIds = coupons.map((c) => c.id);
  await prisma.order.updateMany({ where: { couponId: { in: couponIds } }, data: { couponId: null } });
  await prisma.auditLog.deleteMany({ where: { entityType: "coupon", entityId: { in: couponIds } } });
  await prisma.coupon.deleteMany({ where: { id: { in: couponIds } } });
  for (const e of [buyerEmail, strangerEmail]) {
    const user = await prisma.user.findUnique({ where: { email: e.toLowerCase() }, select: { id: true } });
    if (user) {
      const orderIds = (await prisma.order.findMany({ where: { userId: user.id }, select: { id: true } })).map((o) => o.id);
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      await prisma.auditLog.deleteMany({ where: { entityId: { in: orderIds } } });
    }
    await deleteTestUser(e);
  }
  await deleteTestUser(adminEmail);
  if (offeringId) await prisma.scheduledOffering.delete({ where: { id: offeringId } });
  await disconnectPrisma();
});

async function registerViaUi(page: Page, address: string, name: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel(/^Country/).selectOption("US");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
}

async function signInViaUi(page: Page, address: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}

test("the administrator generates a coupon, sees the row, disables and enables it; a Trainer-less participant is refused the screen", async ({ page }) => {
  await registerViaUi(page, adminEmail, "Coupon Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signInViaUi(page, adminEmail);

  await page.goto("/admin/coupons");
  await expect(page.getByTestId("coupons-title")).toBeVisible();

  // Scoped to the form: the header search's accessible name also contains
  // the word "Training", so a bare getByLabel is ambiguous.
  const form = page.getByTestId("coupon-generate-form");
  await form.getByLabel("User email").fill(buyerEmail);
  await form.getByLabel("Training").selectOption({ label: flagshipTitle });
  await form.getByLabel("Discount %").fill("98");
  await page.getByTestId("coupon-generate").click();
  const status = page.getByTestId("coupon-generate-status");
  await expect(status).toContainText("created for");
  couponCode = (await status.innerText()).match(/TRN-[A-Z0-9]{6}/)![0];

  const row = page.locator(`[data-testid="coupon-row"][data-code="${couponCode}"]`);
  await expect(row).toContainText(buyerEmail.toLowerCase());
  await expect(row).toContainText("98%");
  await expect(row).toContainText("Active");

  // Disable, then enable — the derived status follows the stored one.
  await row.getByTestId("coupon-toggle").click();
  await expect(row).toContainText("Disabled");
  await row.getByTestId("coupon-toggle").click();
  await expect(row).toContainText("Active");
});

test("the assigned participant applies the coupon at checkout: wrong code refused, right code discounts the summary; another account gets the §8 refusal", async ({ page }) => {
  expect(couponCode, "the admin test created the coupon").toMatch(/^TRN-/);

  await registerViaUi(page, buyerEmail, "Bea Buyer");
  await completeProfileByEmail(buyerEmail, { countryCode: "US", nationalityCode: "US" });
  await signInViaUi(page, buyerEmail);

  await page.goto(`/checkout/${offeringId}`);
  await expect(page.getByTestId("coupon-field")).toBeVisible();

  // Wrong code → the §14 sentence; the price is unchanged.
  await page.getByRole("textbox", { name: "Coupon code" }).fill("TRN-WRONG9");
  await page.getByTestId("coupon-apply").click();
  await expect(page.getByTestId("coupon-error")).toContainText("Invalid coupon code");
  await expect(page.getByTestId("checkout-summary")).not.toContainText("Amount payable");

  // The right code, lower-cased on purpose → applied, priced server-side.
  await page.getByRole("textbox", { name: "Coupon code" }).fill(couponCode.toLowerCase());
  await page.getByTestId("coupon-apply").click();
  await expect(page.getByTestId("coupon-applied")).toContainText("Coupon applied successfully. You received a 98% discount.");
  await expect(page.getByTestId("checkout-price")).toHaveText(discountedLabel);
  await expect(page.getByTestId("checkout-coupon-line")).toContainText(couponCode);
  await expect(page.getByTestId("summary-coupon-discount")).toBeVisible();
  await expect(page.getByTestId("checkout-summary")).toContainText("Amount payable");
  await expect(page.getByTestId("pay")).toContainText(discountedLabel);

  // Another signed-in account: the coupon is personal (§8).
  await page.goto("/sign-out");
  await page.context().clearCookies();
  await resetRateLimits();
  await registerViaUi(page, strangerEmail, "Sam Stranger");
  await completeProfileByEmail(strangerEmail, { countryCode: "US", nationalityCode: "US" });
  await signInViaUi(page, strangerEmail);
  await page.goto(`/checkout/${offeringId}?coupon=${couponCode}`);
  await expect(page.getByTestId("coupon-error")).toContainText("This coupon is not assigned to the registered email address.");
});
