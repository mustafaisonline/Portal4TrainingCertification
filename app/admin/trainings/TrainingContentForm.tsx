"use client";

import { useActionState, useState } from "react";
import { CONTENT_FIELD_META, CONTENT_FIELDS, type ContentFieldErrors, type ContentForm } from "@/modules/catalogue/programmes/constants";
import { updateTrainingContentAction, type FormState } from "@/modules/catalogue/programmes/admin.actions";
import { Button } from "@/shared/ui/Button";
import { Field, FormStatus, TextAreaField } from "@/shared/ui/forms";

/*
 * The editorial sections (M12 WP2, decision L9: all of them). One field per
 * section; the line formats are in the hints (content-codec.ts is the
 * single reader/writer). Grouped so the long form reads in the order the
 * public page renders.
 */
const GROUPS: { heading: string; fields: (typeof CONTENT_FIELDS)[number][] }[] = [
  { heading: "Hero and highlights", fields: ["highlights", "relationshipNote"] },
  { heading: "Who should attend", fields: ["whoShouldAttendIntro", "whoShouldAttendRoles"] },
  { heading: "Why this training", fields: ["rationaleHeading", "rationaleParagraphs", "rationaleProblems"] },
  { heading: "Outcomes", fields: ["outcomes", "outcomeGroups", "whatYouGet", "afterHeading", "afterIntro", "afterItems"] },
  { heading: "How you learn", fields: ["pedagogyIntro", "pedagogyMethods", "pedagogyIndustries", "methodologyName", "methodologySteps", "paceNotes"] },
  { heading: "Benefits and inclusions", fields: ["benefitsIntro", "benefitsItems", "included", "valueStack", "valueStackTotal"] },
  { heading: "Questions, related and resources", fields: ["faq", "related", "externalResources"] },
  { heading: "Mentorship only", fields: ["careerPaths", "mentorshipPackagesJson"] },
];

const initial: FormState<ContentFieldErrors> = { status: "idle" };

export function TrainingContentForm({ id, slug, form }: { id: string; slug: string; form: ContentForm }) {
  const [state, action, pending] = useActionState(updateTrainingContentAction, initial);
  const errors = state.status === "error" ? state.fieldErrors : {};
  const [v, setV] = useState<ContentForm>(form);
  const bind = (field: keyof ContentForm) => ({
    name: field,
    value: v[field],
    onChange: (e: { target: { value: string } }) => setV((s) => ({ ...s, [field]: e.target.value })),
  });
  return (
    <form action={action} aria-label="Edit training sections" className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="slug" value={slug} />
      {GROUPS.map((g) => (
        <fieldset key={g.heading} className="flex flex-col gap-5">
          <legend className="text-h2 mb-2">{g.heading}</legend>
          {g.fields.map((f) => {
            const meta = CONTENT_FIELD_META[f];
            return meta.multiline ? (
              <TextAreaField key={f} label={meta.label} hint={meta.hint || undefined} rows={f === "mentorshipPackagesJson" ? 10 : 4} optional={!meta.required} error={errors[f]} {...bind(f)} />
            ) : (
              <Field key={f} label={meta.label} type="text" hint={meta.hint || undefined} optional={!meta.required} error={errors[f]} {...bind(f)} />
            );
          })}
        </fieldset>
      ))}
      <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center gap-4 border-t border-[var(--color-line)] bg-[var(--color-ground-raised)] px-6 py-4">
        <Button type="submit" disabled={pending} data-testid="training-content-save">
          {pending ? "Saving…" : "Save sections"}
        </Button>
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "saved" ? <FormStatus tone="success">Your changes have been saved.</FormStatus> : null}
      </div>
    </form>
  );
}
