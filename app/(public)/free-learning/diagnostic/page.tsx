import type { Metadata } from "next";
import { bankSize } from "@/modules/free-learning/knowledge-check.repository";
import { DIAGNOSTIC_QUESTION_COUNT } from "@/shared/signature/diagnostic";
import { Card } from "@/shared/ui/Card";
import { DiagnosticFlow } from "./DiagnosticFlow";

/*
 * PORTED 2026-09-21 from project-artifacts/mockup/app/diagnostic/page.tsx
 * (ADR-045); REWIRED 2026-09-28 (founder's "New change" item 1): the ten
 * questions no longer come from the fixed seeded scenario set
 * (`@/modules/catalogue/diagnostic/repository`, now unused by this page) —
 * every press of the start button draws a fresh random ten from the
 * reviewed Free Learning question bank through the colocated server action.
 * This server page only checks the bank is big enough, so an empty or
 * too-small bank is an honest message rather than a broken start button.
 * The page's only advertised entry point is the home page's own band —
 * the "New change" removed its links from /free-trainings and /programs.
 * Own `<PublicShell>` wrapper dropped (the (public) layout provides it).
 */

export const metadata: Metadata = {
  title: "Free skill diagnostic",
  description:
    "Ten questions drawn fresh from the Knowledge Hub's question bank. Free, no timer, and \"I'm not sure\" is always an option.",
};

export const dynamic = "force-dynamic";

export default async function DiagnosticPage() {
  // The same bank the Knowledge Check counts — reviewed questions of
  // published topics. The real set is drawn per start, by the action.
  const bank = await bankSize();

  if (bank < DIAGNOSTIC_QUESTION_COUNT) {
    return (
      <div className="mx-auto max-w-[720px] px-6 py-16">
        <p className="text-label mb-3 text-[var(--color-primary)]">Free skill diagnostic</p>
        <h1 className="text-h1 mb-6">Not sure where you stand?</h1>
        <Card variant="plate" className="p-6">
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            The diagnostic question bank is not available right now. Please check back later.
          </p>
        </Card>
      </div>
    );
  }

  return <DiagnosticFlow />;
}
