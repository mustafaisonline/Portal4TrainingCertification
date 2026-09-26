"use client";

import { useActionState, useId, useState } from "react";
import { PROGRAMME_STATUS_LABEL } from "@/modules/catalogue/programmes/constants";
import { setTrainingStatusAction, type FormState } from "@/modules/catalogue/programmes/admin.actions";
import type { ProgrammeStatus } from "@/modules/catalogue/programmes/types";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * Publish / unpublish / retire (M12 WP2, decision L2: administrators only —
 * the server action refuses anyone else; Trainers see the read-only note
 * rendered by the page instead of this form). Publishing needs a ticked
 * confirmation: it puts a price and a date in front of the public.
 */
const initial: FormState<{ status?: string }> = { status: "idle" };

export function TrainingStatusForm({ id, slug, status, ready }: { id: string; slug: string; status: ProgrammeStatus; ready: { ok: boolean; missing: string[] } }) {
  const [state, action, pending] = useActionState(setTrainingStatusAction, initial);
  const [confirmed, setConfirmed] = useState(false);
  const confirmId = useId();
  const next: ProgrammeStatus = status === "published" ? "unlisted" : "published";
  return (
    <form action={action} className="flex flex-col gap-3" data-testid="training-status-form" aria-label="Change visibility">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="status" value={next} />
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        Currently <strong className="text-[var(--color-ink)]">{PROGRAMME_STATUS_LABEL[status]}</strong>.{" "}
        {status === "published"
          ? "Unpublishing removes it from the Trainings page and its own page returns 404; existing registrations are untouched."
          : "Publishing lists it on the Trainings page and makes its page, prices and open dates public."}
      </p>
      {next === "published" && !ready.ok ? (
        <p className="text-body-sm text-[var(--color-danger)]" data-testid="training-not-ready">
          Not ready to publish: {ready.missing.join(" · ")}.
        </p>
      ) : null}
      <div className="flex items-start gap-2">
        <input id={confirmId} type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 h-4 w-4" data-testid="training-status-confirm" />
        <label htmlFor={confirmId} className="text-body-sm text-[var(--color-ink)]">
          I want to {next === "published" ? "publish" : "unpublish"} this training
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant={next === "published" ? "primary" : "secondary"} disabled={pending || !confirmed || (next === "published" && !ready.ok)} data-testid="training-status-submit">
          {pending ? "Saving…" : next === "published" ? "Publish" : "Unpublish"}
        </Button>
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "saved" ? <FormStatus tone="success">Visibility changed.</FormStatus> : null}
      </div>
    </form>
  );
}
