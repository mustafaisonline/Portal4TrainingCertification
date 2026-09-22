"use client";

import { useActionState, useId, useState } from "react";
import { REVIEW_BODY_MAX, REVIEW_BODY_MIN, REVIEW_CATEGORIES, REVIEW_CATEGORY_LABEL, type ReviewKind } from "@/modules/reviews/constants";
import { normaliseBody } from "@/modules/reviews/review-validation";
import { editReviewAction, submitReviewAction, type ReviewFormState } from "@/modules/reviews/review.actions";
import { initialsOf } from "@/shared/util/initials";
import { Button } from "@/shared/ui/Button";
import { FormStatus, inputClass, SelectField } from "@/shared/ui/forms";

/*
 * The review form (requirements §5). Header (avatar, display name,
 * programme, dates) is read-only and comes from the server page. The body
 * has a live counter; rating and consent are radio groups (fieldset/legend
 * for assistive technology); the photo checkbox appears only when the
 * person agrees to public display. Submits to the server action; a success
 * redirects back to /reviews where the page states the outcome from the
 * database — the client never announces success on its own.
 */

const initial: ReviewFormState = { status: "idle" };

export type ReviewFormHeader = {
  name: string;
  /** The person's OWN photo (session-gated route) — null shows initials. */
  photoSrc: string | null;
  hasPhoto: boolean;
  programmeTitle: string;
  dates: string | null;
};

export type ReviewFormInitial = {
  body: string;
  rating: number | null;
  category: string | null;
  consentPublic: boolean;
  consentPhoto: boolean;
};

export function ReviewForm({
  mode,
  kind,
  registrationId,
  reviewId,
  header,
  initialValues,
}: {
  mode: "create" | "edit";
  kind: ReviewKind;
  registrationId?: string;
  reviewId?: string;
  header: ReviewFormHeader;
  initialValues?: ReviewFormInitial;
}) {
  const [state, action, pending] = useActionState(mode === "edit" ? editReviewAction : submitReviewAction, initial);
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const bodyId = useId();
  const counterId = useId();
  const bodyErrorId = useId();
  const consentErrorId = useId();
  const photoHintId = useId();
  // Controlled, deliberately: React resets uncontrolled fields after a form
  // action resolves, which would wipe the text on a validation error.
  const [body, setBody] = useState(initialValues?.body ?? "");
  const [rating, setRating] = useState<string>(initialValues?.rating ? String(initialValues.rating) : "");
  const [category, setCategory] = useState(initialValues?.category ?? "");
  const [consentPublic, setConsentPublic] = useState<"yes" | "no">(initialValues?.consentPublic ? "yes" : "no");
  const [consentPhoto, setConsentPhoto] = useState(initialValues?.consentPhoto ?? false);
  const count = normaliseBody(body).length;
  const short = count < REVIEW_BODY_MIN;
  const long = count > REVIEW_BODY_MAX;

  return (
    <form
      action={action}
      className="flex flex-col gap-5"
      noValidate
      data-testid={mode === "edit" ? "review-edit-form" : kind === "diagnostic" ? "review-diagnostic-form" : "review-form"}
    >
      <input type="hidden" name="kind" value={kind} />
      {registrationId ? <input type="hidden" name="registrationId" value={registrationId} /> : null}
      {reviewId ? <input type="hidden" name="reviewId" value={reviewId} /> : null}

      <div className="flex items-center gap-3" data-testid="review-form-header">
        <span
          aria-hidden="true"
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--color-action)] text-[0.8rem] font-semibold text-[var(--color-action-ink)]"
        >
          {header.photoSrc ? <img src={header.photoSrc} alt="" className="h-full w-full object-cover" /> : initialsOf(header.name)}
        </span>
        <div className="min-w-0">
          <p className="text-body-sm font-medium text-[var(--color-ink)]" data-testid="review-form-name">
            {header.name}
          </p>
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            {header.programmeTitle}
            {header.dates ? ` · ${header.dates}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={bodyId} className="text-label">
          Share your experience
        </label>
        <textarea
          id={bodyId}
          name="body"
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          aria-invalid={fieldErrors.body ? true : undefined}
          aria-describedby={[counterId, fieldErrors.body ? bodyErrorId : null].filter(Boolean).join(" ")}
          className={`${inputClass} resize-y`}
        />
        <span
          id={counterId}
          data-testid="review-counter"
          className={`text-body-sm ${short || long ? "text-[var(--color-ink-faint)]" : "text-[var(--color-ink-quiet)]"}`}
        >
          {count.toLocaleString("en-GB")} / {REVIEW_BODY_MAX.toLocaleString("en-GB")} characters
          {short ? ` · at least ${REVIEW_BODY_MIN}` : ""}
        </span>
        {fieldErrors.body ? (
          <span id={bodyErrorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
            {fieldErrors.body}
          </span>
        ) : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-label mb-2">
          Rating <span className="ml-1.5 font-normal normal-case tracking-normal text-[var(--color-ink-faint)]">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="text-body-sm inline-flex items-center gap-1.5">
              <input type="radio" name="rating" value={String(n)} checked={rating === String(n)} onChange={() => setRating(String(n))} />
              <span aria-hidden="true" className="text-[var(--color-primary)]">
                {"★".repeat(n)}
              </span>
              <span className="sr-only">
                {n} {n === 1 ? "star" : "stars"}
              </span>
            </label>
          ))}
          <label className="text-body-sm inline-flex items-center gap-1.5 text-[var(--color-ink-quiet)]">
            <input type="radio" name="rating" value="" checked={rating === ""} onChange={() => setRating("")} />
            No rating
          </label>
        </div>
        {fieldErrors.rating ? (
          <span role="alert" className="text-body-sm text-[var(--color-danger)]">
            {fieldErrors.rating}
          </span>
        ) : null}
      </fieldset>

      <SelectField label="Category" name="category" optional value={category} onChange={(e) => setCategory(e.target.value)} error={fieldErrors.category}>
        <option value="">Choose a category</option>
        {REVIEW_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {REVIEW_CATEGORY_LABEL[c]}
          </option>
        ))}
      </SelectField>

      <fieldset className="flex flex-col gap-2" aria-describedby={fieldErrors.consentPublic ? consentErrorId : undefined}>
        <legend className="text-label mb-2">May we show your review publicly?</legend>
        <label className="text-body-sm inline-flex items-center gap-2">
          <input type="radio" name="consentPublic" value="yes" checked={consentPublic === "yes"} onChange={() => setConsentPublic("yes")} />
          Yes, I agree
        </label>
        <label className="text-body-sm inline-flex items-center gap-2">
          <input type="radio" name="consentPublic" value="no" checked={consentPublic === "no"} onChange={() => setConsentPublic("no")} />
          No, keep my review private
        </label>
        <p className="text-body-sm text-[var(--color-ink-faint)]">
          Public reviews show your name as it appears above, the programme, your rating and your words — never your email. They are read by us
          before they appear.
        </p>
        {fieldErrors.consentPublic ? (
          <span id={consentErrorId} role="alert" className="text-body-sm text-[var(--color-danger)]">
            {fieldErrors.consentPublic}
          </span>
        ) : null}
        {consentPublic === "yes" ? (
          <div className="mt-1 flex flex-col gap-1">
            <label className="text-body-sm inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="consentPhoto"
                checked={consentPhoto}
                onChange={(e) => setConsentPhoto(e.target.checked)}
                aria-describedby={header.hasPhoto ? undefined : photoHintId}
              />
              Show my photo alongside my name
            </label>
            {!header.hasPhoto ? (
              <span id={photoHintId} className="text-body-sm text-[var(--color-ink-faint)]">
                You have not added a photo yet — your initials are shown until you add one on your profile.
              </span>
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="review-submit">
          {pending ? "Saving…" : mode === "edit" ? "Save changes" : "Share my review"}
        </Button>
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      </div>
    </form>
  );
}
