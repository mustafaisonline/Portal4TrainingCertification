import type { MetadataRoute } from "next";
import { AGENTIC_ITEMS } from "@/content/agentic/catalogue";
import { listPublishedProgrammes } from "@/modules/catalogue/programmes/repository";
import { listPublishedTopics } from "@/modules/free-learning/book.repository";
import { footerExplore, footerLegal, primaryNav } from "@/shared/chrome/site-nav";

/*
 * /sitemap.xml (MILESTONE_9_EXECUTION_PLAN.md §2 item 5): the public
 * navigation (one source — site-nav.ts — so the sitemap can never list a page
 * the header does not) plus every PUBLISHED programme's detail page, read
 * through the catalogue repository (ADR-023: nothing in app/ knows a slug),
 * plus the Free Learning topics index and every PUBLISHED topic (M14; the
 * founder's book is public, readable content). Unlisted programmes and
 * unpublished topics 404 and are therefore absent.
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

  const [programmes, topics] = await Promise.all([listPublishedProgrammes(), listPublishedTopics()]);
  const programmeEntries: MetadataRoute.Sitemap = programmes.map((p) => ({
    url: `${base}/programs/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));
  const topicEntries: MetadataRoute.Sitemap = [
    { url: `${base}/free-learning/topics`, changeFrequency: "weekly" as const, priority: 0.7 },
    ...topics.map((t) => ({ url: `${base}/free-learning/topics/${t.slug}`, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];

  // CR-2026-10-04-0111/0113: the Agentic AI section, its items and the subscription page (public to read).
  const agenticEntries: MetadataRoute.Sitemap = [
    "/agentic-ai",
    "/agentic-ai/agents",
    "/agentic-ai/skills",
    "/agentic-ai/terms",
    "/subscription",
    ...AGENTIC_ITEMS.map((i) => `/agentic-ai/${i.kind === "agent" ? "agents" : "skills"}/${i.slug}`),
  ].map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly" as const, priority: 0.6 }));

  return [...staticEntries, ...programmeEntries, ...topicEntries, ...agenticEntries];
}
