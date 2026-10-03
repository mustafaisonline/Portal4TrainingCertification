/*
 * Certificate branding and issuer details — Milestone 15, Requirement 2
 * (founder, 2026-09-29).
 *
 * SUPPLIED BY THE FOUNDER on 2026-09-29 and used verbatim: the YPT logo
 * (`/brand/ypt-logo.jpg`), Company No. 202401023226 (1569075-K) and the
 * registered address. Decisions recorded with them:
 *  - no separate issuer-name text — the logo carries the name;
 *  - NO signature and no signature line: certificates are system-generated, and
 *    the certificate says so (there is no signatory configuration at all);
 *  - no HRD Corp organisation logo on the Free-test certificate. The field
 *    remains for the Professional certificate only, and stays unused until the
 *    founder supplies the asset AND records authorisation (HRD Corp's logo
 *    terms). A certificate NEVER says it is "HRD Corp certified / accredited /
 *    approved" — the only HRD statement it may carry is a TRAINER's own
 *    accreditation, printed beside that trainer.
 *
 * Anything left `null` is omitted from the sheet (never a bracketed
 * placeholder, never an invented value). `certificateBrandGaps()` lists what
 * is still missing so the admin preview can say so plainly.
 */

export type CertificateBrand = {
  /** The issuing organisation, as printed. */
  legalName: string;
  /** Path under /public. */
  logoPath: string | null;
  /** As printed after "Company No." — e.g. "202401023226 (1569075-K)". */
  registrationNumber: string | null;
  address: string | null;
  /** e.g. "<contact address> · yourpartnertechnologies.com" — null: no address is printed (CR-2026-10-03-1246). */
  contactLine: string | null;
  /** Professional certificate only — never used on the Free-test certificate. */
  hrdCorpLogoPath: string | null;
  /** The founder has confirmed authorisation to display the organisation logo. */
  hrdCorpLogoAuthorised: boolean;
};

export const certificateBrand: CertificateBrand = {
  legalName: "Your Partner Technologies",
  logoPath: "/brand/ypt-logo.jpg",
  registrationNumber: "202401023226 (1569075-K)",
  address: "15-03A, One Jelatek Condominium, Jalan Jelatek, Kementah, 54200 Kuala Lumpur W.P. Kuala Lumpur Malaysia",
  contactLine: null,
  hrdCorpLogoPath: null,
  hrdCorpLogoAuthorised: false,
};

/** What the founder still has to supply. The contact line is optional (the
 *  footer reads fully without it), so it is not a gap. */
export function certificateBrandGaps(brand: CertificateBrand = certificateBrand): string[] {
  const gaps: string[] = [];
  if (!brand.logoPath) gaps.push("YPT logo file");
  if (!brand.registrationNumber) gaps.push("YPT company registration number");
  if (!brand.address) gaps.push("YPT registered address");
  if (!brand.hrdCorpLogoPath || !brand.hrdCorpLogoAuthorised) {
    gaps.push("HRD Corp organisation logo + confirmation of authorisation to display it (Professional Training certificate only — not used on the Assessment certification)");
  }
  return gaps;
}
