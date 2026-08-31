import type { ProficiencyProfile } from "./results";

export type RoleTarget = {
  id: string;
  label: string;
  target: ProficiencyProfile;
};

/** Illustrative target-role profiles for P06 §2 "Compared to your target role". */
export const roleTargets: RoleTarget[] = [
  {
    id: "data-analyst",
    label: "Data Analyst",
    target: { DF: 4, DE: 3, AI: 2, GA: 2, GT: 2 },
  },
  {
    id: "data-engineer",
    label: "Data Engineer",
    target: { DF: 3, DE: 5, AI: 2, GA: 2, GT: 3 },
  },
  {
    id: "ai-governance-lead",
    label: "AI Governance Lead",
    target: { DF: 2, DE: 2, AI: 4, GA: 5, GT: 3 },
  },
];
