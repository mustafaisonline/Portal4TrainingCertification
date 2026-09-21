import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/modules/identity/session";
import { Card } from "@/shared/ui/Card";

/*
 * L05 — Skills profile.
 * PORTED 2026-09-21 from project-artifacts/mockup/app/account/skills/page.tsx
 * (ADR-045). Changed: server component on the real session. The wireframe
 * drew the diagnostic's canned fixture "A" (five capability levels, gap
 * statements, a sample attempt date) — not computed from anyone's answers;
 * none of it is ported. Diagnostic results are not yet recorded against an
 * account, so the screen says so and points at the free diagnostic.
 */
export const metadata: Metadata = { title: "Skills profile" };

export default async function SkillsProfilePage() {
  await requireUser("/account/skills");
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Skills profile</p>
        <h1 className="text-display">Where you stand</h1>
      </header>
      <Card variant="panel" className="p-6 sm:p-8">
        <p className="text-body-lg font-medium">Your skills profile is not available yet.</p>
        <Link
          href="/diagnostic"
          className="text-body-sm mt-3 inline-block py-2 text-[var(--color-primary)] underline underline-offset-4"
        >
          Take the free diagnostic
        </Link>
      </Card>
    </div>
  );
}
