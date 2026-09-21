import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/*
 * Module-boundary tests (ADR-001, AP-01: "a boundary violation is a defect,
 * not a style issue"). No ESLint is installed — Next.js 16 no longer bundles
 * it and adding it is a separate dependency decision — so the fence is a test
 * that runs with every `npm test`, which is stricter than a lint rule anyway:
 * it cannot be disabled per-line.
 */

const ROOT = path.resolve(__dirname, "..", "..");
const SCAN_DIRS = ["app", "src"].map((d) => path.join(ROOT, d));
const PREVIEW_DIR = path.join(ROOT, "src", "preview");
const SOURCE_EXT = new Set([".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs"]);

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (entry === "node_modules" || entry === "generated") continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (SOURCE_EXT.has(path.extname(entry))) out.push(full);
  }
  return out;
}

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g;

function importsOf(file: string): string[] {
  const src = readFileSync(file, "utf8");
  const found: string[] = [];
  for (const m of src.matchAll(IMPORT_RE)) {
    const spec = m[1];
    if (spec) found.push(spec);
  }
  return found;
}

function resolvesIntoPreview(file: string, spec: string): boolean {
  if (spec === "@/preview" || spec.startsWith("@/preview/")) return true;
  if (spec.startsWith(".")) {
    const target = path.resolve(path.dirname(file), spec);
    return target === PREVIEW_DIR || target.startsWith(PREVIEW_DIR + path.sep);
  }
  return false;
}

describe("module boundaries", () => {
  const files = SCAN_DIRS.flatMap((d) => {
    try {
      return walk(d);
    } catch {
      return [];
    }
  });

  it("scans at least the application entry points", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("no production module imports from src/preview (ADR-045 fence)", () => {
    const violations: string[] = [];
    for (const file of files) {
      if (file.startsWith(PREVIEW_DIR + path.sep)) continue; // preview may import itself
      for (const spec of importsOf(file)) {
        if (resolvesIntoPreview(file, spec)) {
          violations.push(`${path.relative(ROOT, file)} → ${spec}`);
        }
      }
    }
    expect(violations, `production code must not import preview fixtures:\n${violations.join("\n")}`).toEqual([]);
  });

  it("no production module imports the mockup or the seed-data content files (ADR-045; M3 criterion 8)", () => {
    // Content reaches the app through the database and its repositories,
    // never as constants. prisma/ (the seed) is the only consumer of seed-data.
    const violations: string[] = [];
    for (const file of files) {
      for (const spec of importsOf(file)) {
        if (spec.includes("project-artifacts/") || spec.includes("seed-data/") || spec.includes("/prisma/seed-data")) {
          violations.push(`${path.relative(ROOT, file)} → ${spec}`);
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("application code never imports the generated Prisma client directly (only src/db does)", () => {
    // Keeps the ORM behind the repository boundary (AP-10): swapping or
    // upgrading Prisma touches one folder.
    const allowed = path.join(ROOT, "src", "db");
    const violations: string[] = [];
    for (const file of files) {
      if (file.startsWith(allowed + path.sep)) continue;
      for (const spec of importsOf(file)) {
        if (spec.startsWith("@/generated/") || spec.includes("/generated/prisma")) {
          violations.push(`${path.relative(ROOT, file)} → ${spec}`);
        }
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
