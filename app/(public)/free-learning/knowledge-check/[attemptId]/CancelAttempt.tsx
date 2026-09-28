"use client";

import { startTransition, useActionState, useState } from "react";
import { cancelKnowledgeCheckAttemptAction, type KnowledgeCheckState } from "@/modules/free-learning/knowledge-check.actions";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { FormStatus } from "@/shared/ui/forms";

/*
 * "Cancel test" on a running Knowledge Check (founder, 2026-09-28: "as it's
 * a free test, if user want to cancel it in the middle … introduce cancel
 * button"). Confirmed through the portal's own dialog; the server action
 * deletes the unfinished attempt (audited) and returns to Free
 * Certifications. Distinct from "Save & exit", which keeps the attempt for
 * a later Continue.
 */

const initial: KnowledgeCheckState = { status: "idle" };

export function CancelAttempt({ attemptId }: { attemptId: string }) {
  const [state, action, pending] = useActionState(cancelKnowledgeCheckAttemptAction, initial);
  const [confirming, setConfirming] = useState(false);

  return (
    <span className="flex items-center gap-3">
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        data-testid="kc-cancel"
        className="text-body-sm py-1 text-[var(--color-ink-quiet)] underline underline-offset-4 hover:text-[var(--color-ink)] disabled:opacity-60"
      >
        {pending ? "Cancelling…" : "Cancel test"}
      </button>
      <ConfirmDialog
        open={confirming}
        title="Cancel this check?"
        body="Your answers so far will be discarded and this attempt will be deleted. You can start a fresh check any time — it is free."
        confirmLabel="Cancel the test"
        cancelLabel="Keep going"
        onConfirm={() => {
          setConfirming(false);
          const data = new FormData();
          data.set("attemptId", attemptId);
          startTransition(() => action(data));
        }}
        onCancel={() => setConfirming(false)}
      />
    </span>
  );
}
