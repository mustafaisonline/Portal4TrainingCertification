import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { createCertificateUser, createEndedOfferingFixture, createPaidRegistrationFixture, deleteTestOffering, type OfferingFixture } from "../helpers/certificates-db";
import { completeProfileByEmail, deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Certificate administration — end to end through the real screens against
 * the test database (MILESTONE_6_EXECUTION_PLAN.md §5 "Admin", §6 criteria
 * 2, 6, 11, 13). An administrator records completion from an ended
 * offering's roster and a certificate is issued; a not-ended offering and a
 * participant without a legal name are refused with the reason in words; the
 * certificates list finds it by ID and email and filters by status; the
 * detail screen corrects the name (reflected on the public verification
 * page) and revokes it; the fee screen shows the seeded USD 10.00, applies a
 * new fee now and schedules one for tomorrow without changing today's; a
 * participant is refused at every admin screen; every screen is axe-clean.
 *
 * Fixtures come from tests/helpers/certificates-db.ts; the administrator and
 * the participant are registered through the UI so they can sign in.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const adminEmail = uniqueEmail("e2e-cert-admin");
const participantEmail = uniqueEmail("e2e-cert-holder");
const LEGAL_NAME = `Cara Certificate ${run}`;
const CORRECTED_NAME = `Cara Corrected ${run}`;
const feeMarker = `e2e-fee-${run}`;

let ended: OfferingFixture;
let notEnded: OfferingFixture;
let noProfile: { id: string; email: string; name: string };
let certificateId = ""; // printed DAA-YYYY-XXXX-XXXX
let certificateRowId = ""; // row uuid

test.beforeAll(async () => {
  ended = await createEndedOfferingFixture({ endsOnDaysAgo: 3 });
  notEnded = await createEndedOfferingFixture({ endsOnDaysAgo: -5, status: "open" });
  noProfile = await createCertificateUser({ prefix: "e2e-cert-noprofile", legalName: null });
  await createPaidRegistrationFixture(noProfile.id, ended.id);
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  // Fee settings are insert-only in the product; this TEST-ONLY cleanup
  // removes the rows this run created (by their note) so the test database
  // does not grow and the seeded USD 10.00 row stays the earliest. A row a
  // renewal already references cannot be deleted (restrict) — then it stays.
  try {
    const rows = await prisma.certificateFeeSetting.findMany({ where: { note: feeMarker }, select: { id: true } });
    const ids = rows.map((r) => r.id);
    if (ids.length) {
      await prisma.auditLog.deleteMany({ where: { entityType: "certificate_fee_setting", entityId: { in: ids } } });
      await prisma.certificateFeeSetting.deleteMany({ where: { id: { in: ids } } });
    }
  } catch (err) {
    console.warn("[certificates-admin.spec] fee rows left in place:", err);
  }
  if (ended) await deleteTestOffering(ended.id);
  if (notEnded) await deleteTestOffering(notEnded.id);
  await deleteTestUser(participantEmail);
  if (noProfile) await deleteTestUser(noProfile.email);
  await deleteTestUser(adminEmail);
  await disconnectPrisma();
});

async function registerViaUi(page: Page, address: string, name: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel(/^Country/).selectOption("MY");
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

test("the roster of an ended offering issues a certificate; a not-ended offering and an incomplete profile are refused with the reason", async ({ page }) => {
  // The participant: a real account with a checkout-complete profile (legal
  // name), and a paid, confirmed registration on each offering.
  await registerViaUi(page, participantEmail, "Cara Certificate");
  await completeProfileByEmail(participantEmail, { legalName: LEGAL_NAME });
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const participant = await findUserByEmail(participantEmail);
  expect(participant).not.toBeNull();
  await createPaidRegistrationFixture(participant!.id, ended.id);
  await createPaidRegistrationFixture(participant!.id, notEnded.id);

  await registerViaUi(page, adminEmail, "Amira Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signInViaUi(page, adminEmail);

  // Landing card → list (reachable), then the offering → its roster.
  await page.goto("/admin");
  await expect(page.getByTestId("admin-certificates-issued")).toBeVisible();
  await page.getByTestId("admin-certificates-link").click();
  await expect(page).toHaveURL(/\/admin\/certificates$/);
  await expect(page.getByTestId("admin-certificates-title")).toHaveText("Certificates");

  await page.goto(`/admin/offerings/${ended.id}`);
  await page.getByTestId("offering-participants-link").click();
  await expect(page).toHaveURL(new RegExp(`/admin/offerings/${ended.id}/participants$`));
  await expect(page.getByTestId("roster-ended")).toContainText("Ended on");
  await expect(page.getByTestId("roster-row")).toHaveCount(2);
  await expectNoAxeViolations(page);

  const rowA = page.getByTestId("roster-row").filter({ hasText: participantEmail });
  await expect(rowA).toHaveCount(1);
  await expect(rowA.getByTestId("roster-legal-name")).toHaveText(LEGAL_NAME);
  await expect(rowA).toContainText("Confirmed");
  await expect(rowA.getByTestId("roster-certificate")).toHaveText("—");
  const form = rowA.getByTestId("record-completion-form");
  await expect(form).toBeVisible();
  await expect(form.getByLabel("Completed on")).toHaveValue(ended.endsOn);

  // No legal name → no form, the reason in words.
  const rowB = page.getByTestId("roster-row").filter({ hasText: noProfile.email });
  await expect(rowB).toHaveCount(1);
  await expect(rowB.getByTestId("roster-legal-name")).toHaveText("Profile incomplete");
  await expect(rowB.getByTestId("completion-blocked")).toHaveText("Profile incomplete — legal name required");
  await expect(rowB.getByTestId("record-completion-form")).toHaveCount(0);

  // Record completion → issued; the row re-renders with the ID and no form.
  await form.getByTestId("record-completion-submit").click();
  const recorded = rowA.getByTestId("completion-recorded");
  await expect(recorded).toContainText(/Certificate DAA-\d{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4} issued/);
  await expect(rowA.getByTestId("record-completion-form")).toHaveCount(0);
  const idLink = rowA.getByTestId("roster-certificate").getByRole("link");
  await expect(idLink).toHaveText(/^DAA-\d{4}-/);
  certificateId = (await idLink.textContent())!.trim();
  const href = await idLink.getAttribute("href");
  certificateRowId = href!.split("/").pop()!;
  expect(certificateRowId).toMatch(/^[0-9a-f-]{36}$/);
  await expect(rowA.getByTestId("certificate-status")).toHaveText("Active");
  await expect(page.getByTestId("roster-summary")).toContainText("1 certificate issued");

  // The same registration cannot be recorded twice: on reload the row shows
  // the certificate and "already issued" instead of a form.
  await page.reload();
  await expect(rowA.getByTestId("completion-blocked")).toHaveText("Certificate already issued");
  await expect(rowA.getByTestId("record-completion-form")).toHaveCount(0);

  // Not ended → reason, no form.
  await page.goto(`/admin/offerings/${notEnded.id}/participants`);
  await expect(page.getByTestId("roster-ended")).toContainText("Ends on");
  await expect(page.getByTestId("roster-ended")).toContainText("completion can be recorded after the offering has ended");
  const rowOpen = page.getByTestId("roster-row").filter({ hasText: participantEmail });
  await expect(rowOpen.getByTestId("completion-blocked")).toHaveText("Offering not ended");
  await expect(rowOpen.getByTestId("record-completion-form")).toHaveCount(0);

  // Persisted through the real path with its audit row.
  const { getPrisma } = await import("../../src/db/prisma");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const prisma = getPrisma();
  const row = await prisma.certificate.findUniqueOrThrow({ where: { certificateId } });
  expect(row.id).toBe(certificateRowId);
  expect(row.holderName).toBe(LEGAL_NAME);
  expect(row.listed).toBe(false);
  expect((await listAuditForEntity(prisma, "certificate", row.id)).map((a) => a.action)).toEqual(["certificate.issued"]);
});

test("the certificates list shows it, finds it by ID and by email, and the revoked filter is empty", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto("/admin/certificates");
  const row = page.getByTestId("admin-certificate-row").filter({ hasText: certificateId });
  await expect(row).toHaveCount(1);
  await expect(row.getByTestId("admin-certificate-holder")).toHaveText(LEGAL_NAME);
  await expect(row).toContainText(participantEmail);
  await expect(row.getByTestId("certificate-status")).toHaveText("Active");
  await expectNoAxeViolations(page);

  // By ID, typed loosely (lower case, no hyphens) — normalised server-side.
  await page.getByLabel("Search").fill(certificateId.toLowerCase().replace(/-/g, ""));
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByTestId("admin-certificate-row")).toHaveCount(1);
  await expect(page.getByTestId("admin-certificate-id")).toHaveText(certificateId);
  await expect(page.getByTestId("admin-certificates-count")).toHaveText("1 certificate");

  // By email.
  await page.goto(`/admin/certificates?q=${encodeURIComponent(participantEmail)}`);
  await expect(page.getByTestId("admin-certificate-row")).toHaveCount(1);
  await expect(page.getByTestId("admin-certificate-id")).toHaveText(certificateId);

  // Nothing matches → the empty state.
  await page.goto(`/admin/certificates?q=${encodeURIComponent(`no-such-holder-${run}`)}`);
  await expect(page.getByTestId("admin-certificates-empty")).toBeVisible();

  // Status filter: nothing of this holder's is revoked yet.
  await page.goto(`/admin/certificates?q=${encodeURIComponent(participantEmail)}&status=revoked`);
  await expect(page.getByTestId("admin-certificates-empty")).toBeVisible();
  await expect(page.getByLabel("Status")).toHaveValue("revoked");

  // The fee screen is one click away.
  await page.goto("/admin/certificates");
  await page.getByTestId("admin-certificates-fee-link").click();
  await expect(page).toHaveURL(/\/admin\/certificates\/fee$/);
});

test("the detail screen corrects the holder's name (reflected on /verify) and revokes the certificate", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/certificates/${certificateRowId}`);
  await expect(page.getByTestId("admin-certificate-title")).toHaveText(certificateId);
  await expect(page.getByTestId("admin-certificate-holder-name")).toHaveText(LEGAL_NAME);
  await expect(page.getByTestId("admin-certificate-listed")).toContainText("No — the holder controls this");
  await expect(page.getByTestId("admin-certificate-verify-link")).toHaveAttribute("href", `/verify/${certificateId}`);
  await expect(page.getByTestId("admin-certificate-roster-link")).toHaveAttribute("href", `/admin/offerings/${ended.id}/participants`);
  await expect(page.getByTestId("admin-certificate-completed-on")).toBeVisible();
  await expect(page.getByTestId("revocation-block")).toHaveCount(0);
  await expect(page.getByTestId("admin-certificate-renewals")).toContainText("No renewals yet");
  await expectNoAxeViolations(page);

  // Correct the name: validation first, then the real change.
  const nameForm = page.getByTestId("correct-name-form");
  const nameInput = nameForm.getByLabel("Name on the certificate");
  await nameInput.fill("A");
  await nameForm.getByTestId("correct-name-submit").click();
  await expect(nameForm.getByText(/Enter the holder's name/)).toBeVisible();
  await nameInput.fill(CORRECTED_NAME);
  await nameForm.getByTestId("correct-name-submit").click();
  await expect(nameForm.getByText(`Holder name saved: ${CORRECTED_NAME}.`)).toBeVisible();
  await expect(page.getByTestId("admin-certificate-holder-name")).toHaveText(CORRECTED_NAME);

  // The public verification page shows the corrected name — and no email.
  const verify = await page.request.get(`/verify/${certificateId}`);
  expect(verify.status()).toBe(200);
  const verifyBody = await verify.text();
  expect(verifyBody).toContain(CORRECTED_NAME);
  expect(verifyBody).not.toContain(participantEmail);

  // Revoke: the button waits for the confirmation; the reason is required.
  const revokeForm = page.getByTestId("revoke-form");
  await expect(revokeForm.getByTestId("revoke-submit")).toBeDisabled();
  await revokeForm.getByLabel(/^Reason for revoking/).fill(`Issued to the wrong registration — e2e ${run}`);
  await revokeForm.getByTestId("revoke-confirm").check();
  await expect(revokeForm.getByTestId("revoke-submit")).toBeEnabled();
  await revokeForm.getByTestId("revoke-submit").click();
  await expect(page.getByTestId("revocation-block")).toBeVisible();
  await expect(page.getByTestId("revocation-block")).toContainText(`Issued to the wrong registration — e2e ${run}`);
  await expect(page.getByTestId("certificate-status")).toHaveText("Revoked");
  await expect(page.getByTestId("revoke-form")).toHaveCount(0);
  await expectNoAxeViolations(page);

  // Now the revoked filter finds it; the public page says revoked.
  await page.goto(`/admin/certificates?q=${encodeURIComponent(participantEmail)}&status=revoked`);
  const revokedRow = page.getByTestId("admin-certificate-row");
  await expect(revokedRow).toHaveCount(1);
  await expect(revokedRow.getByTestId("certificate-status")).toHaveText("Revoked");
  await expect(revokedRow.getByTestId("admin-certificate-holder")).toHaveText(CORRECTED_NAME);
  const verifyAfter = await page.request.get(`/verify/${certificateId}`);
  expect(verifyAfter.status()).toBe(200);
  expect(await verifyAfter.text()).toMatch(/revoked/i);

  // Audit trail, in order, all by the administrator.
  const { getPrisma } = await import("../../src/db/prisma");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");
  const prisma = getPrisma();
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail.toLowerCase() } });
  const audit = await listAuditForEntity(prisma, "certificate", certificateRowId);
  expect(audit.map((a) => a.action)).toEqual(["certificate.issued", "certificate.name_corrected", "certificate.revoked"]);
  expect(audit.every((a) => a.actorUserId === admin.id)).toBe(true);
  expect(audit[2]!.reason).toBe(`Issued to the wrong registration — e2e ${run}`);
});

test("the fee screen shows the seeded fee, applies a new fee now and schedules one for tomorrow without changing today's", async ({ page }) => {
  const { addDays, todayIso } = await import("../../src/modules/certificates/dates");
  await signInViaUi(page, adminEmail);
  await page.goto("/admin/certificates/fee");
  await expect(page.getByTestId("fee-title")).toHaveText("Renewal fee");
  await expect(page.getByText("Changes apply to renewals started after the effective time; renewals already paid are unaffected.")).toBeVisible();
  const history = page.getByTestId("fee-history");
  await expect(history).toContainText("USD 10.00"); // the seeded row (prisma/seed.ts)
  const initialRows = await page.getByTestId("fee-history-row").count();
  expect(initialRows).toBeGreaterThanOrEqual(1);
  await expectNoAxeViolations(page);

  const form = page.getByTestId("fee-form");

  // Validation keeps the page and names the field.
  await form.getByLabel("Amount").fill("abc");
  await form.getByTestId("fee-submit").click();
  await expect(form.getByText(/Enter the amount as a number/)).toBeVisible();

  // 12.00 from now → in force at once.
  await form.getByLabel("Amount").fill("12.00");
  await form.getByLabel("Currency").fill("usd");
  await form.getByLabel("Note").fill(feeMarker);
  await form.getByTestId("fee-submit").click();
  await expect(page.getByTestId("fee-saved")).toContainText("Renewal fee set to USD 12.00");
  await expect(page.getByTestId("fee-current-amount")).toHaveText("USD 12.00");
  await expect(page.getByTestId("fee-history-row")).toHaveCount(initialRows + 1);

  // 15.00 effective tomorrow (Malaysia time) → scheduled; today's fee unchanged.
  const tomorrow = addDays(todayIso(new Date()), 1);
  await form.getByLabel("Amount").fill("15.00");
  await form.getByLabel("Currency").fill("USD");
  await form.getByLabel("Effective from").fill(`${tomorrow}T09:00`);
  await form.getByLabel("Note").fill(feeMarker);
  await form.getByTestId("fee-submit").click();
  await expect(page.getByTestId("fee-saved")).toContainText("Renewal fee set to USD 15.00");
  await expect(page.getByTestId("fee-current-amount")).toHaveText("USD 12.00");
  await expect(page.getByTestId("fee-history-row")).toHaveCount(initialRows + 2);
  const scheduled = page.getByTestId("fee-history-row").filter({ hasText: "USD 15.00" }).filter({ hasText: feeMarker });
  await expect(scheduled).toHaveCount(1);
  await expect(scheduled).toContainText("scheduled");
  const inForce = page.getByTestId("fee-history-row").filter({ hasText: "USD 12.00" }).filter({ hasText: feeMarker });
  await expect(inForce).toContainText("in force");

  // Persisted and audited.
  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const rows = await prisma.certificateFeeSetting.findMany({ where: { note: feeMarker }, orderBy: { effectiveFrom: "asc" } });
  expect(rows.map((r) => [r.amountMinor, r.currency])).toEqual([
    [1200, "USD"],
    [1500, "USD"],
  ]);
  const audits = await prisma.auditLog.findMany({ where: { entityType: "certificate_fee_setting", entityId: { in: rows.map((r) => r.id) } } });
  expect(audits).toHaveLength(2);
  expect(audits.every((a) => a.action === "certificate_fee.changed")).toBe(true);
});

test("a participant without the role is refused at every certificate admin screen", async ({ page }) => {
  await signOut(page);
  await signInViaUi(page, participantEmail);
  for (const path of ["/admin/certificates", `/admin/certificates/${certificateRowId}`, "/admin/certificates/fee", `/admin/offerings/${ended.id}/participants`]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(403);
  }
});
