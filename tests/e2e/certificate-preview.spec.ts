import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deleteTestUser, grantRoleByEmail, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * The certificate design system through the admin preview (Milestone 15,
 * Requirement 2; founder, 2026-09-29): both certificate types on sample data,
 * A4-landscape proportions, no overflow with very long values, a print that
 * is exactly one A4-landscape page, and nothing invented or over-claimed.
 * Set CERT_SHOT_DIR to also write screenshots for design review.
 */

test.describe.configure({ mode: "serial" });

const adminEmail = uniqueEmail("e2e-cert-admin");
const memberEmail = uniqueEmail("e2e-cert-member");
const SHOT_DIR = process.env["CERT_SHOT_DIR"];

test.beforeEach(async () => {
  await resetRateLimits();
});

test.afterAll(async () => {
  await deleteTestUser(adminEmail);
  await deleteTestUser(memberEmail);
  const { disconnectPrisma } = await import("../../src/db/prisma");
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
  await expect(page).toHaveURL(/\/sign-in\?registered=1$/);
}

async function signIn(page: Page, address: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email", { exact: true }).fill(address);
  await page.getByLabel("Password", { exact: true }).fill(STRONG_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(account\/profile|admin)$/);
}

async function shot(page: Page, name: string, selector = "[data-testid=certificate]") {
  if (!SHOT_DIR) return;
  await page.locator(selector).first().screenshot({ path: `${SHOT_DIR}/${name}.png` });
}

/** A PDF's page count and page size (points), read from Chromium's own output. */
function pdfFacts(buffer: Buffer) {
  const text = buffer.toString("latin1");
  const pages = (text.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
  const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(text);
  return { pages, width: box ? Number(box[1]) : 0, height: box ? Number(box[2]) : 0 };
}

test("the preview is for administrators only", async ({ page }) => {
  // Signed out → sign-in.
  await page.goto("/admin/certificates/preview");
  await expect(page).toHaveURL(/\/sign-in/);
  // A participant (no role) → 403.
  await register(page, memberEmail, "Mia Member");
  await signIn(page, memberEmail);
  const res = await page.goto("/admin/certificates/preview");
  expect(res?.status()).toBe(403);
  await page.goto("/sign-out");
  await page.context().clearCookies();
});

test("both certificate types render on sample data: every required field, the QR, the trainer, no over-claiming, no invented details", async ({ page }) => {
  await register(page, adminEmail, "Ada Admin");
  await grantRoleByEmail(adminEmail, "platform_admin");
  await signIn(page, adminEmail);
  await page.setViewportSize({ width: 1280, height: 1000 });
  const { listPublishedExperts } = await import("../../src/modules/catalogue/experts/repository");
  const trainer = (await listPublishedExperts())[0]!;

  await page.goto("/admin/certificates/preview");
  await expect(page.getByTestId("certificate-preview-title")).toBeVisible();
  const sheets = page.getByTestId("certificate");
  await expect(sheets).toHaveCount(2);

  // ── Assessment: Certificate of Achievement ──
  const a = sheets.nth(0);
  await expect(a).toHaveAttribute("data-kind", "achievement");
  await expect(a.getByTestId("certificate-title")).toHaveText("Certificate of Achievement");
  await expect(a).toContainText("This certificate is proudly presented to");
  await expect(a.getByTestId("certificate-holder")).toHaveText("Aisha Binti Rahman");
  await expect(a).toContainText("for successfully completing");
  await expect(a.getByTestId("certificate-subject")).toHaveText("Data & AI Free Assessment Check — 200 questions");
  // Founder, 2026-09-30: the title stays "Certificate of Achievement"; a prominent grade line sits under it (sample default: Alpha).
  await expect(a.getByTestId("certificate-grade")).toHaveText("Grade: ALPHA · 81–100 %");
  const details = a.getByTestId("certificate-details");
  await expect(details).toContainText("Score");
  await expect(details).toContainText("180 of 200 · 90%");
  await expect(a.getByTestId("certificate-result")).toHaveText("PASSED");
  await expect(details).toContainText("Time Taken");
  await expect(details).toContainText("02:14:31");
  await expect(details).toContainText("Date Issued");
  await expect(details).toContainText("Valid Until");
  await expect(a.getByTestId("certificate-id")).toHaveText("KC-2026-SAMP-PLE2");
  await expect(a.getByTestId("certificate-verify-url")).toHaveText(/\/verify\/KC-2026-SAMP-PLE2$/);
  await expect(a.getByTestId("certificate-qr").locator("svg path").first()).toBeVisible();
  // Founder, 2026-09-29: no signature, no signature line, no separate issuer-name text; the logo carries the name.
  await expect(a.getByTestId("certificate-signature")).toHaveCount(0);
  await expect(a).not.toContainText(/Authorised Signatory|Issued by/i);
  await expect(a.getByTestId("certificate-logo")).toBeVisible();
  await expect(a.getByTestId("certificate-logo")).toHaveAttribute("src", "/brand/ypt-logo.jpg");
  await expect(a.getByTestId("certificate-logo")).toHaveAttribute("alt", "Your Partner Technologies");
  await expect(a.getByTestId("certificate-trainers")).toHaveCount(0);
  await expect(a).not.toContainText(/HRD Corp/); // no HRD Corp mark or text on the Free-test certificate
  await expect(a.getByTestId("certificate-disclosure")).toContainText("It is not the Academy’s Certificate of Completion");
  await expect(a.getByTestId("certificate-disclosure")).toContainText("This certificate is system-generated and does not require a signature.");
  await expect(a.getByTestId("certificate-sample")).toHaveCount(1); // the watermark
  await shot(page, "achievement", "[data-testid=certificate][data-kind=achievement]");

  // ── Professional Training: Certificate of Completion ──
  const c = sheets.nth(1);
  await expect(c).toHaveAttribute("data-kind", "completion");
  await expect(c.getByTestId("certificate-title")).toHaveText("Certificate of Completion");
  await expect(c.getByTestId("certificate-subject")).toHaveText("Data Blueprint & AI/Vibe Coding");
  await expect(c.getByTestId("certificate-details")).toContainText("Training Duration");
  await expect(c.getByTestId("certificate-details")).toContainText("2 Days");
  await expect(c.getByTestId("certificate-details")).toContainText("Completion Date");
  await expect(c.getByTestId("certificate-details")).toContainText("Valid Until");
  await expect(c.getByTestId("certificate-id")).toHaveText("DAA-2026-SAMP-PLE2");
  await expect(c.getByTestId("certificate-signature")).toHaveCount(0);
  await expect(c.getByTestId("certificate-logo")).toBeVisible();
  await expect(c).not.toContainText(/Authorised Signatory|Issued by/i);
  await expect(c.getByTestId("certificate-verify-url")).toHaveText(/\/verify\/DAA-2026-SAMP-PLE2$/);
  await expect(c.getByTestId("certificate-qr").locator("svg path").first()).toBeVisible();
  const trainers = c.getByTestId("certificate-trainers");
  await expect(trainers).toContainText("Authorized Trainer / Instructor");
  await expect(trainers).toContainText(trainer.name);
  if (trainer.hrdCorpAccreditation) {
    await expect(trainers).toContainText(`HRD Corp Accredited Trainer · ID ${trainer.hrdCorpAccreditation.trainerId}`);
    await expect(trainers.getByRole("img", { name: /HRD Corp Accredited Trainer badge/ })).toBeVisible();
  }
  await shot(page, "completion", "[data-testid=certificate][data-kind=completion]");

  // ── Honesty, on both sheets ──
  for (const sheet of [a, c]) {
    const text = (await sheet.innerText()).replace(/\s+/g, " ");
    // Never claims the certificate itself is HRD Corp certified / accredited / approved.
    expect(text).not.toMatch(/HRD Corp[^.]{0,40}(certified|approved)/i);
    expect(text).not.toMatch(/certified by HRD|approved by HRD/i);
    // No bracketed placeholder is ever printed on a certificate.
    expect(text).not.toMatch(/\[[^\]]+\]/);
    // The founder's supplied company details, verbatim, in the footer — and nothing else invented.
    await expect(sheet.getByTestId("certificate-legal")).toHaveText(
      "Your Partner Technologies · Company No. 202401023226 (1569075-K) · 15-03A, One Jelatek Condominium, Jalan Jelatek, Kementah, 54200 Kuala Lumpur W.P. Kuala Lumpur Malaysia",
    );
    expect(text).not.toMatch(/Reg\.\s/);
  }

  // What is still missing is listed for the founder: only the HRD Corp organisation logo now.
  const gaps = page.getByTestId("brand-gaps-list");
  await expect(gaps.locator("li")).toHaveCount(1);
  await expect(gaps).toContainText("HRD Corp organisation logo");
});

test("the Assessment sample has one sheet per grade: Alpha (default), Bravo, Charlie, or all three", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.setViewportSize({ width: 1280, height: 1000 });
  const expected = { alpha: ["Grade: ALPHA · 81–100 %", "180 of 200 · 90%"], bravo: ["Grade: BRAVO · 71–80 %", "150 of 200 · 75%"], charlie: ["Grade: CHARLIE · 60–70 %", "130 of 200 · 65%"] } as const;
  for (const grade of ["alpha", "bravo", "charlie"] as const) {
    await page.goto(`/admin/certificates/preview?kind=achievement&grade=${grade}`);
    const sheet = page.getByTestId("certificate");
    await expect(sheet).toHaveCount(1);
    await expect(sheet.getByTestId("certificate-title")).toHaveText("Certificate of Achievement");
    await expect(sheet.getByTestId("certificate-grade")).toHaveText(expected[grade][0]);
    await expect(sheet.getByTestId("certificate-details")).toContainText(expected[grade][1]);
  }
  await page.goto("/admin/certificates/preview?kind=achievement&grade=all");
  const sheets = page.getByTestId("certificate");
  await expect(sheets).toHaveCount(3);
  await expect(page.getByTestId("certificate-grade")).toHaveText(["Grade: CHARLIE · 60–70 %", "Grade: BRAVO · 71–80 %", "Grade: ALPHA · 81–100 %"]);
  // The very long variant of each grade still fits the sheet.
  await page.goto("/admin/certificates/preview?kind=achievement&grade=all&long=1");
  for (let i = 0; i < 3; i += 1) {
    const fits = await page.getByTestId("certificate").nth(i).evaluate((sheet) => {
      const column = sheet.querySelector(":scope > div:last-of-type") as HTMLElement;
      return column.scrollHeight - column.clientHeight;
    });
    expect(fits, `grade sheet ${i} content column overflows`).toBeLessThanOrEqual(1);
  }
});

test("A4 landscape proportions; very long names and titles shrink and never overflow the sheet", async ({ page }) => {
  await signIn(page, adminEmail);
  for (const width of [1280, 800]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const url of ["/admin/certificates/preview", "/admin/certificates/preview?long=1"]) {
      await page.goto(url);
      const sheets = page.getByTestId("certificate");
      for (let i = 0; i < 2; i += 1) {
        const box = (await sheets.nth(i).boundingBox())!;
        expect(box.width / box.height, `${url} @${width}`).toBeGreaterThan(297 / 210 - 0.02);
        expect(box.width / box.height, `${url} @${width}`).toBeLessThan(297 / 210 + 0.02);
        // Nothing inside the frame is clipped: the content column fits its box…
        const fits = await sheets.nth(i).evaluate((sheet) => {
          const column = sheet.querySelector(":scope > div:last-of-type") as HTMLElement;
          const s = sheet.getBoundingClientRect();
          const c = column.getBoundingClientRect();
          const overflowY = column.scrollHeight - column.clientHeight;
          const outside = [...column.querySelectorAll("*")].filter((el) => {
            const r = (el as HTMLElement).getBoundingClientRect();
            return r.width > 0 && (r.right > s.right - 1 || r.bottom > s.bottom - 1 || r.left < s.left + 1 || r.top < s.top + 1);
          }).length;
          return { overflowY, outside, insideSheet: c.right <= s.right && c.bottom <= s.bottom };
        });
        expect(fits.overflowY, `${url} @${width} content column overflows`).toBeLessThanOrEqual(1);
        expect(fits.outside, `${url} @${width} elements outside the sheet`).toBe(0);
        expect(fits.insideSheet).toBe(true);
      }
    }
  }
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/admin/certificates/preview?long=1");
  await shot(page, "achievement-long", "[data-testid=certificate][data-kind=achievement]");
  await shot(page, "completion-long", "[data-testid=certificate][data-kind=completion]");
});

test("print: each certificate is exactly one A4-landscape page, at zero margin", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.setViewportSize({ width: 1280, height: 1000 });
  for (const url of [
    "/admin/certificates/preview?kind=achievement",
    "/admin/certificates/preview?kind=completion",
    "/admin/certificates/preview?kind=achievement&long=1",
    "/admin/certificates/preview?kind=completion&long=1",
  ]) {
    await page.goto(url);
    await page.emulateMedia({ media: "print" });
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
    if (SHOT_DIR) (await import("node:fs")).writeFileSync(`${SHOT_DIR}/print-${url.split("?")[1]?.replace(/[^a-z0-9]+/g, "-") ?? "both"}.pdf`, pdf);
    const { pages, width, height } = pdfFacts(pdf);
    expect(pages, `${url} must be one page`).toBe(1);
    // A4 landscape is 841.89 × 595.28 pt.
    expect(width, url).toBeGreaterThan(840);
    expect(width, url).toBeLessThan(843);
    expect(height, url).toBeGreaterThan(594);
    expect(height, url).toBeLessThan(597);
    await page.emulateMedia({ media: "screen" });
  }
});

test("the design preview has no WCAG 2.2 AA violations (light and dark)", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.setViewportSize({ width: 1280, height: 1000 });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/admin/certificates/preview");
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(results.violations, `${scheme}: ${JSON.stringify(results.violations, null, 2)}`).toEqual([]);
  }
});

test("the Certificates tab shows a sample of each certificate, and the sample PDF downloads (admins only)", async ({ page, request }) => {
  // Signed out / no role: the sample PDF route refuses.
  expect((await request.get("/api/admin/certificates/sample-pdf?kind=achievement", { headers: { cookie: "" } })).status()).toBe(401);

  await signIn(page, adminEmail);
  await page.goto("/admin/certificates");
  const sheet = page.getByTestId("sample-certificate-sheet");
  await expect(sheet).toHaveAttribute("data-kind", "achievement");
  await expect(sheet.getByTestId("certificate-title")).toHaveText("Certificate of Achievement");
  await expect(sheet.getByTestId("certificate-sample")).toBeVisible(); // the SAMPLE watermark
  await expect(sheet.getByTestId("certificate-id")).toContainText("KC-2026-SAMP-PLE2");
  // One sample sheet per grade (default Alpha), with its own PDF.
  await expect(sheet).toHaveAttribute("data-grade", "alpha");
  await expect(sheet.getByTestId("certificate-grade")).toHaveText("Grade: ALPHA · 81–100 %");
  await page.getByTestId("sample-grade-bravo").click();
  await expect(page).toHaveURL(/sample=achievement&grade=bravo/);
  await expect(page.getByTestId("sample-certificate-sheet")).toHaveAttribute("data-grade", "bravo");
  await expect(page.getByTestId("sample-certificate-sheet").getByTestId("certificate-grade")).toHaveText("Grade: BRAVO · 71–80 %");
  await expect(page.getByTestId("sample-download-pdf")).toHaveAttribute("href", "/api/admin/certificates/sample-pdf?kind=achievement&grade=bravo");
  await page.getByTestId("sample-grade-charlie").click();
  await expect(page.getByTestId("sample-certificate-sheet").getByTestId("certificate-grade")).toHaveText("Grade: CHARLIE · 60–70 %");
  for (const grade of ["alpha", "bravo", "charlie"]) {
    const gradePdf = await page.request.get(`/api/admin/certificates/sample-pdf?kind=achievement&grade=${grade}`);
    expect(gradePdf.status()).toBe(200);
    expect(gradePdf.headers()["content-disposition"]).toContain(`SAMPLE-achievement-${grade}-certificate.pdf`);
    expect((await gradePdf.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  }
  expect((await page.request.get("/api/admin/certificates/sample-pdf?kind=achievement&grade=delta")).status()).toBe(400);

  await page.getByTestId("sample-kind-completion").click();
  await expect(page).toHaveURL(/sample=completion/);
  await expect(page.getByTestId("sample-certificate-sheet")).toHaveAttribute("data-kind", "completion");
  await expect(page.getByTestId("sample-certificate-sheet").getByTestId("certificate-title")).toHaveText("Certificate of Completion");
  await expect(page.getByTestId("print-certificate")).toBeVisible();

  // The sample PDF for both kinds: a real one-page PDF, watermark facts only, never cached.
  for (const kind of ["achievement", "completion"]) {
    const pdf = await page.request.get(`/api/admin/certificates/sample-pdf?kind=${kind}`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
    expect(pdf.headers()["content-disposition"]).toContain(`SAMPLE-${kind}-certificate.pdf`);
    expect(pdf.headers()["cache-control"]).toContain("no-store");
    expect((await pdf.body()).subarray(0, 5).toString("latin1")).toBe("%PDF-");
  }
  expect((await page.request.get("/api/admin/certificates/sample-pdf?kind=other")).status()).toBe(400);
  await expect(page.getByTestId("sample-download-pdf")).toHaveAttribute("href", "/api/admin/certificates/sample-pdf?kind=completion");

  // A participant (no admin role) is refused.
  await page.goto("/sign-out");
  await page.context().clearCookies();
  await signIn(page, memberEmail);
  expect((await page.request.get("/api/admin/certificates/sample-pdf?kind=achievement")).status()).toBe(403);
});

test("the Certificates tab has no WCAG 2.2 AA violations with the sample shown", async ({ page }) => {
  await signIn(page, adminEmail);
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/admin/certificates");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});
