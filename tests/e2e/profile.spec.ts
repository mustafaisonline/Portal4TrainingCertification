import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { deflateSync } from "node:zlib";
import { completeProfileByEmail, deleteTestUser, resetRateLimits, STRONG_PASSWORD, uniqueEmail } from "../helpers/identity-db";

/*
 * User profile — end to end through the real screens against the test
 * database (M5a plan §5 criteria 2, 4, 5). A new person sees what is still
 * needed; every section saves and persists; the ID number is shown only as
 * its last four and never appears in the page; a photo uploaded through the
 * browser (resized there) reaches the header avatar through the
 * session-gated route, which answers 401 when signed out; the checkout gate
 * sends an incomplete profile to the page and lets a complete one through.
 */

// The main scenario fills every section, saves, reloads, uploads a photo and
// calls the (cold-compiled) photo route — ~30 s on a dev server, which is
// Playwright's default per-test budget. Give it room rather than split it.
test.describe.configure({ mode: "serial", timeout: 120_000 });

const emails: string[] = [];
function newEmail(prefix: string) {
  const e = uniqueEmail(prefix);
  emails.push(e);
  return e;
}

let offeringId: string;

test.beforeAll(async () => {
  const { getPrisma } = await import("../../src/db/prisma");
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const flagship = await findFlagshipProgramme();
  if (!flagship) throw new Error("seeded flagship programme required");
  const startsOn = new Date();
  startsOn.setUTCHours(0, 0, 0, 0);
  startsOn.setUTCDate(startsOn.getUTCDate() + 40);
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
  for (const e of emails) await deleteTestUser(e);
  if (offeringId) await getPrisma().scheduledOffering.delete({ where: { id: offeringId } });
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

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

/** A valid size×size opaque PNG built in the test (no fixture file). */
function tinyPng(size: number): Buffer {
  const table = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc32 = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = table[(c ^ b) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  const raw = Buffer.alloc((1 + size * 3) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const o = y * (1 + size * 3) + 1 + x * 3;
      raw[o] = 0x1f;
      raw[o + 1] = 0x6f;
      raw[o + 2] = 0xd3;
    }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const NRIC_TYPED = "900101-14-5678";
const NRIC_DIGITS = "900101145678";

test("a new person is told what is missing; every section saves; the ID shows only its last four; the photo reaches the header", async ({ page, browser }) => {
  const { getPrisma } = await import("../../src/db/prisma");
  const { listAuditForEntity } = await import("../../src/modules/platform/audit/repository");

  const email = newEmail("e2e-m5a");
  await registerViaUi(page, email, "Pia Profile");
  await signInViaUi(page, email);

  await page.goto("/account/profile");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Your profile");
  const banner = page.getByTestId("profile-missing");
  await expect(banner).toContainText("Before you can register for a date, please add:");
  await expect(banner).toContainText("Mobile number");
  await expect(banner).toContainText("ID number");
  await expect(banner).toContainText("Date of birth");
  // Registration already gave the name and the country.
  await expect(banner).not.toContainText("Full name");
  await expect(banner).not.toContainText("Country");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(email);
  await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute("readonly", "");
  await expect(page.getByLabel("Country", { exact: true })).toHaveValue("MY");
  await expectNoAxeViolations(page);

  // Identity & contact
  await page.getByLabel("Preferred name").fill("Pia");
  await page.getByLabel("Country code").selectOption("+60");
  await page.getByLabel("Mobile number").fill("012-345 6789");
  await page.getByLabel("Time zone").fill("Asia/Kuala_Lumpur");
  // Address
  await page.getByLabel("Address line 1").fill("1 Jalan Ujian");
  await page.getByLabel("City").fill("Kuala Lumpur");
  await page.getByLabel("State or region").fill("WP Kuala Lumpur");
  await page.getByLabel("Postal code").fill("50000");
  // Professional
  await page.getByLabel("Organisation").fill("Analytical Engines Sdn Bhd");
  await page.getByLabel("Job title").fill("Data Engineer");
  await page.getByLabel("Industry").selectOption("technology");
  await page.getByLabel("Years of experience").selectOption("6-10");
  await page.getByLabel("LinkedIn profile").fill("https://www.linkedin.com/in/pia-profile");
  // Identity document
  await page.getByLabel("ID document type").selectOption("nric");
  await page.getByLabel("ID number").fill(NRIC_TYPED);
  await page.getByLabel("Nationality").selectOption("MY");
  await page.getByLabel("Date of birth").fill("1990-01-01");
  // Preferences
  await page.getByRole("checkbox", { name: /send me news/ }).check();
  await page.getByLabel("How did you hear about us?").selectOption("linkedin");

  await page.getByTestId("profile-save").click();
  await expect(page.getByText("Your changes have been saved.", { exact: true })).toBeVisible();
  await expect(page.getByTestId("profile-missing")).toHaveCount(0);
  // The number is never kept in the field once stored.
  await expect(page.getByLabel("ID number")).toHaveValue("");

  await page.reload();
  await expect(page.getByTestId("profile-missing")).toHaveCount(0);
  await expect(page.getByLabel("Preferred name")).toHaveValue("Pia");
  await expect(page.getByLabel("Country code")).toHaveValue("+60");
  await expect(page.getByLabel("Mobile number")).toHaveValue("123456789");
  await expect(page.getByLabel("Address line 1")).toHaveValue("1 Jalan Ujian");
  await expect(page.getByLabel("Postal code")).toHaveValue("50000");
  await expect(page.getByLabel("Organisation")).toHaveValue("Analytical Engines Sdn Bhd");
  await expect(page.getByLabel("Industry")).toHaveValue("technology");
  await expect(page.getByLabel("ID document type")).toHaveValue("nric");
  await expect(page.getByLabel("ID number")).toHaveValue("");
  await expect(page.getByLabel("ID number")).toHaveAttribute("placeholder", "Stored: ••••5678 — enter a new number to change");
  await expect(page.getByLabel("Nationality")).toHaveValue("MY");
  await expect(page.getByLabel("Date of birth")).toHaveValue("1990-01-01");
  await expect(page.getByRole("checkbox", { name: /send me news/ })).toBeChecked();
  const html = await page.content();
  expect(html).not.toContain(NRIC_DIGITS);
  expect(html).not.toContain(NRIC_TYPED);
  // The greeting uses the preferred name.
  await expect(page.getByTestId("header-account")).toHaveAttribute("aria-label", "Account menu for Pia");
  await expectNoAxeViolations(page);

  // The database holds ciphertext and the last four, never the number; the
  // audit row names fields only.
  const user = await getPrisma().user.findUniqueOrThrow({ where: { email: email.toLowerCase() }, select: { id: true, country: true } });
  expect(user.country).toBe("Malaysia");
  const row = await getPrisma().userProfile.findUniqueOrThrow({ where: { userId: user.id } });
  expect(row.phoneE164).toBe("+60123456789");
  expect(row.countryCode).toBe("MY");
  expect(row.idNumberLast4).toBe("5678");
  expect(row.idNumberCiphertext).toMatch(/^v1:/);
  expect(row.idNumberCiphertext).not.toContain(NRIC_DIGITS);
  expect(row.completedAt).not.toBeNull();
  expect(row.marketingConsentAt).not.toBeNull();
  const audit = (await listAuditForEntity(getPrisma(), "user", user.id)).filter((a) => a.action === "profile.updated");
  expect(audit).toHaveLength(1);
  expect(JSON.stringify(audit[0])).not.toContain(NRIC_DIGITS);
  expect((audit[0]!.after as { changed: string[] }).changed).toContain("idNumber");

  // Photo: a 32×32 PNG is resized in the browser, uploaded, and shown in the
  // header; the route serves it only to this session.
  await page.getByTestId("photo-input").setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: tinyPng(32) });
  await expect(page.getByTestId("photo-status")).toHaveText("Your photo has been saved.");
  const headerImg = page.getByTestId("header-avatar").locator("img");
  await expect(headerImg).toHaveAttribute("src", /^\/api\/me\/photo\?v=\d+$/);
  await expect(page.getByTestId("photo-preview").locator("img")).toHaveCount(1);
  const own = await page.request.get("/api/me/photo");
  expect(own.status()).toBe(200);
  expect(own.headers()["content-type"]).toBe("image/jpeg");
  expect(own.headers()["cache-control"]).toBe("private, max-age=0, must-revalidate");
  const etag = own.headers()["etag"]!;
  expect(etag).toMatch(/^"\d+"$/);
  expect((await page.request.get("/api/me/photo", { headers: { "If-None-Match": etag } })).status()).toBe(304);
  const stored = await getPrisma().userProfile.findUniqueOrThrow({ where: { userId: user.id }, select: { photoMime: true, photo: true } });
  expect(stored.photoMime).toBe("image/jpeg");
  expect(stored.photo!.byteLength).toBeLessThan(300 * 1024);

  const anonymous = await browser.newContext();
  expect((await anonymous.request.get("/api/me/photo")).status()).toBe(401);
  await anonymous.close();

  await page.getByTestId("photo-remove").click();
  await expect(page.getByTestId("photo-status")).toHaveText("Your photo has been removed.");
  await expect(page.getByTestId("header-avatar").locator("img")).toHaveCount(0);
  await expect(page.getByTestId("header-avatar")).toHaveText("P");
  expect((await page.request.get("/api/me/photo")).status()).toBe(404);
});

test("a validation error keeps what was typed and stores nothing", async ({ page }) => {
  const { getPrisma } = await import("../../src/db/prisma");
  const email = newEmail("e2e-m5a-invalid");
  await registerViaUi(page, email, "Val Idation");
  await signInViaUi(page, email);

  await page.goto("/account/profile");
  await page.getByLabel("Mobile number").fill("12");
  await page.getByLabel("ID document type").selectOption("passport");
  await page.getByLabel("ID number").fill("A1");
  await page.getByLabel("LinkedIn profile").fill("https://example.com/me");
  await page.getByLabel("Date of birth").fill("2020-01-01");
  await page.getByTestId("profile-save").click();
  await expect(page.getByText("Please check the highlighted fields.")).toBeVisible();
  await expect(page.getByText("That does not look like a complete mobile number.")).toBeVisible();
  await expect(page.getByText("A passport number has 6 to 12 letters or digits.")).toBeVisible();
  await expect(page.getByText("Only https://www.linkedin.com/ or https://linkedin.com/ links are accepted.")).toBeVisible();
  await expect(page.getByText("You must be at least 16 years old.")).toBeVisible();
  await expect(page.getByLabel("Mobile number")).toHaveValue("12");
  await expect(page.getByLabel("ID number")).toHaveValue("A1");

  const user = await getPrisma().user.findUniqueOrThrow({ where: { email: email.toLowerCase() }, select: { id: true } });
  const row = await getPrisma().userProfile.findUniqueOrThrow({ where: { userId: user.id } });
  expect(row.phoneE164).toBeNull();
  expect(row.idNumberCiphertext).toBeNull();
  expect(row.idType).toBeNull();
});

test("checkout gate: an incomplete profile is sent to the profile page with the missing list; a complete one reaches checkout", async ({ page }) => {
  const email = newEmail("e2e-m5a-gate");
  await registerViaUi(page, email, "Gate Keeper");
  await signInViaUi(page, email);

  await page.goto(`/checkout/${offeringId}`);
  await expect(page).toHaveURL(new RegExp(`/account/profile\\?complete=1&return-to=${encodeURIComponent(`/checkout/${offeringId}`)}$`));
  const banner = page.getByTestId("profile-missing");
  await expect(banner).toContainText("A few details are needed before you can register for that date.");
  await expect(banner).toContainText("Mobile number");
  await expect(banner).toContainText("Organisation");
  await expect(page.getByTestId("profile-continue")).toHaveCount(0);

  // Complete it (the repository path; the form path is covered above) and
  // the same URL now offers the way back.
  await completeProfileByEmail(email, { legalName: "Gate Keeper" });
  await page.reload();
  await expect(page.getByTestId("profile-missing")).toHaveCount(0);
  await expect(page.getByTestId("profile-complete")).toBeVisible();
  const proceed = page.getByTestId("profile-continue");
  await expect(proceed).toHaveAttribute("href", `/checkout/${offeringId}`);
  await proceed.click();
  await expect(page).toHaveURL(new RegExp(`/checkout/${offeringId}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Register and pay");
  await expect(page.getByTestId("checkout-region-note")).toContainText("Malaysia");
  await expect(page.getByTestId("checkout-region-note")).toContainText("Malaysia →");
});
