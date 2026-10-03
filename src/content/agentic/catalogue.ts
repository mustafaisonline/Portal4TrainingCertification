import { AGENTS } from "./agents";
import { SKILLS } from "./skills";
import type { AgenticItem, AgenticKind } from "./types";

export const AGENTIC_ITEMS: readonly AgenticItem[] = [...AGENTS, ...SKILLS];

export function findAgenticItem(kind: AgenticKind, slug: string): AgenticItem | undefined {
  return AGENTIC_ITEMS.find((i) => i.kind === kind && i.slug === slug);
}
export function findAgenticItemBySlug(slug: string): AgenticItem | undefined {
  return AGENTIC_ITEMS.find((i) => i.slug === slug);
}
export function itemsOfKind(kind: AgenticKind): readonly AgenticItem[] {
  return AGENTIC_ITEMS.filter((i) => i.kind === kind);
}
