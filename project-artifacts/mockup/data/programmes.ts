/**
 * Programme catalogue — migrated 2026-08-31 from the founder's existing
 * training ecosystem at yourpartnertechnologies.com/trainings.html and its
 * seven programme subpages (confirmed complete against that site's
 * sitemap.xml). This is real, previously authored content: programme
 * names, audiences, learning outcomes, curricula, pedagogy and the
 * progression between programmes are preserved as written, lightly edited
 * only for house style (en-GB, "programme", sentence case).
 *
 * PRICING — migrated 2026-09-01 at the founder's explicit direction.
 * The figures live in the source site's `js/main.min.js`
 * (TRAINING_INVESTMENT_DATA + buildMentorshipInvestmentRegions) and are
 * injected client-side, which is why a first static-HTML pass missed five
 * of the seven programmes. All three published regions are carried, with
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
 *   be invented (DR-02 §4.1). Programmes are the *proposition* layer;
 *   scheduled offerings (format · date · location · capacity) remain
 *   State A until real ones exist. This keeps the programmes-vs-offerings
 *   emphasis (HO-1) genuinely open.
 * - Certification claims beyond what the source states. The source offers
 *   a "Certificate of Participation" per programme — that is recorded as
 *   `certificate` and must never be conflated with the Academy credential,
 *   which is earned through assessed applied work (OQ-21 boundary).
 *
 * Adding a programme is a data operation: every page maps over this file.
 */

export type ProgrammeLevel =
  | "Foundation"
  | "Practitioner"
  | "Architect"
  | "Executive"
  | "Builder"
  | "Mentorship";

export type RegionKey = "malaysia" | "pakistan" | "international";

/** One region's published price for one programme (or mentorship package). */
export type RegionPrice = {
  original: string;
  discount: string;
  save: string;
  today: string;
};

export type ProgrammePricing = Record<RegionKey, RegionPrice>;

/** Region metadata exactly as published on the source site. */
export const pricingRegions: {
  key: RegionKey;
  label: string;
  /** Compact code for space-constrained price lists (cards, meta strips).
   *  Added 2026-09-02 when the programmes hub began showing all three
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
    subtitle: "Founder's launch offer",
    badge: "Save up to 50%",
    discountLabel: "Discount",
  },
  {
    key: "pakistan",
    label: "Pakistan",
    short: "PK",
    subtitle: "Regional scholarship programme",
    badge: "Regional scholarship",
    discountLabel: "Scholarship",
  },
  {
    key: "international",
    label: "International",
    short: "INT",
    subtitle: "Global professional pricing",
    badge: "Global launch offer",
    discountLabel: "Discount",
  },
];

/** Mentorship uses different discount rates from the training programmes
 *  (20/30/10 rather than 50/70/10), so its region badges differ. */
export const mentorshipRegionBadges: Record<RegionKey, string> = {
  malaysia: "Save up to 20%",
  pakistan: "Regional scholarship — save 30%",
  international: "Global launch offer — save 10%",
};

/** Mentorship is priced per package rather than per programme. */
export type MentorshipPackage = {
  id: string;
  badge: string;
  name: string;
  duration: string;
  idealFor: string;
  includesLead?: string;
  includes: string[];
  featured?: boolean;
  pricing: ProgrammePricing;
};

export const mentorshipPackages: MentorshipPackage[] = [
  {
    id: "career-assessment",
    badge: "Start here",
    name: "Career Assessment",
    duration: "90–120 minutes",
    idealFor:
      "Professionals who want expert career guidance before committing to a longer mentorship programme.",
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

export type Programme = {
  slug: string;
  title: string;
  /** Short line under the title on the detail hero. */
  subtitle: string;
  level: ProgrammeLevel;
  /** Marks the founder's designated flagship programme. */
  flagship?: boolean;
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
  /** "Why this matters" — the argument for the programme. */
  rationale: {
    heading: string;
    paragraphs: string[];
    /** Bulleted problems the programme addresses. */
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
  /** Career-path transitions — mentorship programme only. */
  careerPaths?: { from: string; to: string; challenge: string; helps: string }[];
  /** Named methodology stages, where the source publishes one. */
  methodology?: { name: string; steps: { title: string; body: string }[] };
  /** Published per-region pricing. Absent on the mentorship programme,
   *  which is priced per package (see `mentorshipPackages`). */
  pricing?: ProgrammePricing;
  /** Value-stack breakdown, where the source publishes one. */
  valueStack?: { item: string; value: string }[];
  valueStackTotal?: string;
  /** Slugs of related programmes, from the source's own cross-links. */
  related: string[];
  /** Genuinely external resources — YPT service pages with no Academy
   *  equivalent. Internal training links were migrated to portal routes. */
  externalResources?: { label: string; url: string; description: string }[];
};

export const programmeLevels: {
  level: ProgrammeLevel;
  description: string;
}[] = [
  { level: "Foundation", description: "Shared language for working with data and AI" },
  { level: "Practitioner", description: "The whole enterprise data picture" },
  { level: "Architect", description: "Designing models and platforms" },
  { level: "Executive", description: "Strategy, governance and adoption decisions" },
  { level: "Builder", description: "Building real products with AI" },
  { level: "Mentorship", description: "One-to-one career direction" },
];

export const programmes: Programme[] = [
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
      "Understand modern data and AI concepts and their business applications — the starting point before advancing to practitioner and leadership programmes.",
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
        "This programme bridges that gap by providing a practical understanding of how data and AI work together to support business decisions, innovation and digital transformation. Participants gain the confidence to engage with data engineers, scientists, architects and AI teams using shared language.",
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
        "This programme provides a practical roadmap for the questions leaders actually have to answer.",
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
        "Most AI training focuses on tools, prompts, chatbots and technical implementation. This programme focuses on the decisions leaders own:",
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
    related: ["data-ai-essentials", "ai-powered-product-development"],
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
  {
    slug: "ai-powered-product-development",
    title: "AI-Powered Product Development",
    subtitle: "Build real applications faster with AI (vibe coding)",
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
      "Not a traditional coding bootcamp. A hands-on product-building programme — from idea validation to deployment — designed for builders who want results, not syntax drills.",
    highlights: [
      "Build AI-powered applications",
      "Explore freelance opportunities",
      "Create corporate solutions",
      "Launch startup MVPs",
      "Includes PromptOS Starter Edition",
      "Includes Data Blueprint Foundations",
    ],
    whoShouldAttend: {
      intro:
        "Hands-on training for entrepreneurs, startup founders, product managers, citizen developers and corporate innovation teams.",
      roles: [
        "Entrepreneurs",
        "Startup founders",
        "Product managers",
        "Citizen developers",
        "Innovation teams",
        "Business analysts",
        "Product owners",
        "Career transitioners",
      ],
    },
    rationale: {
      heading: "After this programme, you will be able to",
      paragraphs: [
        "Participants learn not only how to build applications using AI, but also how to ensure those applications are supported by trusted data, strong requirements, quality processes and real-world deployment practices.",
        "Unlike many AI development courses that focus only on coding tools, this programme teaches a complete end-to-end approach to building production-ready AI solutions.",
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
    included: [
      "AI-Powered Product Development training",
      "PromptOS Starter Edition",
      "Data Blueprint Foundations module",
      "Product development templates",
      "Prompt libraries",
      "Capstone project",
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
      {
        title: "Data foundations for AI product builders",
        description:
          "Built on Data Blueprint Foundations™. Outcome: understand why successful AI products depend on trusted, governed, high-quality data.",
        points: [
          "Data fundamentals",
          "Structured versus unstructured data",
          "Metadata awareness",
          "Data quality fundamentals",
          "Data governance essentials",
          "Privacy and security awareness",
          "AI-ready data thinking",
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
    pricing: {
      malaysia: { original: "RM 4,998", discount: "50% OFF", save: "RM 2,499", today: "RM 2,499" },
      pakistan: { original: "Rs. 342,799.53", discount: "70% OFF", save: "Rs. 239,959.67", today: "Rs. 102,839.86" },
      international: { original: "USD 3,124", discount: "10% OFF", save: "USD 313", today: "USD 2,811" },
    },
    valueStack: [
      { item: "AI-Powered Product Development training", value: "RM 4,998" },
      { item: "PromptOS Starter Edition", value: "RM 1,500+" },
      { item: "Data Blueprint Foundations module", value: "RM 1,499" },
      { item: "Product development templates", value: "RM 500+" },
      { item: "Prompt engineering library", value: "RM 500+" },
      { item: "Capstone project assets", value: "RM 500+" },
      { item: "Certificate of participation", value: "Included" },
    ],
    valueStackTotal: "RM 9,497+",
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
    certificate: "Not a certificated programme",
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
  level: ProgrammeLevel;
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
    slugs: ["ai-powered-product-development"],
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

export function getProgramme(slug: string) {
  return programmes.find((p) => p.slug === slug);
}
