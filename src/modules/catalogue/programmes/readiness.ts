import { FEE_REGIONS } from "./constants";
import { priceRegionMeta, type PriceRegion, type ProgrammeContent } from "./types";

/*
 * Is a training ready to be published? (CR-2026-10-03-2255.) One pure check used by the admin screen (to say exactly
 * what is missing, with a link to the tab that fixes it) AND by the server when Publish is pressed (so the screen's
 * disabled button is not the only guard). Nothing is invented: every starter placeholder a new draft gets
 * ("to be written") must be replaced, every fee region must be saved, and there must be at least one curriculum module.
 */

export type ReadinessProblem = {
  /** One plain sentence for the person publishing. */
  message: string;
  /** The tab that fixes it: "" = Details, otherwise the tab's path suffix. */
  tab: "/content" | "/modules" | "/fees";
  tabLabel: "Content" | "Curriculum" | "Fees";
};

const PLACEHOLDER = /to be written/i;
const hasPlaceholder = (items: readonly string[]) => items.some((t) => PLACEHOLDER.test(t));

export function publishReadiness(t: { moduleCount: number; feeRegions: readonly PriceRegion[]; content: ProgrammeContent }): ReadinessProblem[] {
  const problems: ReadinessProblem[] = [];
  if (t.moduleCount === 0) problems.push({ message: "Add at least one curriculum module.", tab: "/modules", tabLabel: "Curriculum" });

  const missing = FEE_REGIONS.filter((r) => !t.feeRegions.includes(r));
  if (missing.length > 0) {
    problems.push({
      message: `Save a fee for ${missing.map((r) => priceRegionMeta(r).label).join(", ")} (${FEE_REGIONS.length - missing.length} of ${FEE_REGIONS.length} fee rows are saved).`,
      tab: "/fees",
      tabLabel: "Fees",
    });
  }

  const c = t.content;
  // A section that is missing altogether (malformed stored content) counts as unwritten, never as a crash.
  if (!c || !Array.isArray(c.highlights) || !c.whoShouldAttend || !c.rationale) {
    problems.push({ message: "The training's sections are incomplete — open the Content tab and save it.", tab: "/content", tabLabel: "Content" });
    return problems;
  }
  if (hasPlaceholder(c.highlights)) problems.push({ message: "Replace the starter text in Highlights.", tab: "/content", tabLabel: "Content" });
  if (PLACEHOLDER.test(c.whoShouldAttend.intro) || hasPlaceholder(c.whoShouldAttend.roles)) problems.push({ message: "Replace the starter text in “Who should attend” (the introduction and the roles).", tab: "/content", tabLabel: "Content" });
  if (hasPlaceholder(c.rationale.paragraphs)) problems.push({ message: "Replace the starter text in “Why this training”.", tab: "/content", tabLabel: "Content" });
  return problems;
}
