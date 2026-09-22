"use client";

import { useActionState, useId, useState } from "react";
import { grantAdminAction, revokeAdminAction, type AdminUserActionState } from "@/modules/identity/admin-users.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * Grant / revoke platform administrator on /admin/users/[id] (M8 plan §2
 * item 4). Two small forms posting to their server actions; the page
 * re-renders from the database. Revoke needs a ticked confirmation before
 * the button works, and is not offered at all for the signed-in
 * administrator themselves (the server refuses it regardless, as it does
 * for the last remaining administrator).
 */

const initial: AdminUserActionState = { status: "idle" };

export function GrantAdmin({ userId, name }: { userId: string; name: string }) {
  const [state, action, pending] = useActionState(grantAdminAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3" data-testid="grant-admin-form" aria-label="Grant platform administrator">
      <input type="hidden" name="userId" value={userId} />
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        {name} will be able to open every screen under /admin, including this one. The grant is recorded in the audit log with your name.
      </p>
      <div>
        <Button type="submit" disabled={pending || state.status === "done"} data-testid="grant-admin-submit">
          {pending ? "Granting…" : "Grant platform administrator"}
        </Button>
      </div>
      {state.status === "done" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}

export function RevokeAdmin({ userId, name, isSelf }: { userId: string; name: string; isSelf: boolean }) {
  const [state, action, pending] = useActionState(revokeAdminAction, initial);
  const [confirmed, setConfirmed] = useState(false);
  const confirmId = useId();

  if (isSelf) {
    return (
      <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="revoke-admin-self">
        You cannot revoke your own administrator access. Another administrator must do it.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3" data-testid="revoke-admin-form" aria-label="Revoke platform administrator">
      <input type="hidden" name="userId" value={userId} />
      <p className="text-body-sm text-[var(--color-ink-quiet)]">
        {name} will lose access to /admin immediately. The revocation is recorded in the audit log with your name; access can be granted again later.
      </p>
      <div className="flex items-start gap-2">
        <input
          id={confirmId}
          type="checkbox"
          name="confirm"
          value="yes"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-1 h-4 w-4"
          data-testid="revoke-admin-confirm"
        />
        <label htmlFor={confirmId} className="text-body-sm text-[var(--color-ink)]">
          I want to revoke {name}&apos;s administrator access
        </label>
      </div>
      <div>
        <Button type="submit" variant="secondary" disabled={pending || !confirmed || state.status === "done"} data-testid="revoke-admin-submit">
          {pending ? "Revoking…" : "Revoke platform administrator"}
        </Button>
      </div>
      {state.status === "done" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
