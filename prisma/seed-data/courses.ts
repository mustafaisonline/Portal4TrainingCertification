/*
 * SEED DATA — PORTED VERBATIM 2026-09-21 from project-artifacts/mockup/data/courses.ts
 * (ADR-045 PORT list: "content files become seed data"). Founder-reviewed
 * content; edit the values here and re-run `npm run db:seed` — never in a
 * migration (ADR-029). The original header comment follows.
 */
/**
 * Course catalogue — migrated 2026-08-31 from the founder's existing
 * training ecosystem at yourpartnertechnologies.com/trainings.html and its
 * seven course subpages (confirmed complete against that site's
 * sitemap.xml). This is real, previously authored content: course
 * names, audiences, learning outcomes, curricula, pedagogy and the
 * progression between courses are preserved as written, lightly edited
 * only for house style (en-GB, "course", sentence case).
 *
 * PRICING — migrated 2026-09-01 at the founder's explicit direction.
 * The figures live in the source site's `js/main.min.js`
 * (TRAINING_INVESTMENT_DATA + buildMentorshipInvestmentRegions) and are
 * injected client-side, which is why a first static-HTML pass missed five
 * of the seven courses. All three published regions are carried, with
 * the launch-offer framing intact, exactly as published:
 *   Malaysia (RM) · Pakistan (Rs., regional scholarship) · International (USD)
 * Mentorship prices are computed in the source from USD bases
 * (250 / 1,000 / 2,500) × region multiplier, less the region discount;
 * the resulting published figures are recorded here literally rather than
 * recomputed, so nothing drifts.
 *
 * ⚠ These are TIME-LIMITED LAUNCH OFFERS ("Founder's Launch Offer",
 * "Regional Scholarship Program"). They will date. When the campaign
 * changes, update `pricing` below — no component changes are required.
 * This supersedes the earlier HO-7 hold on price display, by founder
 * direction; the underlying pricing *strategy* decision for the Academy
 * remains the founder's to make.
 *
 * DELIBERATELY NOT MIGRATED — each is a live open decision, not an
 * oversight:
 * - DATES / SCHEDULED OFFERINGS. The source publishes none, and none may
 *   be invented (DR-02 §4.1). Courses are the *proposition* layer;
 *   scheduled offerings (format · date · location · capacity) remain
 *   State A until real ones exist. This keeps the courses-vs-offerings
 *   emphasis (HO-1) genuinely open.
 * - Certification claims beyond what the source states. The source offers
 *   a "Certificate of Participation" per course — that is recorded as
 *   `certificate` and must never be conflated with the Academy credential,
 *   which is earned through assessed applied work (OQ-21 boundary).
 *
 * Adding a course is a data operation: every page maps over this file.
 */

export type CourseLevel =
  | "Foundation"
  | "Practitioner"
  | "Architect"
  | "Executive"
  | "Builder"
  | "Mentorship";

export type RegionKey = "malaysia" | "pakistan" | "international";

/** One region's published price for one course (or mentorship package). */
export type RegionPrice = {
  original: string;
  discount: string;
  save: string;
  today: string;
};

export type CoursePricing = Record<RegionKey, RegionPrice>;

/** Region metadata — mirrors `PRICE_REGIONS` in
 *  src/modules/catalogue/programmes/types.ts; `subtitle` is persisted as
 *  `programme_prices.offer_name` (shown on the checkout screen).
 *  2026-09-26 (founder): the "Save up to 50%" / "Regional scholarship"
 *  framing is retired; each region states how it pays and the badge names
 *  the 75% launch discount. */
export const pricingRegions: {
  key: RegionKey;
  label: string;
  /** Compact code for space-constrained price lists (cards, meta strips).
   *  Added 2026-09-02 when the courses hub began showing all three
   *  regions; previously components hardcoded "(MY)". */
  short: string;
  subtitle: string;
  badge: string;
  discountLabel: string;
}[] = [
  {
    key: "malaysia",
    label: "Malaysia",
    short: "MY",
    subtitle: "Card payment in RM",
    badge: "75% launch discount",
    discountLabel: "Discount",
  },
  {
    key: "pakistan",
    label: "Pakistan",
    short: "PK",
    subtitle: "Payment through our local partner",
    badge: "75% launch discount",
    discountLabel: "Discount",
  },
  {
    key: "international",
    label: "International",
    short: "INT",
    subtitle: "Card payment in USD",
    badge: "75% launch discount",
    discountLabel: "Discount",
  },
];

/** Mentorship uses different discount rates from the training courses
 *  (20/30/10 rather than 50/70/10), so its region badges differ. */
export const mentorshipRegionBadges: Record<RegionKey, string> = {
  malaysia: "Save up to 20%",
  pakistan: "Regional scholarship — save 30%",
  international: "Global launch offer — save 10%",
};

/** Mentorship is priced per package rather than per course. */
export type MentorshipPackage = {
  id: string;
  badge: string;
  name: string;
  duration: string;
  idealFor: string;
  includesLead?: string;
  includes: string[];
  featured?: boolean;
  pricing: CoursePricing;
};

export const mentorshipPackages: MentorshipPackage[] = [
  {
    id: "career-assessment",
    badge: "Start here",
    name: "Career Assessment",
    duration: "90–120 minutes",
    idealFor:
      "Professionals who want expert career guidance before committing to a longer mentorship course.",
    includes: [
      "Career discussion",
      "Skills assessment",
      "CV review",
      "LinkedIn review",
      "Career recommendations",
      "Personalised roadmap discussion",
    ],
    pricing: {
      malaysia: {
        original: "RM 1,075",
        discount: "20% OFF",
        save: "RM 215",
        today: "RM 860",
      },
      pakistan: {
        original: "Rs. 75,000",
        discount: "30% OFF",
        save: "Rs. 22,500",
        today: "Rs. 52,500",
      },
      international: {
        original: "USD 250",
        discount: "10% OFF",
        save: "USD 25",
        today: "USD 225",
      },
    },
  },
  {
    id: "professional-mentorship",
    badge: "Most popular",
    name: "Professional Mentorship",
    duration: "3 months",
    idealFor:
      "Professionals looking to transition, accelerate or reposition their careers.",
    includes: [
      "Monthly one-to-one mentoring",
      "Personalised career roadmap",
      "Technical guidance",
      "CV review",
      "LinkedIn guidance",
      "Interview preparation",
      "Progress reviews",
      "Email support between sessions",
    ],
    featured: true,
    pricing: {
      malaysia: {
        original: "RM 4,300",
        discount: "20% OFF",
        save: "RM 860",
        today: "RM 3,440",
      },
      pakistan: {
        original: "Rs. 300,000",
        discount: "30% OFF",
        save: "Rs. 90,000",
        today: "Rs. 210,000",
      },
      international: {
        original: "USD 1,000",
        discount: "10% OFF",
        save: "USD 100",
        today: "USD 900",
      },
    },
  },
  {
    id: "executive-mentorship",
    badge: "Executive",
    name: "Executive Mentorship",
    duration: "6 months",
    idealFor:
      "Senior professionals, architects, managers and aspiring technology leaders.",
    includesLead: "Everything in Professional Mentorship, plus:",
    includes: [
      "Leadership mentoring",
      "Executive career planning",
      "Strategic decision guidance",
      "Personal branding",
      "Long-term accountability",
      "Priority scheduling",
    ],
    pricing: {
      malaysia: {
        original: "RM 10,750",
        discount: "20% OFF",
        save: "RM 2,150",
        today: "RM 8,600",
      },
      pakistan: {
        original: "Rs. 750,000",
        discount: "30% OFF",
        save: "Rs. 225,000",
        today: "Rs. 525,000",
      },
      international: {
        original: "USD 2,500",
        discount: "10% OFF",
        save: "USD 250",
        today: "USD 2,250",
      },
    },
  },
];

export type Course = {
  slug: string;
  title: string;
  /** Short line under the title on the detail hero. */
  subtitle: string;
  level: CourseLevel;
  /** Marks the founder's designated flagship course. */
  flagship?: boolean;
  /** Public visibility. When absent the seed applies the M3 §10.1 default:
   *  flagship → published, every other course → unlisted. Set explicitly
   *  where the founder has published a second training (2026-09-26). */
  status?: "published" | "unlisted";
  /** Free-text as published — never a fabricated schedule. */
  duration: string;
  prerequisites: string;
  formats: string[];
  certificate: string;
  audienceSummary: string;
  /** Card + listing summary. */
  summary: string;
  /** Longer hero proposition on the detail page. */
  valueProposition: string;
  highlights: string[];
  whoShouldAttend: { intro: string; roles: string[] };
  /** "Why this matters" — the argument for the course. */
  rationale: {
    heading: string;
    paragraphs: string[];
    /** Bulleted problems the course addresses. */
    problems?: string[];
  };
  /** Flat outcome list. */
  outcomes?: string[];
  /** Grouped outcomes (topic → sub-topics), where the source groups them. */
  outcomeGroups?: { title: string; items: string[] }[];
  /** Curriculum. `points` carries the sub-topics where the source has them. */
  modules: { title: string; description?: string; points?: string[] }[];
  /** Delivery-pace variants — currently only the flagship publishes these. */
  deliveryFormats?: {
    name: string;
    badge?: string;
    duration: string;
    schedule: string;
    totalTime: string;
    bestFor: string[];
  }[];
  /** What enrolment includes, where the source lists it. */
  included?: string[];
  pedagogy?: { intro: string; methods: string[]; industries?: string[] };
  benefits?: { intro: string; items: string[] };
  /** Career-path transitions — mentorship course only. */
  careerPaths?: { from: string; to: string; challenge: string; helps: string }[];
  /** Named methodology stages, where the source publishes one. */
  methodology?: { name: string; steps: { title: string; body: string }[] };
  /** Published per-region pricing. Absent on the mentorship course,
   *  which is priced per package (see `mentorshipPackages`). */
  pricing?: CoursePricing;
  /** Value-stack breakdown, where the source publishes one. */
  valueStack?: { item: string; value: string }[];
  valueStackTotal?: string;
  /** Slugs of related courses, from the source's own cross-links. */
  related: string[];
  /** Genuinely external resources — YPT service pages with no Academy
   *  equivalent. Internal training links were migrated to portal routes. */
  externalResources?: { label: string; url: string; description: string }[];
  /** One sentence placing this training relative to another — shown under
   *  the hero proposition (added 2026-09-26). */
  relationshipNote?: string;
  /** Founder-directed "what you can do straight after" block (2026-09-26). */
  afterThisTraining?: { heading: string; intro: string; items: string[] };
  /** Questions and answers for the detail page (2026-09-26). */
  faq?: { q: string; a: string }[];
  /** "What you get out of this training" (founder change list 2026-09-26). */
  whatYouGet?: string[];
  /** Participant numbers per format, under the "Choose your pace" cards (2026-09-26). */
  paceNotes?: string[];
  /** Per-region pricing notes and, where a region publishes two figures,
   *  the options (2026-09-26). `pricing` above stays the ONE amount per
   *  region that reaches `programme_prices` and checkout; when `options`
   *  exist, one of them must equal it. */
  regionalPricing?: Partial<
    Record<RegionKey, { note?: string; options?: { label: string; original: string; today: string; minParticipants?: number }[] }>
  >;
};

export const courseLevels: {
  level: CourseLevel;
  description: string;
}[] = [
  { level: "Foundation", description: "Shared language for working with data and AI" },
  { level: "Practitioner", description: "The whole enterprise data picture" },
  { level: "Architect", description: "Designing models and platforms" },
  { level: "Executive", description: "Strategy, governance and adoption decisions" },
  { level: "Builder", description: "Building real products with AI" },
  { level: "Mentorship", description: "One-to-one career direction" },
];

export const courses: Course[] = [
  /* ------------------------------------------------------------------ */
  {
    slug: "data-ai-essentials",
    title: "Data & AI Essentials",
    subtitle: "Build your Data & AI foundation — no technical background required",
    level: "Foundation",
    duration: "Half day to 1 day",
    prerequisites: "None",
    formats: ["Face-to-face", "Live online", "Hybrid"],
    certificate: "Certificate of participation",
    audienceSummary: "Business and non-technical professionals",
    summary:
      "Build practical data and AI literacy — understand how organisations use data, analytics, generative AI and agentic AI to make better decisions, without needing a technical background.",
    valueProposition:
      "Understand modern data and AI concepts and their business applications — the starting point before advancing to practitioner and leadership courses.",
    highlights: [
      "Beginner friendly",
      "No technical background required",
      "Real-world examples",
      "Business-focused learning",
      "Practical AI awareness",
    ],
    whoShouldAttend: {
      intro:
        "Foundation-level data literacy for business users, managers, students, and teams who need to understand data and AI — not build it from scratch.",
      roles: [
        "Students and graduates",
        "Business users",
        "Managers and team leaders",
        "Project managers",
        "Business analysts",
        "Product owners",
        "HR professionals",
        "Operations teams",
      ],
    },
    rationale: {
      heading: "Why data & AI literacy matters",
      paragraphs: [
        "Organisations across every industry are investing heavily in data and artificial intelligence. However, many professionals struggle because they do not understand the fundamental concepts behind modern data ecosystems and AI technologies.",
        "This course bridges that gap by providing a practical understanding of how data and AI work together to support business decisions, innovation and digital transformation. Participants gain the confidence to engage with data engineers, scientists, architects and AI teams using shared language.",
      ],
    },
    outcomeGroups: [
      {
        title: "Data fundamentals",
        items: [
          "What data is",
          "Types of data",
          "Structured, semi-structured and unstructured data",
        ],
      },
      {
        title: "Understanding information",
        items: [
          "Data versus information",
          "Data–Information–Knowledge–Wisdom (DIKW)",
          "Business context",
        ],
      },
      {
        title: "Metadata",
        items: [
          "What metadata is",
          "Why metadata matters",
          "Business and technical metadata",
        ],
      },
      {
        title: "Enterprise data building blocks",
        items: ["Master data", "Reference data", "Transactional data", "Metadata"],
      },
      {
        title: "Data governance",
        items: ["Ownership", "Stewardship", "Quality", "Trust"],
      },
      {
        title: "Data quality",
        items: [
          "Accuracy",
          "Completeness",
          "Consistency",
          "Validity",
          "Uniqueness",
          "Timeliness",
        ],
      },
      {
        title: "Artificial intelligence",
        items: [
          "The evolution of AI",
          "Machine learning",
          "Generative AI",
          "Agentic AI",
        ],
      },
      {
        title: "Business use cases",
        items: [
          "Real-world data & AI examples",
          "Business transformation opportunities",
          "AI adoption considerations",
        ],
      },
    ],
    modules: [
      { title: "Introduction to data" },
      { title: "Understanding metadata" },
      { title: "Enterprise data building blocks" },
      { title: "Data governance fundamentals" },
      { title: "Data quality fundamentals" },
      { title: "Introduction to artificial intelligence" },
      { title: "Generative AI & agentic AI" },
      { title: "Business applications and use cases" },
    ],
    pedagogy: {
      intro:
        "Participants are not expected to have technical expertise. The focus is on understanding concepts, terminology, business impact and practical applications.",
      methods: [
        "Practical business examples",
        "Interactive discussions",
        "Real-world case studies",
        "Industry scenarios",
        "Visual learning techniques",
        "Simplified explanations of complex concepts",
      ],
    },
    pricing: {
      malaysia: { original: "RM 1,398", discount: "50% OFF", save: "RM 699", today: "RM 699" },
      pakistan: { original: "Rs. 95,983.00", discount: "70% OFF", save: "Rs. 67,188.10", today: "Rs. 28,794.90" },
      international: { original: "USD 874", discount: "10% OFF", save: "USD 88", today: "USD 786" },
    },
    related: ["data-blueprint", "agentic-ai-strategy-adoption"],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "data-blueprint",
    title: "The Data Blueprint",
    subtitle: "Understanding modern data ecosystems — from governance to AI readiness",
    level: "Practitioner",
    duration: "1–2 days",
    prerequisites: "Basic business or technology awareness",
    formats: ["Face-to-face", "Live online", "Hybrid"],
    certificate: "Certificate of participation",
    audienceSummary: "Business and technical professionals",
    summary:
      "See the full enterprise data picture — how data is governed, architected, managed and prepared for analytics and AI across modern platforms.",
    valueProposition:
      "A complete view of the enterprise data ecosystem, for practitioners who need to contribute confidently to transformation, analytics and AI initiatives.",
    highlights: [
      "Enterprise-focused",
      "Business and technology aligned",
      "Real-world industry examples",
      "Data governance awareness",
      "Architecture foundations",
      "AI-ready concepts",
    ],
    whoShouldAttend: {
      intro:
        "Practitioner-level training for data analysts, engineers, stewards, governance teams, and professionals who work with enterprise data daily.",
      roles: [
        "Business analysts",
        "Data analysts",
        "Data engineers",
        "Data stewards",
        "Project managers",
        "Product owners",
        "Data governance teams",
        "Managers and team leads",
        "Early-career data professionals",
        "University graduates",
      ],
    },
    rationale: {
      heading: "Beyond dashboards: why the whole picture matters",
      paragraphs: [
        "Most organisations invest heavily in data platforms, analytics tools, governance initiatives and AI solutions. However, many professionals lack a holistic understanding of how these components fit together.",
        "The Data Blueprint addresses this by providing a complete view of the enterprise data ecosystem. Participants learn how data is managed, governed, architected, secured and turned into business value.",
      ],
      problems: [
        "Data initiatives struggle",
        "Governance programmes fail",
        "AI projects produce limited value",
        "Teams operate in silos",
        "Decision-makers lack trust in information",
      ],
    },
    outcomes: [
      "Understand the role of data in modern enterprises",
      "Explain how decision support systems enable business decisions",
      "Differentiate between structured, semi-structured and unstructured data",
      "Understand metadata and its role in governance",
      "Identify enterprise data building blocks",
      "Explain master data, reference data and transactional data",
      "Understand modern data storage and processing approaches",
      "Describe data warehouses, data lakes and lakehouses",
      "Understand enterprise data architecture principles",
      "Recognise the importance of governance, privacy and security",
      "Evaluate data quality dimensions",
      "Participate more effectively in data and AI initiatives",
    ],
    modules: [
      {
        title: "Decision support systems (DSS)",
        description:
          "Understanding how organisations transform data into business decisions.",
      },
      {
        title: "Understanding data",
        description:
          "Data fundamentals, data types, and enterprise information concepts.",
      },
      {
        title: "Metadata management",
        description:
          "Business metadata, technical metadata, operational metadata, lineage and trust.",
      },
      {
        title: "Enterprise data building blocks",
        description:
          "Master data, reference data, transactional data and metadata.",
      },
      {
        title: "Data processing & storage",
        description:
          "Data warehouses, data lakes, lakehouses and modern data platforms.",
      },
      {
        title: "Enterprise data architecture",
        description:
          "Business, data, application and technology architecture — and modern data ecosystems.",
      },
      {
        title: "Governance, security, privacy & data quality",
        description:
          "Data governance, ownership and stewardship, security, privacy, quality and trust.",
      },
    ],
    pedagogy: {
      intro:
        "Participants learn concepts using practical business situations rather than vendor-specific tools. The focus is on building enterprise understanding rather than teaching a specific technology platform.",
      methods: [
        "Real-world case studies",
        "Industry examples",
        "Interactive discussions",
        "Practical business scenarios",
        "Architecture thinking",
        "Enterprise data management concepts",
      ],
      industries: [
        "Banking",
        "Telecommunications",
        "Healthcare",
        "Retail",
        "Oil & gas",
        "Public sector",
      ],
    },
    benefits: {
      intro: "Organisations that invest in The Data Blueprint can:",
      items: [
        "Improve data literacy",
        "Strengthen governance awareness",
        "Reduce communication gaps",
        "Improve data quality awareness",
        "Support analytics initiatives",
        "Prepare teams for AI adoption",
        "Create a common enterprise data language",
      ],
    },
    pricing: {
      malaysia: { original: "RM 2,998", discount: "50% OFF", save: "RM 1,499", today: "RM 1,499" },
      pakistan: { original: "Rs. 205,528.84", discount: "70% OFF", save: "Rs. 143,870.19", today: "Rs. 61,658.65" },
      international: { original: "USD 1,874", discount: "10% OFF", save: "USD 188", today: "USD 1,686" },
    },
    related: [
      "data-ai-essentials",
      "enterprise-data-modelling",
      "enterprise-data-architecture",
    ],
    externalResources: [
      {
        label: "Data & AI Services",
        url: "https://yourpartnertechnologies.com/services/data-ai-services.html",
        description: "Delivery support that applies these foundations in practice",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "enterprise-data-modelling",
    title: "Enterprise Data Modelling",
    subtitle: "From business concepts to enterprise information structures",
    level: "Architect",
    duration: "2–3 days",
    prerequisites: "Basic understanding of data concepts",
    formats: ["Face-to-face", "Live online", "Hybrid"],
    certificate: "Certificate of participation",
    audienceSummary: "Architects, analysts, engineers, modellers",
    summary:
      "Design enterprise data models that align business concepts with analytics, governance, lakehouses and AI — from conceptual through logical to physical layers.",
    valueProposition:
      "Business-driven models for analytics, governance and AI — for the people who define the structures behind warehouses, lakehouses and AI-ready platforms.",
    highlights: [
      "Business-driven modelling",
      "Enterprise architecture perspective",
      "Modern modelling approaches",
      "Analytics and AI ready",
      "Industry case studies",
    ],
    whoShouldAttend: {
      intro:
        "Architect-level training for data architects, modellers, information architects, and practitioners who design enterprise information structures.",
      roles: [
        "Data architects",
        "Data modellers",
        "Data engineers",
        "Solution architects",
        "Business analysts",
        "Enterprise architects",
        "Data governance professionals",
        "Data warehouse teams",
        "Analytics professionals",
        "Information architects",
      ],
    },
    rationale: {
      heading: "Why data modelling remains critical",
      paragraphs: [
        "Many organisations invest heavily in modern platforms such as data lakes, lakehouses, AI solutions and cloud technologies. However, technology alone does not solve information challenges.",
        "Enterprise data modelling creates consistent, scalable, business-aligned information assets — the foundation for platform architecture and delivery engagements.",
      ],
      problems: [
        "Conflicting business definitions",
        "Data quality issues",
        "Reporting inconsistencies",
        "Complex integrations",
        "Governance challenges",
        "AI readiness problems",
      ],
    },
    outcomes: [
      "Understand the role of data modelling in enterprise architecture",
      "Translate business concepts into information structures",
      "Differentiate between modelling layers and modelling approaches",
      "Design conceptual, logical and physical models",
      "Understand semantic and information modelling techniques",
      "Evaluate modern enterprise modelling methodologies",
      "Support governance and data quality initiatives through modelling",
      "Improve communication between business and technical teams",
      "Create AI-ready and analytics-ready information structures",
    ],
    modules: [
      {
        title: "Introduction to enterprise data modelling",
        points: [
          "Why modelling matters",
          "Business alignment",
          "Enterprise architecture context",
        ],
      },
      {
        title: "Business modelling",
        points: [
          "Business concepts, entities, relationships",
          "Business rules and enterprise vocabulary",
        ],
      },
      {
        title: "Semantic modelling",
        points: [
          "Meaning, context and shared understanding",
          "Business semantics and concept relationships",
        ],
      },
      {
        title: "Information modelling",
        points: [
          "Information structures and relationships",
          "Enterprise information architecture",
        ],
      },
      {
        title: "Conceptual data modelling",
        points: [
          "High-level business representation",
          "Business entities and relationships",
        ],
      },
      {
        title: "Logical data modelling",
        points: [
          "Business rules and normalisation concepts",
          "Enterprise information structures",
        ],
      },
      {
        title: "Physical data modelling",
        points: [
          "Database implementation considerations",
          "Performance and platform alignment",
        ],
      },
      {
        title: "Modern enterprise modelling approaches",
        points: [
          "Dimensional modelling",
          "Data Vault",
          "Anchor modelling",
          "Focal Point modelling",
          "Unified Star Schema",
          "FCO-IM",
        ],
      },
      {
        title: "Data modelling for analytics and AI",
        points: [
          "Analytical models and AI-ready information structures",
          "Governance considerations",
        ],
      },
    ],
    pricing: {
      malaysia: { original: "RM 4,998", discount: "50% OFF", save: "RM 2,499", today: "RM 2,499" },
      pakistan: { original: "Rs. 342,799.53", discount: "70% OFF", save: "Rs. 239,959.67", today: "Rs. 102,839.86" },
      international: { original: "USD 3,124", discount: "10% OFF", save: "USD 313", today: "USD 2,811" },
    },
    related: ["data-blueprint", "enterprise-data-architecture"],
    externalResources: [
      {
        label: "Data & AI Services",
        url: "https://yourpartnertechnologies.com/services/data-ai-services.html",
        description: "Modelling applied within delivery engagements",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "enterprise-data-architecture",
    title: "Enterprise Data Architecture",
    subtitle:
      "Designing modern data ecosystems for analytics, governance and AI",
    level: "Architect",
    duration: "2 days",
    prerequisites: "Understanding of basic data concepts",
    formats: ["Face-to-face", "Live online", "Hybrid"],
    certificate: "Certificate of participation",
    audienceSummary: "Architects, leads, senior professionals",
    summary:
      "Design governed, scalable, AI-ready enterprise data platforms — lakehouse, data mesh, data fabric, architecture layers, and vendor-neutral patterns that align business strategy with technology.",
    valueProposition:
      "Scalable, governed, future-ready data ecosystems — for architects and technical leaders responsible for modern data platform design.",
    highlights: [
      "Enterprise architecture perspective",
      "Modern data platform design",
      "Data lakehouse concepts",
      "Data mesh and federated architectures",
      "Data governance alignment",
      "AI-ready architectures",
    ],
    whoShouldAttend: {
      intro:
        "Architect-level training for data architects, platform architects, enterprise architects, and technical leaders designing modern data ecosystems.",
      roles: [
        "Data architects",
        "Enterprise architects",
        "Solution architects",
        "Data engineering leads",
        "Data managers",
        "Analytics leaders",
        "Technology leaders",
        "Digital transformation teams",
        "Governance professionals",
        "Senior data practitioners",
      ],
    },
    rationale: {
      heading: "Why enterprise data architecture matters",
      paragraphs: [
        "Many organisations invest heavily in cloud platforms, data lakes, analytics tools and AI solutions. Yet many initiatives fail because the architecture supporting them was never properly designed.",
        "Enterprise data architecture provides the blueprint that connects business strategy, information assets, applications, governance and technology. Strong architecture creates consistency, trust and scalability.",
      ],
      problems: [
        "Data silos",
        "Duplicate data",
        "Poor governance",
        "Inconsistent reporting",
        "Integration complexity",
        "Limited scalability",
        "Difficult AI adoption",
      ],
    },
    outcomes: [
      "Understand the role of enterprise data architecture",
      "Align business objectives with data strategy",
      "Differentiate architecture domains and responsibilities",
      "Design modern enterprise data ecosystems",
      "Understand data warehouse, data lake and lakehouse architectures",
      "Evaluate data hub and data fabric concepts",
      "Understand data mesh and federated approaches",
      "Design architecture layers for scalable data platforms",
      "Improve governance and data quality outcomes",
      "Prepare organisations for analytics and AI initiatives",
    ],
    modules: [
      {
        title: "Introduction to enterprise architecture",
        description: "Understanding architecture as a business capability.",
      },
      {
        title: "Architecture domains",
        description:
          "Business, data, application and technology architecture — and how the four domains work together.",
      },
      {
        title: "Modern data ecosystems",
        description:
          "How information flows through modern organisations; enterprise data lifecycle concepts.",
      },
      {
        title: "Data architecture layers",
        description:
          "Landing zone, staging zone, preparation zone and semantic zone — the purpose and responsibilities of each.",
      },
      {
        title: "Modern data platform architectures",
        description:
          "Data warehouse, data lake and data lakehouse — benefits, challenges and use cases.",
      },
      {
        title: "Data integration architectures",
        description:
          "Data hub, virtualisation and API-based integration — modern integration approaches.",
      },
      {
        title: "Advanced enterprise architectures",
        description:
          "Data fabric, data mesh and federated data architecture — domain ownership and governance models.",
      },
      {
        title: "Governance and trust",
        description:
          "Data governance, metadata, security, privacy and data quality — architecture considerations for trust and compliance.",
      },
      {
        title: "AI-ready architectures",
        description:
          "Feature stores, vector databases and inference layers — modern architectural considerations for AI and agentic AI.",
      },
      {
        title: "Data & AI Cognitive (DAC) Architecture",
        description:
          "An overview of the DAC Architecture framework and how it brings modern data and AI capabilities together within a unified enterprise architecture.",
      },
    ],
    pricing: {
      malaysia: { original: "RM 5,998", discount: "50% OFF", save: "RM 2,999", today: "RM 2,999" },
      pakistan: { original: "Rs. 411,165.42", discount: "70% OFF", save: "Rs. 287,815.79", today: "Rs. 123,349.63" },
      international: { original: "USD 3,749", discount: "10% OFF", save: "USD 375", today: "USD 3,374" },
    },
    related: ["enterprise-data-modelling", "data-blueprint"],
    externalResources: [
      {
        label: "Data & AI Services",
        url: "https://yourpartnertechnologies.com/services/data-ai-services.html",
        description: "Platform delivery support",
      },
      {
        label: "LTAD 2.0",
        url: "https://yourpartnertechnologies.com/services/ltad2.html",
        description: "Tool and technology evaluation approach",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "agentic-ai-strategy-adoption",
    title: "Agentic AI Strategy & Adoption",
    subtitle: "Turning agentic AI hype into business value",
    level: "Executive",
    duration: "1 day",
    prerequisites: "None",
    formats: ["Face-to-face", "Live online", "Hybrid"],
    certificate: "Certificate of participation",
    audienceSummary: "Executives, managers, digital leaders",
    summary:
      "Turn agentic AI from hype into governed business value — evaluate opportunities, manage risk, set adoption strategy, and avoid the mistakes that stalled earlier AI waves.",
    valueProposition:
      "Strategy, governance and adoption — not coding. For leaders accountable for agentic AI investment and adoption decisions.",
    highlights: [
      "Executive-friendly",
      "Business-focused",
      "Real-world use cases",
      "AI governance awareness",
      "Adoption frameworks",
      "Risk management",
    ],
    whoShouldAttend: {
      intro:
        "Executive training for leaders accountable for agentic AI investment, governance and adoption decisions.",
      roles: [
        "CIOs",
        "CTOs",
        "CDOs",
        "Business executives",
        "Innovation leaders",
        "Product owners",
        "Digital transformation teams",
        "Enterprise architects",
        "Data leaders",
        "AI governance teams",
      ],
    },
    rationale: {
      heading: "Why organisations need an agentic AI strategy",
      paragraphs: [
        "Many organisations rushed into generative AI initiatives without fully understanding business value, governance requirements, operational challenges and production realities. As agentic AI emerges, many risk repeating the same mistakes.",
        "This course provides a practical roadmap for the questions leaders actually have to answer.",
      ],
      problems: [
        "What is agentic AI?",
        "How is it different from generative AI?",
        "Which business processes should be automated?",
        "What risks must be managed?",
        "What governance is required?",
        "How do we move from experimentation to production?",
      ],
    },
    outcomes: [
      "Understand the evolution of AI technologies",
      "Differentiate agentic AI from traditional AI approaches",
      "Evaluate agentic AI opportunities objectively",
      "Understand major agentic AI risks and challenges",
      "Identify suitable business use cases",
      "Understand agentic AI governance considerations",
      "Assess organisational readiness",
      "Develop adoption strategies",
      "Apply practical implementation frameworks",
      "Move beyond AI experimentation toward business value realisation",
    ],
    modules: [
      {
        title: "The evolution of AI",
        description:
          "Rule-based systems, machine learning, generative AI and agentic AI — understanding how AI evolved toward autonomous systems.",
      },
      {
        title: "The reality of AI adoption",
        description:
          "Lessons from previous AI initiatives, why projects fail, common adoption challenges, and managing expectations.",
      },
      {
        title: "What is agentic AI?",
        description:
          "Fundamentals, goal-oriented systems, autonomous decision making, tool usage, memory, planning and reflection.",
      },
      {
        title: "Agent types and agent ecosystems",
        description:
          "Core agents, supporting agents, multi-agent systems and emerging agent patterns.",
      },
      {
        title: "Components of agentic AI systems",
        description:
          "Planning, memory, tool integration, execution, monitoring and feedback loops.",
      },
      {
        title: "Risks, governance & responsible adoption",
        description:
          "Governance, compliance, security, privacy, human oversight, trust and accountability.",
      },
      {
        title: "Business use cases",
        description:
          "Employee onboarding, meeting management, policy discovery, knowledge management, project tracking and helpdesk automation.",
      },
      {
        title: "The PVP approach",
        description:
          "Productionizable Viable Product — why many AI solutions fail to reach production, and how to improve adoption success.",
      },
      {
        title: "Enterprise case studies",
        description: "Enterprise agentic AI adoption scenarios examined in practice.",
      },
      {
        title: "Building an agentic AI roadmap",
        description:
          "Opportunity identification, prioritisation, governance, adoption planning and scaling responsibly.",
      },
    ],
    pedagogy: {
      intro:
        "Most AI training focuses on tools, prompts, chatbots and technical implementation. This course focuses on the decisions leaders own:",
      methods: [
        "Business outcomes",
        "Organisational readiness",
        "Governance",
        "Adoption strategy",
        "Risk management",
        "Value realisation",
      ],
    },
    pricing: {
      malaysia: { original: "RM 3,998", discount: "50% OFF", save: "RM 1,999", today: "RM 1,999" },
      pakistan: { original: "Rs. 274,434.11", discount: "70% OFF", save: "Rs. 192,103.88", today: "Rs. 82,330.23" },
      international: { original: "USD 2,499", discount: "10% OFF", save: "USD 250", today: "USD 2,249" },
    },
    related: ["data-ai-essentials", "data-blueprint-ai-vibe-coding"],
    externalResources: [
      {
        label: "Value Discovery Canvas™",
        url: "https://yourpartnertechnologies.com/services/value-discovery-canvas.html",
        description: "Prioritise and align AI initiatives with business value",
      },
      {
        label: "Strategic Advisory",
        url: "https://yourpartnertechnologies.com/strategic-advisory.html",
        description: "Portfolio-level strategy support",
      },
      {
        label: "Agentic AI Solutions",
        url: "https://yourpartnertechnologies.com/services/agentic-ai.html",
        description: "Technical delivery when you are ready to execute",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Learn Vibe Coding — ADDED 2026-09-26 at the founder's direction (the
   * curriculum is docs/execution/CURRICULUM_LEARN_VIBE_CODING.md). The
   * vibe-coding half of the two-day flagship, taught on its own. Published
   * and listed FIRST on /programs (founder's order); not the flagship.
   * Prices are the founder's figures verbatim (USD 1,000 · RM 100 ·
   * Rs 5,000) with NO discount, so list = offer and the components hide the
   * strike-through. The module points restate the agenda blocks of the
   * curriculum document (the founder's outline items 1–13). */
  {
    slug: "learn-vibe-coding",
    title: "Learn Vibe Coding",
    subtitle: "Build software by directing AI — the method, the tools and a real build, in one afternoon",
    level: "Builder",
    status: "published",
    duration: "3–4 hours",
    prerequisites: "None — bring a laptop and one AI account",
    formats: ["Half-day workshop", "Live online"],
    certificate: "Certificate of Completion",
    audienceSummary: "Founders, product owners, analysts, managers, curious professionals",
    summary:
      "A half-day, expert-led session on building software by directing AI: what an LLM, an agent and a skill are, the document-first Vibe Coding Method, and a live build on a real repository — no coding background needed.",
    valueProposition:
      "Software is now built by directing AI. This afternoon gives you the method that keeps it reliable — the eight documents, the guardrails and the build sequence — shown live on a real repository, and a starter kit to use the next morning.",
    relationshipNote:
      "This is the vibe-coding half of the 2-day Data Blueprint & AI/Vibe Coding training, taught on its own.",
    highlights: [
      "No coding background needed",
      "The eight-document Vibe Coding Method, shown on a real product",
      "A live build on a real repository — wireframe to admin panel",
      "Agents and skills made in front of you",
      "The Vibe Coding Starter Kit to take home",
      "Certificate of Completion on attending the full session",
    ],
    // "Who can take this training" — rewritten 2026-09-26 (founder change
    // list): no coding background needed; anyone with a laptop and an AI
    // account.
    whoShouldAttend: {
      intro:
        "Anyone with a laptop and an AI account can take this training — no coding background is needed. It is for people who want to build with AI rather than only talk about it; developers new to AI-assisted work are welcome too, because the method makes them faster rather than starting them over.",
      roles: [
        "Founders and entrepreneurs",
        "Product owners and product managers",
        "Business and data analysts",
        "Managers who commission software",
        "Students and recent graduates",
        "Freelancers",
        "Developers new to AI-assisted work",
      ],
    },
    rationale: {
      heading: "Why you need this training",
      paragraphs: [
        "Software is now built by directing AI. A person who can describe what they want, set the rules the AI must keep and check what comes back can produce a working product in an afternoon — work that used to need a team and a budget.",
        "The people who win are not the fastest typists. They are the ones who can specify, direct and verify: write the documents an AI needs, keep it inside a constitution, and know when to accept its output and when to send it back.",
        "Most people skip the method. They prompt, get something that almost works, and get stuck when the AI forgets, invents a rule or breaks what it built yesterday. This session gives you the method in one afternoon, on a real repository, so you leave able to start.",
      ],
      problems: [
        "You have tried AI coding tools and got a demo that fell apart when you changed one thing",
        "You know what you want built but cannot brief a developer — or an AI — precisely enough",
        "You are paying for software that a small internal tool could replace",
        "You do not know which tools to use, what they cost, or when you still need a professional developer",
      ],
    },
    outcomes: [
      "Explain what vibe coding is and is not, and what an LLM, RAG, an agent and a skill are, in plain language",
      "Choose a starting toolset (chat tool, coding agent, Git) and a minimum tech stack, and know what each costs",
      "Write prompts that get reliable results, and write a constitution file that keeps the AI inside the rules",
      "Follow the document-first Vibe Coding Method: Vision → BRD → FSD → HLD → LLD → WBS → TechStack → GuardRails, with reference designs and a theme",
      "Recognise the build sequence — wireframe → physical data model → product → admin panel — and the checks that belong between steps",
      "Name the five ways vibe-coded projects fail and how the method prevents each",
      "Leave with your own Vision.md written with AI and a wireframe prompt ready to run (hands-on option)",
    ],
    afterThisTraining: {
      heading: "Start freelancing straight after the session",
      intro: "You leave ready to start offering vibe-coding services as a freelancer or inside your team:",
      items: [
        "Build landing pages, internal tools and prototypes for clients",
        "Turn a client brief into Vision, BRD and FSD documents an AI can build from",
        "Scope and quote a small build with a work breakdown you can defend",
        "Run an AI coding agent inside a constitution and Git, with every change reviewed before it is accepted",
        "Know when a job needs a professional developer — and what to hand them",
      ],
    },
    // Module points are the founder's list VERBATIM (chat, 2026-09-26),
    // asterisks removed; the parenthesised minutes are the founder's too.
    modules: [
      {
        title: "Part 1 · Foundations (about 60 minutes)",
        points: [
          "What is Vibe Coding, and what it is not",
          "What is an LLM, and what is RAG",
          "Tokens, context window and why the AI forgets",
          "Hallucination and how to verify what the AI tells you",
          "Tools: ChatGPT, Gemini, Grok, Claude, and the coding agents (Claude Code, Cursor, Gemini CLI, Copilot)",
          "Git and GitHub: your undo button",
          "What is a framework, and the minimum stack you need (front end, back end, database, hosting)",
          "What AI tools cost, and what is free",
        ],
      },
      {
        title: "Part 2 · Working with AI (about 45 minutes)",
        points: [
          "What is Prompt Engineering, and the prompt patterns that work (role, context, constraints, examples, output format, iterate)",
          "The constitution file: rules the AI must follow in every session",
          "What is an Agent",
          "How to make an Agent (live demo)",
          "What is a Skill",
          "How to make a Skill (live demo)",
          "When not to use an Agent",
        ],
      },
      {
        title: "Part 3 · The Vibe Coding Method (about 30 minutes)",
        points: [
          "Step 1 · Create Vision.md",
          "Step 2 · Create BRD.md",
          "Step 3 · Create FSD.md",
          "Step 4 · Create HLD.md",
          "Step 5 · Create LLD.md, including the data model",
          "Step 6 · Create Project Plan WBS.md for the whole project",
          "Step 7 · Create TechStack.md",
          "Step 8 · Create GuardRails.md",
          "Find sample sites or product designs to share with the AI",
          "Give a theme image",
          "Keep a decision log",
        ],
      },
      {
        title: "Part 4 · Watch it build (about 35 minutes, live on a real repository)",
        points: [
          "Build the wireframe",
          "Build the physical data model, and approve it before it is applied",
          "Build the production product, milestone by milestone",
          "Build the admin panel",
          "Commit after every step, review what the AI changed, test before saying \"done\"",
        ],
      },
      {
        title: "Part 5 · Guardrails and next steps (about 20 minutes)",
        points: [
          "Five ways vibe-coded projects fail: scope creep, invented rules, unverified claims, secrets pasted into chat, no version control",
          "What comes after: testing, security, deployment, running it (covered in the 2-day programme)",
          "Your Starter Kit: the eight templates, constitution template, prompt sheet, tool and cost sheet",
          "The 30-day capstone challenge",
        ],
      },
      {
        title: "Optional hands-on (30 minutes)",
        points: ["Write your own Vision.md with AI, and generate the wireframe prompt from it"],
      },
    ],
    // Participant numbers 2026-09-26 (founder): live online is sold per
    // seat; the in-person half day needs a minimum of 25 participants and
    // is costed separately. `bestFor`/`schedule` were adjusted so they do
    // not contradict `paceNotes`.
    deliveryFormats: [
      {
        name: "Half-day workshop",
        badge: "Face-to-face",
        duration: "3.5–4 hours",
        schedule: "One afternoon, on site — minimum 25 participants",
        totalTime: "Up to 4 hours",
        bestFor: [
          "Corporate and private cohorts of 25 or more, on site",
          "Teams who want the hands-on option in one room",
          "People who learn best in a room with the trainer",
        ],
      },
      {
        name: "Live online",
        duration: "3.5–4 hours",
        schedule: "One session — individual seats",
        totalTime: "Up to 4 hours",
        bestFor: [
          "Individuals — priced per person",
          "Participants outside Kuala Lumpur or outside Malaysia",
          "Distributed teams who want the same agenda without travelling",
        ],
      },
    ],
    paceNotes: [
      "Live online — individual seats, priced per person",
      "In-person half-day workshop — minimum 25 participants; cost discussed separately",
    ],
    methodology: {
      name: "The Vibe Coding Method",
      steps: [
        { title: "Vision", body: "What you are building, for whom, and why — on one page." },
        { title: "BRD", body: "The business requirements: what the product must achieve." },
        { title: "FSD", body: "The functional specification: what each screen and rule does." },
        { title: "HLD", body: "The high-level design: the parts and how they connect." },
        { title: "LLD", body: "The low-level design: the data model and the details the AI builds from." },
        { title: "Project Plan / WBS", body: "The work broken down and sequenced into milestones." },
        { title: "TechStack", body: "One choice per layer — front end, back end, database, hosting." },
        { title: "GuardRails", body: "The constitution: the rules the AI must never break." },
      ],
    },
    // `included` removed 2026-09-26 (founder: no "Included" list); what a
    // participant takes away is stated once, in `whatYouGet`.
    whatYouGet: [
      "A Certificate of Completion with a unique ID and public verification page",
      "Course material — a hard copy when you attend in person, a soft copy when you attend online",
      "The Vibe Coding Starter Kit (templates, constitution, prompt sheet, tool and cost sheet, capstone challenge)",
    ],
    pedagogy: {
      intro:
        "Live demonstrations on a real repository the trainer owns — never slides alone. Participants prompt along on their own laptops, and the optional last half hour is their own first document.",
      methods: [
        "Live demos on a real repository",
        "Two short prompt exercises",
        "An agent and a skill made in front of you",
        "The build sequence run end to end",
        "Your own Vision.md and wireframe prompt (hands-on option)",
        "A starter kit to continue with the next day",
      ],
    },
    faq: [
      {
        q: "Do I need to be able to code?",
        a: "No. The session is designed for people with no coding background. If you already code, the method makes you faster and more reliable — it does not start you over.",
      },
      {
        q: "What do I bring?",
        a: "A laptop and one AI account — a free tier is enough. A GitHub account is optional but useful for the hands-on part.",
      },
      {
        q: "Is this the same as the 2-day Data Blueprint & AI/Vibe Coding training?",
        a: "It is the vibe-coding half of it, taught on its own. The 2-day training adds the data foundations and a full hands-on build, test and deploy of a product. This session shows the method and starts it.",
      },
      {
        q: "Do I get a certificate?",
        a: "Yes — a Certificate of Completion for this training, issued on attending the full session. It names this training, so it cannot be mistaken for the 2-day one.",
      },
      {
        q: "Can I take the 2-day training afterwards?",
        a: "Yes. The module titles here are reused there, so you will recognise the ground you have covered. Talk to us about dates and how this session counts towards it.",
      },
    ],
    // Founder's figures 2026-09-26 (second round): today's price is 75% off
    // the original — Malaysia RM 500 (was RM 2,000), Pakistan Rs 5,000 (was
    // Rs 20,000), International USD 200 (was USD 800; the founder typed
    // "RM200" under USD — read as USD 200, to confirm). Supersedes the
    // earlier undiscounted RM 100 / Rs 5,000 / USD 1,000.
    pricing: {
      malaysia: { original: "RM 2,000", discount: "75% OFF", save: "RM 1,500", today: "RM 500" },
      pakistan: { original: "Rs. 20,000", discount: "75% OFF", save: "Rs. 15,000", today: "Rs. 5,000" },
      international: { original: "USD 800", discount: "75% OFF", save: "USD 600", today: "USD 200" },
    },
    regionalPricing: {
      malaysia: { note: "Online training price. In-person training needs a minimum of 25 participants; cost discussed separately." },
      international: { note: "Online training price. In-person training needs a minimum of 25 participants; cost discussed separately." },
    },
    related: ["data-blueprint-ai-vibe-coding"],
  },

  /* ------------------------------------------------------------------ */
  // Slug and title renamed 2026-09-26 (founder): was
  // `ai-powered-product-development` / "AI-Powered Product Development".
  // prisma/seed.ts renames the existing row in place so its id is kept.
  {
    slug: "data-blueprint-ai-vibe-coding",
    title: "Data Blueprint & AI/Vibe Coding",
    subtitle: "Data foundations plus building real products with AI, in two days",
    level: "Builder",
    flagship: true,
    duration: "2 days – 4 weeks",
    prerequisites: "None",
    formats: ["Bootcamp", "Accelerator", "Mastery"],
    certificate: "Certificate of participation",
    audienceSummary: "Entrepreneurs, builders, innovators",
    summary:
      "Transform ideas into working apps, MVPs and portfolio projects using AI-assisted development, PromptOS and trusted data foundations — for freelance clients, corporate innovation, or your next startup.",
    valueProposition:
      "Not a traditional coding bootcamp. A hands-on product-building course — from idea validation to deployment — designed for builders who want results, not syntax drills.",
    highlights: [
      "Build AI-powered applications",
      "Explore freelance opportunities",
      "Create corporate solutions",
      "Launch startup MVPs",
      "Includes PromptOS Starter Edition",
      "Includes Data Blueprint Foundations",
    ],
    // "Who can take this training" — rewritten 2026-09-26 (founder change
    // list): professionals who want the data foundations AND to build with
    // AI; basic business or technology awareness helps; no coding required.
    // Rendered by FlagshipLanding.tsx (it no longer hardcodes its audience).
    whoShouldAttend: {
      intro:
        "For professionals who want the data foundations and to build with AI — not one without the other. Basic business or technology awareness helps; no coding is required.",
      roles: [
        "Business and data analysts",
        "Data and software engineers",
        "Product and innovation teams",
        "Entrepreneurs and startup founders",
        "Corporate cohorts and internal teams",
        "Professionals moving into data and AI work",
      ],
    },
    rationale: {
      heading: "After this course, you will be able to",
      paragraphs: [
        "Participants learn not only how to build applications using AI, but also how to ensure those applications are supported by trusted data, strong requirements, quality processes and real-world deployment practices.",
        "Unlike many AI development courses that focus only on coding tools, this course teaches a complete end-to-end approach to building production-ready AI solutions.",
      ],
      problems: [
        "Build AI-powered applications — websites, portals, dashboards, assistants and business applications",
        "Pursue freelance opportunities with portfolio projects and practical skills",
        "Create corporate solutions — internal apps, workflow automation, productivity tools",
        "Strengthen your professional portfolio with tangible projects",
        "Launch startup MVPs without traditional development timelines",
        "Apply AI development in real projects using frameworks, workflows and accelerators",
      ],
    },
    deliveryFormats: [
      {
        name: "Bootcamp",
        badge: "Most popular",
        duration: "2 days",
        schedule: "8 hours per day",
        totalTime: "16 hours",
        bestFor: [
          "Entrepreneurs and startup founders",
          "Corporate innovation teams",
          "Product managers",
          "Professionals seeking rapid results",
        ],
      },
      {
        name: "Accelerator",
        badge: "Best for working professionals",
        duration: "2 weeks",
        schedule: "10 working days · 2 hours per day",
        totalTime: "20 hours",
        bestFor: [
          "Working professionals",
          "Corporate teams",
          "Business analysts and product owners",
          "Teams needing time between sessions to practise",
        ],
      },
      {
        name: "Mastery",
        badge: "Best for beginners",
        duration: "4 weeks",
        schedule: "20 working days · 1 hour per day",
        totalTime: "20 hours",
        bestFor: [
          "Students and universities",
          "Beginners",
          "Career transitioners",
          "Long-term structured learning programmes",
        ],
      },
    ],
    // `included` removed 2026-09-26 (founder: no "Included" list).
    whatYouGet: [
      "A Certificate of Completion with a unique ID and public verification page",
      "Course material — a hard copy when you attend in person, a soft copy when you attend online",
    ],
    paceNotes: [
      "Malaysia — in person only, minimum 25 participants",
      "Outside Malaysia — online per person; in person from 100 participants, cost discussed separately",
      "Pakistan — in person from 100 participants, online from 10 participants, arranged through our local partner",
    ],
    outcomes: [
      "Transform ideas into product requirements",
      "Generate product specifications using AI",
      "Design user interfaces",
      "Create prototypes",
      "Build applications using AI-assisted development tools",
      "Test and improve solutions",
      "Deploy working applications",
      "Iterate and enhance products",
    ],
    modules: [
      {
        title: "AI-powered product development fundamentals",
        description:
          "Outcome: understand how AI is changing the way products are designed and delivered.",
        points: [
          "Traditional versus AI-assisted development",
          "What is vibe coding?",
          "Opportunities and limitations",
          "Product thinking",
          "AI-powered innovation",
        ],
      },
      /* Data Blueprint Foundations — 2026-09-07, founder direction: expanded
         from the single placeholder module above (now replaced) into nine
         modules, one per deck in the founder's own training archive
         (`My Training Material/`, decks numbered 1–9; see
         docs/course_landing_page.md §7 open item 1). Content is drawn from
         the decks' actual slide text — outcomes, terminology and case
         studies are the founder's own, not invented. Deck 7 has two files
         sharing that number: "DAC Architecture1.1.pptx" (2026, newest) and
         the older "Data Architecture.pptx" (2025) — the newer, more
         developed deck was used below; the older one appears superseded
         but wasn't confirmed as such, so it's flagged rather than
         discarded. See the completion report for this session for the
         full flag. */
      {
        title: "Decision support systems (DSS)",
        description:
          "Outcome: understand how organisations turn data into decisions, and the anatomy of a Decision Support System.",
        points: [
          "What a system is — people, process and technology working together",
          "OLTP vs OLAP — operational systems vs analytical systems",
          "Components of a Decision Support System",
          "Real-world DSS examples across banking, telecom, oil & gas and healthcare",
        ],
      },
      {
        title: "What is data",
        description:
          "Outcome: build data literacy from first principles — entities, attributes and how raw data becomes insight.",
        points: [
          "Entities, attributes and instances",
          "Tables, columns and rows",
          "States and types of data",
          "The DIKW pyramid — Data, Information, Knowledge, Wisdom",
          "Best practices and guidelines for working with data",
        ],
      },
      {
        title: "What is metadata",
        description:
          "Outcome: understand metadata as the layer that gives data meaning, trust and usability.",
        points: [
          "Business, technical and operational metadata",
          "Data assets, and why metadata unlocks their value",
          "Case studies — banking, telecom, oil & gas and retail",
          "The cost of inaction: what happens without metadata",
        ],
      },
      {
        title: "Building blocks of data",
        description:
          "Outcome: understand the four building blocks every enterprise depends on, and how they work together.",
        points: [
          "Master data — stable, reusable core entities",
          "Reference data — codes, classifications and standardisation",
          "Transactional data — high-volume business events",
          "Case studies — banking, telecommunications, oil & gas and healthcare",
        ],
      },
      {
        title: "Data modelling",
        description:
          "Outcome: navigate the full modelling landscape, from business concepts through to physical, AI-ready design.",
        points: [
          "Business, conceptual and information modelling (NIAM, ORM, FCO-IM, ontologies, knowledge graphs)",
          "Conceptual, logical and physical data modelling, including normalisation (1NF–6NF, BCNF, DKNF)",
          "Specialised techniques — dimensional, Data Vault, Anchor, Focal Point, NoSQL, temporal, event-driven",
          "Governance and AI extensions — metadata modelling, access control, ML feature modelling",
        ],
      },
      {
        title: "Data processing & storage",
        description:
          "Outcome: understand how data is stored and processed at scale, and which pattern fits which workload.",
        points: [
          "Data warehouse, data lake, lakehouse, data hub and data fabric",
          "Relational vs NoSQL — key-value, document, columnar and graph databases",
          "Specialised datastores — Hadoop, object storage, file and table formats",
        ],
      },
      {
        title: "DAC Architecture",
        description:
          "Outcome: apply the founder's own DAC (Data & AI Cognitive) Architecture framework to modern data platform design.",
        points: [
          "Why traditional architecture fails, and the cost of architectural drift",
          "Operating models — centralised, decentralised, data mesh, data hub, data fabric",
          "DAC's design principles, layers and \"one door in, one window out\" integration",
          "Traditional architecture vs DAC — what changes and why",
        ],
      },
      {
        title: "Data governance, security, privacy & quality",
        description:
          "Outcome: understand the four pillars of trust in enterprise data, and the roles that keep them working.",
        points: [
          "Data governance — ownership, stewardship, policies and decision rights",
          "Security vs privacy — the CIA triad and responsible data use",
          "The six dimensions of data quality",
          "The real cost of getting any one pillar wrong",
        ],
      },
      {
        title: "Agentic AI",
        description:
          "Outcome: understand what agentic AI actually is, why many projects get scrapped, and where it creates real business value.",
        points: [
          "The evolution of AI, and the current reality of agentic AI adoption",
          "Core agent types and how agentic AI works",
          "The PVP (Productionizable Viable Product) approach",
          "Real business use cases — HR onboarding, meeting automation, policy discovery",
        ],
      },
      {
        title: "Product discovery & validation",
        description: "Outcome: transform ideas into validated product opportunities.",
        points: [
          "Problem identification",
          "Opportunity discovery",
          "User personas",
          "Customer journeys",
          "Product vision",
          "Value proposition design",
        ],
      },
      {
        title: "AI-assisted requirements engineering",
        description:
          "Outcome: create structured requirements faster using AI-powered approaches.",
        points: [
          "Product requirements documents (PRD)",
          "Functional and non-functional requirements",
          "User stories",
          "Acceptance criteria",
          "AI-assisted documentation",
        ],
      },
      {
        title: "Prompt engineering & PromptOS",
        description:
          "Outcome: learn how to consistently generate better outputs from AI tools.",
        points: [
          "Prompt engineering principles",
          "Structured prompt design",
          "Context management",
          "Iterative refinement",
          "The PromptOS framework",
          "Reusable prompt libraries",
        ],
      },
      {
        title: "Rapid application development",
        description: "Outcome: create functional applications significantly faster.",
        points: [
          "User interface generation",
          "Workflow design",
          "AI-assisted development",
          "Low-code and AI-assisted approaches",
          "Building working prototypes",
        ],
      },
      {
        title: "Quality engineering & testing",
        description: "Outcome: improve reliability and quality before deployment.",
        points: [
          "Test planning",
          "AI-assisted testing",
          "User acceptance testing",
          "Data quality validation",
          "Product review frameworks",
        ],
      },
      {
        title: "Deployment & production readiness",
        description: "Outcome: prepare solutions for real-world adoption.",
        points: [
          "Deployment fundamentals",
          "Security awareness",
          "Governance considerations",
          "Operational readiness",
          "Production best practices",
        ],
      },
      {
        title: "Capstone project",
        description:
          "Participants apply the complete framework to build a practical AI-powered solution and leave with real-world experience.",
        points: [
          "Internal business applications",
          "Knowledge management systems",
          "AI assistants",
          "Workflow automation solutions",
          "Customer portals",
          "Startup MVPs",
        ],
      },
    ],
    methodology: {
      name: "Your learning journey",
      steps: [
        { title: "Idea", body: "Start from a real problem worth solving." },
        { title: "Data foundations", body: "Trusted, governed data underneath." },
        { title: "Product discovery", body: "Validate the opportunity." },
        { title: "Requirements", body: "Structure what you are building." },
        { title: "PromptOS", body: "Consistent, reusable AI outputs." },
        { title: "Build", body: "AI-assisted rapid development." },
        { title: "Test", body: "Quality before deployment." },
        { title: "Deploy", body: "Production readiness and adoption." },
      ],
    },
    benefits: {
      intro: "Organisations that invest in AI-powered product development can:",
      items: [
        "Accelerate innovation",
        "Reduce development cycles",
        "Improve idea validation",
        "Increase productivity",
        "Enable citizen development",
        "Improve business agility",
        "Reduce time-to-market",
      ],
    },
    // Prices 2026-09-26 (founder change list): today's figures are the
    // founder's — Malaysia RM 4,999, International USD 1,999, Pakistan
    // Rs 99,999 online / Rs 199,999 in person — shown as 75% off. The
    // ORIGINALS (RM 19,999 / USD 7,999 / Rs 399,999 / Rs 799,999) were set
    // by the orchestrator to make 75% arithmetic exact — FOUNDER TO CONFIRM.
    // History: 2026-09-06 Malaysia was RM 9,999 → RM 4,999 (50% OFF);
    // Pakistan Rs. 342,799.53 → Rs. 102,839.86 (70% OFF); International
    // USD 3,124 → USD 2,811 (10% OFF).
    // `programme_prices` keeps ONE Pakistan row — the ONLINE figure; the
    // in-person figure is display-only in `regionalPricing.pakistan.options`.
    // `valueStack` / `valueStackTotal` removed (founder: no value stack).
    pricing: {
      malaysia: { original: "RM 19,999", discount: "75% OFF", save: "RM 15,000", today: "RM 4,999" },
      pakistan: { original: "Rs. 399,999", discount: "75% OFF", save: "Rs. 300,000", today: "Rs. 99,999" },
      international: { original: "USD 7,999", discount: "75% OFF", save: "USD 6,000", today: "USD 1,999" },
    },
    regionalPricing: {
      malaysia: { note: "In-person training price. Minimum 25 participants. There is no online option for this training in Malaysia." },
      international: { note: "Online training price. In-person training needs a minimum of 100 participants; cost discussed separately." },
      pakistan: {
        options: [
          { label: "In-person", original: "Rs. 799,999", today: "Rs. 199,999", minParticipants: 100 },
          { label: "Online", original: "Rs. 399,999", today: "Rs. 99,999", minParticipants: 10 },
        ],
      },
    },
    related: ["data-blueprint", "agentic-ai-strategy-adoption"],
    externalResources: [
      {
        label: "AI-Powered Consulting",
        url: "https://yourpartnertechnologies.com/ai-powered-consulting.html",
        description: "When you would rather have the product built for you",
      },
    ],
  },

  /* ------------------------------------------------------------------ */
  {
    slug: "data-ai-career-mentorship",
    title: "Data & AI Career Mentorship",
    subtitle: "Because your career deserves more than a generic training course",
    level: "Mentorship",
    duration: "Flexible engagement",
    prerequisites: "None",
    formats: ["One-to-one", "Live online"],
    certificate: "Not a certificated course",
    audienceSummary: "Aspiring and experienced data & AI professionals",
    summary:
      "Personalised one-to-one mentorship tailored to your experience, aspirations, strengths and challenges — defining your destination, identifying the gaps, and building a practical roadmap.",
    valueProposition:
      "Training teaches everyone the same thing. Mentorship builds a strategy for your career.",
    highlights: [
      "Built around you — not a fixed curriculum",
      "Career strategy: direction, decisions, accountability",
      "Practitioner-led",
      "Roadmap and reviews — CV, LinkedIn, interviews, growth",
    ],
    whoShouldAttend: {
      intro:
        "Real professional personas — if you recognise yourself here, mentorship can accelerate your next move.",
      roles: [
        "The ambitious graduate — potential but no roadmap",
        "The stuck analyst or engineer — delivering well, no clear path up",
        "The career changer — moving into data or AI credibly",
        "The aspiring architect — strong technically, unsure how to operate at enterprise level",
        "The future leader — ready to lead but needing executive positioning",
        "The independent professional — building a consulting or freelance practice",
      ],
    },
    rationale: {
      heading: "Are you learning the right things — or just learning more?",
      paragraphs: [
        "Many talented data & AI professionals stall not because they lack ability, but because they lack direction. Training answers “what is Spark?” — a technology explanation, the same for every participant. Mentorship answers “should you invest six months learning Spark?” — a career decision, personalised to your goals, role and market.",
        "Knowledge is important. Direction is transformational.",
      ],
      problems: [
        "Which career path to pursue",
        "What skills to learn next",
        "Which certifications actually matter",
        "Whether to specialise or broaden",
        "How to transition into AI",
        "How to become an architect",
        "How to move into leadership",
        "How to position yourself in the job market",
      ],
    },
    careerPaths: [
      {
        from: "Graduate",
        to: "Entering data & AI",
        challenge: "Overwhelmed by options; no clear first role or learning sequence.",
        helps:
          "Build a realistic entry roadmap, prioritise skills, and avoid years of random learning.",
      },
      {
        from: "Database administrator",
        to: "Data engineer",
        challenge: "Breaking away from operational DBA work into modern engineering.",
        helps:
          "Build cloud, Python and data engineering skills with a realistic transition roadmap.",
      },
      {
        from: "BI developer",
        to: "Analytics engineer",
        challenge:
          "Moving from reports and dashboards to modern analytics engineering stacks.",
        helps:
          "Map the skills gap between BI tooling and dbt, SQL and cloud analytics platforms.",
      },
      {
        from: "Data engineer",
        to: "Data architect",
        challenge: "Elevating from building pipelines to designing enterprise platforms.",
        helps:
          "Develop architectural thinking, stakeholder communication and platform design credibility.",
      },
      {
        from: "Software engineer",
        to: "AI / ML engineer",
        challenge:
          "Pivoting engineering skills into AI without a clear learning or positioning strategy.",
        helps:
          "Prioritise AI skills, build a credible portfolio, and target the right roles.",
      },
      {
        from: "Data scientist",
        to: "Data science leader",
        challenge:
          "Moving from individual contributor to leading teams and influencing strategy.",
        helps:
          "Build leadership presence, team management skills and executive communication.",
      },
      {
        from: "Senior practitioner",
        to: "Head of data",
        challenge:
          "Transitioning from technical depth to organisational leadership and strategy.",
        helps:
          "Develop executive positioning, stakeholder management and function-building strategy.",
      },
      {
        from: "Employed professional",
        to: "Independent consultant",
        challenge:
          "Building credibility, finding clients, and creating sustainable independent income.",
        helps:
          "Define your niche, build a personal brand, and create a viable consulting practice.",
      },
    ],
    methodology: {
      name: "The Career Acceleration Framework",
      steps: [
        {
          title: "Discover",
          body: "Understand your background, aspirations, and the career questions that matter most to you.",
        },
        {
          title: "Assess",
          body: "Evaluate your skills, experience, CV, LinkedIn and portfolio against your target role.",
        },
        {
          title: "Strategise",
          body: "Define your career vision, identify gaps, and build a personalised roadmap with clear priorities.",
        },
        {
          title: "Build",
          body: "Focus on the right skills, certifications and projects — not everything at once.",
        },
        {
          title: "Position",
          body: "Strengthen your CV, LinkedIn, portfolio and professional brand for the market you are targeting.",
        },
        {
          title: "Accelerate",
          body: "Execute your transition with interview preparation, networking strategy and ongoing accountability.",
        },
      ],
    },
    outcomes: [
      "Personalised career blueprint",
      "12-month career roadmap",
      "Technical skills roadmap",
      "Certification strategy",
      "CV review",
      "LinkedIn optimisation guidance",
      "Portfolio improvement plan",
      "Interview preparation strategy",
      "Networking strategy",
      "Long-term growth plan",
    ],
    modules: [
      {
        title: "Career assessment",
        description:
          "Every engagement begins with a structured career assessment to determine whether ongoing mentorship is the right fit. Low commitment, high clarity.",
        points: [
          "Review of current experience",
          "Career aspirations discussion",
          "Technical skills assessment",
          "Skills gap analysis",
          "CV, LinkedIn and portfolio review",
          "Target role and market discussion",
        ],
      },
      {
        title: "Career vision & roadmap",
        description:
          "Define where you are going and the practical route to get there.",
        points: [
          "Career vision definition",
          "Personalised roadmap creation",
          "Learning priorities",
        ],
      },
      {
        title: "Focused learning & portfolio",
        description:
          "Build the right skills and the evidence that demonstrates them.",
        points: [
          "Technical learning path",
          "Portfolio development",
          "Certification strategy",
        ],
      },
      {
        title: "Positioning & transition",
        description:
          "Present yourself credibly to the market you are actually targeting.",
        points: [
          "LinkedIn optimisation",
          "Interview preparation",
          "Networking strategy",
          "Ongoing accountability",
        ],
      },
    ],
    benefits: {
      intro: "Common career mistakes this mentorship helps you avoid:",
      items: [
        "Learning every technology without a strategy",
        "Collecting certifications that employers do not value",
        "Following generic online roadmaps",
        "Delaying specialisation",
        "Ignoring LinkedIn and personal branding",
        "Applying for jobs without understanding expectations",
        "Staying in the wrong role for years",
        "Focusing only on salary instead of long-term growth",
      ],
    },
    related: ["data-blueprint", "enterprise-data-architecture"],
  },
];

/** The progression published on the source overview page. Foundation →
 *  Practitioner → Architect → Builder, with Executive and Mentorship as
 *  deliberately parallel tracks (not steps in the same ladder). */
export const learningPathway: {
  stage: string;
  level: CourseLevel;
  slugs: string[];
  parallel?: boolean;
  note?: string;
}[] = [
  { stage: "Start here", level: "Foundation", slugs: ["data-ai-essentials"] },
  { stage: "Build the whole picture", level: "Practitioner", slugs: ["data-blueprint"] },
  {
    stage: "Specialise",
    level: "Architect",
    slugs: ["enterprise-data-modelling", "enterprise-data-architecture"],
  },
  {
    stage: "Build products",
    level: "Builder",
    slugs: ["learn-vibe-coding", "data-blueprint-ai-vibe-coding"],
  },
  {
    stage: "Leadership track",
    level: "Executive",
    slugs: ["agentic-ai-strategy-adoption"],
    parallel: true,
    note: "Runs in parallel — for leaders making adoption decisions rather than building.",
  },
  {
    stage: "Mentorship track",
    level: "Mentorship",
    slugs: ["data-ai-career-mentorship"],
    parallel: true,
    note: "Runs in parallel at any stage — one-to-one career direction rather than curriculum.",
  },
];

export function getCourse(slug: string) {
  return courses.find((p) => p.slug === slug);
}
