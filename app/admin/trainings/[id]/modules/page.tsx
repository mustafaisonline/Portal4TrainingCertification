import type { Metadata } from "next";
import { forbidden, notFound, redirect } from "next/navigation";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { getTrainingForAdmin } from "@/modules/catalogue/programmes/admin.repository";
import { modulePointsToText } from "@/modules/catalogue/programmes/content-codec";
import { Card } from "@/shared/ui/Card";
import { TrainingModulesForm } from "../../TrainingModulesForm";

export const metadata: Metadata = { title: "Curriculum" };
export const dynamic = "force-dynamic";

export default async function TrainingModulesPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await trainingAccess();
  const { id } = await params;
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/trainings/${id}/modules`)}`);
    forbidden();
  }
  const training = await getTrainingForAdmin(id, access.scope);
  if (!training) notFound();
  return (
    <Card variant="panel" className="max-w-[960px] p-6">
      <TrainingModulesForm
        id={training.id}
        slug={training.slug}
        modules={training.modules.map((m) => ({ title: m.title, description: m.description ?? "", pointsText: modulePointsToText(m.points) }))}
      />
    </Card>
  );
}
