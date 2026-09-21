import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.resolve(__dirname, "..", "..", "app", "globals.css"), "utf8");

/*
 * Guards the token contract ported in M1b (ADR-045). Two classes of bug it
 * catches, both seen in the wireframe's history:
 *   1. A dark override for a token that doesn't exist in `:root` (typo), or a
 *      `:root` token with no dark value where one is needed — the
 *      founder-reported "can't read text at night" defect.
 *   2. The two dark blocks (system preference vs. explicit toggle) drifting
 *      apart, so the toggle and the OS setting render different palettes.
 */

function block(selectorStart: string): string {
  const start = css.indexOf(selectorStart);
  if (start < 0) throw new Error(`selector not found: ${selectorStart}`);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`unterminated block: ${selectorStart}`);
}

function tokens(body: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /(--[a-z0-9-]+)\s*:\s*([^;]+);/g;
  for (const m of body.matchAll(re)) out.set(m[1]!, m[2]!.replace(/\s+/g, " ").trim());
  return out;
}

const root = tokens(block(":root {"));
const darkSystem = tokens(block(':root:not([data-theme="light"])'));
const darkExplicit = tokens(block(':root[data-theme="dark"]'));
const night = tokens(block(".night {"));

describe("design tokens (app/globals.css)", () => {
  it("defines the core token families in :root", () => {
    for (const t of [
      "--color-ground",
      "--color-ground-raised",
      "--color-ground-tint",
      "--color-ink",
      "--color-ink-quiet",
      "--color-ink-faint",
      "--color-line",
      "--color-primary",
      "--color-action",
      "--color-action-ink",
      "--radius-plate",
      "--radius-panel",
      "--font-body",
      "--font-mono",
    ]) {
      expect(root.has(t), `missing ${t}`).toBe(true);
    }
  });

  it("every dark-mode override names a token that exists in :root", () => {
    const unknown = [...darkExplicit.keys(), ...night.keys()].filter((t) => !root.has(t));
    expect(unknown).toEqual([]);
  });

  it("the system-preference and explicit dark blocks are identical", () => {
    expect(Object.fromEntries(darkSystem)).toEqual(Object.fromEntries(darkExplicit));
  });

  it("every surface and ink token has a dark value", () => {
    const needDark = [...root.keys()].filter((t) =>
      /^--color-(ground|ink|line|primary|accent|success|warning|danger|info|prof)/.test(t),
    );
    const missing = needDark.filter((t) => !darkExplicit.has(t));
    expect(missing).toEqual([]);
  });

  it("night scope overrides the surface and ink tokens it paints on", () => {
    for (const t of ["--color-ground", "--color-ground-raised", "--color-ink", "--color-ink-quiet", "--color-line", "--color-action", "--color-action-ink"]) {
      expect(night.has(t), `night missing ${t}`).toBe(true);
    }
  });
});
