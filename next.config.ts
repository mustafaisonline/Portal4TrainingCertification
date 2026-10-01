import type { NextConfig } from "next";

/*
 * Production application — repository root (ADR-001/002; layout confirmed by
 * founder direction 2026-09-21, recorded as ADR-045).
 *
 * Deliberately NOT a static export: this application has a server (server
 * actions, route handlers for webhooks and the jobs scheduler, sessions).
 * The wireframe in project-artifacts/mockup is the static-export artefact;
 * nothing from its next.config (basePath, output: "export", trailingSlash,
 * unoptimized images) carries over — see
 * docs/execution/WIREFRAME_TO_PRODUCTION_PLAN.md §4.
 */
const nextConfig: NextConfig = {
  // `forbidden()` from next/navigation — a real 403 response for a signed-in
  // user who lacks a role (M2 plan §8 criterion 8), rather than a redirect
  // that hides the refusal. Next.js gates it behind this flag.
  experimental: { authInterrupts: true },
  // Keep the build honest: type errors and lint errors fail the build.
  typescript: { ignoreBuildErrors: false },
  // No image-optimisation opt-outs: a real server is present.
  poweredByHeader: false,

  /*
   * next/image local sources (Next 16 requires query-string sources to be
   * allow-listed, and listing ANY pattern blocks every path not listed).
   * Found 2026-09-28 when the training photo (served from the database at
   * /programs/images/<id>?v=<upload time>) 500'd both training pages: the
   * `?v=` cache-buster needs `search` left OPEN on that one pattern (the
   * route serves only validated ≤600 KB JPEG/PNG/WebP from Postgres, so an
   * arbitrary `v` only busts a cache). The four static folders keep
   * `search: ""` — no query belongs on them.
   */
  images: {
    localPatterns: [
      { pathname: "/programs/images/**" },
      { pathname: "/experts/**", search: "" },
      { pathname: "/hrd-corp/**", search: "" },
      { pathname: "/books/**", search: "" },
      { pathname: "/delivery/**", search: "" },
    ],
  },

  /*
   * Permanent redirects (308) from the routes retired 2026-09-26 when the
   * founder renamed the public catalogue to /programs ("Trainings"): the old
   * flagship URL and the generic /courses/<slug> detail path. Kept so any
   * link already shared keeps resolving (LAUNCH_READINESS_CHECKLIST §4).
   */
  async redirects() {
    return [
      { source: "/DataBlueprint-AIVibeCoding", destination: "/programs/data-blueprint-ai-vibe-coding", permanent: true },
      { source: "/courses", destination: "/programs", permanent: true },
      { source: "/courses/:slug", destination: "/programs/:slug", permanent: true },
      // Milestone 13 (founder decisions 5–7, 2026-09-27): the account tabs
      // were renamed and re-ordered; links already sent by email (order
      // confirmations, certificate reminders) keep resolving.
      { source: "/account/programmes", destination: "/account/trainings", permanent: true },
      { source: "/account/certificate", destination: "/account/certifications", permanent: true },
      { source: "/account/programme", destination: "/programs", permanent: true },
      { source: "/account/security", destination: "/account/profile", permanent: true },
      // Milestone 14 Phase 1 (founder decisions P15–P17, 2026-09-27): HRD
      // Corp merged into Trainings; the diagnostic lives under Free Learning.
      { source: "/hrd-corp", destination: "/programs#hrd-corp", permanent: true },
      // 2026-09-28 ("New change" item 2): the free page no longer hosts a
      // diagnostic section, so the retired URL points at the page itself.
      { source: "/diagnostic", destination: "/free-learning/diagnostic", permanent: true },
      { source: "/diagnostic/result", destination: "/free-learning/diagnostic/result", permanent: true },
      // 2026-09-28 (founder): "Free Training & Certification" split into two
      // pages (DR-04); the combined landing is retired. Later the same day
      // the topics list merged into /free-trainings (the Knowledge Hub) and
      // the Knowledge Check start screen into /free-certifications ("no need
      // for two pages"), so those two list under their new homes too; a
      // topic's own reading page and a running check's pages are unchanged.
      { source: "/free-learning", destination: "/free-trainings", permanent: true },
      { source: "/free-learning/topics", destination: "/free-trainings", permanent: true },
      { source: "/free-learning/knowledge-check", destination: "/assessment", permanent: true },
      // 2026-10-01 (founder, CR-2026-10-01-1711): "Free Certifications" is now "Assessment" everywhere,
      // address included. The old address keeps working for every link already shared.
      { source: "/free-certifications", destination: "/assessment", permanent: true },
      // 2026-09-28 evening (founder): the /trainers directory is retired —
      // the one trainer's page lived at the top-level slug. 2026-09-30 (M7):
      // that page is gone too; the top-level slug is now a content-less route
      // (app/(public)/[slug]/page.tsx) that 308s a published trainer to their
      // EXTERNAL profile URL, or 404s when there is none — so these two still
      // chain into it. (`/trainers` lands on the founder's slug.)
      { source: "/trainers", destination: "/mustafa-qizilbash", permanent: true },
      { source: "/trainers/:slug", destination: "/:slug", permanent: true },
      { source: "/for-organisations", destination: "/programs#for-organisations", permanent: true },
      // Milestone 15 Req 5 (founder Q4, 2026-09-29): the verification address
      // named in the requirements is an alias of the one verification system.
      { source: "/verify-certificate", destination: "/verify", permanent: true },
      { source: "/verify-certificate/:id", destination: "/verify/:id", permanent: true },
    ];
  },

  /*
   * Security headers (MILESTONE_9_EXECUTION_PLAN.md §2 item 2; default H2 —
   * no Content-Security-Policy yet, see plan §4 J8). Rules are applied in
   * order and a later rule overrides an earlier one for the same header key
   * (Next docs: headers.md "Header Overriding Behavior"), which is how the
   * two photo routes keep their own caching below the blanket `/api` rule.
   */
  async headers() {
    const baseline = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      // HSTS only where TLS is certain: a production host. Never in dev, where
      // a cached HSTS entry would break plain http://localhost for two years.
      ...(process.env["NODE_ENV"] === "production"
        ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
        : []),
    ];
    const noStore = [{ key: "Cache-Control", value: "no-store" }];
    return [
      { source: "/:path*", headers: baseline },
      // Personal or per-request content: never held by any shared cache.
      // Route handlers receive this value verbatim. Dynamic PAGES are
      // additionally stamped by Next's renderer after this rule (dev:
      // `no-cache, must-revalidate`; production: `private, no-cache,
      // no-store, max-age=0, must-revalidate` — base-server.js), so the
      // page outcome is uncacheable in both modes either way.
      { source: "/verify/:id", headers: noStore },
      { source: "/account/:path*", headers: noStore },
      { source: "/organisation/:path*", headers: noStore },
      { source: "/admin/:path*", headers: noStore },
      { source: "/api/:path*", headers: noStore },
      // Exceptions restated so production and dev agree with what the route
      // handlers themselves set (app/api/me/photo, app/api/reviews/[id]/photo).
      { source: "/api/me/photo", headers: [{ key: "Cache-Control", value: "private, max-age=0, must-revalidate" }] },
      { source: "/api/reviews/:id/photo", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
    ];
  },
};

export default nextConfig;
