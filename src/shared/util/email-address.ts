/*
 * One plain-mailbox check for the whole portal (CR-2026-10-03-1226; security
 * review finding H1/M3). Written WITHOUT a regular expression over the input:
 * the earlier `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` backtracks quadratically on a
 * crafted string, so one request could freeze the single-threaded server.
 * Everything here is a single linear pass, and the length is checked first.
 *
 * Accepts "local@domain.tld" only: letters, digits and `. _ + -` in the local part, exactly one "@", no
 * display names, no lists, no quotes, comments or brackets — so what is stored
 * and validated is exactly the one address that mail is sent to (a value like
 * `a,b@c.com` or `<a@b.com>` is refused, never interpreted as several).
 */

export const EMAIL_MAX_LENGTH = 254;

// Deliberately narrow (security review L-B): letters, digits and . _ + - only — no `%` relay form, pipes, quotes or other legacy-MTA oddities.
const LOCAL_EXTRA = new Set("._+-");
const isAlnum = (c: number) => (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122);

export function isPlainEmailAddress(value: string): boolean {
  if (value.length < 6 || value.length > EMAIL_MAX_LENGTH) return false;
  const at = value.indexOf("@");
  if (at < 1 || at !== value.lastIndexOf("@")) return false;

  // Local part: letters, digits and a few symbols; no leading, trailing or doubled dot.
  if (at > 64) return false;
  for (let i = 0; i < at; i++) {
    const code = value.charCodeAt(i);
    if (!isAlnum(code) && !LOCAL_EXTRA.has(value[i]!)) return false;
  }
  if (value[0] === "." || value[at - 1] === "." || value.includes("..")) return false;

  // Domain: dot-separated labels of letters, digits and hyphens; at least two labels; a letters-only top-level label of 2+.
  const domainStart = at + 1;
  let labelStart = domainStart;
  let labels = 0;
  for (let i = domainStart; i <= value.length; i++) {
    const end = i === value.length;
    if (!end && value[i] !== ".") {
      const code = value.charCodeAt(i);
      if (!isAlnum(code) && code !== 45) return false;
      continue;
    }
    const len = i - labelStart;
    if (len < 1 || len > 63 || value[labelStart] === "-" || value[i - 1] === "-") return false;
    labels++;
    if (end) {
      if (len < 2) return false;
      for (let k = labelStart; k < i; k++) if (!isAlnum(value.charCodeAt(k)) || (value.charCodeAt(k) >= 48 && value.charCodeAt(k) <= 57)) return false;
    }
    labelStart = i + 1;
  }
  return labels >= 2;
}
