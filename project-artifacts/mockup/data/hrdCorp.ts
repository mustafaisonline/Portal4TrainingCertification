/**
 * HRD Corp context — organisation-level facts, for the dedicated /hrd-corp
 * page. Founder direction, 2026-09-06. See docs/HRD_CORP.md for the full
 * research trail (source: hrdcorp.gov.my, and the founder's own reference
 * archive under `Malaysia - HRD Requirements/`).
 *
 * The TRAINER's accreditation lives on `Practitioner.hrdCorpAccreditation`
 * (data/practitioners.ts) — this file holds only what is true of the
 * organisation and the scheme in general. Keeping them separate mirrors a
 * real distinction HRD Corp itself draws: a trainer can be individually
 * accredited without the company that engages them being an HRD Corp
 * Registered Training Provider, and neither status makes a course
 * "HRD Corp Claimable" on its own — that is a third, per-course status.
 *
 * BINDING RULE — do not blur these three statuses, ever:
 * 1. Trainer accreditation — HELD (see practitioners.ts)
 * 2. Registered Training Provider (organisation) — NOT held; application
 *    in progress (founder statement, 2026-09-06)
 * 3. HRD Corp Claimable (per course) — NOT held by any course; depends on
 *    (2) plus separate course registration via e-TRIS
 *
 * HRD Corp's own logo usage terms (hrdcorp.gov.my/usage-of-hrd-corp-logo)
 * reserve the HRD Corp logo and the phrases "HRD Corp Registered Training
 * Provider" / "HRD Corp Claimable" for entities that actually hold that
 * registration. Nothing here may use either phrase as a present-tense claim
 * about Your Partner Technologies or any course.
 */

export const hrdCorpOrg = {
  legalEntityName: "Your Partner Technologies",
  /** Registration status is a fact about the ORGANISATION, distinct from
   *  the trainer's personal accreditation above. */
  registeredTrainingProvider: {
    status: "in_progress" as const,
    statement:
      "Your Partner Technologies — the training practice behind these courses — has an active application in progress to become an HRD Corp Registered Training Provider. It does not hold that registration today.",
  },
  claimableCourses: {
    status: "none" as const,
    statement:
      "No course on this site is registered as HRD Corp Claimable today. Course-level registration follows organisational registration, via HRD Corp's e-TRiS system.",
  },
};

/** What HRD Corp is, in general — factual, sourced from hrdcorp.gov.my.
 *  Not specific to this organisation. */
export const hrdCorpAbout = {
  fullName: "Pembangunan Sumber Manusia Berhad (HRD Corp)",
  ministry: "Ministry of Human Resources, Malaysia",
  summary:
    "HRD Corp is a Malaysian government agency that administers human resource development through levy-based funding — supporting registered employers, registered training providers and individuals with training programmes, assessments and other capability-development support.",
  schemes: [
    {
      name: "HRD Corp Claimable Course",
      description:
        "Helps registered employers claim back the cost of approved training for their employees.",
    },
    {
      name: "Training Facilities & Renovation (ALAT)",
      description: "Funds training-room setup and enhancement.",
    },
    {
      name: "Industrial Training Scheme (ITS)",
      description: "Financial assistance for undergraduate trainees.",
    },
  ],
};
