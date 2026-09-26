import type { Metadata } from "next";
import { forbidden, notFound, redirect } from "next/navigation";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { getTrainingForAdmin } from "@/modules/catalogue/programmes/admin.repository";
import { contentToForm } from "@/modules/catalogue/programmes/content-codec";
import { Card } from "@/shared/ui/Card";
import { TrainingContentForm } from "../../TrainingContentForm";

export const metadata: Metadata = { title: "Training sections" };
export const dynamic = "force-dynamic";

export default async function TrainingContentPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await trainingAccess();
  const { id } = await params;
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/trainings/${id}/content`)}`);
    forbidden();
  }
  const training = await getTrainingForAdmin(id, access.scope);
  if (!training) notFound();
  return (
    <Card variant="panel" className="max-w-[960px] p-6">
      <p className="text-body-sm mb-6 max-w-[70ch] text-[var(--color-ink-quiet)]">
        Every section the public training page renders. Lists are one item per line; the hint under each field gives its format. Sections left blank are simply not shown.
      </p>
      <TrainingContentForm id={training.id} slug={training.slug} form={contentToForm(training.content)} />
    </Card>
  );
}
