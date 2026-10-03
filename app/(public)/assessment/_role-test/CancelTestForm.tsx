"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { cancelRoleTestAction, type RoleTestState } from "@/modules/assessment/role-test.actions";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormStatus } from "@/shared/ui/forms";

const initial: RoleTestState = { status: "idle" };

/*
 * "Cancel test" for Prepare for Interview (CR-2026-10-03-2251): the person can leave at any time and nothing is kept — the running
 * test and its answers are deleted. A separate form (a form cannot sit inside the question form) with a plain two-step confirmation,
 * so one stray click cannot throw away an hour of answers.
 */
export function CancelTestForm({ attemptId }: { attemptId: string }) {
  const [state, action, pending] = useActionState(cancelRoleTestAction, initial);
  const [asking, setAsking] = useState(false);
  const wasAsking = useRef(false);
  // Focus follows the dialog: the safe button when it opens, the trigger again when the person keeps going.
  useEffect(() => {
    if (asking) document.getElementById("cancel-keep-going")?.focus();
    else if (wasAsking.current) document.getElementById("cancel-test-trigger")?.focus();
    wasAsking.current = asking;
  }, [asking]);
  return (
    <form action={action} className="mt-6" aria-label="Cancel the test" data-testid="cancel-form">
      <input type="hidden" name="attemptId" value={attemptId} />
      {asking ? (
        <Card variant="plate" className="p-4" role="alertdialog" aria-labelledby="cancel-confirm-title" data-testid="cancel-confirm">
          <p id="cancel-confirm-title" className="text-body-sm mb-3 font-medium">
            Cancel this test? Your answers are deleted and no result is kept. This cannot be undone.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending} data-testid="cancel-confirm-yes">
              {pending ? "Cancelling…" : "Yes, cancel the test"}
            </Button>
            <Button id="cancel-keep-going" type="button" variant="secondary" onClick={() => setAsking(false)} data-testid="cancel-confirm-no">
              No, keep going
            </Button>
          </div>
        </Card>
      ) : (
        <Button id="cancel-test-trigger" type="button" variant="text" onClick={() => setAsking(true)} data-testid="cancel-test">
          Cancel test
        </Button>
      )}
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
