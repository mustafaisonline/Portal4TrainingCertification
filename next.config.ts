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
  // Keep the build honest: type errors and lint errors fail the build.
  typescript: { ignoreBuildErrors: false },
  // No image-optimisation opt-outs: a real server is present.
  poweredByHeader: false,
};

export default nextConfig;
