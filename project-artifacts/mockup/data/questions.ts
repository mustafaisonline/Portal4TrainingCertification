import type { Domain } from "./domains";

export type Question = {
  id: string;
  domain: Domain["code"];
  scenario: string;
  options: string[]; // "I'm not sure" is appended separately, never stored here
};

/**
 * Fixed, linear question set for P05 (Mockup Milestone 1).
 *
 * NOT a real adaptive or branching diagnostic — see docs/MOCK_DATA_REGISTER.md.
 * Ten questions, two per domain, is the minimum that still lets every
 * domain contribute to the P06 profile and lets the mid-flow insight card
 * land naturally after question 5 (per §4 P05's "roughly every 5
 * questions"), without padding the walkthrough with filler questions.
 */
export const questions: Question[] = [
  {
    id: "q1",
    domain: "DF",
    scenario:
      "Two systems both call a customer “customer,” but one means a billing account and the other a person. What's the first thing you'd do?",
    options: [
      "Write down what each system actually means by the term, before touching either system",
      "Pick the definition used by the larger system and migrate the other",
      "Add a translation layer that maps between the two silently",
      "Rename one of the fields so they no longer collide",
    ],
  },
  {
    id: "q2",
    domain: "DF",
    scenario:
      "You're asked to model a new domain. The stakeholders disagree about what counts as one entity versus two.",
    options: [
      "Model both views and reconcile via a documented mapping",
      "Pick the model that's easiest to build first",
      "Escalate and ask for a single decision before modelling anything",
      "Interview each stakeholder to find the shared underlying concept",
    ],
  },
  {
    id: "q3",
    domain: "DE",
    scenario:
      "A nightly pipeline has started silently dropping about 2% of rows. What's your first move?",
    options: [
      "Add row-count and schema checks between each pipeline stage",
      "Re-run the pipeline and see if the number changes",
      "Check whether the source system changed its export format first",
      "Widen the pipeline's error handling to log and continue",
    ],
  },
  {
    id: "q4",
    domain: "DE",
    scenario:
      "Two teams want to build on the same raw dataset, but each wants a different transformation applied upstream.",
    options: [
      "Keep the raw layer untouched and let each team transform downstream",
      "Apply one team's transformation and let the other adapt",
      "Build two parallel raw ingestion paths",
      "Negotiate a single shared transformation both teams can use",
    ],
  },
  {
    id: "q5",
    domain: "AI",
    scenario:
      "A model performs well in testing but a stakeholder asks how confident you are it will hold up next quarter.",
    options: [
      "Show its performance on a held-out, time-based split, not a random one",
      "Point to the overall accuracy number from the test set",
      "Explain that all models degrade eventually",
      "Recommend shipping now and monitoring drift after launch",
    ],
  },
  {
    id: "q6",
    domain: "AI",
    scenario:
      "You're deciding whether a use case is a good fit for an LLM versus a simpler rules-based approach.",
    options: [
      "Check whether the task has clear, enumerable rules first",
      "Default to the LLM since it's faster to prototype",
      "Ask which approach the team is more comfortable maintaining",
      "Test both and pick whichever scores higher on one benchmark",
    ],
  },
  {
    id: "q7",
    domain: "GA",
    scenario:
      "An AI system's output will influence a decision about a real person. What governance question comes first?",
    options: [
      "Who is accountable if the output is wrong, and how would they know",
      "Whether the model's accuracy score is above a set threshold",
      "Whether the vendor's terms of service permit this use case",
      "Whether the output is fast enough for the workflow",
    ],
  },
  {
    id: "q8",
    domain: "GA",
    scenario:
      "You're asked to assess whether a data practice is compliant. The written policy is ambiguous.",
    options: [
      "Document the ambiguity and the interpretation you're applying, with reasoning",
      "Apply the strictest possible reading to be safe",
      "Ask whoever wrote the policy what they meant, informally",
      "Proceed and flag it only if someone raises it later",
    ],
  },
  {
    id: "q9",
    domain: "GT",
    scenario:
      "You need to enforce a data access rule across several tools that don't share a permissions model.",
    options: [
      "Push enforcement down to the query layer, closest to the data",
      "Trust each tool's own access control and document the policy separately",
      "Restrict access by giving fewer people any access at all",
      "Add the rule as a check in each application's UI",
    ],
  },
  {
    id: "q10",
    domain: "GT",
    scenario:
      "Choosing a tool to catalogue data assets across the organisation, what matters most first?",
    options: [
      "Whether it can represent lineage and ownership, not just a list of tables",
      "Whether it has the most polished user interface",
      "Whether it's the cheapest option that technically qualifies",
      "Whether it's the tool a competitor is already using",
    ],
  },
];

export const UNSURE_OPTION = "I'm not sure";

export const INSIGHT_CARD = {
  afterQuestionIndex: 5, // 1-indexed question number, matches §4 "roughly every 5"
  text: "You're reading strongly on data modelling and pipeline reliability. Let's check how you reason about AI and governance next.",
};
