/**
 * Practitioners who deliver programmes — GENUINE people only, ever.
 *
 * DR-02 §7 and the P01 specification (docs/design/
 * P01_HOMEPAGE_REDESIGN_SPECIFICATION.md §8) bind this file:
 * - No fabricated practitioner may ever be added — not for visual balance,
 *   not for marketing, not to appear larger.
 * - The structure is deliberately plural and drives the trainer cards,
 *   the /trainers index and the /trainers/[slug] profile pages: adding a
 *   real practitioner is a data operation plus content, never a redesign.
 *
 * Every fact below comes from the founder's own résumé in the repository
 * and his authorized public profiles (P01 spec §8.4/§18). Deliberately
 * omitted: current employer (§8.6, open item HO-14), employer/client
 *   names (sector-level only), and volatile counts (books, episodes,
 *   followers — §8.4 Tier 2).
 * No programme-delivery history is listed because no Academy programme
 * has run yet (State A) — that history appears only when it is real.
 */
export type Practitioner = {
  slug: string;
  name: string;
  /** Role on this platform — a platform designation, not an employer title. */
  role: string;
  /** Path under public/. Genuine photograph only; AI-generated or stock
   *  imagery is prohibited (P01 spec §16.2–16.3). */
  photo: string;
  location: string;
  /** One-line positioning used on cards. */
  headline: string;
  /** Short mono line for cards. */
  experienceLine: string;
  /** Card summary — two sentences maximum. */
  summary: string;
  /** Expertise tags shown as chips. */
  expertise: string[];
  /** Profile — introduction paragraphs. */
  about: string[];
  /** Profile — professional background, sector-level (no employer names). */
  background: string[];
  /** Profile — training specialisations. */
  specialisations: string[];
  /** Profile — certifications, from the founder's own résumé. */
  certifications: string[];
  /** Profile — formal education. */
  education: string[];
  /** Profile — publishing, podcast, community. */
  beyond: string[];
  /** Genuine public professional profile. */
  linkedin?: string;
};

export const practitioners: Practitioner[] = [
  {
    slug: "mustafa-qizilbash",
    name: "Mustafa Qizilbash",
    role: "Founder & Lead Trainer",
    photo: "/experts/mustafa-qizilbash.jpg",
    location: "Kuala Lumpur, Malaysia · delivers internationally",
    headline: "Enterprise Data & AI practitioner and educator",
    experienceLine: "24+ years · enterprise data & AI",
    summary:
      "More than two decades building enterprise data and AI platforms across banking, energy, telecom and government — now teaching the capability he has practised.",
    expertise: [
      "Data strategy & governance",
      "Data platforms & lakehouse architecture",
      "Enterprise analytics",
      "Applied AI enablement",
      "Data engineering",
    ],
    about: [
      "Mustafa has spent more than 24 years at the working end of enterprise data — from traditional data warehousing through modern lakehouse architectures to today's AI-driven data ecosystems. His career has been international, hands-on and senior at the same time: leading platform modernisation programmes while staying close to the architectures, pipelines and decisions underneath them.",
      "His teaching starts from a practitioner's problem, not a textbook's chapter: organisations do not lack data — they lack data they can trust, and people who can build that trust. The programmes he delivers are built around that reality, using real enterprise scenarios and the judgement calls that come with them.",
    ],
    background: [
      "Led the modernisation of an enterprise data lake into a lakehouse platform supporting analytics, AI initiatives and self-service data capabilities at national-enterprise scale",
      "Directed an enterprise data-lake modernisation programme in the banking sector, owning end-to-end technical delivery",
      "Headed a big-data consulting practice delivering enterprise platform initiatives across the region",
      "Earlier delivery and leadership roles across banking, energy, telecom, government and enterprise sectors in Asia and internationally",
    ],
    specialisations: [
      "Data governance and building trusted data",
      "Data platform and lakehouse modernisation",
      "Enterprise analytics and self-service enablement",
      "Practical, applied AI adoption for the enterprise",
    ],
    certifications: [
      "DAMA CDMP",
      "Certified Data Governance Engineer (CDGE)",
      "PMI Project Management",
      "Apache Spark & Scala",
      "Oracle Certified Associate",
      "IBM Big Data",
    ],
    education: [
      "Master's degree in Information Technology",
      "Bachelor's degree in Commerce",
    ],
    beyond: [
      "Author of books on data engineering, AI and enterprise architecture",
      "Host of the Let's Talk About Data! podcast, in conversation with global data & AI leaders",
      "Founder of a long-running global community of data practitioners",
    ],
    linkedin: "https://www.linkedin.com/in/mustafaisonline",
  },
];
