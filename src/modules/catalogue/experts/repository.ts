import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";

/*
 * Experts (trainers / practitioners) — a real role with a public profile
 * (DR-02). Field names mirror the mockup's `Practitioner` so ported pages
 * keep their shape; the long-form sections live in `profile` (jsonb).
 */

export type ExpertProfile = {
  about: string[];
  background: string[];
  specialisations: string[];
  careerAchievements?: { org: string; description: string }[];
  books?: { title: string; subtitle: string; url: string; cover: string }[];
  frameworks?: { abbr: string; name: string; description: string }[];
  frameworksUrl?: string;
  podcast?: { name: string; description: string; youtube: string; spotify: string };
  communityImpact?: { metric: string; label: string; description: string }[];
  socialLinks?: { platform: string; handle: string; url: string }[];
  technologies: string[];
  certifications: string[];
  education: string[];
  linkedin?: string;
  mediumProfile?: string;
};

export type HrdCorpAccreditation = {
  issuer: string;
  title: string;
  trainerId: string;
  certificateId: string;
  validFrom: string;
  validTo: string;
  badge: string;
  verifyUrl: string;
};

export type ExpertRecord = {
  id: string;
  slug: string;
  name: string;
  roleTitle: string;
  location: string;
  headline: string;
  experienceLine: string;
  summary: string;
  photoPath: string;
  expertise: string[];
  profile: ExpertProfile;
  hrdCorpAccreditation: HrdCorpAccreditation | null;
};

const select = {
  id: true, slug: true, name: true, roleTitle: true, location: true, headline: true, experienceLine: true,
  summary: true, photoPath: true, expertise: true, profile: true, hrdCorpAccreditation: true,
} as const;

type Row = { [K in keyof typeof select]: unknown } & { id: string; slug: string; name: string; roleTitle: string; location: string; headline: string; experienceLine: string; summary: string; photoPath: string };

function toRecord(r: Row): ExpertRecord {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    roleTitle: r.roleTitle,
    location: r.location,
    headline: r.headline,
    experienceLine: r.experienceLine,
    summary: r.summary,
    photoPath: r.photoPath,
    expertise: r.expertise as string[],
    profile: r.profile as ExpertProfile,
    hrdCorpAccreditation: (r.hrdCorpAccreditation as HrdCorpAccreditation | null) ?? null,
  };
}

export async function listPublishedExperts(db: Db = getPrisma()): Promise<ExpertRecord[]> {
  const rows = await db.expert.findMany({ where: { published: true }, orderBy: { createdAt: "asc" }, select });
  return rows.map(toRecord);
}

export async function findPublishedExpertBySlug(slug: string, db: Db = getPrisma()): Promise<ExpertRecord | null> {
  const row = await db.expert.findFirst({ where: { slug, published: true }, select });
  return row ? toRecord(row) : null;
}
