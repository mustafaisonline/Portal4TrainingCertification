import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { addDays, formatCalendarDate } from "../../src/modules/certificates/dates";
import {
  certificateTodayIso,
  createAdminUser,
  createCertificateUser,
  deleteTestOffering,
  issueTestCertificate,
  setCertificateExpiry,
  type IssuedCertificateFixture,
} from "../helpers/certificates-db";
import { completeProfileByEmail, deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Certificates of Completion — public and holder screens, end to end
 * against the test database (MILESTONE_6_EXECUTION_PLAN.md §6 criteria 7,
 * 8, 9, 10, 13). Fixtures go through the REAL `recordCompletion` (helpers/
 * certificates-db.ts); nothing is seeded. Stripe is never reached: the app
 * runs with STRIPE_SECRET_KEY blank, so "Renew" states that payments are
 * not configured and creates no order.
 */

test.describe.configure({ mode: "serial" });

const emails: string[] = [];
function newEmail(prefix: string) {
  const e = uniqueEmail(prefix);
  emails.push(e);
  return e;
}

const SUFFIX = randomUUID().slice(0, 6);
const LISTED_NAME = `Listed Holder ${SUFFIX}`;
const UNLISTED_NAME = `Unlisted Holder ${SUFFIX}`;
const HOLDER_NAME = `Hana Holder ${SUFFIX}`;
const UNKNOWN_ID = "DAA-2026-ZZZZ-ZZZZ";

const holderEmail = newEmail("e2e-cert-holder");
let adminEmail: string;
let adminUserId: string;
let listed: IssuedCertificateFixture;
let unlisted: IssuedCertificateFixture;
let holder: IssuedCertificateFixture;
const offeringIds: string[] = [];

test.beforeAll(async () => {
  const admin = await createAdminUser("e2e-cert-admin");
  adminEmail = admin.email;
  adminUserId = admin.id;
  const listedUser = await createCertificateUser({ prefix: "e2e-cert-listed", legalName: LISTED_NAME });
  const unlistedUser = await createCertificateUser({ prefix: "e2e-cert-unlisted", legalName: UNLISTED_NAME });
  emails.push(listedUser.email, unlistedUser.email);
  listed = await issueTestCertificate({ adminUserId, userId: listedUser.id, listed: true });
  unlisted = await issueTestCertificate({ adminUserId, userId: unlistedUser.id, listed: false });
  offeringIds.push(listed.offeringId, unlisted.offeringId);
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { disconnectPrisma } = await import("../../src/db/prisma");
  for (const id of offeringIds) await deleteTestOffering(id);
  for (const e of emails) await deleteTestUser(e);
  // The administrator last: certificates restrict their issuer until deleted above.
  if (adminEmail) await deleteTestUser(adminEmail);
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

async function expectNoPersonalData(page: Page) {
  const html = await page.content();
  expect(html).not.toContain("@example.test");
  for (const e of [...emails, adminEmail]) if (e) expect(html).not.toContain(e);
}

/** Any review row satisfies the gate — a private one included (plan §6 criterion 9). */
async function shareReview(fixture: IssuedCertificateFixture) {
  const { withTransaction } = await import("../../src/db/prisma");
  const { createReview } = await import("../../src/modules/reviews/repository");
  return withTransaction((tx) =>
    createReview(tx, {
      userId: fixture.userId,
      kind: "registration",
      registrationId: fixture.registrationId,
      programmeId: fixture.certificate.programmeId,
      offeringId: fixture.offeringId,
      body: `A private note written by the e2e run to satisfy the certificate gate. ${SUFFIX}`,
      rating: null,
      category: null,
      consentPublic: false,
      consentPhoto: false,
    }),
  );
}

test("a guest searches: empty hint, too short, unknown ID, listed holder by name (case and word order), unlisted holder only by ID — never an email", async ({ page }) => {
  const res = await page.goto("/verify");
  expect(res?.status()).toBe(200);
  await expect(page.getByTestId("verify-title")).toHaveText("Verify a certificate");
  await expect(page.getByText("It is not the Academy’s earned credential.")).toBeVisible();
  await expect(page.getByTestId("verify-hint")).toBeVisible();
  await expect(page.getByTestId("verify-result")).toHaveCount(0);
  await expectNoAxeViolations(page);

  // Too short, through the form.
  await page.getByLabel("Certificate ID or holder's name").fill("ab");
  await page.getByTestId("verify-submit").click();
  await expect(page).toHaveURL(/\/verify\?q=ab$/);
  await expect(page.getByTestId("verify-too-short")).toHaveText("Enter at least 3 characters of a name, or a full certificate ID.");
  await expect(page.getByLabel("Certificate ID or holder's name")).toHaveValue("ab");

  // Unknown ID → neutral not-found.
  await page.goto(`/verify?q=${UNKNOWN_ID}`);
  await expect(page.getByTestId("verify-none")).toContainText("No certificate found for that ID");
  await expect(page.getByTestId("verify-result")).toHaveCount(0);

  // Listed holder: lower case, reversed word order, a prefix of the first word.
  await page.goto(`/verify?q=${encodeURIComponent(`${SUFFIX} list`)}`);
  const hit = page.getByTestId("verify-result").filter({ hasText: LISTED_NAME });
  await expect(hit).toHaveCount(1);
  await expect(hit.getByTestId("certificate-status")).toContainText("Active");
  await expect(hit).toContainText(listed.certificate.programmeTitle);
  await expect(hit).toContainText(listed.certificate.certificateId);
  await expect(hit.getByTestId("verify-result-link")).toHaveAttribute("href", `/verify/${listed.certificate.certificateId}`);
  await expect(page.getByTestId("verify-result").filter({ hasText: UNLISTED_NAME })).toHaveCount(0);
  await expectNoPersonalData(page);
  await expectNoAxeViolations(page);

  // Unlisted holder: invisible to a name search …
  await page.goto(`/verify?q=${encodeURIComponent(UNLISTED_NAME)}`);
  await expect(page.getByTestId("verify-none")).toContainText("No listed certificate matches");
  await expect(page.getByTestId("verify-result")).toHaveCount(0);
  await expect(page.getByTestId("verify-result-name")).toHaveCount(0);

  // … but found by the exact ID typed lower-case without hyphens.
  const loose = unlisted.certificate.certificateId.replace(/-/g, "").toLowerCase();
  await page.goto(`/verify?q=${loose}`);
  const idHit = page.getByTestId("verify-result");
  await expect(idHit).toHaveCount(1);
  await expect(idHit.getByTestId("verify-result-name")).toHaveText(UNLISTED_NAME);
  await expect(idHit).toContainText(unlisted.certificate.certificateId);
  await expectNoPersonalData(page);
});

test("the search is rate-limited: the 11th search in a minute is refused without a lookup", async ({ page }) => {
  for (let i = 0; i < 10; i += 1) {
    await page.goto(`/verify?q=${listed.certificate.certificateId}`);
    await expect(page.getByTestId("verify-result")).toHaveCount(1);
  }
  await page.goto(`/verify?q=${listed.certificate.certificateId}`);
  await expect(page.getByTestId("verify-rate-limited")).toHaveText("Too many searches — please wait a minute.");
  await expect(page.getByTestId("verify-result")).toHaveCount(0);
  // An empty or too-short query never counts and is still answered.
  await page.goto("/verify?q=ab");
  await expect(page.getByTestId("verify-too-short")).toBeVisible();
});

test("/verify/<ID> shows the verification layout with status in words and the details list, is not cached, and an unknown ID is a real 404", async ({ page }) => {
  const res = await page.goto(`/verify/${listed.certificate.certificateId}`);
  expect(res?.status()).toBe(200);
  const cacheControl = res?.headers()["cache-control"] ?? "";
  // Not cacheable by any shared cache: no s-maxage, and a no-cache / no-store
  // directive (`next dev` sends "no-cache, must-revalidate"; `next start`
  // sends "private, no-cache, no-store, max-age=0, must-revalidate").
  expect(cacheControl).not.toContain("s-maxage");
  expect(cacheControl).toMatch(/no-(cache|store)/);
  await expect(page).toHaveTitle(`Certificate ${listed.certificate.certificateId} · Data & AI Academy`);
  await expect(page.getByTestId("verify-holder")).toHaveText(LISTED_NAME);
  await expect(page.getByTestId("certificate-status")).toHaveAttribute("data-status", "active");
  await expect(page.getByTestId("certificate-status")).toContainText("Active");
  await expect(page.getByTestId("verify-status-sentence")).toHaveText(`This certificate is active until ${formatCalendarDate(listed.certificate.expiresOn)}.`);
  const dl = page.getByTestId("verify-details");
  for (const term of ["Holder", "Programme", "Format", "Completed", "Issued", "Active until", "Certificate ID"]) {
    await expect(dl.getByRole("term").filter({ hasText: new RegExp(`^${term}$`, "i") })).toHaveCount(1);
  }
  await expect(dl).toContainText(listed.certificate.programmeTitle);
  await expect(dl).toContainText(formatCalendarDate(listed.certificate.completedOn));
  await expect(page.getByTestId("verify-certificate-id")).toHaveText(listed.certificate.certificateId);
  await expect(page.getByText("Dates are calendar dates in Malaysia (MYT).")).toBeVisible();
  await expect(page.getByText("It is not the Academy’s earned credential.")).toBeVisible();
  await expect(page.getByTestId("verify-search-another")).toHaveAttribute("href", "/verify");
  // The printable document is never served here (E9).
  await expect(page.getByTestId("certificate-document")).toHaveCount(0);
  await expectNoPersonalData(page);
  await expectNoAxeViolations(page);

  // An unlisted holder's page resolves by ID too.
  const unlistedRes = await page.goto(`/verify/${unlisted.certificate.certificateId}`);
  expect(unlistedRes?.status()).toBe(200);
  await expect(page.getByTestId("verify-holder")).toHaveText(UNLISTED_NAME);

  // Unknown and malformed IDs → 404 with neutral copy.
  const missing = await page.goto(`/verify/${UNKNOWN_ID}`);
  expect(missing?.status()).toBe(404);
  await expect(page.getByTestId("verify-not-found")).toHaveText("No certificate found");
  const malformed = await page.goto("/verify/not-a-certificate");
  expect(malformed?.status()).toBe(404);
});

test("a signed-in holder without a review sees the gate and no document; after sharing a review the document renders; the dashboard shows the status", async ({ page }) => {
  await registerViaUi(page, holderEmail, HOLDER_NAME);
  await completeProfileByEmail(holderEmail, { legalName: HOLDER_NAME });
  holder = await issueTestCertificate({ adminUserId, userEmail: holderEmail });
  offeringIds.push(holder.offeringId);
  await signInViaUi(page, holderEmail);

  // Dashboard chip line.
  const dash = page.getByTestId("dash-certificate-status");
  await expect(dash).toContainText("Certificate: Active");
  await expect(dash).toContainText(`until ${formatCalendarDate(holder.certificate.expiresOn)}`);

  await page.goto("/account/certificate");
  await expect(page.getByTestId("certificate-id")).toHaveText(holder.certificate.certificateId);
  await expect(page.getByTestId("certificate-status")).toContainText("Active");
  await expect(page.getByTestId("certificate-expiry-sentence")).toHaveText(`Active until ${formatCalendarDate(holder.certificate.expiresOn)}.`);
  await expect(page.getByText("Dates are calendar dates in Malaysia (MYT).")).toBeVisible();
  await expect(page.getByTestId("copy-link")).toBeVisible();
  await expect(page.getByTestId("certificate-public-link")).toHaveAttribute("href", `/verify/${holder.certificate.certificateId}`);
  const gate = page.getByTestId("certificate-gate");
  await expect(gate).toContainText("Share your review to view and download your certificate");
  await expect(gate.getByTestId("certificate-gate-review-link")).toHaveAttribute("href", `/reviews#registration-${holder.registrationId}`);
  await expect(page.locator('[data-testid="certificate-document"]')).toHaveCount(0);
  await expect(page.getByTestId("print-certificate")).toHaveCount(0);
  expect(await page.content()).not.toContain("Issued by Your Partner Technologies");
  await expectNoAxeViolations(page);

  // Copy link: a visible confirmation (clipboard granted in Chromium by the permission below).
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByTestId("copy-link").click();
  await expect(page.getByTestId("copy-link-status")).toHaveText("Copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toMatch(new RegExp(`/verify/${holder.certificate.certificateId}$`));

  // Any review row — private included — unlocks the document.
  await shareReview(holder);
  await page.reload();
  await expect(page.getByTestId("certificate-gate")).toHaveCount(0);
  const doc = page.getByTestId("certificate-document");
  await expect(doc).toBeVisible();
  await expect(doc).toContainText("Certificate of Completion");
  await expect(doc.getByTestId("document-holder")).toHaveText(HOLDER_NAME);
  await expect(doc).toContainText(holder.certificate.programmeTitle);
  await expect(doc).toContainText(holder.certificate.certificateId);
  await expect(doc).toContainText("Your Partner Technologies");
  await expect(doc).toContainText("It is not the Academy’s earned credential.");
  await expect(doc).toContainText(`/verify/${holder.certificate.certificateId}`);
  await expect(page.getByTestId("print-certificate")).toBeVisible();
  await expectNoAxeViolations(page);
});

test("the listing toggle: on → found by name in public search (consent row written); off → not found", async ({ page }) => {
  await signInViaUi(page, holderEmail);
  await page.goto("/account/certificate");
  const toggle = page.getByTestId("listing-toggle");
  await expect(toggle).not.toBeChecked();
  await expect(page.getByTestId("listing-save")).toBeDisabled();

  await toggle.check();
  await page.getByTestId("listing-save").click();
  await expect(page.getByText("Your name can now be found in public certificate search.")).toBeVisible();

  const { getPrisma } = await import("../../src/db/prisma");
  const consent = await getPrisma().consent.findFirst({ where: { userId: holder.userId, documentKey: "certificate_listing" } });
  expect(consent).not.toBeNull();

  await page.goto(`/verify?q=${encodeURIComponent(`hana ${SUFFIX}`)}`);
  await expect(page.getByTestId("verify-result").filter({ hasText: HOLDER_NAME })).toHaveCount(1);

  await page.goto("/account/certificate");
  await expect(page.getByTestId("listing-toggle")).toBeChecked();
  await page.getByTestId("listing-toggle").uncheck();
  await page.getByTestId("listing-save").click();
  await expect(page.getByText("Your name is no longer shown in public certificate search.")).toBeVisible();

  await page.goto(`/verify?q=${encodeURIComponent(`hana ${SUFFIX}`)}`);
  await expect(page.getByTestId("verify-none")).toContainText("No listed certificate matches");
  await expect(page.getByTestId("verify-result").filter({ hasText: HOLDER_NAME })).toHaveCount(0);
});

test("renewal: inside the window the exact fee is offered and, with payments unconfigured, submitting explains rather than crashing; outside the window the page says when it opens", async ({ page }) => {
  await signInViaUi(page, holderEmail);
  const today = certificateTodayIso();

  // 10 days left → renewal due, form present with the fee in force.
  await setCertificateExpiry(holder.certificate.id, addDays(today, 10));
  await page.goto("/account/certificate");
  await expect(page.getByTestId("certificate-status")).toHaveAttribute("data-status", "renewal_due");
  await expect(page.getByTestId("certificate-status")).toContainText("renewal due");
  await expect(page.getByTestId("certificate-expiry-sentence")).toContainText("10 days left");
  const submit = page.getByTestId("renew-submit");
  await expect(submit).toHaveText(/Renew for 12 months — USD\s*10/);
  await submit.click();
  await expect(page.getByText("Payments are not configured on this environment yet", { exact: false })).toBeVisible();
  await expect(page.getByText("Nothing has been charged.", { exact: false })).toBeVisible();
  const { getPrisma } = await import("../../src/db/prisma");
  expect(await getPrisma().order.count({ where: { certificateId: holder.certificate.id } })).toBe(0);
  await expect(page.getByTestId("dash-certificate-status")).toHaveCount(0); // not the dashboard
  await page.goto("/account");
  await expect(page.getByTestId("dash-certificate-status")).toContainText("renewal due");

  // 60 days left → window closed; the page states the opening date.
  const later = addDays(today, 60);
  await setCertificateExpiry(holder.certificate.id, later);
  await page.goto("/account/certificate");
  await expect(page.getByTestId("renew-form")).toHaveCount(0);
  await expect(page.getByTestId("renewal-closed")).toHaveText(`Renewal opens 30 days before expiry, on ${formatCalendarDate(addDays(later, -30))}.`);
  await expect(page.getByTestId("renewal-history")).toContainText(`Issued ${formatCalendarDate(holder.certificate.issuedOn)}`);

  // Stripe's cancel return is a quiet note; an unknown order id is honest.
  await page.goto("/account/certificate?cancelled=1");
  await expect(page.getByTestId("renewal-cancelled")).toBeVisible();
  await page.goto(`/account/certificate?order=${randomUUID()}`);
  await expect(page.getByTestId("renewal-order-missing")).toBeVisible();
  await expectNoAxeViolations(page);
  await signOut(page);
});
