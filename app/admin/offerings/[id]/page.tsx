import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { formatCalendarDate } from "@/modules/catalogue/offerings/dates";
import { findOfferingById } from "@/modules/catalogue/offerings/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { canManageTraining, listTrainings } from "@/modules/catalogue/programmes/admin.repository";
import { listDeliveryFormatsForAdmin, listProgrammesForAdmin } from "@/modules/catalogue/programmes/repository";
import { getPrisma } from "@/db/prisma";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { OfferingForm } from "../OfferingForm";

/*
 * PORTED 2026-09-21 (header structure only) from
 * project-artifacts/mockup/app/admin/offerings/[id]/page.tsx (ADR-045).
 * Changed: the wireframe's sample roster, sessions, attendance and disabled
 * action buttons are not ported (M8); the page is the edit form for one
 * REAL offering, pre-filled from the database. Unknown id → 404.
 * Milestone 12 (L7): a date of a training outside the caller's scope is a
 * 404 too, and a Trainer can only move it between their own trainings.
 */
export const metadata: Metadata = { title: "Edit offering" };
export const dynamic = "force-dynamic";

export default async function EditOfferingPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await trainingAccess();
  const { id } = await params;
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/offerings/${id}`)}`);
    forbidden();
  }
  const offering = await findOfferingById(id);
  if (!offering || !(await canManageTraining(getPrisma(), access.scope, offering.programmeId))) notFound();
  const [allProgrammes, formats, experts] = await Promise.all([
    listProgrammesForAdmin(),
    listDeliveryFormatsForAdmin(),
    listPublishedExperts(),
  ]);
  const programmes = access.isAdmin ? allProgrammes : await listTrainings(access.scope).then((mine) => allProgrammes.filter((p) => mine.some((t) => t.id === p.id)));
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/offerings" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Scheduled offerings
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Offering</p>
        <h1 className="text-display">
          {offering.format?.name ?? offering.programmeTitle} · {formatCalendarDate(offering.startsOn)}
        </h1>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">{offering.programmeTitle}</p>
        {access.isAdmin ? (
          <div className="mt-4">
            {/* M6: the roster with "Record completion" lives on its own screen (administrators). */}
            <Button variant="secondary" href={`/admin/offerings/${offering.id}/participants`} data-testid="offering-participants-link">
              Participants & completion
            </Button>
          </div>
        ) : null}
      </header>
      <Card variant="panel" className="max-w-[760px] p-6">
        <OfferingForm
          offering={offering}
          programmes={programmes}
          formats={formats}
          experts={experts.map((x) => ({ id: x.id, name: x.name }))}
        />
      </Card>
    </div>
  );
}
