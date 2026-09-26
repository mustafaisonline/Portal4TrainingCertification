"use client";

import { useActionState, useState } from "react";
import { replaceTrainingModulesAction, type FormState } from "@/modules/catalogue/programmes/admin.actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, TextAreaField } from "@/shared/ui/forms";

/*
 * Curriculum editor (M12 WP2): the modules in order, each with a title, an
 * optional description and its points — "## Group title" and "> group
 * description" lines make a group (the flagship's two-module curriculum
 * uses them). Rows are client state and posted as ONE JSON field so the
 * server sees the whole ordered list at once.
 */
export type ModuleRow = { title: string; description: string; pointsText: string };

const initial: FormState<Record<string, string>> = { status: "idle" };

export function TrainingModulesForm({ id, slug, modules }: { id: string; slug: string; modules: ModuleRow[] }) {
  const [state, action, pending] = useActionState(replaceTrainingModulesAction, initial);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const [rows, setRows] = useState<ModuleRow[]>(modules.length ? modules : [{ title: "", description: "", pointsText: "" }]);
  const update = (i: number, patch: Partial<ModuleRow>) => setRows((r) => r.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const move = (i: number, d: -1 | 1) =>
    setRows((r) => {
      const j = i + d;
      if (j < 0 || j >= r.length) return r;
      const copy = [...r];
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      return copy;
    });
  return (
    <form action={action} aria-label="Edit curriculum" className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="modulesJson" value={JSON.stringify(rows)} />
      {rows.map((m, i) => (
        <fieldset key={i} className="flex flex-col gap-4 rounded-[var(--radius-plate)] border border-[var(--color-line)] p-4" data-testid="module-row">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-label">Module {i + 1}</legend>
            <div className="flex gap-2">
              <Button type="button" variant="text" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move module ${i + 1} up`}>
                ↑
              </Button>
              <Button type="button" variant="text" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label={`Move module ${i + 1} down`}>
                ↓
              </Button>
              <Button type="button" variant="text" onClick={() => setRows((r) => r.filter((_, j) => j !== i))} disabled={rows.length === 1} aria-label={`Remove module ${i + 1}`}>
                Remove
              </Button>
            </div>
          </div>
          <Field label="Title" type="text" required maxLength={300} error={errors[`${i}.title`]} value={m.title} onChange={(e) => update(i, { title: e.target.value })} />
          <TextAreaField label="Description" rows={2} optional value={m.description} onChange={(e) => update(i, { description: e.target.value })} />
          <TextAreaField
            label="Points"
            rows={6}
            optional
            hint="One point per line. Start a group with '## Group title'; an optional '> description' line may follow it."
            error={errors[`${i}.pointsText`]}
            value={m.pointsText}
            onChange={(e) => update(i, { pointsText: e.target.value })}
          />
        </fieldset>
      ))}
      <div>
        <Button type="button" variant="secondary" onClick={() => setRows((r) => [...r, { title: "", description: "", pointsText: "" }])} data-testid="module-add">
          Add a module
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="training-modules-save">
          {pending ? "Saving…" : "Save curriculum"}
        </Button>
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "saved" ? <FormStatus tone="success">Your changes have been saved.</FormStatus> : null}
      </div>
    </form>
  );
}
