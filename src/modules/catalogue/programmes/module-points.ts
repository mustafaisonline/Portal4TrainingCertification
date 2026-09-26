import type { ModulePoint, ModulePointGroup } from "./types";

/*
 * `programme_modules.points` is a JSON column. Until 2026-09-26 it held a
 * flat `string[]`; the flagship's two-module curriculum (founder direction
 * that day) stores GROUPS in it as well — Module 1 groups the ten Data
 * Blueprint topics, Module 2 the six Learn Vibe Coding parts. These two pure
 * helpers are the one place that reads the column's shape: the repository
 * normalises what the database returns, and the curriculum renderer asks
 * which kind each entry is. No schema change.
 */

/** Type guard: a group (sub-heading + optional description + own list)
 *  rather than a plain point. */
export function isModulePointGroup(point: ModulePoint): point is ModulePointGroup {
  return typeof point === "object" && point !== null;
}

/** Validates the JSON column lightly: keeps non-empty strings and objects
 *  with a non-empty string `title` (their `description` must be a string
 *  or null when present, their `points` an array of non-empty strings).
 *  Anything else — a bare object without a title, a number, a nested array
 *  — is dropped rather than rendered as "[object Object]". Returns null
 *  when the column is null, not an array, or yields nothing usable. */
export function normaliseModulePoints(value: unknown): ModulePoint[] | null {
  if (!Array.isArray(value)) return null;
  const out: ModulePoint[] = [];
  for (const entry of value) {
    if (typeof entry === "string") {
      if (entry.trim().length > 0) out.push(entry);
      continue;
    }
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const { title, description, points } = entry as Record<string, unknown>;
    if (typeof title !== "string" || title.trim().length === 0) continue;
    const group: ModulePointGroup = { title };
    if (typeof description === "string" && description.trim().length > 0) group.description = description;
    if (Array.isArray(points)) {
      const strings = points.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
      if (strings.length > 0) group.points = strings;
    }
    out.push(group);
  }
  return out.length > 0 ? out : null;
}
