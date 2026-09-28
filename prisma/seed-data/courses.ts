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

/** The fee rows (M12 WP1, founder 2026-09-26): Malaysia via HRD Corp ·
 *  Malaysia not via HRD Corp (`malaysia`, the card price) · Pakistan ·
 *  Rest of the world (`international`). Mirrors `PriceRegion`. */
export type RegionKey = "malaysia" | "malaysia_hrdcorp" | "pakistan" | "international";
/** The three regions a participant can be assigned at checkout — also the
 *  mentorship packages' tabs. */
export type CheckoutRegionKey = Exclude<RegionKey, "malaysia_hrdcorp">;

/** One region's published price for one course (or mentorship package). */
export type RegionPrice = {
  original: string;
  discount: string;
  save: string;
  today: string;
  /** "minimum N participants" — persisted as `programme_prices.min_participants`. */
  minParticipants?: number;
  /** Note under the figure — persisted as `programme_prices.note`. */
  note?: string;
};

/** Three rows every priced course has, plus the HRD Corp row where the
 *  founder has published one (the flagship). The admin Fees screen (M12
 *  WP2) edits all four from then on; this file is the initial import. */
export type CoursePricing = Record<CheckoutRegionKey, RegionPrice> & { malaysia_hrdcorp?: RegionPrice };

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
    key: "malaysia_hrdcorp",
    label: "Malaysia — via HRD Corp",
    short: "MY·HRD",
    subtitle: "Claimed through your employer under HRD Corp",
    badge: "HRD Corp claimable",
    discountLabel: "Discount",
  },
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
    // Renamed from "International" 2026-09-26 (M12 L12, founder's wording).
    key: "international",
    label: "Rest of the world",
    short: "RoW",
    subtitle: "Card payment in USD",
    badge: "75% launch discount",
    discountLabel: "Discount",
  },
];

/** Mentorship uses different discount rates from the training courses
 *  (20/30/10 rather than 50/70/10), so its region badges differ. */
export const mentorshipRegionBadges: Record<CheckoutRegionKey, string> = {
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

/** One entry of a module's `points`: a plain sub-topic, or — since
 *  2026-09-26 (the flagship's two-module curriculum) — a GROUP with its own
 *  title, optional description and list. Persisted as-is into the existing
 *  `programme_modules.points` JSON column; no schema change. Mirrors
 *  `ModulePoint` in src/modules/catalogue/programmes/types.ts. */
export type CourseModulePoint = string | { title: string; description?: string; points?: string[] };

export type CourseModule = { title: string; description?: string; points?: CourseModulePoint[] };

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
  modules: CourseModule[];
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
  /* `regionalPricing` (notes + "Via / Without HRD Corp" options, 2026-09-26)
   * was retired by M12 WP1 the same day: each figure, minimum and note is
   * now its own `pricing` row (`RegionPrice.minParticipants` / `.note`). */
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

/* Learn Vibe Coding — the SIX curriculum modules, in one place.
 * Used by the `learn-vibe-coding` entry's `modules` AND, verbatim, as the
 * groups inside the flagship's "Module 2 · Learn Vibe Coding" (founder,
 * 2026-09-26: "Our other training Learn Vibe Coding is the last module of
 * this training … Module 2: copy-paste the Learn Vibe Coding curriculum").
 * Keeping one constant means the two curricula can never drift; edit the
 * points HERE and both programmes follow on the next seed.
 * Module points are the founder's list VERBATIM (chat, 2026-09-26),
 * asterisks removed; the parenthesised minutes are the founder's too. */
export const LEARN_VIBE_CODING_MODULES: { title: string; points: string[] }[] = [
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
];

export const courses: Course[] = [

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
    // Modules: the shared constant `LEARN_VIBE_CODING_MODULES` (top of this
    // file) — the flagship's Module 2 reuses it verbatim, so the two can
    // never drift.
    modules: LEARN_VIBE_CODING_MODULES,
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
    // M12 WP1 (2026-09-26, later): the per-region notes moved from the
    // retired `regionalPricing` block onto the rows themselves. No HRD Corp
    // row has been published for this training yet — the admin Fees screen
    // adds it when the founder sets one.
    pricing: {
      malaysia: {
        original: "RM 2,000",
        discount: "75% OFF",
        save: "RM 1,500",
        today: "RM 500",
        note: "Online training price. In-person training needs a minimum of 25 participants; cost discussed separately.",
      },
      pakistan: { original: "Rs. 20,000", discount: "75% OFF", save: "Rs. 15,000", today: "Rs. 5,000" },
      international: {
        original: "USD 800",
        discount: "75% OFF",
        save: "USD 600",
        today: "USD 200",
        note: "Online training price. In-person training needs a minimum of 25 participants; cost discussed separately.",
      },
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
    // 2026-09-26 (founder: "the training is 2 days"); was "2 days – 4 weeks".
    // The three delivery formats below keep their own durations.
    duration: "2 days",
    prerequisites: "None",
    formats: ["Bootcamp", "Accelerator", "Mastery"],
    // M6 decision E1 (Certificate of Completion replaces "participation"),
    // applied to this entry 2026-09-26 with the two-module rewrite.
    certificate: "Certificate of Completion",
    audienceSummary: "Entrepreneurs, builders, innovators",
    // REWRITTEN 2026-09-26 (founder: two modules — Data Blueprint, then the
    // Learn Vibe Coding masterclass; fill the page with "Why you need this
    // training", freelancing, standard sections and a CTA; the page now
    // renders on the same template as every training, the bespoke landing
    // having been retired). Copy that named PromptOS or the retired modules
    // 11–17 is gone; the landing's "a method, not a course" framing and its
    // plan → build → test → deploy → improve loop live in `rationale` and
    // `methodology` below.
    summary:
      "Two days, one method: the data foundations every AI-era builder needs, then the Learn Vibe Coding masterclass in full and hands-on build time — working apps, MVPs and portfolio projects for freelance clients, corporate innovation, or your next startup.",
    valueProposition:
      "Not a traditional coding bootcamp, and not a prompt trick. Two days that give you trusted data foundations and a method for building real products with AI — for builders who want results, not syntax drills.",
    relationshipNote:
      "Module 2 of this training is our standalone Learn Vibe Coding masterclass — if you already know your data foundations, you can take that on its own.",
    highlights: [
      "Build AI-powered applications",
      "Explore freelance opportunities",
      "Create corporate solutions",
      "Launch startup MVPs",
      "Module 1 · Data Blueprint — ten data-foundations topics in one day",
      "Module 2 · the full Learn Vibe Coding masterclass, then build time on your own idea",
    ],
    // "Who can take this training" — rewritten 2026-09-26 (founder change
    // list): professionals who want the data foundations AND to build with
    // AI; basic business or technology awareness helps; no coding required.
    // Rendered by the shared training template (app/(public)/programs/[slug]/page.tsx).
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
      heading: "Why you need this training",
      paragraphs: [
        "Software is now built by directing AI — and the products that hold up are the ones built on data that is understood, modelled and governed. Most people learn only one half. They know their data but cannot build, or they can prompt an AI into a demo that falls apart the moment a real dataset, a real business rule or a real user arrives.",
        "This training teaches both halves, in the order they belong. Day 1 is the Data Blueprint: decision support systems, what data and metadata are, the building blocks, modelling, processing and storage, architecture, governance and agentic AI. Day 2 is the Learn Vibe Coding masterclass in full — the eight documents, the guardrails and the build sequence, shown live on a real repository — followed by hands-on time on your own idea.",
        "It is a method, not a course of slides: plan, build, test, deploy, improve. You leave with the documents, the constitution file and the habits that keep an AI coding agent reliable — and with the data foundations that make what it builds worth trusting.",
      ],
      problems: [
        "You can describe the product you want but cannot brief a developer — or an AI — precisely enough to get it",
        "You have tried AI coding tools and got something that almost worked, then broke when the data or the rules changed",
        "You work with data every day but have never been shown how it should be modelled, governed and made trustworthy",
        "You are paying for software, or waiting in a queue for it, that a small well-built internal tool could replace",
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
    // Reviewed 2026-09-26 for the two-module curriculum: the eight
    // build-side outcomes still hold (Module 2); three data-side outcomes
    // (Module 1) and the agent-direction outcome were added.
    outcomes: [
      "Explain how an organisation turns data into decisions, and what data, metadata, master, reference and transactional data are",
      "Model data from business concepts to a physical, AI-ready design, and choose the storage and processing pattern that fits the workload",
      "Apply the DAC Architecture framework and the four pillars of data trust — governance, security, privacy and quality — to a real data landscape",
      "Transform ideas into product requirements",
      "Generate product specifications using AI",
      "Design user interfaces",
      "Create prototypes",
      "Build applications using AI-assisted development tools",
      "Direct an AI coding agent from a written vision to a working product with guardrails",
      "Test and improve solutions",
      "Deploy working applications",
      "Iterate and enhance products",
    ],
    // Founder, 2026-09-26: "trainees will be able to start freelancing
    // immediately". Factual capabilities only — no income claim.
    afterThisTraining: {
      heading: "Start freelancing or lead data-and-AI work straight after",
      intro: "You leave able to offer, scope and deliver work that combines trusted data with AI-built software:",
      items: [
        "Audit and model a client's data landscape — entities, master and reference data, metadata, and where it all lives",
        "Write the Vision, BRD and FSD documents for a product so an AI — or a developer — can build from them",
        "Build landing pages, internal tools and prototypes with an AI coding agent, inside a constitution and Git",
        "Set up the governance, quality and privacy basics an organisation needs before it can trust its data",
        "Scope and quote a small build with a work breakdown you can defend",
        "Know when a job needs a professional developer or data engineer — and what to hand them",
      ],
    },
    faq: [
      {
        q: "Do I need to be able to code?",
        a: "No. Neither module assumes a coding background. Day 1 is about data, not programming; Day 2 teaches you to direct an AI coding agent rather than to type code yourself. If you already code, the method makes you faster and more reliable — it does not start you over.",
      },
      {
        q: "Is Module 2 the same as the Learn Vibe Coding training?",
        a: "Yes. Module 2 is the Learn Vibe Coding masterclass in full — the same six parts, from the same curriculum — followed by hands-on build time on your own idea that the half-day session does not have room for.",
      },
      {
        q: "Can I take only Module 2?",
        a: "Yes. Learn Vibe Coding is offered on its own as a half-day session for people who already know their data foundations. If you take it first and want the data half later, talk to us about dates and how that session counts towards this training.",
      },
      {
        q: "What do I bring?",
        a: "A laptop and one AI account — a free tier is enough. A GitHub account is optional but useful for the build time on Day 2. Bring a real idea, or a real dataset, if you have one: the hands-on time is yours.",
      },
      {
        q: "Do I get a certificate?",
        a: "Yes — a Certificate of Completion for this training, with a unique ID and a public verification page, issued on attending both days. It records completion of the training; it is not the Academy's earned credential.",
      },
    ],
    modules: [
      /* TWO MODULES — founder, 2026-09-26: "Curriculum in two modules:
         Module 1: Data Blueprint = the current curriculum items 1–10.
         Module 2: copy-paste the Learn Vibe Coding curriculum." Each former
         module 1–10 is kept VERBATIM (title, description, points) as a
         GROUP inside Module 1's `points`; Module 2's groups are the shared
         `LEARN_VIBE_CODING_MODULES`. The former modules 11–17 are retired
         (see the commented block at the end of this entry). */
      {
        title: "Module 1 · Data Blueprint",
        description:
          "Day 1 — the data foundations every AI-era builder needs: from decision support systems to governance and agentic AI.",
        points: [
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
        ],
      },
      {
        title: "Module 2 · Learn Vibe Coding",
        description:
          "Day 2 — the Learn Vibe Coding masterclass in full (also offered on its own), then hands-on build time on your own idea.",
        points: LEARN_VIBE_CODING_MODULES.map((m) => ({ title: m.title, points: m.points })),
      },
    ],
    // Steps revised 2026-09-26 with the two-module curriculum: "Product
    // discovery", "Requirements" and "PromptOS" named retired modules; the
    // steps now follow Module 1 → Module 2 and carry the plan → build →
    // test → deploy → improve loop the retired landing described.
    methodology: {
      name: "Your learning journey",
      steps: [
        { title: "Idea", body: "Start from a real problem worth solving." },
        { title: "Data foundations", body: "Trusted, governed data underneath — Module 1." },
        { title: "Plan", body: "The eight documents, Vision through GuardRails — Module 2." },
        { title: "Guardrails", body: "The constitution the AI must never break, and Git as the undo button." },
        { title: "Build", body: "Direct an AI coding agent milestone by milestone, inside the rules." },
        { title: "Test", body: "Review every change and test before saying \"done\"." },
        { title: "Deploy", body: "Production readiness and adoption." },
        { title: "Improve", body: "Iterate on what you shipped — the loop starts again." },
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
    // Prices UPDATED 2026-09-26, later the same day, at the founder's
    // explicit direction (chat: "Please update the card content... Please
    // note, I have added another line for Malaysia"). RELABELLED the same
    // day, later still (founder: "Launch offer change this to Without HRD
    // Corp" — also asked for both figures to show on the /programs listing
    // card, not just the detail page; see CourseCard.tsx):
    // - Malaysia now publishes TWO figures on one card, via `options`
    //   (the same mechanism Pakistan used to use — see below): "Via HRD
    //   Corp" at the undiscounted RM 5,000, and "Without HRD Corp" at
    //   RM 2,500 (50% off). `programme_prices`/checkout is wired to the
    //   LOWER, generally-available figure (RM 2,500) — the same pattern
    //   already used for Pakistan below (the broader, self-serve option is
    //   the row that reaches checkout; the other is display-only).
    //   FOUNDER TO CONFIRM this checkout-wiring choice.
    // - Pakistan DROPS its previous two-figure (in-person/online) display
    //   and now publishes ONE figure — Rs 100,000, down from Rs 200,000 —
    //   with a note identical in wording to International's, replacing the
    //   `options` array entirely.
    // - International: today's figure is USD 1,000 (was USD 1,999),
    //   discounted from a new original USD 4,000 (was USD 7,999); the
    //   note is unchanged.
    // ⚠ Pakistan's figures (Rs 200,000 → Rs 100,000) are exactly 50% off,
    // not the "55% OFF" the founder's message stated — the founder's
    // amounts are used verbatim below (nothing was silently corrected);
    // FOUNDER TO CONFIRM which is right: the label or one of the amounts.
    // History: this course's price has changed on 2026-09-01 (migration),
    // 2026-09-06 (50%/70%/10% off), and twice on 2026-09-26 (first to
    // RM 4,999 / Rs 99,999 online·199,999 in-person / USD 1,999 at 75%
    // off, now to the figures below).
    // `valueStack` / `valueStackTotal` removed (founder: no value stack).
    // M12 WP1 (2026-09-26, later still — founder decisions L4/L5/L6): the
    // four fee rows. "Via HRD Corp" is its own row (`malaysia_hrdcorp`),
    // display-only — claimed through the employer, never charged by
    // Stripe; "Without HRD Corp" is the `malaysia` row that checkout
    // charges (L6 confirms the 2026-09-26 wiring above). Minimums and notes
    // are row columns; the `regionalPricing` block is gone.
    pricing: {
      malaysia_hrdcorp: {
        original: "RM 5,000",
        discount: "Full fee",
        save: "RM 0",
        today: "RM 5,000",
        minParticipants: 25,
        note: "In-person training price. Minimum 25 participants. There is no online option for this training in Malaysia.",
      },
      malaysia: {
        original: "RM 5,000",
        discount: "50% OFF",
        save: "RM 2,500",
        today: "RM 2,500",
        minParticipants: 25,
        note: "In-person training price. Minimum 25 participants. There is no online option for this training in Malaysia.",
      },
      pakistan: {
        original: "Rs. 200,000",
        discount: "55% OFF",
        save: "Rs. 100,000",
        today: "Rs. 100,000",
        note: "Online training price. In-person training needs a minimum of 100 participants; cost discussed separately.",
      },
      international: {
        original: "USD 4,000",
        discount: "75% OFF",
        save: "USD 3,000",
        today: "USD 1,000",
        note: "Online training price. In-person training needs a minimum of 100 participants; cost discussed separately.",
      },
    },
    // "learn-vibe-coding" added 2026-09-26 — Module 2 is that training.
    related: ["learn-vibe-coding", "data-blueprint", "agentic-ai-strategy-adoption"],
    externalResources: [
      {
        label: "AI-Powered Consulting",
        url: "https://yourpartnertechnologies.com/ai-powered-consulting.html",
        description: "When you would rather have the product built for you",
      },
    ],
    /* Retired from the curriculum on the founder's 2026-09-26 two-module
       instruction; kept for reference. These were modules 11–17 of the
       former 17-module curriculum, verbatim:
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
    */
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
