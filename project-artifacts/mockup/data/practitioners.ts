/**
 * Practitioners who deliver programmes — GENUINE people only, ever.
 *
 * DR-02 §7 and the P01 specification (docs/design/
 * P01_HOMEPAGE_REDESIGN_SPECIFICATION.md §8) bind this file:
 * - No fabricated practitioner may ever be added — not for visual balance,
 *   not for marketing, not to appear larger.
 * - The structure is deliberately plural: adding a real practitioner is a
 *   data operation plus content, never a redesign. The homepage renders
 *   exactly as many entries as exist here.
 *
 * Every fact below is sourced from the founder's own résumé in the
 * repository and his authorized public profiles (spec §8.4 Tier 1 /
 * §18). Current employer is deliberately omitted (spec §8.6, open item
 * HO-14). Volatile counts (followers, episodes, books) are deliberately
 * omitted (spec §8.4 Tier 2).
 */
export type Practitioner = {
  slug: string;
  name: string;
  /** Role on this platform — a platform designation, not an employer title. */
  role: string;
  /** Path under public/. Genuine photograph only; AI-generated or stock
   *  imagery is prohibited (spec §16.2–16.3). */
  photo: string;
  location: string;
  facts: string[];
};

export const practitioners: Practitioner[] = [
  {
    slug: "mustafa-qizilbash",
    name: "Mustafa Qizilbash",
    role: "Founder & Lead Trainer",
    photo: "/experts/mustafa-qizilbash.jpg",
    location: "Kuala Lumpur, Malaysia · delivers internationally",
    facts: [
      "24+ years of international experience in enterprise data and analytics",
      "Enterprise delivery across banking, energy, telecom, government and enterprise sectors",
      "Author of books on data engineering, AI and enterprise architecture",
      "Host of the Let’s Talk About Data! podcast, in conversation with global data & AI leaders",
      "DAMA CDMP certified, alongside project management and data governance credentials",
    ],
  },
];
