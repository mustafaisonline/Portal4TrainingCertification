import { expect, test } from "@playwright/test";
import { footerExplore, footerLegal, primaryNav, verifyLink } from "../../src/shared/chrome/site-nav";

/*
 * Production readiness — end to end (M9 plan §5 criteria 2, 5; M10 plan
 * §1.5). Written unrun by the M9/M10 agent (another agent owned the dev
 * server port); executed by the orchestrator with the rest of the suite.
 *
 * Note on HSTS: the Playwright server runs `next dev` (NODE_ENV=development),
 * so Strict-Transport-Security is deliberately absent here — it is set only
 * under NODE_ENV=production (next.config.ts).
 */

const BASELINE_HEADERS: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "DENY",
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

const publicRoutes = [...new Set([...primaryNav, ...footerExplore, ...footerLegal, verifyLink].map((i) => i.href))];

test("the home page carries the security headers", async ({ request }) => {
  const res = await request.get("/");
  expect(res.status()).toBe(200);
  for (const [name, value] of Object.entries(BASELINE_HEADERS)) {
    expect(res.headers()[name], name).toBe(value);
  }
  expect(res.headers()["x-powered-by"]).toBeUndefined();
});

/*
 * Cache-Control on PAGES: Next's renderer sets its own header on a dynamic
 * page after the next.config.ts rule runs — `no-cache, must-revalidate` under
 * `next dev` (what Playwright runs), `private, no-cache, no-store, max-age=0,
 * must-revalidate` under `next start`. Either forbids a shared cache from
 * serving the page; the assertion accepts both. Route handlers (/api/*) get
 * the config's `no-store` verbatim in both modes (verified by live probe,
 * M9 completion report §3).
 */
const UNCACHEABLE = /no-store|no-cache/;

test("personal and per-request routes are uncacheable", async ({ request }) => {
  // /account redirects to sign-in when signed out; the header rule applies to
  // the /account response itself, so do not follow the redirect.
  const account = await request.get("/account", { maxRedirects: 0 });
  expect(account.headers()["cache-control"] ?? "").toMatch(UNCACHEABLE);

  const { createAdminUser, issueTestCertificate, deleteTestOffering } = await import("../helpers/certificates-db");
  const { deleteTestUser } = await import("../helpers/identity-db");
  const admin = await createAdminUser("e2e-readiness-admin");
  const issued = await issueTestCertificate({ adminUserId: admin.id });
  try {
    const verify = await request.get(`/verify/${issued.certificate.certificateId}`);
    expect(verify.status()).toBe(200);
    expect(verify.headers()["cache-control"] ?? "").toMatch(UNCACHEABLE);
    expect(verify.headers()["x-frame-options"]).toBe("DENY");
  } finally {
    const { getPrisma } = await import("../../src/db/prisma");
    const holder = await getPrisma().user.findUnique({ where: { id: issued.userId }, select: { email: true } });
    await deleteTestOffering(issued.offeringId);
    if (holder) await deleteTestUser(holder.email);
    await deleteTestUser(admin.email);
  }

  const health = await request.get("/api/health");
  expect(health.headers()["cache-control"]).toContain("no-store");
});

test("/api/health answers 200 JSON with the documented shape", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("application/json");
  const body = (await res.json()) as Record<string, unknown>;
  expect(body["status"]).toBe("ok");
  expect(body["db"]).toBe("up");
  expect(typeof body["migration"]).toBe("string");
  expect(typeof body["version"]).toBe("string");
  expect(Object.keys(body).sort()).toEqual(["db", "migration", "status", "time", "version"]);
});

test("/robots.txt allows the public surface and disallows the private areas", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toMatch(/User-Agent:\s*\*/i);
  expect(text).toMatch(/Allow:\s*\/\s*$/im);
  for (const path of ["/account", "/admin", "/api", "/checkout", "/sign-in", "/register", "/forgot-password", "/verify-email", "/sign-out"]) {
    expect(text, path).toMatch(new RegExp(`Disallow:\\s*${path.replace(/\//g, "\\/")}\\s*$`, "im"));
  }
  expect(text).toMatch(/Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/);
});

test("/sitemap.xml lists the navigation pages and the published programme only", async ({ request, baseURL }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain("<urlset");
  for (const href of [...new Set([...primaryNav, ...footerExplore, ...footerLegal].map((i) => i.href))]) {
    const loc = `${baseURL}${href === "/" ? "" : href}`;
    expect(xml, href).toContain(`<loc>${loc}</loc>`);
  }
  const { findFlagshipProgramme } = await import("../../src/modules/catalogue/programmes/repository");
  const { getPrisma, disconnectPrisma } = await import("../../src/db/prisma");
  const flagship = await findFlagshipProgramme();
  expect(flagship).not.toBeNull();
  expect(xml).toContain(`<loc>${baseURL}/courses/${flagship!.slug}</loc>`);
  const unlisted = await getPrisma().programme.findFirst({ where: { status: "unlisted" }, select: { slug: true } });
  if (unlisted) expect(xml).not.toContain(`/courses/${unlisted.slug}<`);
  // Private areas never appear.
  for (const p of ["/account", "/admin", "/api", "/checkout", "/sign-in"]) expect(xml).not.toContain(`<loc>${baseURL}${p}`);
  await disconnectPrisma();
});

test("no wireframe remnant text renders on any public route (M10 §1.5)", async ({ page }) => {
  // Whole words, case as the wireframe wrote them. "Sample"/"placeholder" in
  // ordinary prose are allowed; the SAMPLE watermark and Mockup strip are not.
  const remnants = [/\bWireframeNote\b/, /\bWireframe\b/, /\bSAMPLE\b/, /\bMockup\b/];
  for (const href of publicRoutes) {
    await page.goto(href);
    const text = await page.locator("body").innerText();
    for (const re of remnants) expect(text, `${href} contains ${re}`).not.toMatch(re);
  }
});
