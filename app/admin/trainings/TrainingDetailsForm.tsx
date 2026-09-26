"use client";

import { useActionState, useState } from "react";
import { PROGRAMME_LEVELS } from "@/modules/catalogue/programmes/constants";
import { createTrainingAction, updateTrainingDetailsAction, type FormState } from "@/modules/catalogue/programmes/admin.actions";
import type { TrainingDetailsErrors } from "@/modules/catalogue/programmes/admin.repository";
import { levelLabel } from "@/modules/catalogue/programmes/types";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, SelectField, TextAreaField } from "@/shared/ui/forms";

/*
 * Details of a training (M12 WP2) — the typed columns of `programmes`. One
 * component for create and edit, bound to the matching server action;
 * fields are controlled so a validation error keeps what was typed. The
 * public address (slug) is generated from the title on create and locked
 * once the training is published (links have been shared).
 */

export type DomainOption = { id: string; name: string };

export type TrainingDetailsValues = {
  id?: string;
  title: string;
  subtitle: string;
  slug: string;
  domainId: string;
  level: string;
  flagship: boolean;
  durationLabel: string;
  prerequisites: string;
  formats: string;
  certificateLabel: string;
  audienceSummary: string;
  summary: string;
  valueProposition: string;
  sortOrder: string;
  published?: boolean;
};

const initial: FormState<TrainingDetailsErrors> = { status: "idle" };

export function TrainingDetailsForm({ domains, training }: { domains: DomainOption[]; training?: TrainingDetailsValues }) {
  const mode = training ? "edit" : "create";
  const [state, action, pending] = useActionState(mode === "edit" ? updateTrainingDetailsAction : createTrainingAction, initial);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const [v, setV] = useState<TrainingDetailsValues>(
    training ?? {
      title: "",
      subtitle: "",
      slug: "",
      domainId: domains[0]?.id ?? "",
      level: "foundation",
      flagship: false,
      durationLabel: "",
      prerequisites: "",
      formats: "Live online",
      certificateLabel: "Certificate of Completion",
      audienceSummary: "",
      summary: "",
      valueProposition: "",
      sortOrder: "0",
    },
  );
  const bind = (field: keyof TrainingDetailsValues) => ({
    name: field,
    value: String(v[field] ?? ""),
    onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [field]: e.target.value })),
  });

  if (mode === "create" && state.status === "saved") {
    return (
      <div role="status" className="flex flex-col gap-4" data-testid="training-created">
        <p className="text-h2">The training has been created as a draft.</p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          Its public address will be <span className="text-mono">/programs/{state.slug}</span>. Next: write its sections, add the curriculum, pace formats, the four fee rows and a date — then an administrator publishes it.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href={`/admin/trainings/${state.id}/content`} data-testid="training-created-content">
            Write the sections
          </Button>
          <Button href={`/admin/trainings/${state.id}`} variant="secondary">
            Open the training
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} aria-label={mode === "edit" ? "Edit training details" : "New training"} className="flex flex-col gap-5" noValidate>
      {training?.id ? <input type="hidden" name="id" value={training.id} /> : null}

      <Field label="Title" type="text" required maxLength={120} error={errors.title} {...bind("title")} />
      <Field label="Subtitle" type="text" required maxLength={300} hint="The line under the title on the training page." error={errors.subtitle} {...bind("subtitle")} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Public address"
          type="text"
          optional={mode === "create"}
          maxLength={80}
          disabled={training?.published === true}
          hint={
            training?.published
              ? "Locked: the training is published and its address has been shared."
              : mode === "create"
                ? "Leave blank to generate from the title (lowercase letters, digits, hyphens)."
                : "Changing this changes the training's URL."
          }
          error={errors.slug}
          {...bind("slug")}
        />
        <Field label="Order" type="number" inputMode="numeric" min={0} step={1} hint="Position on the Trainings page; lower comes first." error={errors.sortOrder} {...bind("sortOrder")} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField label="Domain" required error={errors.domainId} {...bind("domainId")}>
          {domains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Level" required error={errors.level} {...bind("level")}>
          {PROGRAMME_LEVELS.map((l) => (
            <option key={l} value={l}>
              {levelLabel(l)}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Duration" type="text" required maxLength={300} hint="As published, e.g. 2 days." error={errors.durationLabel} {...bind("durationLabel")} />
        <Field label="Certificate label" type="text" required maxLength={300} error={errors.certificateLabel} {...bind("certificateLabel")} />
      </div>

      <TextAreaField label="Delivery labels" rows={2} required hint="One per line as published, e.g. Live online, Face-to-face." error={errors.formats} {...bind("formats")} />
      <Field label="Audience summary" type="text" required maxLength={300} hint="One line on the listing card: who it is for." error={errors.audienceSummary} {...bind("audienceSummary")} />
      <TextAreaField label="Summary" rows={3} required maxLength={2000} hint="The paragraph on the listing card." error={errors.summary} {...bind("summary")} />
      <TextAreaField label="Value proposition" rows={3} required maxLength={2000} hint="The hero sentence on the training page." error={errors.valueProposition} {...bind("valueProposition")} />
      <TextAreaField label="Prerequisites" rows={3} required maxLength={2000} error={errors.prerequisites} {...bind("prerequisites")} />

      <label className="flex items-start gap-2">
        <input type="checkbox" name="flagship" checked={v.flagship} onChange={(e) => setV((s) => ({ ...s, flagship: e.target.checked }))} className="mt-1 h-4 w-4" />
        <span className="text-body-sm text-[var(--color-ink)]">
          Flagship training <span className="text-[var(--color-ink-faint)]">— featured on the home page; only one training can be the flagship.</span>
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="training-save">
          {pending ? "Saving…" : mode === "edit" ? "Save details" : "Create draft"}
        </Button>
        <Button href="/admin/trainings" variant="text">
          Cancel
        </Button>
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "saved" ? <FormStatus tone="success">Your changes have been saved.</FormStatus> : null}
      </div>
    </form>
  );
}
