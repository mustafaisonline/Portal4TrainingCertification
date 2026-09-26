import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { listTrainings } from "@/modules/catalogue/programmes/admin.repository";
import { listDeliveryFormatsForAdmin, listProgrammesForAdmin } from "@/modules/catalogue/programmes/repository";
import { Card } from "@/shared/ui/Card";
import { OfferingForm } from "../OfferingForm";

/* New offering — the founder creates a real date here; nothing is seeded
   (DR-02 §4.1). Header structure follows the wireframe's `AdminHeader`.
   Milestone 12: a Trainer is offered only their own trainings (L7); "Add a
   date" from a training's Dates tab pre-selects that training. */
export const metadata: Metadata = { title: "New offering" };
export const dynamic = "force-dynamic";

export default async function NewOfferingPage({ searchParams }: { searchParams: Promise<{ programmeId?: string }> }) {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/offerings/new")}`);
    forbidden();
  }
  const [allProgrammes, formats, experts, { programmeId }] = await Promise.all([
    listProgrammesForAdmin(),
    listDeliveryFormatsForAdmin(),
    listPublishedExperts(),
    searchParams,
  ]);
  const mine = access.isAdmin ? null : new Set((await listTrainings(access.scope)).map((t) => t.id));
  const options = mine ? allProgrammes.filter((p) => mine.has(p.id)) : allProgrammes;
  const preselected = options.find((p) => p.id === programmeId)?.id;
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/offerings" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Scheduled offerings
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Offering</p>
        <h1 className="text-display">New offering</h1>
      </header>
      <Card variant="panel" className="max-w-[760px] p-6">
        <OfferingForm programmes={options} formats={formats} experts={experts.map((x) => ({ id: x.id, name: x.name }))} initialProgrammeId={preselected} />
      </Card>
    </div>
  );
}
