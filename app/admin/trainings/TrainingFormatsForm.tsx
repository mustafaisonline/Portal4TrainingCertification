"use client";

import { useActionState, useState } from "react";
import { replaceTrainingFormatsAction, type FormState } from "@/modules/catalogue/programmes/admin.actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, TextAreaField } from "@/shared/ui/forms";

/*
 * Pace formats (M12 WP2) — the "Choose your pace" cards (Bootcamp /
 * Accelerator / Mastery) and what an offering can be scheduled under.
 * Posted as one JSON field, like the curriculum. A format that dates are
 * scheduled under cannot be removed (the server refuses and says why).
 */
export type FormatRow = { name: string; badge: string; durationLabel: string; scheduleLabel: string; totalTimeLabel: string; bestForText: string };

const initial: FormState<Record<string, string>> = { status: "idle" };
const blank = (): FormatRow => ({ name: "", badge: "", durationLabel: "", scheduleLabel: "", totalTimeLabel: "", bestForText: "" });

export function TrainingFormatsForm({ id, slug, formats }: { id: string; slug: string; formats: FormatRow[] }) {
  const [state, action, pending] = useActionState(replaceTrainingFormatsAction, initial);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const [rows, setRows] = useState<FormatRow[]>(formats);
  const update = (i: number, patch: Partial<FormatRow>) => setRows((r) => r.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  return (
    <form action={action} aria-label="Edit pace formats" className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="formatsJson" value={JSON.stringify(rows)} />
      {rows.length === 0 ? <p className="text-body-sm text-[var(--color-ink-quiet)]">No pace formats. The training page then shows no "Choose your pace" section; dates are scheduled without a format.</p> : null}
      {rows.map((f, i) => (
        <fieldset key={i} className="flex flex-col gap-4 rounded-[var(--radius-plate)] border border-[var(--color-line)] p-4" data-testid="format-row">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-label">Format {i + 1}</legend>
            <Button type="button" variant="text" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} aria-label={`Remove format ${i + 1}`}>
              Remove
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" type="text" required maxLength={300} error={errors[`${i}.name`]} value={f.name} onChange={(e) => update(i, { name: e.target.value })} />
            <Field label="Badge" type="text" optional maxLength={300} hint="e.g. Most popular" value={f.badge} onChange={(e) => update(i, { badge: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Duration" type="text" required maxLength={300} hint="e.g. 2 days" error={errors[`${i}.durationLabel`]} value={f.durationLabel} onChange={(e) => update(i, { durationLabel: e.target.value })} />
            <Field label="Schedule" type="text" required maxLength={300} hint="e.g. 8 hours per day" error={errors[`${i}.scheduleLabel`]} value={f.scheduleLabel} onChange={(e) => update(i, { scheduleLabel: e.target.value })} />
            <Field label="Total time" type="text" required maxLength={300} hint="e.g. 16 hours" error={errors[`${i}.totalTimeLabel`]} value={f.totalTimeLabel} onChange={(e) => update(i, { totalTimeLabel: e.target.value })} />
          </div>
          <TextAreaField label="Best for" rows={3} optional hint="One line each." value={f.bestForText} onChange={(e) => update(i, { bestForText: e.target.value })} />
        </fieldset>
      ))}
      <div>
        <Button type="button" variant="secondary" onClick={() => setRows((r) => [...r, blank()])} data-testid="format-add">
          Add a format
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="training-formats-save">
          {pending ? "Saving…" : "Save formats"}
        </Button>
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "saved" ? <FormStatus tone="success">Your changes have been saved.</FormStatus> : null}
      </div>
    </form>
  );
}
