import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { adminNavItems } from "../../src/shared/chrome/admin-nav";
import { createEndedOfferingFixture, createPaidRegistrationFixture, deleteTestOffering, type OfferingFixture } from "../helpers/certificates-db";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Milestone 8 part 1 — admin operations end to end against the test
 * database (MILESTONE_8_EXECUTION_PLAN.md §2 items 1, 2, 3, 6; §4 criteria
 * 1, 3, 5, 8). An administrator sees the sub-navigation with every entry
 * and a live overview board; finds a paid order and opens its detail; works
 * an enquiry through replied → closed → reopened with the audit visible on
 * the detail; downloads a report as CSV with the header row; a participant
 * is refused (403) at every new screen and at the CSV route; every new
 * screen is axe-clean.
 *
 * /admin/users and /admin/audit are built by part 2 and are NOT visited
 * here — only their presence in the navigation is asserted.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const adminEmail = uniqueEmail("e2e-ops-admin");
const participantEmail = uniqueEmail("e2e-ops-buyer");
const enquiryMarker = `e2e-enquiry-${run}`;

let offering: OfferingFixture;
let orderId = "";
let enquiryId = "";

test.beforeAll(async () => {
  // A future OPEN date (endsOnDaysAgo negative = has not ended).
  offering = await createEndedOfferingFixture({ endsOnDaysAgo: -30, status: "open" });
  const { getPrisma } = await import("../../src/db/prisma");
  const enquiry = await getPrisma().enquiry.create({
    data: {
      kind: "general",
      name: `Enid Enquirer ${run}`,
      email: uniqueEmail("e2e-enquirer"),
      organisation: null,
      message: `${enquiryMarker}\nSecond line of the message, with a comma, and "quotes".`,
      programmeId: offering.programmeId,
      sourcePath: "/contact-us",
    },
  });
  enquiryId = enquiry.id;
});

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  if (enquiryId) {
    await prisma.auditLog.deleteMany({ where: { entityType: "enquiry", entityId: enquiryId } });
    await prisma.enquiry.deleteMany({ where: { id: enquiryId } });
  }
  if (offering) await deleteTestOffering(offering.id);
  await deleteTestUser(participantEmail);
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

test("the administrator sees the sub-navigation with every entry and a live overview board", async ({ page }) => {
  await registerViaUi(page, participantEmail, "Bella Buyer");
  const { findUserByEmail } = await import("../../src/modules/identity/users.repository");
  const buyer = await findUserByEmail(participantEmail);
  expect(buyer).not.toBeNull();
  ({ orderId } = await createPaidRegistrationFixture(buyer!.id, offering.id));

  await registerViaUi(page, adminEmail, "Amira Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signInViaUi(page, adminEmail);

  await page.goto("/admin");
  await expect(page.getByTestId("admin-title")).toHaveText("Operations");
  const nav = page.getByRole("navigation", { name: "Admin" });
  await expect(nav).toBeVisible();
  const items = nav.getByTestId("admin-nav-item");
  await expect(items).toHaveCount(adminNavItems.length);
  await expect(items).toHaveText(adminNavItems.map((i) => i.label));
  for (const item of adminNavItems) {
    await expect(nav.getByRole("link", { name: item.label, exact: true })).toHaveAttribute("href", item.href);
  }
  await expect(nav.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("aria-current", "page");

  // Board figures render (live from the database).
  await expect(page.getByTestId("admin-reviews-pending")).toBeVisible();
  await expect(page.getByTestId("admin-enquiries-open")).toContainText(/new enquir/);
  await expect(page.getByTestId("admin-certificates-issued")).toBeVisible();
  await expect(page.getByTestId("admin-certificates-expiring")).toContainText(/within 30 days/);
  await expect(page.getByTestId("admin-registrations-upcoming")).toContainText(/confirmed registration/);
  await expect(page.getByTestId("admin-revenue-month")).toContainText(/net of refunds/);
  await expect(page.getByTestId("admin-reminder-run")).toBeVisible();
  // Links the earlier specs rely on are still there.
  for (const id of ["admin-offerings-link", "admin-reviews-link", "admin-certificates-link", "admin-certificates-fee-link", "admin-orders-link", "admin-enquiries-link", "admin-reports-link"]) {
    await expect(page.getByTestId(id)).toBeVisible();
  }
  await expectNoAxeViolations(page);

  // The bar marks the current screen.
  await nav.getByRole("link", { name: "Orders", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/orders$/);
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Orders", exact: true })).toHaveAttribute("aria-current", "page");
});

test("orders: the list finds the paid order by buyer email with totals, and the detail shows payment, registration and history", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/orders?q=${encodeURIComponent(participantEmail)}`);
  await expect(page.getByTestId("admin-orders-title")).toHaveText("Orders");
  const rows = page.getByTestId("order-row");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-order-id", orderId);
  await expect(rows.first().getByTestId("order-buyer-email")).toHaveText(participantEmail);
  await expect(rows.first().getByTestId("order-amount")).toContainText("4,999");
  await expect(rows.first()).toContainText("Paid");
  await expect(page.getByTestId("admin-orders-count")).toHaveText("1 order");
  await expect(page.getByTestId("admin-orders-totals")).toContainText("4,999");
  await expectNoAxeViolations(page);

  // Status filter narrows to nothing for a status this order does not have.
  await page.goto(`/admin/orders?q=${encodeURIComponent(participantEmail)}&status=refunded`);
  await expect(page.getByTestId("admin-orders-empty")).toBeVisible();
  await expect(page.getByTestId("admin-orders-count")).toHaveText("0 orders");

  await page.goto(`/admin/orders?q=${encodeURIComponent(participantEmail)}`);
  await rows.first().getByTestId("order-open").click();
  await expect(page).toHaveURL(new RegExp(`/admin/orders/${orderId}$`));
  const detail = page.getByTestId("order-detail");
  await expect(detail).toHaveAttribute("data-order-id", orderId);
  await expect(page.getByTestId("order-detail-status")).toHaveText("Paid");
  await expect(page.getByTestId("order-detail-buyer")).toContainText(participantEmail);
  await expect(page.getByTestId("order-detail-payment")).toBeVisible();
  await expect(page.getByTestId("order-detail-fee")).toContainText("Not yet reported");
  await expect(page.getByTestId("order-detail-refunds")).toContainText("No refunds");
  await expect(page.getByTestId("order-detail-refund-note")).toContainText("Stripe dashboard");
  await expect(page.getByTestId("order-detail-registration-status")).toHaveText("confirmed");
  await expect(page.getByTestId("order-detail-audit")).toBeVisible();
  await expectNoAxeViolations(page);

  // An unknown id is a 404, not an error page.
  const missing = await page.goto(`/admin/orders/${randomUUID()}`);
  expect(missing?.status()).toBe(404);
});

test("enquiries: the list finds the enquiry; the detail marks it replied, closed and reopened with the audit trail shown", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto(`/admin/enquiries?q=${encodeURIComponent(enquiryMarker)}`);
  await expect(page.getByTestId("admin-enquiries-title")).toHaveText("Enquiries");
  const rows = page.getByTestId("enquiry-row");
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toHaveAttribute("data-enquiry-id", enquiryId);
  await expect(rows.first().getByTestId("enquiry-row-status")).toHaveText("New");
  await expect(rows.first()).toContainText("General");
  await expect(rows.first()).toContainText("/contact-us");
  await expect(page.getByTestId("admin-enquiries-count")).toHaveText("1 enquiry");
  await expectNoAxeViolations(page);

  // The status filter is honoured.
  await page.goto(`/admin/enquiries?q=${encodeURIComponent(enquiryMarker)}&status=closed`);
  await expect(page.getByTestId("admin-enquiries-empty")).toBeVisible();

  await page.goto(`/admin/enquiries/${enquiryId}`);
  await expect(page.getByTestId("enquiry-title")).toContainText("Enid Enquirer");
  // The message is rendered as text, line breaks and quotes intact.
  await expect(page.getByTestId("enquiry-message")).toContainText(enquiryMarker);
  await expect(page.getByTestId("enquiry-message")).toContainText('with a comma, and "quotes"');
  await expect(page.getByTestId("enquiry-status")).toHaveText("New");
  await expect(page.getByTestId("enquiry-reopen")).toHaveCount(0);
  await expectNoAxeViolations(page);

  await page.getByTestId("enquiry-mark-replied").click();
  await expect(page.getByTestId("enquiry-status")).toHaveText("Replied");
  await expect(page.getByTestId("enquiry-audit-row")).toHaveCount(1);
  await expect(page.getByTestId("enquiry-audit-row").first()).toContainText("enquiry.status_changed");
  await expect(page.getByTestId("enquiry-audit-row").first()).toContainText("status: replied");

  await page.getByTestId("enquiry-close").click();
  await expect(page.getByTestId("enquiry-status")).toHaveText("Closed");
  await expect(page.getByTestId("enquiry-audit-row")).toHaveCount(2);

  await page.getByTestId("enquiry-reopen").click();
  await expect(page.getByTestId("enquiry-status")).toHaveText("New");
  await expect(page.getByTestId("enquiry-audit-row")).toHaveCount(3);
  await expectNoAxeViolations(page);

  // Persisted, with before/after on each row.
  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  expect((await prisma.enquiry.findUniqueOrThrow({ where: { id: enquiryId } })).status).toBe("new");
  const audit = await prisma.auditLog.findMany({ where: { entityType: "enquiry", entityId: enquiryId }, orderBy: { createdAt: "asc" } });
  expect(audit.map((a) => [a.before, a.after])).toEqual([
    [{ status: "new" }, { status: "replied" }],
    [{ status: "replied" }, { status: "closed" }],
    [{ status: "closed" }, { status: "new" }],
  ]);
  expect(audit.every((a) => a.actorUserId !== null)).toBe(true);

  // The overview counts it as open again.
  await page.goto("/admin");
  await expect(page.getByTestId("admin-enquiries-open")).toContainText(/\d+ new enquir/);
});

test("reports: every table renders and the CSV download carries the header row, quoting and no-store", async ({ page }) => {
  await signInViaUi(page, adminEmail);
  await page.goto("/admin/reports");
  await expect(page.getByTestId("admin-reports-title")).toHaveText("Reports");
  for (const key of ["registrations-per-offering", "revenue-by-month", "certificates", "reviews", "enquiries"]) {
    await expect(page.getByTestId(`report-table-${key}`)).toBeVisible();
    await expect(page.getByTestId(`report-csv-${key}`)).toHaveAttribute("href", `/admin/reports/${key}/csv`);
  }
  // The fixture offering appears in the registrations table with one confirmed seat.
  const registrations = page.getByTestId("report-table-registrations-per-offering").getByTestId("report-row").filter({ hasText: offering.id });
  await expect(registrations).toHaveCount(1);
  await expectNoAxeViolations(page);

  // The download, with the browser's session cookie.
  const csv = await page.request.get("/admin/reports/enquiries/csv");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  expect(csv.headers()["content-disposition"]).toMatch(/^attachment; filename="enquiries-\d{4}-\d{2}-\d{2}\.csv"$/);
  expect(csv.headers()["cache-control"]).toBe("no-store");
  const body = await csv.text();
  const lines = body.split("\r\n");
  expect(lines[0]).toBe("Status,Total,General,Organisation,Programme interest");
  expect(lines[1]).toMatch(/^New,\d+,\d+,\d+,\d+$/);
  expect(body.endsWith("\r\n")).toBe(true);

  const registrationsCsv = await page.request.get("/admin/reports/registrations-per-offering/csv");
  expect(registrationsCsv.status()).toBe(200);
  const regBody = await registrationsCsv.text();
  expect(regBody.split("\r\n")[0]).toBe("Programme,Format,Starts,Ends,Status,Capacity,Confirmed,Cancelled,Transferred,Seats left,Offering id");
  expect(regBody).toContain(offering.id);

  const unknown = await page.request.get("/admin/reports/not-a-report/csv");
  expect(unknown.status()).toBe(404);
});

test("a participant without the role is refused at every new admin screen and at the CSV route", async ({ page }) => {
  await signOut(page);
  await signInViaUi(page, participantEmail);
  for (const path of ["/admin", "/admin/orders", `/admin/orders/${orderId}`, "/admin/enquiries", `/admin/enquiries/${enquiryId}`, "/admin/reports"]) {
    const res = await page.goto(path);
    expect(res?.status(), path).toBe(403);
  }
  const csv = await page.request.get("/admin/reports/enquiries/csv");
  expect(csv.status()).toBe(403);
  expect(csv.headers()["cache-control"]).toBe("no-store");

  // Signed out, the CSV route sends the person to sign in rather than serving anything.
  await signOut(page);
  const anonymous = await page.request.get("/admin/reports/enquiries/csv", { maxRedirects: 0 });
  expect(anonymous.status()).toBeGreaterThanOrEqual(300);
  expect(anonymous.status()).toBeLessThan(400);
  expect(anonymous.headers()["location"]).toContain("/sign-in");
});
