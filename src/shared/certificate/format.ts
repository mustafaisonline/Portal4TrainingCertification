/*
 * Small, pure helpers for the certificate design (Milestone 15, Req 2).
 */

/** "HH:MM:SS" from a millisecond span. The founder's format for Time Taken;
 *  hours are not capped at 24 (a check left open overnight prints honestly,
 *  e.g. "14:02:11"). Negative or non-finite spans print "00:00:00". */
export function formatTimeTaken(ms: number): string {
  const total = Number.isFinite(ms) && ms > 0 ? Math.floor(ms / 1000) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

/** The size step for a name / title, by length, so a long value shrinks
 *  instead of overflowing its line. `base` is the size for a short value. */
export function fitStep(text: string, thresholds: readonly [number, number]): "base" | "small" | "smaller" {
  const n = text.trim().length;
  if (n > thresholds[1]) return "smaller";
  if (n > thresholds[0]) return "small";
  return "base";
}
