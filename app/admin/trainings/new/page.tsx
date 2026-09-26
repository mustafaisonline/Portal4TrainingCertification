import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, redirect } from "next/navigation";
import { listDomains } from "@/modules/catalogue/domains/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { Card } from "@/shared/ui/Card";
import { TrainingDetailsForm } from "../TrainingDetailsForm";

/* New training (M12 WP2) — created as a DRAFT; a Trainer creating it is
   linked as its lead expert. Content, curriculum, formats, fees and dates
   are added on the training's own tabs once it exists. */
export const metadata: Metadata = { title: "New training" };
export const dynamic = "force-dynamic";

export default async function NewTrainingPage() {
  const access = await trainingAccess();
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent("/admin/trainings/new")}`);
    forbidden();
  }
  const domains = await listDomains();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/trainings" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Trainings
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Training</p>
        <h1 className="text-display">New training</h1>
        <p className="text-body-sm mt-2 max-w-[70ch] text-[var(--color-ink-quiet)]">
          The essentials first. The training is saved as a draft; you then add its sections, curriculum, pace formats, fees and dates.
        </p>
      </header>
      <Card variant="panel" className="max-w-[860px] p-6">
        <TrainingDetailsForm domains={domains.map((d) => ({ id: d.id, name: d.name }))} />
      </Card>
    </div>
  );
}
