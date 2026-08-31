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
 * Every fact below comes from the founder's own résumé in the repository,
 * his authorized public profiles (P01 spec §8.4/§18), and — added
 * 2026-08-31 at the founder's direction — his published bio at
 * yourpartnertechnologies.com/team/mustafa-qizilbash.html. Because that
 * bio publicly names his past engagements (PETRONAS Digital, Hong Leong
 * Bank), those names now appear in achievements as his own published
 * claims; the earlier sector-level-only caution is superseded for THOSE
 * items. Still deliberately omitted: current employer/role (§8.6, open
 * item HO-14 — sources conflict) and volatile counts (episodes,
 * followers, members — §8.4 Tier 2).
 * No Academy programme-delivery history is listed because no Academy
 * programme has run yet (State A) — that history appears only when real.
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
  /** Profile — selected achievements, as published in the founder's own
   *  public bio. */
  achievements: string[];
  /** Profile — proprietary frameworks and methodologies he authored. */
  frameworks: string[];
  /** Profile — published books, by title. */
  books: string[];
  /** Profile — platforms and tooling taught/practised. */
  technologies: string[];
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
      "Generative and agentic AI for the enterprise",
    ],
    achievements: [
      "Led the first Teradata migration in Southeast Asia, at Hong Leong Bank",
      "Modernised PETRONAS Digital's enterprise data ecosystem to a Databricks lakehouse — with zero SLA breaches across two years",
      "Secured approval for a federated enterprise data architecture at national scale",
      "Won pioneering big-data consulting engagements in Pakistan",
    ],
    frameworks: [
      "Four 4s Formula (4×4) — a structured approach to implementing data practices",
      "DAC — Data & AI Cognitive Architecture for intelligent systems",
      "PVP — the Productionizable Viable Product methodology",
    ],
    books: [
      "Agentic AI and the Rise of Autonomous Intelligence",
      "I Am Datapedia! — co-authored with Bill Inmon and Marco Wobben",
      "Lakebase: The Databricks-Powered Future of OLTP, Analytics, and Agentic AI",
      "Four 4s Formula (I Am Data! series)",
      "Data Engineering Technical Standards and Best Practices",
    ],
    technologies: [
      "Databricks",
      "Snowflake",
      "Microsoft Fabric",
      "Azure",
      "AWS",
      "Azure Data Factory",
      "Talend",
      "Informatica",
      "Power BI",
      "Tableau",
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
      "Host of the Let's Talk About Data! podcast — conversations with global data & AI leaders, on YouTube and Spotify",
      "Founder and long-time administrator of one of the largest global online communities of data practitioners",
      "Writes regularly on data architecture, governance and AI adoption",
    ],
    linkedin: "https://www.linkedin.com/in/mustafaisonline",
  },
];
