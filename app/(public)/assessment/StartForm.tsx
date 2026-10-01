"use client";

import { useActionState } from "react";
import { startKnowledgeCheckAction, type KnowledgeCheckState } from "@/modules/free-learning/knowledge-check.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

const initial: KnowledgeCheckState = { status: "idle" };

/** ONE button: there is a single test (200 questions, 3 hours). While a test is running, the button
 *  returns to it — the server allows one running test per person. */
export function StartForm({ available, running }: { available: boolean; running: boolean }) {
  const [state, action, pending] = useActionState(startKnowledgeCheckAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Start the Free Assessment Check">
      <div>
        <Button type="submit" variant={available ? "primary" : "secondary"} disabled={pending || !available} data-testid="kc-start">
          {running ? "Return to my running test" : "Start the Free Assessment Check"}
          {available ? "" : " — not enough reviewed questions yet"}
        </Button>
      </div>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
