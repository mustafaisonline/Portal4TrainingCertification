import type { ReactNode } from "react";
import Link from "next/link";
import { forbidden, notFound, redirect } from "next/navigation";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { PROGRAMME_STATUS_LABEL } from "@/modules/catalogue/programmes/constants";
import { getTrainingForAdmin } from "@/modules/catalogue/programmes/admin.repository";
import { Chip } from "@/shared/ui/Chip";
import { TrainingTabs } from "../TrainingTabs";

/*
 * One training's workspace (M12 WP2): header with its status and public
 * link, then the tabs — Details · Content · Curriculum · Formats · Fees ·
 * Dates. The gate runs here AND in every page/action below: a training
 * outside the caller's scope is a 404, never a hint that it exists.
 */
export default async function TrainingLayout({ children, params }: { children: ReactNode; params: Promise<{ id: string }> }) {
  const access = await trainingAccess();
  const { id } = await params;
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/trainings/${id}`)}`);
    forbidden();
  }
  const training = await getTrainingForAdmin(id, access.scope);
  if (!training) notFound();
  return (
    <div className="flex flex-col gap-6" data-testid="training-workspace" data-training-id={training.id}>
      <header>
        <Link href="/admin/trainings" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Trainings
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Training</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-display" data-testid="training-title">
            {training.title}
          </h1>
          <Chip tone={training.status === "published" ? "primary" : "neutral"}>{PROGRAMME_STATUS_LABEL[training.status]}</Chip>
        </div>
        <p className="text-body-sm mt-2 text-[var(--color-ink-quiet)]">
          <span className="text-mono">/programs/{training.slug}</span>
          {training.status === "published" ? (
            <>
              {" · "}
              <Link href={`/programs/${training.slug}`} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="training-public-link">
                View public page
              </Link>
            </>
          ) : (
            " · not visible to the public until published"
          )}
        </p>
      </header>
      <TrainingTabs id={training.id} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
