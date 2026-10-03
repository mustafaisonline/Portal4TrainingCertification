/*
 * The Agentic AI catalogue (CR-2026-10-04-0111 / -0112): agents and skills for Claude Code, written as plain content in the
 * repository (like the legal texts) — reviewed by the founder in git, no item table, no files stored in the database.
 * Founder, 2026-10-04: "a curated, generalised starter set" — every item here is a generalised version of one we use
 * ourselves, with no project names, paths or business rules in it.
 */

export type AgenticKind = "agent" | "skill";

export type AgenticItem = {
  /** URL slug and download name — lower-case words and hyphens. */
  slug: string;
  kind: AgenticKind;
  title: string;
  /** One or two sentences: what it does for you. */
  summary: string;
  /** Three short lines: who or what it is best for. */
  bestFor: readonly string[];
  /** What you give it. */
  youGive: readonly string[];
  /** What you get back. */
  youGet: readonly string[];
  /** A short worked example. */
  example: { request: string; result: string };
  /** How it works, step by step (3–5 lines). */
  howItWorks: readonly string[];
  /** Honest limits. */
  limits: readonly string[];
  /** Ways to adapt it to your own project. */
  customise: readonly string[];
  /** The exact file the buyer installs: frontmatter + body. */
  definition: string;
};

/** Where the definition file goes inside the download (mirrors a project's `.claude/` folder). */
export function definitionPath(item: AgenticItem): string {
  return item.kind === "agent" ? `.claude/agents/${item.slug}.md` : `.claude/skills/${item.slug}/SKILL.md`;
}

export const KIND_LABEL: Record<AgenticKind, string> = { agent: "Agent", skill: "Skill" };
export const KIND_PLURAL: Record<AgenticKind, string> = { agent: "Agents", skill: "Skills" };
