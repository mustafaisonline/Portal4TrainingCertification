import { notFound, permanentRedirect } from "next/navigation";
import { findPublishedExpertBySlug } from "@/modules/catalogue/experts/repository";
import { trainerProfileUrl } from "@/modules/catalogue/experts/profile-url";

/*
 * /[slug] — NO LONGER a page. The portal has no trainer dedicated pages
 * (founder, 2026-09-30, modification.md M7). This top-level segment only
 * keeps the old trainer address (/mustafa-qizilbash, and /trainers and
 * /trainers/:slug, which next.config.ts sends here) working:
 *
 *  - the slug is a PUBLISHED trainer with an external profile — Medium, else
 *    LinkedIn, https only (`trainerProfileUrl`, the one link rule) — →
 *    308 to that external URL. Data-driven: nothing here names a trainer, so
 *    a future trainer with a profile URL redirects with no code change;
 *  - anything else — an unknown or unpublished slug, or a trainer with no
 *    external profile (nothing to send them to; "no URL, no link") — is an
 *    ordinary 404, so this catch-all cannot shadow a genuine page (static
 *    routes win first).
 *
 * The trainer's record (`experts`) and its admin screens are untouched; only
 * the public page content and every link to it were removed.
 */

export const dynamic = "force-dynamic";

export default async function TrainerLegacyAddress({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const expert = await findPublishedExpertBySlug(slug);
  const url = expert ? trainerProfileUrl(expert) : null;
  if (!url) notFound();
  permanentRedirect(url);
}
