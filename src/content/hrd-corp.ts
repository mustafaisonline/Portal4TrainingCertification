/*
 * HRD Corp context — organisation-level facts for /hrd-corp.
 * PORTED VERBATIM 2026-09-21 from project-artifacts/mockup/data/hrdCorp.ts
 * (ADR-045). Kept as a typed content module rather than a table: these are
 * statements about the provider and the scheme, i.e. page copy, not records
 * anyone creates or edits at runtime. The TRAINER's accreditation is data on
 * the `experts` row.
 *
 * BINDING RULE — do not blur these three statuses, ever:
 * 1. Trainer accreditation — HELD (experts.hrd_corp_accreditation)
 * 2. Registered Training Provider (organisation) — NOT held; application in
 *    progress (founder statement, 2026-09-06)
 * 3. HRD Corp Claimable (per course) — NOT held by any course
 * HRD Corp's logo-usage terms reserve the phrases "HRD Corp Registered
 * Training Provider" / "HRD Corp Claimable" for entities that hold them.
 * Nothing here may use either as a present-tense claim.
 */

export const hrdCorpOrg = {
  legalEntityName: "Your Partner Technologies",
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

/** What HRD Corp is, in general — factual, sourced from hrdcorp.gov.my. */
export const hrdCorpAbout = {
  fullName: "Pembangunan Sumber Manusia Berhad (HRD Corp)",
  ministry: "Ministry of Human Resources, Malaysia",
  summary:
    "HRD Corp is a Malaysian government agency that administers human resource development through levy-based funding — supporting registered employers, registered training providers and individuals with training programmes, assessments and other capability-development support.",
  schemes: [
    {
      name: "HRD Corp Claimable Course",
      description: "Helps registered employers claim back the cost of approved training for their employees.",
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
