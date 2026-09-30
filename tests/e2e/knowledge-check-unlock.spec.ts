import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { completeProfileByEmail, deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * The Knowledge Check result DOCUMENT and its gate through the screens
 * (Milestone 14 Phase 5): a finished result shows both conditions open; a
 * Free Learning review satisfies the first; Pay explains that payments are
 * not configured (Stripe keys are blank in the Playwright environment — the
 * page tells the truth rather than pretending); a Pakistan profile is
 * exempt from the fee, so the document opens and prints; the administrator
 * sees and changes the unlock fee setting; a Malaysian profile pays.
 */

test.describe.configure({ mode: "serial" });

const SLUG = `e2e-unlock-${Date.now().toString(36)}`;
const email = uniqueEmail("e2e-unlock");
const adminEmail = uniqueEmail("e2e-unlock-admin");
let attemptId = "";

test.beforeAll(async () => {
  // The Free Assessment Check is 200 questions and is refused below that: a 260-question reviewed fixture bank.
  const { createAssessmentBank } = await import("../helpers/assessment-bank");
  await createAssessmentBank({ slug: SLUG, position: 83001, title: "E2E Unlock Topic" });
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });
  if (user) {
    const orders = await prisma.order.findMany({ where: { userId: user.id }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: "order", entityId: { in: orders.map((o) => o.id) } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: orders.map((o) => o.id) } } });
    await prisma.order.deleteMany({ where: { userId: user.id } });
    const attempts = await prisma.knowledgeCheckAttempt.findMany({ where: { userId: user.id }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: "knowledge_check_attempt", entityId: { in: attempts.map((a) => a.id) } } });
    await prisma.knowledgeCheckAttempt.deleteMany({ where: { userId: user.id } });
    const reviews = await prisma.review.findMany({ where: { userId: user.id }, select: { id: true } });
    await prisma.auditLog.deleteMany({ where: { entityType: "review", entityId: { in: reviews.map((x) => x.id) } } });
    await prisma.review.deleteMany({ where: { userId: user.id } });
  }
  await prisma.bookTopic.deleteMany({ where: { slug: SLUG } }); // the fixture bank (questions and options cascade)
  const settings = await prisma.knowledgeCheckUnlockSetting.findMany({ where: { note: { contains: "e2e-unlock" } }, select: { id: true } });
  await prisma.auditLog.deleteMany({ where: { entityType: "knowledge_check_unlock_setting", entityId: { in: settings.map((s) => s.id) } } });
  await prisma.knowledgeCheckUnlockSetting.deleteMany({ where: { id: { in: settings.map((s) => s.id) } } });
  await deleteTestUser(email);
  await deleteTestUser(adminEmail);
  await disconnectPrisma();
});

async function registerViaUi(page: Page, address: string, name: string) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
}

async function signInViaUi(page: Page, address: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("a finished result shows both gate conditions; a Free Learning review satisfies the first; Pay explains honestly; Pakistan is exempt and the document opens", async ({ page }) => {
  await registerViaUi(page, email, "Uma Unlock");
  await signInViaUi(page, email);
  const { withTransaction } = await import("../../src/db/prisma");
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const { startAttempt, finishAttempt, saveAnswers } = await import("../../src/modules/free-learning/knowledge-check.repository");
  const user = (await findUserByEmail(email))!;
  // UX review 2026-09-27 U5: the document is offered after a pass only — a fail shows the retake hint and no gate.
  const failed = await withTransaction((tx) => startAttempt(tx, { userId: user.id, size: 200 }));
  await withTransaction((tx) => finishAttempt(tx, { attemptId: failed.id, userId: user.id }));
  await page.goto(`/free-learning/knowledge-check/${failed.id}/result`);
  await expect(page.getByTestId("result-title")).toContainText("Not passed — 0 of 200");
  await expect(page.getByTestId("result-grade")).toHaveCount(0); // below 60 %: no grade
  await expect(page.getByTestId("result-document")).toHaveCount(0);
  await expect(page.getByTestId("result-retake-hint")).toContainText("offered once you pass");
  await page.goto(`/free-learning/knowledge-check/${failed.id}/document`);
  await expect(page).toHaveURL(new RegExp(`/free-learning/knowledge-check/${failed.id}/result$`));

  const attempt = await withTransaction((tx) => startAttempt(tx, { userId: user.id, size: 200 }));
  attemptId = attempt.id;
  await withTransaction((tx) => saveAnswers(tx, { attemptId, userId: user.id, answers: Object.fromEntries(attempt.questionIds.map((id) => [id, 1])) }));
  await withTransaction((tx) => finishAttempt(tx, { attemptId, userId: user.id }));

  await page.goto(`/free-learning/knowledge-check/${attemptId}/result`);
  await expect(page.getByTestId("result-title")).toContainText("Passed — 200 of 200");
  await expect(page.getByTestId("result-grade")).toHaveAttribute("data-grade", "alpha");
  await expect(page.getByTestId("result-grade")).toContainText("Grade Alpha · 81–100 %");
  await expect(page.getByTestId("result-gate-review")).toHaveAttribute("data-satisfied", "no");
  await expect(page.getByTestId("result-gate-fee")).toHaveAttribute("data-fee", "required");
  await expect(page.getByTestId("result-gate-fee")).toContainText("USD 10");
  await expect(page.getByTestId("result-gate-review-link")).toHaveAttribute("href", "/reviews#free-learning");
  // Locked: a SAMPLE of the certificate is shown — never this person's own (no name, ID, score, time or QR of the real one).
  const sample = page.getByTestId("result-sample");
  await expect(sample.getByTestId("certificate-sample")).toBeVisible();
  await expect(sample.getByTestId("certificate-id")).toContainText("KC-2026-SAMP-PLE2");
  await expect(sample.getByTestId("certificate-holder")).not.toHaveText("Uma Unlock");
  const realId = (await page.getByTestId("result-public-id").textContent())!.trim();
  await expect(sample).not.toContainText(realId);
  await expect(sample).not.toContainText("200 of 200");
  await expect(sample.getByRole("button", { name: /print|download/i })).toHaveCount(0);
  await expectNoAxeViolations(page);
  // The PDF route refuses until the gate holds — and is never public.
  expect((await page.request.get(`/api/knowledge-checks/${attemptId}/pdf`)).status()).toBe(403);
  // The document route refuses until the gate holds.
  await page.goto(`/free-learning/knowledge-check/${attemptId}/document`);
  await expect(page).toHaveURL(new RegExp(`/free-learning/knowledge-check/${attemptId}/result$`));

  // Pay: Stripe keys are blank here — the page says so, nothing is charged.
  await page.getByTestId("unlock-pay").click();
  await expect(page.getByText("not configured on this installation yet", { exact: false }).first()).toBeVisible();

  // The review (the reviews model's registration-free kind), through the repository.
  const { createReview } = await import("../../src/modules/reviews/repository");
  const { flagshipProgramme } = await import("../helpers/certificates-db");
  const flagship = await flagshipProgramme();
  await withTransaction((tx) =>
    createReview(tx, {
      userId: user.id,
      kind: "diagnostic",
      registrationId: null,
      programmeId: flagship.id,
      offeringId: null,
      body: "A review of Free Learning written by the e2e run. ".repeat(7),
      rating: 5,
      category: null,
      consentPublic: false,
      consentPhoto: false,
    }),
  );
  await page.reload();
  await expect(page.getByTestId("result-gate-review")).toHaveAttribute("data-satisfied", "yes");
  await expect(page.getByTestId("result-gate-fee")).toHaveAttribute("data-fee", "required");

  // Pakistan profile → exempt → unlocked → the document.
  await completeProfileByEmail(email, { legalName: "Uma Unlock", countryCode: "PK", nationalityCode: "PK" });
  await page.reload();
  await expect(page.getByTestId("result-document-unlocked")).toContainText("no fee applies to you");
  await expect(page.getByTestId("result-sample")).toHaveCount(0);
  await page.getByTestId("result-document-link").click();
  await expect(page).toHaveURL(new RegExp(`/free-learning/knowledge-check/${attemptId}/document$`));
  // Milestone 15 Req 3 (DR-05): the document IS the Certificate of Achievement.
  await expect(page.getByTestId("certificate-title")).toHaveText("Certificate of Achievement");
  await expect(page.getByTestId("certificate-holder")).toHaveText("Uma Unlock");
  await expect(page.getByTestId("certificate-subject")).toContainText("Data & AI Free Assessment Check — 200 questions");
  await expect(page.getByTestId("certificate-result")).toContainText("PASSED");
  // The certificate title stays "Certificate of Achievement"; the grade is a prominent line under it (founder, 2026-09-30).
  await expect(page.getByTestId("certificate-grade")).toHaveText("Grade: ALPHA · 81–100 %");
  const details = page.getByTestId("certificate-details");
  await expect(details).toContainText("200 of 200 · 100%");
  await expect(details).toContainText(/\d{2}:\d{2}:\d{2}/);
  await expect(page.getByTestId("certificate-id")).toContainText(/^KC-\d{4}-/);
  await expect(page.getByTestId("certificate-qr").locator("svg")).toHaveCount(1);
  await expect(page.getByTestId("kc-document")).toContainText("not the Academy’s Certificate of Completion");
  await expect(page.getByTestId("kc-document")).not.toContainText("HRD Corp certified");
  await expectNoAxeViolations(page);

  // The PDF: a real vector PDF, one page, an attachment named by the KC ID, never cached.
  await page.goto(`/free-learning/knowledge-check/${attemptId}/document`);
  const pdfHref = await page.getByTestId("download-certificate-pdf").getAttribute("href");
  expect(pdfHref).toBe(`/api/knowledge-checks/${attemptId}/pdf`);
  const pdf = await page.request.get(pdfHref!);
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect(pdf.headers()["content-disposition"]).toMatch(/filename="KC-\d{4}-[A-Z0-9]{4}-[A-Z0-9]{4}\.pdf"/);
  expect(pdf.headers()["cache-control"]).toContain("no-store");
  const pdfBytes = await pdf.body();
  expect(pdfBytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  expect(pdfBytes.toString("latin1")).toMatch(/\/Count 1\b/);
  expect((await page.request.get("/api/knowledge-checks/00000000-0000-4000-8000-000000000000/pdf")).status()).toBe(404);

  // The result page shows the derived time and validity.
  await page.goto(`/free-learning/knowledge-check/${attemptId}/result`);
  await expect(page.getByTestId("result-time-taken")).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  await expect(page.getByTestId("result-valid-until")).toBeVisible();

  // A revoked certificate is no longer shown or printable; the result page says so.
  const { getPrisma } = await import("../../src/db/prisma");
  await getPrisma().knowledgeCheckAttempt.update({ where: { id: attemptId }, data: { revokedAt: new Date(), revocationReason: "e2e revoke" } });
  await page.goto(`/free-learning/knowledge-check/${attemptId}/document`);
  await expect(page).toHaveURL(new RegExp(`/free-learning/knowledge-check/${attemptId}/result$`));
  await expect(page.getByTestId("result-revoked")).toContainText("revoked");
  await expect(page.getByTestId("result-document-link")).toHaveCount(0);
  expect((await page.request.get(`/api/knowledge-checks/${attemptId}/pdf`)).status()).toBe(403); // revoked: never rendered
  await getPrisma().knowledgeCheckAttempt.update({ where: { id: attemptId }, data: { revokedAt: null, revocationReason: null } });
});

test("the administrator sees the unlock fee setting from Orders and can switch it off and on, audited", async ({ page }) => {
  await registerViaUi(page, adminEmail, "Ada Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signInViaUi(page, adminEmail);
  await page.goto("/admin/orders");
  await page.getByTestId("admin-unlock-setting-link").click();
  await expect(page).toHaveURL(/\/admin\/orders\/unlock$/);
  await expect(page.getByTestId("unlock-setting-amount")).toHaveText("USD 10.00");
  await expectNoAxeViolations(page);

  const form = page.getByTestId("unlock-setting-form");
  await form.getByTestId("unlock-setting-enabled").uncheck();
  await form.getByLabel("Note").fill("e2e-unlock off");
  await page.getByTestId("unlock-setting-submit").click();
  await expect(page.getByTestId("unlock-setting-saved")).toContainText("Disabled");
  await page.goto("/admin/orders/unlock");
  const again = page.getByTestId("unlock-setting-form");
  await again.getByTestId("unlock-setting-enabled").check();
  await again.getByLabel("Amount").fill("10.00");
  await again.getByLabel("Note").fill("e2e-unlock on");
  await page.getByTestId("unlock-setting-submit").click();
  await expect(page.getByTestId("unlock-setting-saved")).toContainText("Enabled");

  const { getPrisma } = await import("../../src/db/prisma");
  const rows = await getPrisma().auditLog.findMany({ where: { action: "knowledge_check_unlock.changed", reason: { contains: "e2e-unlock" } }, orderBy: { createdAt: "asc" } });
  expect(rows.map((r) => (r.after as { enabled: boolean }).enabled)).toEqual([false, true]);
});

test("the administrator finds a passed result by its ID and revokes its certificate with a reason; verify then says Revoked; a second revoke is impossible", async ({ page }) => {
  const { getPrisma } = await import("../../src/db/prisma");
  const row = await getPrisma().knowledgeCheckAttempt.findUniqueOrThrow({ where: { id: attemptId }, select: { publicId: true } });
  const publicId = row.publicId!;
  // The administrator account was registered and granted by the previous test in this file.
  await signInViaUi(page, adminEmail);
  await page.goto("/admin/free-learning");
  await page.getByTestId("kc-results-link").click();
  await expect(page).toHaveURL(/\/admin\/free-learning\/results$/);
  await page.getByTestId("kc-results-search").fill(publicId.toLowerCase());
  await page.getByRole("button", { name: "Find" }).click();
  const rowEl = page.getByTestId("kc-results-row");
  await expect(rowEl).toHaveCount(1);
  await expect(rowEl.getByTestId("kc-results-status")).toHaveAttribute("data-status", "valid");
  // The Grade column (derived from the score) and the grade filter.
  await expect(rowEl.getByTestId("kc-results-grade")).toHaveAttribute("data-grade", "alpha");
  await expect(rowEl.getByTestId("kc-results-grade")).toHaveText("Alpha");
  await page.getByTestId("kc-results-grade-filter").selectOption("charlie");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(page.getByTestId("kc-results-row")).toHaveCount(0); // this Alpha result is not a Charlie
  await page.getByTestId("kc-results-grade-filter").selectOption("alpha");
  await page.getByRole("button", { name: "Find" }).click();
  await expect(rowEl).toHaveCount(1);
  await expectNoAxeViolations(page);
  // A reason and the confirmation are both required.
  await expect(page.getByTestId("kc-revoke-submit")).toBeDisabled();
  await page.getByLabel(/Reason for revoking/).fill("Issued in error — e2e");
  await page.getByTestId("kc-revoke-confirm").check();
  await page.getByTestId("kc-revoke-submit").click();
  // The list re-renders from the database: the row now reads Revoked, with the reason, and offers no second revoke.
  await expect(rowEl.getByTestId("kc-results-status")).toHaveAttribute("data-status", "revoked");
  await expect(rowEl).toContainText("Issued in error — e2e");
  await page.goto(`/verify/${publicId}`);
  await expect(page.getByTestId("certificate-status")).toHaveText("Revoked");
  await page.goto(`/admin/free-learning/results?q=${publicId}`);
  await expect(page.getByTestId("kc-results-status")).toHaveAttribute("data-status", "revoked");
  await expect(page.getByTestId("kc-revoke-form")).toHaveCount(0);
});

