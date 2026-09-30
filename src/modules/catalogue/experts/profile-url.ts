/*
 * The ONE decision about where a trainer's name may link (founder,
 * 2026-09-30, modification.md M7): trainers have no dedicated page on this
 * portal any more, so a name links ONLY to the trainer's own external
 * profile — Medium first, else LinkedIn — and to nothing at all when there is
 * none ("if there is no URL, then remove the link"). Every place that shows a
 * trainer's name (training cards/pages, the on-screen certificate) and the
 * old top-level trainer URL's redirect call this, so the rule cannot drift.
 *
 * Pure (no database import). The stored value is free text a person typed
 * into the profile, so only a well-formed `https:` URL without embedded
 * credentials is ever returned — never `javascript:`, `http:`, `data:`, a
 * relative path or garbage.
 */

type HasProfileUrls = { profile?: { mediumProfile?: unknown; linkedin?: unknown } | null } | null | undefined;

function safeHttps(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  // The parser is forgiving (it turns "https:///host" into "https://host/"), so
  // insist the text itself is `https://` followed directly by a host.
  if (!/^https:\/\/[^/\s]/i.test(trimmed)) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.hostname === "" || url.username !== "" || url.password !== "") return null;
  return url.href;
}

/** The trainer's external profile URL — Medium, else LinkedIn — or null. */
export function trainerProfileUrl(expert: HasProfileUrls): string | null {
  const profile = expert?.profile;
  if (!profile) return null;
  return safeHttps(profile.mediumProfile) ?? safeHttps(profile.linkedin);
}
