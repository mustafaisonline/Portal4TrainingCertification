"use client";

import { startTransition, useActionState, useState } from "react";
import {
  addRoleToOrganisationAction,
  createOrganisationAction,
  removeRoleFromOrganisationAction,
  revokeMemberAction,
  setOrganisationPublishedAction,
  updateOrganisationAction,
  type AdminAssessmentState,
} from "@/modules/assessment/admin.actions";
import { EMAIL_MAX, NAME_MAX, ORGANISATION_TYPES, type OrganisationType } from "@/modules/assessment/constants";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Field, FormStatus, SelectField } from "@/shared/ui/forms";

/*
 * Client forms of /admin/organisations (CR-2026-10-01-1711). Fields only — every
 * rule (validation, who may see what, the audit row) is server-side.
 */

const initial: AdminAssessmentState = { status: "idle" };
const TYPE_LABEL: Record<OrganisationType, string> = { company: "Company", education: "Education sector" };

function Status({ state, testId }: { state: AdminAssessmentState; testId: string }) {
  if (state.status === "idle") return null;
  return (
    <span data-testid={testId}>
      <FormStatus tone={state.status === "done" ? "success" : "error"}>{state.message}</FormStatus>
    </span>
  );
}

function TypeSelect({ defaultValue }: { defaultValue: OrganisationType }) {
  return (
    <SelectField label="Type" name="type" required defaultValue={defaultValue} data-testid="org-type">
      {ORGANISATION_TYPES.map((t) => (
        <option key={t} value={t}>
          {TYPE_LABEL[t]}
        </option>
      ))}
    </SelectField>
  );
}

export function CreateOrganisationForm() {
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [state, action, pending] = useActionState(async (prev: AdminAssessmentState, formData: FormData) => {
    const next = await createOrganisationAction(prev, formData);
    if (next.status === "done") {
      setName("");
      setContactEmail("");
      setLogoPath("");
    }
    return next;
  }, initial);
  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Register an organisation" data-testid="org-create-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organisation name" name="name" required maxLength={NAME_MAX} value={name} onChange={(e) => setName(e.target.value)} data-testid="org-name" />
        <TypeSelect defaultValue="company" />
        <Field label="Contact email" name="contactEmail" type="email" required maxLength={EMAIL_MAX} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} data-testid="org-email" />
        <Field label="Logo path" name="logoPath" optional maxLength={500} value={logoPath} onChange={(e) => setLogoPath(e.target.value)} placeholder="/brand/ypt-logo.jpg" hint="A file under /public, e.g. /brand/…, or an https:// address." data-testid="org-logo" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="org-create-submit">
          {pending ? "Registering…" : "Register organisation"}
        </Button>
        <Status state={state} testId="org-create-status" />
      </div>
    </form>
  );
}

export function EditOrganisationForm({ organisationId, name, type, contactEmail, logoPath }: { organisationId: string; name: string; type: OrganisationType; contactEmail: string; logoPath: string | null }) {
  const [state, action, pending] = useActionState(updateOrganisationAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Organisation details" data-testid="org-edit-form">
      <input type="hidden" name="organisationId" value={organisationId} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Organisation name" name="name" required maxLength={NAME_MAX} defaultValue={name} data-testid="org-edit-name" />
        <TypeSelect defaultValue={type} />
        <Field label="Contact email" name="contactEmail" type="email" required maxLength={EMAIL_MAX} defaultValue={contactEmail} data-testid="org-edit-email" />
        <Field label="Logo path" name="logoPath" optional maxLength={500} defaultValue={logoPath ?? ""} hint="Blank removes the logo." data-testid="org-edit-logo" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="org-edit-submit">
          {pending ? "Saving…" : "Save details"}
        </Button>
        <Status state={state} testId="org-edit-status" />
      </div>
    </form>
  );
}

export function OrganisationPublishToggle({ organisationId, published, name }: { organisationId: string; published: boolean; name: string }) {
  const [state, action, pending] = useActionState(setOrganisationPublishedAction, initial);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="organisationId" value={organisationId} />
      <input type="hidden" name="published" value={published ? "false" : "true"} />
      <Button type="submit" variant="secondary" disabled={pending} data-testid="org-publish-toggle" aria-label={`${published ? "Unpublish" : "Publish"} ${name}`}>
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

export function AddRoleForm({ organisationId, roles }: { organisationId: string; roles: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(addRoleToOrganisationAction, initial);
  if (roles.length === 0) {
    return (
      <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="org-add-role-none">
        Every published shared role is already offered.
      </p>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-3" aria-label="Offer a role" data-testid="org-add-role-form">
      <input type="hidden" name="organisationId" value={organisationId} />
      <SelectField label="Add a shared role" name="roleId" required defaultValue="" data-testid="org-add-role-select">
        <option value="" disabled>
          Choose a role…
        </option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </SelectField>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="org-add-role-submit">
          {pending ? "Adding…" : "Add role"}
        </Button>
        <Status state={state} testId="org-add-role-status" />
      </div>
    </form>
  );
}

export function RemoveRoleButton({ organisationId, roleId, roleName }: { organisationId: string; roleId: string; roleName: string }) {
  const [state, action, pending] = useActionState(removeRoleFromOrganisationAction, initial);
  const [confirming, setConfirming] = useState(false);
  return (
    <span className="flex flex-col items-start gap-1">
      <Button type="button" variant="secondary" onClick={() => setConfirming(true)} disabled={pending} data-testid="org-remove-role" aria-label={`Remove ${roleName}`}>
        {pending ? "Removing…" : "Remove"}
      </Button>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      <ConfirmDialog
        open={confirming}
        title={`Stop offering ${roleName}?`}
        body="Candidates will no longer see this role under the organisation. The organisation's own questions for it are kept and come back if the role is offered again."
        confirmLabel="Remove"
        cancelLabel="Keep"
        onConfirm={() => {
          setConfirming(false);
          const data = new FormData();
          data.set("organisationId", organisationId);
          data.set("roleId", roleId);
          startTransition(() => action(data));
        }}
        onCancel={() => setConfirming(false)}
      />
    </span>
  );
}

export function RevokeMemberButton({ organisationId, userId, label }: { organisationId: string; userId: string; label: string }) {
  const [state, action, pending] = useActionState(revokeMemberAction, initial);
  const [confirming, setConfirming] = useState(false);
  return (
    <span className="flex flex-col items-start gap-1">
      <Button type="button" variant="secondary" onClick={() => setConfirming(true)} disabled={pending} data-testid="org-revoke-member" aria-label={`Revoke access for ${label}`}>
        {pending ? "Revoking…" : "Revoke"}
      </Button>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      <ConfirmDialog
        open={confirming}
        title="Revoke this person's access?"
        body={`${label} loses the Organisation dashboard for this organisation immediately. Its roles, questions and results are kept, and access can be granted again later. The change is recorded in the audit log.`}
        confirmLabel="Revoke"
        cancelLabel="Keep"
        onConfirm={() => {
          setConfirming(false);
          const data = new FormData();
          data.set("organisationId", organisationId);
          data.set("userId", userId);
          startTransition(() => action(data));
        }}
        onCancel={() => setConfirming(false)}
      />
    </span>
  );
}
