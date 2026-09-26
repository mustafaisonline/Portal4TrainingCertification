import type { Metadata } from "next";
import { forbidden, notFound, redirect } from "next/navigation";
import { listDomains } from "@/modules/catalogue/domains/repository";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { FEE_REGIONS } from "@/modules/catalogue/programmes/constants";
import { getTrainingForAdmin } from "@/modules/catalogue/programmes/admin.repository";
import { Card } from "@/shared/ui/Card";
import { TrainingDetailsForm } from "../TrainingDetailsForm";
import { TrainingStatusForm } from "../TrainingStatusForm";

/* Details tab (M12 WP2): the typed columns, and — for administrators — the
   visibility control with a readiness check (L2). */
export const metadata: Metadata = { title: "Training details" };
export const dynamic = "force-dynamic";

export default async function TrainingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const access = await trainingAccess();
  const { id } = await params;
  if (!access.ok) {
    if (access.reason === "signed-out") redirect(`/sign-in?return-to=${encodeURIComponent(`/admin/trainings/${id}`)}`);
    forbidden();
  }
  const [training, domains] = await Promise.all([getTrainingForAdmin(id, access.scope), listDomains()]);
  if (!training) notFound();

  const missing: string[] = [];
  if (training.modules.length === 0) missing.push("no curriculum modules");
  if (training.feeRows.length < FEE_REGIONS.length) missing.push(`${training.feeRows.length} of ${FEE_REGIONS.length} fee rows`);
  if (training.content.highlights.some((h) => /to be written/i.test(h)) || /to be written/i.test(training.content.whoShouldAttend.intro)) missing.push("sections still hold placeholder text");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card variant="panel" className="p-6">
        <TrainingDetailsForm
          domains={domains.map((d) => ({ id: d.id, name: d.name }))}
          training={{
            id: training.id,
            title: training.title,
            subtitle: training.subtitle,
            slug: training.slug,
            domainId: training.domainId,
            level: training.level,
            flagship: training.flagship,
            durationLabel: training.durationLabel,
            prerequisites: training.prerequisites,
            formats: training.formats.join("\n"),
            certificateLabel: training.certificateLabel,
            audienceSummary: training.audienceSummary,
            summary: training.summary,
            valueProposition: training.valueProposition,
            sortOrder: String(training.sortOrder),
            published: training.status === "published",
          }}
        />
      </Card>
      <div className="flex flex-col gap-6">
        <Card variant="panel" className="p-6" data-testid="training-visibility">
          <h2 className="text-h2 mb-1">Visibility</h2>
          {access.isAdmin ? (
            <TrainingStatusForm id={training.id} slug={training.slug} status={training.status} ready={{ ok: missing.length === 0, missing }} />
          ) : (
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="training-status-readonly">
              Only an administrator can publish a training. When yours is ready — sections written, curriculum, the four fee rows and a date — ask an administrator to publish it.
              {missing.length ? ` Still needed: ${missing.join(" · ")}.` : ""}
            </p>
          )}
        </Card>
        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-2">Trainers</h2>
          {training.experts.length === 0 ? (
            <p className="text-body-sm text-[var(--color-ink-quiet)]">No trainer linked yet.</p>
          ) : (
            <ul className="text-body-sm flex flex-col gap-1">
              {training.experts.map((e) => (
                <li key={e.id}>
                  {e.name} <span className="text-[var(--color-ink-faint)]">· {e.roleTitle}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
