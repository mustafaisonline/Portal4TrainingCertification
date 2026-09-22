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
