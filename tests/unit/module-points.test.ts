import { describe, expect, it } from "vitest";
import { isModulePointGroup, normaliseModulePoints } from "@/modules/catalogue/programmes/module-points";

/*
 * `programme_modules.points` (JSON) may hold plain strings or GROUPS since
 * 2026-09-26 (the flagship's two-module curriculum). The repository reads
 * the column through `normaliseModulePoints`; the curriculum renderer picks
 * the markup with `isModulePointGroup`. Pure functions — no database.
 */
describe("normaliseModulePoints", () => {
  it("passes a flat string list through unchanged (every pre-2026-09-26 module)", () => {
    expect(normaliseModulePoints(["A", "B"])).toEqual(["A", "B"]);
  });

  it("keeps groups with a title, optional description and their own points, in order", () => {
    const input = [
      "Plain point",
      { title: "Decision support systems (DSS)", description: "Outcome: …", points: ["OLTP vs OLAP", "Components"] },
      { title: "Part 1 · Foundations (about 60 minutes)", points: ["What is Vibe Coding, and what it is not"] },
      { title: "Heading only" },
    ];
    expect(normaliseModulePoints(input)).toEqual(input);
  });

  it("drops entries that could not render honestly — blanks, objects without a title, numbers, nested arrays, non-string sub-points", () => {
    const out = normaliseModulePoints([
      "",
      "   ",
      "Kept",
      { description: "no title" },
      { title: "", points: ["x"] },
      { title: "Group", description: 42, points: ["ok", 7, null, "", "also ok"] },
      12,
      null,
      ["nested"],
    ]);
    expect(out).toEqual(["Kept", { title: "Group", points: ["ok", "also ok"] }]);
  });

  it("returns null for a null column, a non-array, or a list with nothing usable", () => {
    expect(normaliseModulePoints(null)).toBeNull();
    expect(normaliseModulePoints(undefined)).toBeNull();
    expect(normaliseModulePoints("A")).toBeNull();
    expect(normaliseModulePoints({ title: "not a list" })).toBeNull();
    expect(normaliseModulePoints([])).toBeNull();
    expect(normaliseModulePoints(["", 3])).toBeNull();
  });
});

describe("isModulePointGroup", () => {
  it("distinguishes a group from a plain point", () => {
    expect(isModulePointGroup("A")).toBe(false);
    expect(isModulePointGroup({ title: "A" })).toBe(true);
    expect(isModulePointGroup({ title: "A", description: null, points: [] })).toBe(true);
  });
});

describe("the seed's two curricula share one source", () => {
  it("the flagship's Module 2 groups are exactly LEARN_VIBE_CODING_MODULES, and Learn Vibe Coding's modules are that constant", async () => {
    const { courses, LEARN_VIBE_CODING_MODULES } = await import("../../prisma/seed-data/courses");
    const flagship = courses.find((c) => c.flagship)!;
    const lvc = courses.find((c) => c.slug === "learn-vibe-coding")!;
    expect(lvc.modules).toBe(LEARN_VIBE_CODING_MODULES);
    expect(LEARN_VIBE_CODING_MODULES).toHaveLength(6);
    expect(flagship.modules).toHaveLength(2);
    expect(flagship.modules[1]!.points).toEqual(LEARN_VIBE_CODING_MODULES.map((m) => ({ title: m.title, points: m.points })));
    // Module 1: the former modules 1–10, each a group with its own title.
    const m1 = flagship.modules[0]!.points!;
    expect(m1).toHaveLength(10);
    expect(m1.every((p) => typeof p === "object" && typeof p.title === "string")).toBe(true);
  });
});
