"use client";

import { useActionState, useState } from "react";
import { startRoleTestAction, type RoleTestState } from "@/modules/assessment/role-test.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

const initial: RoleTestState = { status: "idle" };

/*
 * The start button of a role test — ONE form for Prepare for Interview and for
 * Organisation Interview Screening (CR-2026-10-01-1711). An organisation test
 * shows the acknowledgement checkbox ("I understand my result is shared with
 * {organisation}") and the server refuses to start without it; while a test is
 * running the button simply returns to it (one running test per person per role
 * and organisation) and the acknowledgement is not asked again. The user is the
 * session's, never a form field.
 */
export function RoleStartForm({
  roleId,
  organisationId = null,
  organisationName = null,
  running = false,
  label,
}: {
  roleId: string;
  organisationId?: string | null;
  organisationName?: string | null;
  running?: boolean;
  label: string;
}) {
  const [state, action, pending] = useActionState(startRoleTestAction, initial);
  const [acknowledged, setAcknowledged] = useState(false);
  const needsAcknowledgement = organisationId !== null && !running;
  return (
    <form action={action} className="flex flex-col gap-4" aria-label={label} data-testid="role-start-form">
      <input type="hidden" name="roleId" value={roleId} />
      {organisationId ? <input type="hidden" name="organisationId" value={organisationId} /> : null}
      {needsAcknowledgement ? (
        <label className="text-body-sm flex max-w-[62ch] cursor-pointer items-start gap-3 rounded-[var(--radius-plate)] border border-[var(--color-line)] px-3 py-3">
          <input
            type="checkbox"
            name="acknowledged"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
            data-testid="role-ack"
          />
          <span>I understand my result is shared with {organisationName ?? "the organisation"}.</span>
        </label>
      ) : null}
      <div>
        <Button type="submit" disabled={pending} data-testid="role-start">
          {pending ? "Starting…" : label}
        </Button>
      </div>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
