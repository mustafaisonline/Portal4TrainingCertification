import type { Domain } from "./domains";

export type ProficiencyProfile = Record<Domain["code"], 1 | 2 | 3 | 4 | 5>;

export type ResultFixture = {
  id: "A" | "B";
  profile: ProficiencyProfile;
  gaps: string[];
  path: {
    targetCredential: string;
    hourEstimate: string;
    price: string;
    milestones: string[];
  };
  alreadyHave: string[];
  peerBenchmark: string;
};

/**
 * Two canned P06 outcomes (Mockup Milestone 1) — NOT computed from the
 * diagnostic answers. Which one is shown is picked by a single, visibly
 * illustrative rule (see selectFixture below), not a scoring engine.
 * See docs/MOCK_DATA_REGISTER.md.
 */
export const resultFixtures: Record<"A" | "B", ResultFixture> = {
  A: {
    id: "A",
    profile: { DF: 4, DE: 3, AI: 2, GA: 2, GT: 2 },
    gaps: [
      "You can describe what metadata is, but not how to design a lineage capability that survives a system migration.",
      "You reason well about model performance, but haven't yet worked through what governance a model needs before it touches a real decision.",
      "You know the shape of a good data model, but assessing a written policy for ambiguity is still new territory.",
    ],
    path: {
      targetCredential: "Blueprint Practitioner — Data Foundations",
      hourEstimate: "≈ 40 hours over 6–8 weeks",
      price: "RM 1,800 / USD 420",
      milestones: [
        "Model a real conceptual domain end to end",
        "Design a governance approach for a shared dataset",
        "Read and apply a rubric like an assessor would",
        "Submit and defend an applied artifact",
      ],
    },
    alreadyHave: [
      "Core data modelling — you can skip Module 1",
      "Pipeline reliability fundamentals — you can skip Module 2",
    ],
    peerBenchmark:
      "Stronger than 60% of people who described a similar role on this diagnostic.",
  },
  B: {
    id: "B",
    profile: { DF: 2, DE: 2, AI: 4, GA: 4, GT: 3 },
    gaps: [
      "You reason well about AI governance, but haven't yet designed a conceptual data model from scratch under ambiguity.",
      "You know what a reliable pipeline looks like, but haven't had to enforce access rules across tools that don't share a permissions model.",
      "You're strong on assurance thinking, but the language of formal data modelling is still unfamiliar.",
    ],
    path: {
      targetCredential: "Blueprint Practitioner — Governance & AI Assurance",
      hourEstimate: "≈ 35 hours over 5–7 weeks",
      price: "RM 1,800 / USD 420",
      milestones: [
        "Assess an ambiguous data policy and document your reasoning",
        "Design an accountability structure for an AI-influenced decision",
        "Read and apply a rubric like an assessor would",
        "Submit and defend an applied artifact",
      ],
    },
    alreadyHave: [
      "AI governance fundamentals — you can skip Module 1",
      "Assurance reasoning — you can skip Module 2",
    ],
    peerBenchmark:
      "Stronger than 55% of people who described a similar role on this diagnostic.",
  },
};

/**
 * Deliberately trivial and visible, not a scoring algorithm: more "I'm not
 * sure" answers biases toward the fixture with the larger stated gaps (B),
 * fewer biases toward the stronger-baseline fixture (A). This exists only
 * to make the walkthrough feel responsive — it is not, and must not become,
 * a real diagnostic scoring engine.
 */
export function selectFixture(unsureCount: number): "A" | "B" {
  return unsureCount >= 3 ? "B" : "A";
}
