/*
 * Published legal documents — the consent gate (MILESTONE_2_EXECUTION_PLAN.md
 * §6.9). Registration stores a person's name and email, and consent must be
 * recorded against a document version that exists (G0-13: "B2 is required
 * the moment a form stores a name"). The documents are legal instruments the
 * founder and counsel publish — never drafted here (§0.1 default 6).
 *
 * Configuration, not code: LEGAL_DOCUMENT_VERSIONS is JSON naming the
 * published version of each required document, e.g.
 *   {"terms":"2026-10-01","privacy":"2026-10-01"}
 * It lives in the environment / platform secret store (ADR-030), so it
 * survives restarts (Rule 6) and can change without a deploy. While it is
 * absent or incomplete, registration is CLOSED and the register screen says
 * why — the same convention the wireframe's BlockedConsent used.
 */

export const REQUIRED_DOCUMENTS = ["terms", "privacy"] as const;
export type DocumentKey = (typeof REQUIRED_DOCUMENTS)[number];

export type PublishedDocuments = Readonly<Record<DocumentKey, string>>;

const VERSION_RE = /^[A-Za-z0-9._-]{1,64}$/;

/** Parses the configured versions. Returns null unless EVERY required
 *  document has a well-formed version — a partial set is treated as
 *  unpublished, deliberately. */
export function parsePublishedDocuments(raw: string | undefined | null): PublishedDocuments | null {
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const out: Partial<Record<DocumentKey, string>> = {};
  for (const key of REQUIRED_DOCUMENTS) {
    const v = (parsed as Record<string, unknown>)[key];
    if (typeof v !== "string" || !VERSION_RE.test(v)) return null;
    out[key] = v;
  }
  return out as PublishedDocuments;
}

/** The live setting. Read per call (not cached at import) so tests and a
 *  changed environment are honoured without a restart of the module graph. */
export function publishedDocuments(): PublishedDocuments | null {
  return parsePublishedDocuments(process.env["LEGAL_DOCUMENT_VERSIONS"]);
}

export function registrationOpen(): boolean {
  return publishedDocuments() !== null;
}

/** The public routes of the documents, for the consent sentence. */
export const DOCUMENT_ROUTES: Readonly<Record<DocumentKey, { href: string; label: string }>> = {
  terms: { href: "/terms", label: "Terms of service" },
  privacy: { href: "/privacy", label: "Privacy policy" },
};
