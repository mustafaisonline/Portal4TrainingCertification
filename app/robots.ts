import type { MetadataRoute } from "next";

/*
 * /robots.txt (MILESTONE_9_EXECUTION_PLAN.md §2 item 5). Crawlers may read
 * the public surface; the signed-in, administrative, API, checkout and
 * authentication routes are excluded. Certificate pages (/verify/[id])
 * additionally carry `noindex` in their own metadata.
 *
 * Note for launch cutover (M10): app/layout.tsx still sets
 * `robots: { index: false, follow: false }` on every page — nothing is
 * indexable until the founder lifts that at cutover. This file only says
 * where crawlers may go once it is lifted.
 *
 * Dynamic so APP_BASE_URL is read when the request arrives, not baked in at
 * build time (the same container image may serve staging and production).
 */
export const dynamic = "force-dynamic";

// Kept local: metadata route files may export only the Next conventions.
const DISALLOWED_PATHS = [
  "/account",
  "/admin",
  "/api",
  "/checkout",
  "/sign-in",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/sign-out",
] as const;

export default function robots(): MetadataRoute.Robots {
  const base = (process.env["APP_BASE_URL"] ?? "http://localhost:3100").replace(/\/+$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: [...DISALLOWED_PATHS] },
    sitemap: `${base}/sitemap.xml`,
  };
}
