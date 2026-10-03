import { describe, expect, it } from "vitest";
import { publishReadiness } from "@/modules/catalogue/programmes/readiness";
import { priceRegionMeta, type ProgrammeContent } from "@/modules/catalogue/programmes/types";

/* CR-2026-10-03-2255 — the publish check says exactly what is missing. */

const real: ProgrammeContent = {
  highlights: ["Build a working app in a day"],
  whoShouldAttend: { intro: "Anyone curious about building with AI.", roles: ["Analysts", "Managers"] },
  rationale: { heading: "Why this training", paragraphs: ["Because it saves time."] },
  related: [],
};
const starter: ProgrammeContent = {
  highlights: ["Vibe Coding — highlights to be written"],
  whoShouldAttend: { intro: "To be written.", roles: ["To be written"] },
  rationale: { heading: "Why this training", paragraphs: ["To be written."] },
  related: [],
};
const all = ["malaysia_hrdcorp", "malaysia", "pakistan", "international"] as const;

describe("publishReadiness", () => {
  it("a complete training has no problems", () => {
    expect(publishReadiness({ moduleCount: 3, feeRegions: all, content: real })).toEqual([]);
  });

  it("a fresh draft lists every problem, each pointing at the tab that fixes it", () => {
    const p = publishReadiness({ moduleCount: 0, feeRegions: ["malaysia"], content: starter });
    expect(p.map((x) => x.tabLabel)).toEqual(["Curriculum", "Fees", "Content", "Content", "Content"]);
    const fees = p.find((x) => x.tabLabel === "Fees")!;
    expect(fees.message).toContain("1 of 4 fee rows are saved");
    for (const r of ["malaysia_hrdcorp", "pakistan", "international"] as const) expect(fees.message).toContain(priceRegionMeta(r).label);
    expect(fees.message).not.toContain(priceRegionMeta("malaysia").label + ","); // the saved one is not listed as missing
  });

  it("names the starter text in the roles and the rationale too, not only the highlights", () => {
    const p = publishReadiness({ moduleCount: 1, feeRegions: all, content: { ...real, whoShouldAttend: { intro: "Fine.", roles: ["To be written"] }, rationale: { heading: "x", paragraphs: ["to BE written"] } } });
    expect(p.map((x) => x.message)).toEqual([expect.stringContaining("Who should attend"), expect.stringContaining("Why this training")]);
  });
});
