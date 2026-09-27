import type { Metadata } from "next";
import { listDiagnosticQuestions } from "@/modules/catalogue/diagnostic/repository";
import { Card } from "@/shared/ui/Card";
import { DiagnosticFlow } from "./DiagnosticFlow";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/diagnostic/page.tsx (ADR-045)
 * Changed: split into this server page (loads the fixed question set from the
 * database via the repository) and the colocated client `DiagnosticFlow`,
 * which carries the mockup page's walkthrough logic. The mockup's hardcoded
 * `data/questions` and its canned `selectFixture` result routing are NOT
 * ported — on finish the flow hands the raw answers to /diagnostic/result
 * through the shared per-browser record in `@/shared/signature/diagnostic`.
 * Own `<PublicShell>` wrapper dropped (the (public) layout provides it).
 */

export const metadata: Metadata = {
  title: "Free skill diagnostic",
  description:
    "Ten scenario questions across the Academy's capability areas. Free, no timer, and \"I'm not sure\" is always an option.",
};

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  const records = await listDiagnosticQuestions();

  if (records.length === 0) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Free skill diagnostic</p>
        <h1 className="text-h1 mb-6">Not sure where you stand?</h1>
        <Card variant="plate" className="p-6">
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            The diagnostic question set is not available right now. Please check back later.
          </p>
        </Card>
      </div>
    );
  }

  const questions = records.map((q) => ({
    code: q.code,
    scenario: q.scenario,
    options: q.options,
    domainCode: q.domain.code,
    domainName: q.domain.name,
  }));

  return <DiagnosticFlow questions={questions} />;
}
