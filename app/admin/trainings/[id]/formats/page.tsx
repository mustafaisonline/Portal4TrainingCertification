import type { Metadata } from "next";
import { forbidden, notFound, redirect } from "next/navigation";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { getTrainingForAdmin } from "@/modules/catalogue/programmes/admin.repository";
import { Card } from "@/shared/ui/Card";
import { TrainingFormatsForm } from "../../TrainingFormatsForm";

export const metadata: Metadata = { title: "Pace formats" };
export const dynamic = "force-dynamic";

export default async function TrainingFormatsPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await trainingAccess();
  const { id } = await params;
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/trainings/${id}/formats`)}`);
    forbidden();
  }
  const training = await getTrainingForAdmin(id, access.scope);
  if (!training) notFound();
  return (
    <Card variant="panel" className="max-w-[960px] p-6">
      <TrainingFormatsForm
        id={training.id}
        slug={training.slug}
        formats={training.deliveryFormats.map((f) => ({
          name: f.name,
          badge: f.badge ?? "",
          durationLabel: f.durationLabel,
          scheduleLabel: f.scheduleLabel,
          totalTimeLabel: f.totalTimeLabel,
          bestForText: f.bestFor.join("\n"),
        }))}
      />
    </Card>
  );
}
