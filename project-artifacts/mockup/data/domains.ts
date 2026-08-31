/**
 * Domain and altitude model (§1.7). Course counts are illustrative
 * placeholders for the mockup — see docs/MOCK_DATA_REGISTER.md.
 */
export type Domain = {
  code: "DF" | "DE" | "AI" | "GA" | "GT";
  name: string;
  scope: string;
  courseCount: number;
  emphasised?: boolean;
};

export const domains: Domain[] = [
  {
    code: "DF",
    name: "Data Foundations",
    scope: "Modelling, quality, and the language of data work",
    courseCount: 6,
  },
  {
    code: "DE",
    name: "Data Engineering",
    scope: "Pipelines, warehousing, and reliable delivery",
    courseCount: 4,
  },
  {
    code: "AI",
    name: "AI & Machine Learning",
    scope: "Applied ML, LLMs, and responsible deployment",
    courseCount: 5,
  },
  {
    code: "GA",
    name: "Governance & AI Assurance",
    scope: "Risk, policy, and assurance for data and AI systems",
    courseCount: 5,
    emphasised: true,
  },
  {
    code: "GT",
    name: "Governance Technology",
    scope: "Tooling and infrastructure for governed data platforms",
    courseCount: 3,
  },
];
