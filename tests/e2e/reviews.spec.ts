import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Reviews — end to end through the real screens against the test database
 * (MILESTONE_5B_EXECUTION_PLAN.md §4 criteria 2–4, 6, 9). A guest sees the
 * page and the sign-in button but no form; a person with a confirmed
 * registration on a past offering (created directly, as the commerce spec
 * does) sees the form headed by their name, the counter and validation,
 * submits, and the dashboard shows the status; an administrator approves,
 * hides and restores; a private review cannot be restored; a participant
 * gets 403 on /admin/reviews; both screens are axe-clean.
 */

test.describe.configure({ mode: "serial" });

const emails: string[] = [];
function newEmail(prefix: string) {
  const e = uniqueEmail(prefix);
  emails.push(e);
  return e;
}

const LEARNER_NAME = `Riya Reviewer ${randomUUID().slice(0, 4)}`;
const BODY = `The cohort format kept me accountable and the labs were directly usable at work. ${randomUUID().slice(0, 8)}`;
const PRIVATE_BODY = `A private note that must never be restored to public view. ${randomUUID().slice(0, 8)}`;

let offeringId: string;
let flagshipTitle: string;
const learnerEmail = newEmail("e2e-review-learner");
const privateEmail = newEmail("e2e-review-private");
const adminEmail = newEmail("e2e-review-admin");
let learnerUserId: string;

async function pastOffering() {
  const { getPrisma } = await import("../../src/db/prisma");
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const flagship = await findFlagshipProgramme();
  if (!flagship) throw new Error("seeded flagship programme required");
  flagshipTitle = flagship.title;
  const endsOn = new Date();
  endsOn.setUTCHours(0, 0, 0, 0);
  endsOn.setUTCDate(endsOn.getUTCDate() - 1);
  const startsOn = new Date(endsOn);
  startsOn.setUTCDate(startsOn.getUTCDate() - 2);
  const row = await getPrisma().scheduledOffering.create({
    data: {
      programmeId: flagship.id,
      deliveryFormatId: flagship.deliveryFormats[0]?.id ?? null,
      modality: "live_online",
      timezone: "Asia/Kuala_Lumpur",
      startsOn,
      endsOn,
      capacity: 5,
      status: "completed",
    },
  });
  return { offeringId: row.id, programmeId: flagship.id };
}

/** A paid order + confirmed registration for the person, written directly. */
async function confirmRegistration(email: string, programmeId: string) {
  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const user = await prisma.user.findUniqueOrThrow({ where: { email: email.toLowerCase() } });
  const order = await prisma.order.create({
    data: {
      userId: user.id,
      offeringId,
      programmeId,
      status: "paid",
      region: "malaysia",
      currency: "MYR",
      amountMinor: BigInt(499900),
      expiresAt: new Date(Date.now() + 3600_000),
      paidAt: new Date(),
      stripeCheckoutSessionId: `cs_test_${randomUUID().slice(0, 12)}`,
    },
  });
  const reg = await prisma.registration.create({ data: { userId: user.id, offeringId, orderId: order.id, status: "confirmed" } });
  return { userId: user.id, registrationId: reg.id };
}

test.beforeAll(async () => {
  const created = await pastOffering();
  offeringId = created.offeringId;
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
      const reviewIds = (await prisma.review.findMany({ where: { userId: user.id }, select: { id: true } })).map((r) => r.id);
      const orderIds = (await prisma.order.findMany({ where: { userId: user.id }, select: { id: true } })).map((o) => o.id);
      await prisma.auditLog.deleteMany({ where: { entityType: "review", entityId: { in: reviewIds } } });
      await prisma.review.deleteMany({ where: { userId: user.id } });
      await prisma.registration.deleteMany({ where: { orderId: { in: orderIds } } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    }
    await deleteTestUser(e);
  }
  if (offeringId) await prisma.scheduledOffering.delete({ where: { id: offeringId } });
  await disconnectPrisma();
});

async function registerViaUi(page: Page, email: string, name: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
}

async function signInViaUi(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

async function signOut(page: Page) {
  await page.goto("/sign-out");
  await page.context().clearCookies();
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("a guest sees the title, the intro, the public list or its empty state, and the sign-in button — never a form", async ({ page }) => {
  const res = await page.goto("/reviews");
  expect(res?.status()).toBe(200);
  await expect(page.getByTestId("reviews-title")).toHaveText("Reviews");
  await expect(page.getByText("Real experiences from learners building their knowledge")).toBeVisible();
  const signIn = page.getByTestId("reviews-sign-in");
  await expect(signIn).toHaveText("Log in to share a review");
  await expect(signIn).toHaveAttribute("href", "/sign-in?return-to=/reviews");
  await expect(page.getByTestId("review-form")).toHaveCount(0);
  const empty = await page.getByTestId("reviews-empty").count();
  const cards = await page.getByTestId("public-review").count();
  expect(empty + cards).toBeGreaterThan(0);
  await expectNoAxeViolations(page);
});

test("a signed-in learner with a completed registration reviews it: profile-headed form, counter, validation, submit → pending, dashboard status", async ({ page }) => {
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const flagship = (await findFlagshipProgramme())!;
  await registerViaUi(page, learnerEmail, LEARNER_NAME);
  const { userId, registrationId } = await confirmRegistration(learnerEmail, flagship.id);
  learnerUserId = userId;
  await signInViaUi(page, learnerEmail);

  // Dashboard and registrations say a review is required, linking to /reviews.
  await expect(page.getByTestId("dash-review-status")).toHaveText("Required");
  await page.goto("/account/programmes");
  const share = page.getByTestId("registration-review-status").getByRole("link", { name: "Share your experience" });
  await expect(share).toHaveAttribute("href", `/reviews#registration-${registrationId}`);
  await share.click();
  await expect(page).toHaveURL(new RegExp(`/reviews#registration-${registrationId}$`));

  // The sidebar item exists and the form is headed by the person's own name and programme.
  await expect(page.getByRole("navigation", { name: "Account" })).toHaveCount(0); // public page, no account sidebar
  const form = page.getByTestId("review-form").first();
  await expect(form).toBeVisible();
  await expect(form.getByTestId("review-form-name")).toHaveText(LEARNER_NAME);
  await expect(form.getByTestId("review-form-header")).toContainText(flagshipTitle);
  await expectNoAxeViolations(page);

  // Live counter and server-side validation for a 10-character body.
  const textarea = form.getByLabel("Share your experience");
  await textarea.fill("ten chars!");
  await expect(form.getByTestId("review-counter")).toContainText("10 / 2,000 characters");
  await expect(form.getByTestId("review-counter")).toContainText("at least 20");
  await form.getByTestId("review-submit").click();
  await expect(form.getByText("Please write at least 20 characters.")).toBeVisible();
  await expect(textarea).toHaveValue("ten chars!"); // typed text survives the error

  // Consent defaults to private; the photo checkbox appears only with Yes.
  await expect(form.getByLabel("No, keep my review private")).toBeChecked();
  await expect(form.getByLabel("Show my photo alongside my name")).toHaveCount(0);
  await form.getByLabel("Yes, I agree").check();
  await expect(form.getByLabel("Show my photo alongside my name")).toBeVisible();

  await textarea.fill(BODY);
  await expect(form.getByTestId("review-counter")).toContainText(`${BODY.length} / 2,000 characters`);
  await form.getByLabel("5 stars").check();
  await form.getByLabel("Category").selectOption("programme_experience");
  await form.getByTestId("review-submit").click();

  await expect(page.getByTestId("review-outcome")).toHaveText(
    "Thank you for sharing your experience! Your review has been submitted and will appear once it has been reviewed.",
  );
  await expect(page.getByTestId("review-form")).toHaveCount(0); // nothing left to review
  const own = page.getByTestId("own-review");
  await expect(own).toHaveCount(1);
  await expect(own).toContainText("Awaiting review");
  await expect(own).toContainText(BODY);
  await expect(page.getByTestId("public-review").filter({ hasText: BODY })).toHaveCount(0); // pending is never public

  // Persisted as pending with the name snapshot and an audit row.
  const { getPrisma } = await import("../../src/db/prisma");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const row = await getPrisma().review.findUniqueOrThrow({ where: { registrationId } });
  expect(row).toMatchObject({ userId, moderationStatus: "pending", visibilityStatus: "visible", consentPublic: true, rating: 5, displayNameSnapshot: LEARNER_NAME });
  expect((await listAuditForEntity(getPrisma(), "review", row.id)).map((a) => a.action)).toEqual(["review.submitted"]);

  await page.goto("/account");
  await expect(page.getByTestId("dash-review-status")).toHaveText("Awaiting review");
  await page.goto("/account/programmes");
  await expect(page.getByTestId("registration-review-status")).toContainText("Awaiting review");

  // A participant is refused at the admin screen.
  const forbidden = await page.goto("/admin/reviews");
  expect(forbidden?.status()).toBe(403);
  await signOut(page);
});

test("a second learner records a private review", async ({ page }) => {
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const flagship = (await findFlagshipProgramme())!;
  await registerViaUi(page, privateEmail, "Priya Private");
  await confirmRegistration(privateEmail, flagship.id);
  await signInViaUi(page, privateEmail);
  await page.goto("/reviews");
  const form = page.getByTestId("review-form").first();
  await form.getByLabel("Share your experience").fill(PRIVATE_BODY);
  await form.getByTestId("review-submit").click();
  await expect(page.getByTestId("review-outcome")).toHaveText("Thank you for sharing your experience! Your review has been recorded. It will stay private.");
  await expect(page.getByTestId("own-review")).toContainText("Private");
  await signOut(page);
});

test("an administrator approves → the card is public; hides → gone; restores → back; a private review cannot be restored", async ({ page }) => {
  await registerViaUi(page, adminEmail, "Amir Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signInViaUi(page, adminEmail);

  await page.goto("/admin");
  await expect(page.getByTestId("admin-reviews-pending")).toContainText(/reviews? (is|are) waiting/);
  await page.getByTestId("admin-reviews-link").click();
  await expect(page).toHaveURL(/\/admin\/reviews\?moderation=pending$/);
  await expect(page.getByTestId("admin-reviews-title")).toHaveText("Reviews");
  await expectNoAxeViolations(page);

  // Search by the learner's email — visible to the admin only.
  await page.getByLabel("Search").fill(learnerEmail);
  await page.getByLabel("Moderation").selectOption("");
  await page.getByRole("button", { name: "Apply" }).click();
  const row = page.getByTestId("admin-review-row");
  await expect(row).toHaveCount(1);
  await expect(row.getByTestId("admin-review-name")).toHaveText(LEARNER_NAME);
  await expect(row).toContainText(learnerEmail);
  await expect(row.getByTestId("admin-review-consent")).toContainText("Yes");
  await expect(row).toContainText("Pending");

  await row.getByTestId("review-approve").click();
  await expect(row.getByText("Approved.")).toBeVisible();
  await expect(row).toContainText("Approved");

  // Public page shows the card with the name snapshot, stars and month.
  await page.goto("/reviews");
  const card = page.getByTestId("public-review").filter({ hasText: BODY });
  await expect(card).toHaveCount(1);
  await expect(card.getByTestId("public-review-name")).toHaveText(LEARNER_NAME);
  await expect(card).toContainText(flagshipTitle);
  await expect(card.getByRole("img", { name: "Rated 5 out of 5" })).toBeVisible();
  await expect(card).not.toContainText(learnerEmail);
  expect(await page.content()).not.toContain(learnerEmail);
  await expectNoAxeViolations(page);

  // Hide → gone from the public page.
  await page.goto(`/admin/reviews?q=${encodeURIComponent(learnerEmail)}`);
  await page.getByTestId("admin-review-row").getByTestId("review-hide").click();
  await expect(page.getByText("Hidden from the public page.")).toBeVisible();
  await page.goto("/reviews");
  await expect(page.getByTestId("public-review").filter({ hasText: BODY })).toHaveCount(0);

  // Restore → back.
  await page.goto(`/admin/reviews?q=${encodeURIComponent(learnerEmail)}`);
  const restore = page.getByTestId("admin-review-row").getByTestId("review-restore");
  await expect(restore).toBeEnabled();
  await restore.click();
  await expect(page.getByText("Restored.")).toBeVisible();
  await page.goto("/reviews");
  await expect(page.getByTestId("public-review").filter({ hasText: BODY })).toHaveCount(1);

  // Detail page: full body and the audit history.
  await page.goto(`/admin/reviews?q=${encodeURIComponent(learnerEmail)}`);
  await page.getByRole("link", { name: `Open review by ${LEARNER_NAME}` }).click();
  await expect(page.getByTestId("admin-review-title")).toHaveText(LEARNER_NAME);
  await expect(page.getByTestId("admin-review-body")).toHaveText(BODY);
  const history = page.getByTestId("admin-review-audit");
  await expect(history).toContainText("review.submitted");
  await expect(history).toContainText("review.moderated");
  await expect(history).toContainText("review.hidden");
  await expect(history).toContainText("review.restored");
  await expectNoAxeViolations(page);

  // A review with consent No: hide works, Restore is disabled with the reason.
  await page.goto(`/admin/reviews?q=${encodeURIComponent(privateEmail)}`);
  const privateRow = page.getByTestId("admin-review-row");
  await expect(privateRow.getByTestId("admin-review-consent")).toContainText("No");
  await privateRow.getByTestId("review-hide").click();
  await expect(page.getByText("Hidden from the public page.")).toBeVisible();
  const disabledRestore = privateRow.getByTestId("review-restore");
  await expect(disabledRestore).toBeDisabled();
  await expect(disabledRestore).toHaveAttribute("title", "The learner asked to keep this private");

  // Audit trail for the approved review names the administrator.
  const { getPrisma } = await import("../../src/db/prisma");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const prisma = getPrisma();
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail.toLowerCase() } });
  const review = await prisma.review.findFirstOrThrow({ where: { userId: learnerUserId } });
  const audit = await listAuditForEntity(prisma, "review", review.id);
  expect(audit.map((a) => a.action)).toEqual(["review.submitted", "review.moderated", "review.hidden", "review.restored"]);
  expect(audit.slice(1).every((a) => a.actorUserId === admin.id)).toBe(true);
});
