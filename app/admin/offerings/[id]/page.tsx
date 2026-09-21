import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { formatCalendarDate } from "@/modules/catalogue/offerings/dates";
import { findOfferingById } from "@/modules/catalogue/offerings/repository";
import { listDeliveryFormatsForAdmin, listProgrammesForAdmin } from "@/modules/catalogue/programmes/repository";
import { Card } from "@/shared/ui/Card";
import { OfferingForm } from "../OfferingForm";

/*
 * PORTED 2026-09-21 (header structure only) from
 * project-artifacts/mockup/app/admin/offerings/[id]/page.tsx (ADR-045).
 * Changed: the wireframe's sample roster, sessions, attendance and disabled
 * action buttons are not ported (M8); the page is the edit form for one
 * REAL offering, pre-filled from the database. Unknown id → 404.
 */
export const metadata: Metadata = { title: "Edit offering" };

export default async function EditOfferingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offering = await findOfferingById(id);
  if (!offering) notFound();
  const [programmes, formats, experts] = await Promise.all([
    listProgrammesForAdmin(),
    listDeliveryFormatsForAdmin(),
    listPublishedExperts(),
  ]);
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
