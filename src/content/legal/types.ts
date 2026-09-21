/*
 * Legal document content type — added 2026-09-21, founder direction: draft
 * the Terms of service, Privacy policy and Refund & cancellation policy as
 * CLEARLY-LABELLED DRAFTS for review by a Malaysian-qualified lawyer.
 *
 * Content, not records: these documents are page copy the founder and counsel
 * revise and then publish; nobody creates or edits them at runtime, so they
 * live as typed content modules (the same reasoning as src/content/hrd-corp.ts)
 * rather than as table rows.
 *
 * `status: "draft"` is load-bearing. LegalDocumentView renders a prominent
 * "not yet in force" notice whenever it is set, and registration remains
 * gated on LEGAL_DOCUMENT_VERSIONS (src/modules/identity/legal-documents.ts)
 * naming a PUBLISHED version — a draft here never opens registration.
 */

export type LegalDocumentKey = "terms" | "privacy" | "refund";

export type LegalDocumentStatus = "draft" | "published";

export interface LegalSection {
  /** Numbered, sentence-case heading, e.g. "3. Your account". */
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  /** A small table, used for the refund schedule. */
  table?: {
    caption: string;
    columns: string[];
    rows: string[][];
  };
}

export interface LegalDocument {
  key: LegalDocumentKey;
  title: string;
  /** A draft carries a DRAFT- prefixed version so it can never be mistaken
   *  for (or configured as) a published version by accident. */
  version: string;
  status: LegalDocumentStatus;
  /** ISO date (YYYY-MM-DD). */
  lastUpdated: string;
  /** One or two plain sentences shown beneath the title. */
  summary: string;
  sections: LegalSection[];
}

/** Square-bracket placeholders the founder must complete before any of the
 *  three drafts can be published. Shared so each "About this draft" section
 *  and the test refer to the same list. */
export const LEGAL_PLACEHOLDERS = [
  "[SSM registration number]",
  "[registered business address]",
  "[contact email]",
  "[data protection contact / officer]",
  "[phone number]",
  "[effective date]",
  "[SST registration status]",
] as const;
