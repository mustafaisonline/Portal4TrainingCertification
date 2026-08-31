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
 *   Profile sections render only when their (optional) data exists, so a
 *   future trainer without books or a podcast gets a correct page.
 *
 * Sources: the founder's own résumé in the repository, his authorized
 * public profiles (P01 spec §8.4/§18), and — at the founder's direction,
 * 2026-08-31 — his published bio at
 * yourpartnertechnologies.com/team/mustafa-qizilbash.html, including its
 * embedded URLs (Amazon book links, Medium frameworks article, podcast
 * channels, social profiles) and his own published community metrics,
 * reproduced as published. Book covers in public/books/ are his own
 * cover artwork from that bio.
 * Still deliberately omitted: current employer/role (open item HO-14 —
 * sources conflict).
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
  /** Profile — professional background, career-arc bullets. */
  background: string[];
  /** Profile — training specialisations. */
  specialisations: string[];
  /** Profile — career achievements, per engagement, as published in the
   *  founder's own bio. */
  careerAchievements?: { org: string; description: string }[];
  /** Profile — published books, with the exact Amazon URLs and the
   *  author's own cover artwork. */
  books?: { title: string; subtitle: string; url: string; cover: string }[];
  /** Profile — proprietary frameworks and methodologies. */
  frameworks?: { abbr: string; name: string; description: string }[];
  /** Deep-dive link for the frameworks section. */
  frameworksUrl?: string;
  /** Profile — podcast / media presence. */
  podcast?: {
    name: string;
    description: string;
    youtube: string;
    spotify: string;
  };
  /** Profile — community impact, metrics as published by the founder. */
  communityImpact?: { metric: string; label: string; description: string }[];
  /** Profile — professional online presence, exact published URLs. */
  socialLinks?: { platform: string; handle: string; url: string }[];
  /** Profile — platforms and tooling taught/practised. */
  technologies: string[];
  /** Profile — certifications, from the founder's own résumé. */
  certifications: string[];
  /** Profile — formal education. */
  education: string[];
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
    careerAchievements: [
      {
        org: "Hong Leong Bank",
        description:
          "Led the first Teradata migration project in Southeast Asia, establishing a new benchmark in the region.",
      },
      {
        org: "PETRONAS",
        description:
          "Led the team with zero SLA breaches over two years; migrated the data ecosystem to a unified Databricks Lakehouse; secured approval for a federated data architecture.",
      },
      {
        org: "Big-data consulting, Pakistan",
        description:
          "Led the Big Data practice, securing the first-ever big-data wins by any consulting company in the country.",
      },
    ],
    books: [
      {
        title: "Agentic AI and the Rise of Autonomous Intelligence",
        subtitle:
          "How autonomous systems are redefining work, strategy, and intelligence",
        url: "https://www.amazon.com/dp/B0F46TJ5YN",
        cover: "/books/agentic-ai.jpg",
      },
      {
        title: "I Am Datapedia!",
        subtitle:
          "Series of ‘I Am Data!’ — co-authored with Bill Inmon & Marco Wobben",
        url: "https://www.amazon.com/dp/B0F1NT87CL",
        cover: "/books/i-am-datapedia.jpg",
      },
      {
        title: "Lakebase",
        subtitle:
          "The Databricks-powered future of OLTP, analytics, and agentic AI",
        url: "https://www.amazon.com/dp/B0FDKDST38",
        cover: "/books/lakebase.jpg",
      },
      {
        title: "Four 4s Formula",
        subtitle:
          "Series of ‘I Am Data!’ — a structured approach for data practices",
        url: "https://www.amazon.com/dp/B0FGTR7Z1N",
        cover: "/books/four-4s-formula.jpg",
      },
      {
        title: "Data Engineering Technical Standards and Best Practices",
        subtitle: "Series of ‘I Am Data!’",
        url: "https://www.amazon.com/dp/B0FB2MKZPK",
        cover: "/books/data-engineering-standards.jpg",
      },
    ],
    frameworks: [
      {
        abbr: "4×4",
        name: "Four 4s Formula",
        description:
          "A structured approach (4×4×4×4) for implementing data practices that breaks complex initiatives down into manageable components.",
      },
      {
        abbr: "DAC",
        name: "DAC Architecture",
        description:
          "Data & AI Cognitive Architecture — a comprehensive framework for building intelligent systems that combine data management with AI capabilities.",
      },
      {
        abbr: "PVP",
        name: "PVP Approach",
        description:
          "Productionizable Viable Product — a methodology for taking data and AI initiatives from proof-of-concept to production-ready products.",
      },
    ],
    frameworksUrl:
      "https://medium.com/@mustafaisonline/innovations-frameworks-methodologies-f38d1cc6b044",
    podcast: {
      name: "Let’s Talk About Data!",
      description:
        "Insightful conversations with data & AI leaders from around the world — 80+ episodes featuring industry experts, thought leaders and practitioners sharing their experiences and insights.",
      youtube: "https://www.youtube.com/@letstalkaboutdata",
      spotify: "https://open.spotify.com/playlist/703KmQouYdqqxwTz7KPdmf",
    },
    communityImpact: [
      {
        metric: "40,000+",
        label: "Big Data community",
        description:
          "Founder and administrator for 12+ years of a thriving global Facebook community of data professionals.",
      },
      {
        metric: "5,000+",
        label: "LinkedIn followers",
        description:
          "600+ posts and articles on data architectures, AI adoption and industry thought leadership.",
      },
      {
        metric: "80+",
        label: "Podcast episodes",
        description:
          "Bringing global perspectives to practitioners through Let’s Talk About Data!",
      },
    ],
    socialLinks: [
      {
        platform: "LinkedIn",
        handle: "@mustafaisonline",
        url: "https://linkedin.com/in/mustafaisonline",
      },
      {
        platform: "YouTube",
        handle: "Let’s Talk About Data",
        url: "https://www.youtube.com/@letstalkaboutdata",
      },
      {
        platform: "Medium",
        handle: "Articles & blogs",
        url: "https://medium.com/@mustafaisonline",
      },
      {
        platform: "Substack",
        handle: "Newsletter",
        url: "https://mustafaqizilbash.substack.com",
      },
      {
        platform: "X / Twitter",
        handle: "@MustafaQiz",
        url: "https://x.com/MustafaQiz",
      },
      {
        platform: "Spotify",
        handle: "Podcast playlist",
        url: "https://open.spotify.com/playlist/703KmQouYdqqxwTz7KPdmf",
      },
      {
        platform: "Bluesky",
        handle: "@mustafaqiz",
        url: "https://bsky.app/profile/mustafaqiz.bsky.social",
      },
      {
        platform: "Instagram",
        handle: "@mustafaisonline",
        url: "https://www.instagram.com/mustafaisonline",
      },
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
    linkedin: "https://www.linkedin.com/in/mustafaisonline",
  },
];
