import { randomUUID } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { CONTACT_EMAIL } from "../../src/content/contact";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * Contact Us form (CR-2026-10-03-1226) end to end against the test database:
 * the page shows a form and no email address; validation names each problem;
 * a good message is stored, the team is notified and the sender acknowledged
 * (both through the outbox); a bot's honeypot submission is swallowed; the
 * rate limit holds; the administrator reads the message and replies from
 * Admin → Enquiries, which emails the person and marks it replied.
 */

test.describe.configure({ mode: "serial" });

const run = randomUUID().slice(0, 6);
const adminEmail = uniqueEmail("e2e-contact-admin");
const senders: string[] = [];
const sender = () => {
  const e = uniqueEmail("e2e-contact-sender");
  senders.push(e);
  return e;
};
const marker = `e2e contact ${run}`;
let enquiryId = "";
let firstSender = "";

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const rows = await prisma.enquiry.findMany({ where: { email: { in: senders.map((s) => s.toLowerCase()) } }, select: { id: true } });
  const ids = rows.map((r) => r.id);
  await prisma.auditLog.deleteMany({ where: { entityType: "enquiry", entityId: { in: ids } } });
  await prisma.enquiry.deleteMany({ where: { id: { in: ids } } });
  await prisma.outboundEmail.deleteMany({ where: { OR: [{ toEmail: { in: senders.map((s) => s.toLowerCase()) } }, { subject: { contains: "[" }, textBody: { contains: marker } }] } });
  await deleteTestUser(adminEmail);
  await disconnectPrisma();
});

async function fillForm(page: Page, input: { name?: string; email: string; kind?: string; message?: string }) {
  await page.getByLabel("Your name").fill(input.name ?? `Contact Tester ${run}`);
  await page.getByLabel("Email", { exact: true }).fill(input.email);
  if (input.kind) await page.getByLabel("I am contacting you about").selectOption(input.kind);
  await page.getByLabel("Your message").fill(input.message ?? `${marker}: a question about the next date.`);
}

async function noAxeViolations(page: Page, scope?: string) {
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expect.poll(async () => (await page.title()).trim().length, { timeout: 10_000 }).toBeGreaterThan(0);
    let b = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
    if (scope) b = b.include(scope);
    const results = await b.analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  }
}

test("the Contact Us page offers a form and shows no email address, mailto link or WhatsApp in its contact section", async ({ page }) => {
  await page.goto("/contact-us");
  const section = page.getByTestId("contact-section");
  await expect(section).toBeVisible();
  await expect(section.getByTestId("enquiry-form")).toBeVisible();
  await expect(section.locator("a[href^='mailto:']")).toHaveCount(0);
  await expect(section).not.toContainText(CONTACT_EMAIL);
  await expect(section).not.toContainText(/@/);
  await expect(page.locator("a[href*='wa.me'], a[href*='whatsapp']")).toHaveCount(0);
  await expect(page.getByTestId("enquiry-submit")).toHaveText("Send message");
});

test("an empty or wrong form names every problem and keeps what was typed", async ({ page }) => {
  await page.goto("/contact-us");
  await page.getByTestId("enquiry-submit").click();
  await expect(page.getByText("Please enter your name.")).toBeVisible();
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await expect(page.getByText(/at least 10 characters/)).toBeVisible();
  await page.getByLabel("Your name").fill("Someone");
  await page.getByLabel("Email", { exact: true }).fill("not-an-email");
  await page.getByTestId("enquiry-submit").click();
  await expect(page.getByLabel("Your name")).toHaveValue("Someone"); // not wiped by the server's answer
  await expect(page.getByText("Please enter a valid email address.")).toBeVisible();
  await noAxeViolations(page, "#main, main");
});

test("a good message is stored, the team is notified and the sender is acknowledged", async ({ page }) => {
  firstSender = sender();
  await page.goto("/contact-us");
  await fillForm(page, { email: firstSender.toUpperCase().replace("@EXAMPLE.TEST", "@example.test"), kind: "organisation" });
  await page.getByLabel("Organisation").fill("Acme Training Sdn Bhd");
  await page.getByTestId("enquiry-submit").click();
  await expect(page.getByTestId("enquiry-sent")).toContainText("your message has been received");
  const reference = (await page.getByTestId("enquiry-reference").textContent())!.trim();
  expect(reference).toMatch(/^[0-9A-F]{8}$/);

  const { getPrisma } = await import("../../src/db/prisma");
  const prisma = getPrisma();
  const row = await prisma.enquiry.findFirstOrThrow({ where: { email: firstSender.toLowerCase() } });
  enquiryId = row.id;
  expect(row).toMatchObject({ kind: "organisation", organisation: "Acme Training Sdn Bhd", status: "new", sourcePath: "/contact-us" });
  expect(row.id.slice(0, 8).toUpperCase()).toBe(reference);
  expect(row.message).toContain(marker);

  const ack = await prisma.outboundEmail.findFirstOrThrow({ where: { toEmail: firstSender.toLowerCase(), templateKey: "enquiry.acknowledgement" } });
  expect(ack.subject).toContain(reference);
  expect(ack.textBody).toContain(marker);
  const team = await prisma.outboundEmail.findFirstOrThrow({ where: { templateKey: "enquiry.notify", textBody: { contains: reference } } });
  expect(team.textBody).toContain(`/admin/enquiries/${row.id}`);
  expect(team.textBody).toContain(firstSender.toLowerCase());
});

test("a training link pre-selects the topic and records the training and page", async ({ page }) => {
  const address = sender();
  await page.goto("/contact-us?programme=learn-vibe-coding");
  await expect(page.getByTestId("contact-about")).toContainText("Learn Vibe Coding");
  await expect(page.getByLabel("I am contacting you about")).toHaveValue("programme_interest");
  await fillForm(page, { email: address });
  await page.getByTestId("enquiry-submit").click();
  await expect(page.getByTestId("enquiry-sent")).toBeVisible();
  const { getPrisma } = await import("../../src/db/prisma");
  const row = await getPrisma().enquiry.findFirstOrThrow({ where: { email: address.toLowerCase() }, include: { programme: { select: { slug: true } } } });
  expect(row.kind).toBe("programme_interest");
  expect(row.programme?.slug).toBe("learn-vibe-coding");
  expect(row.sourcePath).toBe("/contact-us?programme=learn-vibe-coding");
});

test("a bot that fills the hidden field sees the same thank-you screen and nothing is stored or sent", async ({ page }) => {
  const address = sender();
  await page.goto("/contact-us");
  await fillForm(page, { email: address });
  await page.locator("input[name=website]").evaluate((el: HTMLInputElement) => {
    el.value = "http://spam.example";
  });
  await page.getByTestId("enquiry-submit").click();
  await expect(page.getByTestId("enquiry-sent")).toBeVisible();
  const { getPrisma } = await import("../../src/db/prisma");
  expect(await getPrisma().enquiry.count({ where: { email: address.toLowerCase() } })).toBe(0);
  expect(await getPrisma().outboundEmail.count({ where: { toEmail: address.toLowerCase() } })).toBe(0);
});

test("the sixth message from one place in ten minutes is refused, in words", async ({ page }) => {
  for (let i = 1; i <= 5; i++) {
    await page.goto("/contact-us");
    await fillForm(page, { email: sender(), message: `${marker}: message number ${i} for the limit.` });
    await page.getByTestId("enquiry-submit").click();
    await expect(page.getByTestId("enquiry-sent"), `message ${i}`).toBeVisible();
  }
  await page.goto("/contact-us");
  await fillForm(page, { email: sender(), message: `${marker}: the sixth one.` });
  await page.getByTestId("enquiry-submit").click();
  await expect(page.getByText(/Too many messages in a short time/)).toBeVisible();
});

test("the same address cannot send a fourth message within an hour", async ({ page }) => {
  const address = sender();
  for (let i = 1; i <= 3; i++) {
    await resetRateLimitsKeepingEmail();
    await page.goto("/contact-us");
    await fillForm(page, { email: address, message: `${marker}: same address, message ${i}.` });
    await page.getByTestId("enquiry-submit").click();
    await expect(page.getByTestId("enquiry-sent"), `message ${i}`).toBeVisible();
  }
  await resetRateLimitsKeepingEmail();
  await page.goto("/contact-us");
  await fillForm(page, { email: address, message: `${marker}: a fourth.` });
  await page.getByTestId("enquiry-submit").click();
  await expect(page.getByText(/Too many messages in a short time/)).toBeVisible();
});

/** Clears the per-client counter between submissions but leaves the per-address one. */
async function resetRateLimitsKeepingEmail() {
  const { getPrisma } = await import("../../src/db/prisma");
  await getPrisma().authRateLimit.deleteMany({ where: { key: { startsWith: "enquiry:ip:" } } });
}

test("the administrator reads the message and replies; the person is emailed and the enquiry is marked replied", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Amira Contact Admin");
  await page.getByLabel("Email", { exact: true }).fill(adminEmail);
  await page.getByLabel(/^Country/).selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByLabel("Confirm password").fill(STRONG_PASSWORD);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
  await grantRoleByEmail(adminEmail, "platform_admin");
  await page.getByLabel("Email", { exact: true }).fill(adminEmail);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto(`/admin/enquiries/${enquiryId}`);
  await expect(page.getByTestId("enquiry-message")).toContainText(marker);
  await expect(page.getByTestId("enquiry-email")).toHaveText(firstSender.toLowerCase());
  await expect(page.locator("main a[href^='mailto:']")).toHaveCount(0);

  // An empty reply is refused and nothing is sent.
  await page.getByTestId("enquiry-reply-send").click();
  await expect(page.getByText(/Write your reply first/)).toBeVisible();

  const reply = `${marker} reply: the next date is in November — see you there.`;
  await page.getByLabel("Reply by email").fill(reply);
  await page.getByTestId("enquiry-reply-send").click();
  await expect(page.getByText(`Reply sent to ${firstSender.toLowerCase()}.`)).toBeVisible();
  await expect(page.getByTestId("enquiry-status")).toHaveText("Replied");
  await expect(page.getByLabel("Reply by email")).toHaveValue(""); // cleared after sending
  await expect(page.getByTestId("enquiry-audit")).toContainText("enquiry.replied"); // after the status change it caused
  await expect(page.getByTestId("enquiry-audit-row")).toHaveCount(2);

  const { getPrisma } = await import("../../src/db/prisma");
  const mail = await getPrisma().outboundEmail.findFirstOrThrow({ where: { toEmail: firstSender.toLowerCase(), templateKey: "enquiry.reply" } });
  expect(mail.status).toBe("sent");
  expect(mail.textBody).toContain(reply);
  expect(mail.textBody).toContain(`> ${marker}: a question about the next date.`); // the original, quoted
  expect(mail.textBody).not.toContain(CONTACT_EMAIL);
  expect((await getPrisma().enquiry.findUniqueOrThrow({ where: { id: enquiryId } })).status).toBe("replied");
  await noAxeViolations(page, "main");
});
