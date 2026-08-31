/**
 * Capability areas (subject scope). Reframed under DR-02: these are areas
 * in which the platform develops professional capability — never catalogue
 * categories, and they carry NO counts of anything (course counts are
 * retired; depth-as-value is retired). Domain survives as subject scope
 * and seeded data per ADR-023. The launch area scope is an open decision
 * (HO-3) — nothing may assume this list's length.
 */
export type Domain = {
  code: "DF" | "DE" | "AI" | "GA" | "GT";
  name: string;
  scope: string;
};

export const domains: Domain[] = [
  {
    code: "DF",
    name: "Data Foundations",
    scope: "Modelling, quality, and the language of data work",
  },
  {
    code: "DE",
    name: "Data Engineering",
    scope: "Pipelines, warehousing, and reliable delivery",
  },
  {
    code: "AI",
    name: "AI & Machine Learning",
    scope: "Applied ML, LLMs, and responsible deployment",
  },
  {
    code: "GA",
    name: "Governance & AI Assurance",
    scope: "Risk, policy, and assurance for data and AI systems",
  },
  {
    code: "GT",
    name: "Governance Technology",
    scope: "Tooling and infrastructure for governed data platforms",
  },
];
