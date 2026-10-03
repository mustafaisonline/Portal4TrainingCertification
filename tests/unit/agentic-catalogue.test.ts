import { describe, expect, it } from "vitest";
import { AGENTIC_ITEMS, findAgenticItem, itemsOfKind } from "@/content/agentic/catalogue";
import { definitionPath } from "@/content/agentic/types";
import { buildItemPackage, composeInstall, composeManual, LICENSE_TEXT } from "@/modules/agentic/package";
import { createZip, readZip } from "@/modules/agentic/zip";

/* CR-2026-10-04-0111/0112 — the catalogue is well-formed and generalised, and the download is a valid, complete ZIP. */

// Project-specific names that must never reach a buyer (the originals stay private).
const INTERNAL_TERMS = ["p4tc", "dataainexus", "datapedia", "buddy", "yourpartner", "droplet", "framework/", "docs/execution", "CR-2026-10", "DR-01", "DR-02", "DR-03", "DR-04", "br-analyst", "pe-selector", "governance-reviewer", "test-verifier", "deploy-engineer", "sslip"];

describe("the starter catalogue", () => {
  it("has the approved starter set: 5 agents and 8 skills, unique slugs", () => {
    expect(itemsOfKind("agent")).toHaveLength(5);
    expect(itemsOfKind("skill")).toHaveLength(8);
    const slugs = AGENTIC_ITEMS.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z][a-z0-9-]{2,40}$/);
  });

  it("every item is complete", () => {
    for (const i of AGENTIC_ITEMS) {
      expect(i.title.length, i.slug).toBeGreaterThan(3);
      expect(i.summary.length, i.slug).toBeGreaterThan(40);
      for (const list of [i.bestFor, i.youGive, i.youGet, i.howItWorks, i.limits, i.customise]) expect(list.length, `${i.slug} list`).toBeGreaterThan(0);
      expect(i.example.request.length).toBeGreaterThan(10);
      expect(i.example.result.length).toBeGreaterThan(20);
    }
  });

  it("every definition is a valid Claude Code file: front matter with a name equal to the slug and a description; agents list their tools", () => {
    for (const i of AGENTIC_ITEMS) {
      const m = /^---\nname: ([a-z0-9-]+)\ndescription: (.+)\n(tools: .+\n)?---\n/.exec(i.definition);
      expect(m, `${i.slug} front matter`).not.toBeNull();
      expect(m![1], i.slug).toBe(i.slug);
      expect(m![2]!.length, i.slug).toBeGreaterThan(30);
      if (i.kind === "agent") expect(m![3], `${i.slug} tools`).toBeTruthy();
    }
  });

  it("nothing project-specific leaks into what a buyer receives", () => {
    for (const i of AGENTIC_ITEMS) {
      const everything = [i.definition, composeManual(i), composeInstall(i)].join("\n").toLowerCase();
      for (const term of INTERNAL_TERMS) expect(everything.includes(term.toLowerCase()), `${i.slug} mentions "${term}"`).toBe(false);
    }
  });

  it("the prompt-selector agent and the prompt-frameworks skill reference each other by their new names", () => {
    expect(findAgenticItem("agent", "prompt-selector")!.definition).toContain("`prompt-frameworks`");
    expect(findAgenticItem("skill", "prompt-frameworks")!.definition).toContain("prompt-selector agent");
  });
});

describe("the download", () => {
  it("zip: files round-trip with valid CRCs, UTF-8 names, and unsafe paths are refused", () => {
    const zip = createZip([{ path: "a/b.txt", data: new TextEncoder().encode("héllo") }, { path: "c.md", data: new Uint8Array() }]);
    const files = readZip(zip);
    expect(files.map((f) => f.path)).toEqual(["a/b.txt", "c.md"]);
    expect(files[0]!.data.toString("utf8")).toBe("héllo");
    expect(() => createZip([{ path: "../x", data: new Uint8Array() }])).toThrow();
    expect(() => createZip([{ path: "/x", data: new Uint8Array() }])).toThrow();
    expect(createZip([{ path: "a", data: new TextEncoder().encode("x") }]).equals(createZip([{ path: "a", data: new TextEncoder().encode("x") }]))).toBe(true); // reproducible
  });

  it("each item's package holds the definition in the right folder, the manual, the install guide and the licence", () => {
    for (const i of AGENTIC_ITEMS) {
      const { filename, bytes } = buildItemPackage(i);
      expect(filename).toBe(`${i.slug}.zip`);
      const files = readZip(bytes);
      expect(files.map((f) => f.path).sort()).toEqual([definitionPath(i), "INSTALL.md", "LICENSE.txt", "MANUAL.md"].sort());
      expect(files.find((f) => f.path === definitionPath(i))!.data.toString("utf8")).toBe(i.definition);
      expect(files.find((f) => f.path === "LICENSE.txt")!.data.toString("utf8")).toBe(LICENSE_TEXT);
      expect(files.find((f) => f.path === "MANUAL.md")!.data.toString("utf8")).toContain(i.title);
      expect(definitionPath(i)).toBe(i.kind === "agent" ? `.claude/agents/${i.slug}.md` : `.claude/skills/${i.slug}/SKILL.md`);
    }
  });
});
