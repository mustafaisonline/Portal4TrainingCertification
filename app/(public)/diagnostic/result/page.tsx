import type { Metadata } from "next";
import { findFlagshipProgramme } from "@/modules/catalogue/programmes/repository";
import { DiagnosticResultView } from "./DiagnosticResultView";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/diagnostic/result/page.tsx (ADR-045)
 * Changed: canned result fixtures NOT ported; page shows an answer summary.
 * The mockup rendered one of two invented fixtures (`data/results.ts`: a
 * score, proficiency profile, named gaps, recommended path with a price,
 * "what you already have", and a peer benchmark) plus invented role targets
 * (`data/roles.ts`), selected by `?fixture=`. None of that is computed by
 * anything, so none of it is here. This server page resolves the programme
 * CTA through the repository and renders the colocated client
 * `DiagnosticResultView`, which reads the completed answers the walkthrough
 * left in the shared per-browser record and reports counts per capability
 * area. Own `<PublicShell>` wrapper dropped.
 */

export const metadata: Metadata = {
  title: "Diagnostic result",
  description: "A record of what you answered on the free skill diagnostic.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DiagnosticResultPage() {
  const programme = await findFlagshipProgramme();
  // 2026-09-26: the catalogue lives at /programs ("Trainings"); the CTA
  // deep-links the flagship's own page, or the hub when none is published.
  const programmeHref = programme ? `/programs/${programme.slug}` : "/programs";
  const programmeLabel = programme ? `Explore ${programme.title}` : "Explore the trainings";

  return <DiagnosticResultView programmeHref={programmeHref} programmeLabel={programmeLabel} />;
}
