import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/*
 * /contact-us "Our locations" — CR-2026-10-01-0712 (founder, 2026-10-01): the
 * head office card on top, the local training partner(s) under it, every
 * detail real and every link working.
 */
async function expectNoAxeViolations(page: Page, scope?: string) {
  const builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  const results = await (scope ? builder.include(scope) : builder).analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("the head office card is on top with our details; the partner card is under it with Infocentric's", async ({ page }) => {
  await page.goto("/contact-us");
  const section = page.getByTestId("locations-section");
  await expect(section.getByRole("heading", { level: 2, name: "Our locations" })).toBeVisible();

  const head = page.getByTestId("location-your-partner-technologies");
  const partner = page.getByTestId("location-infocentric");
  await expect(head).toHaveAttribute("data-kind", "head_office");
  await expect(partner).toHaveAttribute("data-kind", "partner");
  await expect(page.getByTestId("head-office")).toContainText("Head office");
  await expect(page.getByRole("heading", { level: 3, name: "Partner locations" })).toBeVisible();

  // Placement: head office above the partner card, which sits inside "Partner locations".
  const h = (await head.boundingBox())!;
  const p = (await partner.boundingBox())!;
  expect(h.y + h.height, "head office is above the partner card").toBeLessThanOrEqual(p.y + 1);
  await expect(page.getByTestId("partner-locations").getByTestId("location-infocentric")).toHaveCount(1);
  await expect(page.getByTestId("head-office").getByTestId("location-infocentric")).toHaveCount(0);

  // Head office: name, company number, registered address, email, website — and no invented phone line.
  await expect(head.getByRole("heading", { level: 3 })).toHaveText("Your Partner Technologies");
  await expect(page.getByTestId("location-your-partner-technologies-registration")).toContainText("202401023226 (1569075-K)");
  await expect(page.getByTestId("location-your-partner-technologies-address")).toContainText("15-03A, One Jelatek Condominium, Jalan Jelatek, Kementah, 54200 Kuala Lumpur");
  // CR-2026-10-03-1246: the portal shows no email address of ours — the head office card has no email row.
  await expect(page.getByTestId("location-your-partner-technologies-email")).toHaveCount(0);
  const ypWeb = page.getByTestId("location-your-partner-technologies-website").getByRole("link");
  await expect(ypWeb).toHaveAttribute("href", "https://yourpartnertechnologies.com");
  await expect(page.getByTestId("location-your-partner-technologies-phone")).toHaveCount(0);

  // Partner: name, tagline, role, address, tap-to-call phone, email, website.
  await expect(partner.getByRole("heading", { level: 3 })).toHaveText("Infocentric");
  await expect(partner).toContainText("Digital Transformation using AI");
  await expect(page.getByTestId("location-infocentric-role")).toHaveText("Local training partner — Pakistan");
  await expect(page.getByTestId("location-infocentric-address")).toContainText("Plaza 241, Spring North Commercial, Bahria Town Phase 7, Rawalpindi, Pakistan");
  await expect(page.getByTestId("location-infocentric-phone").getByRole("link")).toHaveAttribute("href", "tel:+92518890717");
  await expect(page.getByTestId("location-infocentric-phone")).toContainText("(+92-51) 8890717");
  await expect(page.getByTestId("location-infocentric-email").getByRole("link")).toHaveAttribute("href", "mailto:info@infocentric.pk");
  const web = page.getByTestId("location-infocentric-website").getByRole("link");
  await expect(web).toHaveAttribute("href", "https://infocentric.pk/");
  await expect(web).toHaveAttribute("target", "_blank");
  await expect(web).toHaveAttribute("rel", /noopener/);
  await expect(web).toContainText("(opens external site)");
});

test("both logos load, with alt text; the partner's white wordmark sits on a dark tile", async ({ page, request }) => {
  await page.goto("/contact-us");
  for (const [id, alt] of [["your-partner-technologies", "Your Partner Technologies logo"], ["infocentric", "Infocentric"]] as const) {
    const img = page.getByTestId(`location-${id}-logo`).getByRole("img", { name: alt });
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { message: `${id} logo loaded` }).toBe(true);
  }
  expect((await request.get("/brand/partners/infocentric-logo.png")).status()).toBe(200);
  expect((await request.get("/brand/ypt-logo.jpg")).status()).toBe(200);
  const tile = await page.getByTestId("location-infocentric-logo").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(tile).toBe("rgb(11, 27, 58)"); // dark, so the white "INFO" is readable
});

test("layout: no horizontal overflow at phone, tablet and desktop widths; the cards stack on a phone", async ({ page }) => {
  for (const [width, columns] of [[375, 1], [768, 2], [1280, 2]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/contact-us");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${width}px`).toBeLessThanOrEqual(1);
    await expect(page.getByTestId("location-infocentric")).toBeVisible();
    if (columns === 1) {
      const h = (await page.getByTestId("location-your-partner-technologies").boundingBox())!;
      const p = (await page.getByTestId("location-infocentric").boundingBox())!;
      expect(p.y).toBeGreaterThanOrEqual(h.y + h.height - 1); // stacked, head office first
    }
  }
});

test("the locations section has no WCAG 2.2 AA violations in the light and the dark theme", async ({ page }) => {
  await page.goto("/contact-us");
  await page.addStyleTag({ content: "*, *::before, *::after { transition: none !important; }" });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    await expectNoAxeViolations(page, '[data-testid="locations-section"]');
  }
});
