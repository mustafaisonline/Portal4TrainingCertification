import type { MetadataRoute } from "next";
import { listPublishedProgrammes } from "@/modules/catalogue/programmes/repository";
import { footerExplore, footerLegal, primaryNav } from "@/shared/chrome/site-nav";

/*
 * /sitemap.xml (MILESTONE_9_EXECUTION_PLAN.md §2 item 5): the public
 * navigation (one source — site-nav.ts — so the sitemap can never list a page
 * the header does not) plus every PUBLISHED programme's detail page, read
 * through the catalogue repository (ADR-023: nothing in app/ knows a slug).
 * Unlisted programmes 404 and are therefore absent.
 *
 * `lastModified` is omitted: the repository's public summary does not expose
 * `updated_at`, and adding it is a catalogue-module change outside this
 * milestone's file ownership. Recorded in the M9 completion report.
 *
 * Dynamic: reads the database and APP_BASE_URL per request, so `next build`
 * needs no database and the image is environment-agnostic.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env["APP_BASE_URL"] ?? "http://localhost:3100").replace(/\/+$/, "");
  const navHrefs = [...new Set([...primaryNav, ...footerExplore, ...footerLegal].map((i) => i.href))];

  const staticEntries: MetadataRoute.Sitemap = navHrefs.map((href) => ({
    url: `${base}${href === "/" ? "" : href}`,
    changeFrequency: href === "/" ? "weekly" : "monthly",
    priority: href === "/" ? 1 : 0.7,
  }));

  const programmes = await listPublishedProgrammes();
  const programmeEntries: MetadataRoute.Sitemap = programmes.map((p) => ({
    url: `${base}/programs/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...programmeEntries];
}
