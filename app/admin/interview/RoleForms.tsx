"use client";

import { startTransition, useActionState, useState } from "react";
import { approveAllDraftsAction, createRoleAction, deleteRoleAction, setRolePublishedAction, updateRoleAction, type AdminAssessmentState } from "@/modules/assessment/admin.actions";
import { DESCRIPTION_MAX, NAME_MAX } from "@/modules/assessment/constants";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Field, FormStatus, TextAreaField } from "@/shared/ui/forms";

/*
 * Client forms of /admin/interview (CR-2026-10-01-1711). Fields only — every
 * decision (validation, audit, the draft → reviewed move) is server-side in the
 * admin actions and the assessment repositories.
 */

const initial: AdminAssessmentState = { status: "idle" };

function Status({ state, testId }: { state: AdminAssessmentState; testId: string }) {
  if (state.status === "idle") return null;
  return (
    <span data-testid={testId}>
      <FormStatus tone={state.status === "done" ? "success" : "error"}>{state.message}</FormStatus>
    </span>
  );
}

export function CreateRoleForm() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [state, action, pending] = useActionState(async (prev: AdminAssessmentState, formData: FormData) => {
    const next = await createRoleAction(prev, formData);
    if (next.status === "done") {
      setName("");
      setSlug("");
      setDescription("");
    }
    return next;
  }, initial);
  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Create an interview role" data-testid="role-create-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role name" name="name" required maxLength={NAME_MAX} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Data Analyst" data-testid="role-name" />
        <Field label="URL name" name="slug" optional maxLength={80} value={slug} onChange={(e) => setSlug(e.target.value)} hint="Lower-case, hyphens. Blank = made from the name; it cannot be changed later." data-testid="role-slug" />
      </div>
      <TextAreaField label="Description" name="description" optional rows={3} maxLength={DESCRIPTION_MAX} value={description} onChange={(e) => setDescription(e.target.value)} hint="One or two sentences shown on the role's card." data-testid="role-description" />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="role-create-submit">
          {pending ? "Creating…" : "Create role"}
        </Button>
        <Status state={state} testId="role-create-status" />
      </div>
    </form>
  );
}

export function RoleDetailsForm({ roleId, name, description, position }: { roleId: string; name: string; description: string; position: number }) {
  const [state, action, pending] = useActionState(updateRoleAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Role details" data-testid="role-details-form">
      <input type="hidden" name="roleId" value={roleId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Role name" name="name" required maxLength={NAME_MAX} defaultValue={name} data-testid="role-edit-name" />
        <Field label="Display position" name="position" type="number" min={0} max={10000} defaultValue={String(position)} hint="Lower numbers come first." data-testid="role-edit-position" />
      </div>
      <TextAreaField label="Description" name="description" optional rows={3} maxLength={DESCRIPTION_MAX} defaultValue={description} data-testid="role-edit-description" />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="role-edit-submit">
          {pending ? "Saving…" : "Save details"}
        </Button>
        <Status state={state} testId="role-edit-status" />
      </div>
    </form>
  );
}

export function RolePublishToggle({ roleId, published, name }: { roleId: string; published: boolean; name: string }) {
  const [state, action, pending] = useActionState(setRolePublishedAction, initial);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="roleId" value={roleId} />
      <input type="hidden" name="published" value={published ? "false" : "true"} />
      <Button type="submit" variant="secondary" disabled={pending} data-testid="role-publish-toggle" aria-label={`${published ? "Unpublish" : "Publish"} ${name}`}>
        {pending ? "Saving…" : published ? "Unpublish" : "Publish"}
      </Button>
      {state.status === "error" ? (
        <span role="alert" className="text-body-sm text-[var(--color-danger)]">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

/** Delete a role — only offered while nobody has taken a test on it; asks first and says what goes with it. */
export function DeleteRoleButton({ roleId, name, attempts, questions }: { roleId: string; name: string; attempts: number; questions: number }) {
  const [state, action, pending] = useActionState(deleteRoleAction, initial);
  const [confirming, setConfirming] = useState(false);
  if (attempts > 0) {
    return (
      <span className="text-body-sm text-[var(--color-ink-faint)]" data-testid="role-delete-blocked">
        Has {attempts} {attempts === 1 ? "attempt" : "attempts"} — unpublish instead
      </span>
    );
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="secondary" onClick={() => setConfirming(true)} disabled={pending} aria-label={`Delete ${name}`} data-testid="role-delete">
        {pending ? "Deleting…" : "Delete"}
      </Button>
      <Status state={state} testId="role-delete-status" />
      <ConfirmDialog
        open={confirming}
        title={`Delete the role "${name}"?`}
        body={`This removes the role and its ${questions} ${questions === 1 ? "question" : "questions"} (including any an organisation added), and takes it off every organisation's list. Nobody has taken a test on it. This cannot be undone here; it is recorded in the audit log.`}
        confirmLabel="Delete role"
        cancelLabel="Keep it"
        onConfirm={() => {
          setConfirming(false);
          const data = new FormData();
          data.set("roleId", roleId);
          startTransition(() => action(data));
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}

/** "Approve all N drafts" of the role's shared bank — asks first (the portal's own dialog). */
export function ApproveAllDrafts({ roleId, drafts }: { roleId: string; drafts: number }) {
  const [state, action, pending] = useActionState(approveAllDraftsAction, initial);
  const [confirming, setConfirming] = useState(false);
  return (
    <div className="flex flex-col items-start gap-2" data-testid="approve-all">
      {drafts > 0 ? (
        <Button type="button" onClick={() => setConfirming(true)} disabled={pending} data-testid="approve-all-drafts">
          {pending ? "Approving…" : `Approve all ${drafts} ${drafts === 1 ? "draft" : "drafts"}`}
        </Button>
      ) : (
        <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="approve-all-none">
          No drafts waiting for review.
        </p>
      )}
      <Status state={state} testId="approve-all-status" />
      <ConfirmDialog
        open={confirming}
        title={`Approve all ${drafts} ${drafts === 1 ? "draft" : "drafts"}?`}
        body="Every draft question in this role's shared bank becomes reviewed and can appear in candidates' tests straight away. The change is recorded in the audit log with your name."
        confirmLabel="Approve all"
        cancelLabel="Not yet"
        onConfirm={() => {
          setConfirming(false);
          const data = new FormData();
          data.set("roleId", roleId);
          startTransition(() => action(data));
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
