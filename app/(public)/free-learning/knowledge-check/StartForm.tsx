"use client";

import { useActionState } from "react";
import { startKnowledgeCheckAction, type KnowledgeCheckState } from "@/modules/free-learning/knowledge-check.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

const initial: KnowledgeCheckState = { status: "idle" };

export function StartForm({ sizes }: { sizes: { size: number; available: boolean }[] }) {
  const [state, action, pending] = useActionState(startKnowledgeCheckAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Start a Knowledge Check">
      <div className="flex flex-wrap gap-3">
        {sizes.map((s) => (
          <Button key={s.size} type="submit" name="size" value={String(s.size)} variant={s.available ? "primary" : "secondary"} disabled={pending || !s.available} data-testid={`kc-start-${s.size}`}>
            {s.size} questions{s.available ? "" : " — not enough reviewed yet"}
          </Button>
        ))}
      </div>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
