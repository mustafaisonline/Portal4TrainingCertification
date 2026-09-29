/*
 * "380+" / "3,800+" — a count rounded DOWN to a step and marked with a plus,
 * so a headline number is always true: 383 topics reads "380+", never "400+".
 *
 * Milestone 15, Requirement 1 (founder, 2026-09-29): the home page says
 * "380+ topics" and "3,800+ questions", but those figures are read from the
 * database at request time and formatted here — never typed into the page —
 * so they stay honest as the book and the question bank change.
 *
 *   plusCount(383, 10)   → "380+"
 *   plusCount(3830, 100) → "3,800+"
 *   plusCount(380, 10)   → "380"      (an exact multiple is stated exactly, no plus)
 *   plusCount(7, 10)     → "7"        (below one step: the exact number, no plus)
 *   plusCount(0, 10)     → null       (nothing to claim — callers omit the figure)
 */
export function plusCount(count: number, step: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  if (count < step) return String(Math.floor(count));
  const rounded = Math.floor(count / step) * step;
  return `${rounded.toLocaleString("en-US")}${rounded < count ? "+" : ""}`;
}
