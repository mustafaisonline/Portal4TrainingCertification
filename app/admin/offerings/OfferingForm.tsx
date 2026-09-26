"use client";

import { useActionState, useId, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { createOfferingAction, updateOfferingAction, type OfferingFormState } from "@/modules/catalogue/offerings/admin.actions";
import { toDateInputValue } from "@/modules/catalogue/offerings/dates";
// Pure vocabulary only — never the repository (it imports the database layer,
// which must not reach the browser bundle).
import {
  DEFAULT_TIMEZONE,
  DELIVERY_MODALITIES,
  MODALITY_LABEL,
  OFFERING_STATUS_LABEL,
  OFFERING_STATUSES,
} from "@/modules/catalogue/offerings/constants";
import type { OfferingRecord } from "@/modules/catalogue/offerings/repository";
import type { AdminDeliveryFormatOption, AdminProgrammeOption } from "@/modules/catalogue/programmes/repository";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, inputClass } from "@/shared/ui/forms";

/*
 * Create / edit an offering (M4 plan §2 item 2). The wireframe had no such
 * form — its "Add a date" and "Edit offering" buttons were disabled
 * (project-artifacts/mockup/app/admin/offerings/**), so this is new, built
 * from the shared form parts in the same family as the profile and enquiry
 * forms. One component for both modes: bound to `createOfferingAction` or
 * `updateOfferingAction`, fields controlled so a validation error keeps what
 * was typed. Options (programmes, formats, experts) come from the server page.
 */

export type ExpertOption = { id: string; name: string };

const initial: OfferingFormState = { status: "idle" };

type Values = {
  programmeId: string;
  deliveryFormatId: string;
  modality: string;
  status: string;
  startsOn: string;
  endsOn: string;
  capacity: string;
  location: string;
  timezone: string;
  scheduleNote: string;
  leadExpertId: string;
};

function initialValues(offering: OfferingRecord | undefined, programmes: AdminProgrammeOption[], initialProgrammeId?: string): Values {
  if (!offering) {
    return {
      programmeId: initialProgrammeId ?? programmes[0]?.id ?? "",
      deliveryFormatId: "",
      modality: "live_online",
      status: "planned",
      startsOn: "",
      endsOn: "",
      capacity: "",
      location: "",
      timezone: DEFAULT_TIMEZONE,
      scheduleNote: "",
      leadExpertId: "",
    };
  }
  return {
    programmeId: offering.programmeId,
    deliveryFormatId: offering.deliveryFormatId ?? "",
    modality: offering.modality,
    status: offering.status,
    startsOn: toDateInputValue(offering.startsOn),
    endsOn: toDateInputValue(offering.endsOn),
    capacity: offering.capacity === null ? "" : String(offering.capacity),
    location: offering.location ?? "",
    timezone: offering.timezone,
    scheduleNote: offering.scheduleNote ?? "",
    leadExpertId: offering.leadExpertId ?? "",
  };
}

/** A labelled <select> in the `Field` family (forms.tsx has inputs only). */
function SelectField({
  label,
  hint,
  error,
  children,
  ...select
}: { label: string; hint?: string; error?: string; children: ReactNode } & Omit<ComponentPropsWithoutRef<"select">, "className">) {
  const hintId = useId();
  const errorId = useId();
  const selectId = useId();
  const described = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  // Explicit htmlFor/id, not a wrapping <label>: a label that wraps a select
  // gives it an accessible name containing every option's text (found by the
  // e2e run — "Programme" matched two controls and no control exactly).
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="text-label">
        {label}
      </label>
      <select {...select} id={selectId} aria-describedby={described} aria-invalid={error ? true : undefined} className={inputClass}>
        {children}
      </select>
      {hint ? (
        <span id={hintId} className="text-body-sm text-[var(--color-ink-faint)]">
          {hint}
        </span>
      ) : null}
      {error ? (
        <span id={errorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function OfferingForm({
  offering,
  programmes,
  formats,
  experts,
  initialProgrammeId,
}: {
  /** Present in edit mode; absent when creating. */
  offering?: OfferingRecord;
  programmes: AdminProgrammeOption[];
  formats: AdminDeliveryFormatOption[];
  experts: ExpertOption[];
  /** Create mode: the training to pre-select (M12 — "Add a date" from a training). */
  initialProgrammeId?: string;
}) {
  const mode = offering ? "edit" : "create";
  const [state, action, pending] = useActionState(mode === "edit" ? updateOfferingAction : createOfferingAction, initial);
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const noteErrorId = useId();
  const [values, setValues] = useState<Values>(() => initialValues(offering, programmes, initialProgrammeId));
  const bind = (field: keyof Values) => ({
    name: field,
    value: values[field],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value })),
  });

  const formatsForProgramme = formats.filter((f) => f.programmeId === values.programmeId);

  function chooseProgramme(programmeId: string) {
    setValues((v) => ({
      ...v,
      programmeId,
      // A format belongs to one programme: drop a stale choice.
      deliveryFormatId: formats.some((f) => f.id === v.deliveryFormatId && f.programmeId === programmeId) ? v.deliveryFormatId : "",
    }));
  }

  if (mode === "create" && state.status === "saved") {
    return (
      <div role="status" className="flex flex-col gap-4" data-testid="offering-created">
        <p className="text-h2">The offering has been created.</p>
        <p className="text-body-sm text-[var(--color-ink-quiet)]">
          It is listed under Scheduled offerings and, while its status is planned, open or full, on the public
          schedule.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href="/admin/offerings">Back to offerings</Button>
          <Button href={`/admin/offerings/${state.id}`} variant="secondary">
            Edit this offering
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form action={action} aria-label={mode === "edit" ? "Edit offering" : "New offering"} className="flex flex-col gap-5" noValidate>
      {offering ? <input type="hidden" name="id" value={offering.id} /> : null}

      <SelectField
        label="Programme"
        required
        error={fieldErrors.programmeId}
        name="programmeId"
        value={values.programmeId}
        onChange={(e) => chooseProgramme(e.target.value)}
      >
        {programmes.length === 0 ? <option value="">No programmes</option> : null}
        {programmes.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
            {p.status !== "published" ? ` (${p.status})` : ""}
          </option>
        ))}
      </SelectField>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Format"
          hint={formatsForProgramme.length === 0 ? "This programme publishes no delivery formats." : undefined}
          error={fieldErrors.deliveryFormatId}
          {...bind("deliveryFormatId")}
        >
          <option value="">No specific format</option>
          {formatsForProgramme.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Delivery" required error={fieldErrors.modality} {...bind("modality")}>
          {DELIVERY_MODALITIES.map((m) => (
            <option key={m} value={m}>
              {MODALITY_LABEL[m]}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First day" type="date" required error={fieldErrors.startsOn} {...bind("startsOn")} />
        <Field label="Last day" type="date" required error={fieldErrors.endsOn} {...bind("endsOn")} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Status"
          required
          hint="Planned, open and full appear on the public schedule; completed and cancelled do not."
          error={fieldErrors.status}
          {...bind("status")}
        >
          {OFFERING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {OFFERING_STATUS_LABEL[s]}
            </option>
          ))}
        </SelectField>
        <Field
          label="Capacity"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          optional
          hint="Leave blank to publish no capacity."
          error={fieldErrors.capacity}
          {...bind("capacity")}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Location"
          type="text"
          optional
          maxLength={200}
          hint="Venue or city for face-to-face; leave blank for live online."
          error={fieldErrors.location}
          {...bind("location")}
        />
        <Field label="Time zone" type="text" required maxLength={64} hint="IANA name, e.g. Asia/Kuala_Lumpur." error={fieldErrors.timezone} {...bind("timezone")} />
      </div>

      <SelectField label="Lead expert" error={fieldErrors.leadExpertId} {...bind("leadExpertId")}>
        <option value="">Not assigned yet</option>
        {experts.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </SelectField>

      <label className="flex flex-col gap-2">
        <span className="text-label">
          Schedule note
          <span className="ml-1.5 font-normal normal-case tracking-normal text-[var(--color-ink-faint)]">(optional)</span>
        </span>
        <textarea
          rows={3}
          maxLength={500}
          {...bind("scheduleNote")}
          aria-invalid={fieldErrors.scheduleNote ? true : undefined}
          aria-describedby={fieldErrors.scheduleNote ? noteErrorId : undefined}
          className={`${inputClass} resize-y`}
        />
        {fieldErrors.scheduleNote ? (
          <span id={noteErrorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
            {fieldErrors.scheduleNote}
          </span>
        ) : null}
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="offering-save">
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Create offering"}
        </Button>
        <Button href="/admin/offerings" variant="text">
          Cancel
        </Button>
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "saved" ? <FormStatus tone="success">Your changes have been saved.</FormStatus> : null}
      </div>
    </form>
  );
}
