"use client";

import { startTransition, useActionState, useState } from "react";
import { addCatalogueRoleAction, createOwnRoleAction, removeRoleAction, type OrganisationActionState } from "@/modules/assessment/organisation.actions";
import { DESCRIPTION_MAX, MIN_PRIVATE_ROLE_QUESTIONS, NAME_MAX } from "@/modules/assessment/constants";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Field, FormStatus, SelectField, TextAreaField } from "@/shared/ui/forms";

/*
 * Forms on the Organisation Dashboard's Roles tab: add a role from the
 * catalogue, create the organisation's own role, remove a role (behind the
 * portal's own confirmation box). The actions decide who the organisation is —
 * nothing here sends an organisation id.
 */

const initial: OrganisationActionState = { status: "idle" };

function Status({ state, testId }: { state: OrganisationActionState; testId: string }) {
  return (
    <span data-testid={testId}>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      {state.status === "saved" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
    </span>
  );
}

export function AddCatalogueRoleForm({ roles }: { roles: { id: string; name: string; reviewedQuestionCount: number }[] }) {
  const [state, action, pending] = useActionState(addCatalogueRoleAction, initial);
  if (roles.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="org-catalogue-empty">
          Your organisation already offers every role in the catalogue.
        </p>
        <Status state={state} testId="org-catalogue-status" />
      </div>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-4" data-testid="org-catalogue-form">
      <SelectField label="Role" name="roleId" defaultValue="" required>
        <option value="" disabled>
          Choose a role…
        </option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} ({r.reviewedQuestionCount} shared {r.reviewedQuestionCount === 1 ? "question" : "questions"})
          </option>
        ))}
      </SelectField>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="org-catalogue-add">
          {pending ? "Adding…" : "Add role"}
        </Button>
        <Status state={state} testId="org-catalogue-status" />
      </div>
    </form>
  );
}

export function CreateRoleForm() {
  const [state, action, pending] = useActionState(createOwnRoleAction, initial);
  // A fresh form after a role is created: the key changes with each saved result.
  const [saves, setSaves] = useState(0);
  const [lastState, setLastState] = useState<OrganisationActionState>(initial);
  if (state !== lastState) {
    setLastState(state);
    if (state.status === "saved") setSaves((n) => n + 1);
  }
  return (
    <form key={saves} action={action} className="flex flex-col gap-4" data-testid="org-create-role-form">
      <Field label="Role name" name="name" maxLength={NAME_MAX} required hint="For example: Data Analyst (Graduate)." />
      <TextAreaField label="Description" name="description" rows={3} maxLength={DESCRIPTION_MAX} optional hint="One or two sentences candidates read on the role's card." />
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        Your own role is private to your organisation. Candidates see it once it has at least {MIN_PRIVATE_ROLE_QUESTIONS} approved questions.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="org-create-role-submit">
          {pending ? "Creating…" : "Create role"}
        </Button>
        <Status state={state} testId="org-create-role-status" />
      </div>
    </form>
  );
}

export function RemoveRoleButton({ roleId, roleName }: { roleId: string; roleName: string }) {
  const [state, action, pending] = useActionState(removeRoleAction, initial);
  const [confirming, setConfirming] = useState(false);
  return (
    <span className="flex flex-wrap items-center gap-3">
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        data-testid="org-role-remove"
        aria-label={`Remove the role ${roleName}`}
        className="text-body-sm py-1 text-[var(--color-ink-quiet)] underline underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-60"
      >
        {pending ? "Removing…" : "Remove"}
      </button>
      {confirming ? (
        <ConfirmDialog
          open={confirming}
          title={`Remove ${roleName}?`}
          body="Candidates will no longer find this role under your organisation. Your questions for it are kept, and come back if you add the role again."
          confirmLabel="Remove"
          cancelLabel="Keep"
          onConfirm={() => {
            setConfirming(false);
            const data = new FormData();
            data.set("roleId", roleId);
            startTransition(() => action(data));
          }}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </span>
  );
}
