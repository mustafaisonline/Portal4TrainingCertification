"use client";

import { useActionState } from "react";
import { addSuppressionAction, removeSuppressionAction, retryEmailAction, type EmailActionState } from "@/modules/notifications/email-admin.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus, inputClass } from "@/shared/ui/forms";

/* Admin → Email: the three small forms (retry, add to the do-not-send list, remove from it). */

const initial: EmailActionState = { status: "idle" };

function Status({ state }: { state: EmailActionState }) {
  return state.status === "idle" ? null : <FormStatus tone={state.status === "error" ? "error" : "success"}>{state.message}</FormStatus>;
}

export function RetryEmailForm({ emailId }: { emailId: string }) {
  const [state, action, pending] = useActionState(retryEmailAction, initial);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="emailId" value={emailId} />
      <Button type="submit" variant="secondary" disabled={pending} data-testid="email-retry">
        Retry
      </Button>
      <Status state={state} />
    </form>
  );
}

export function AddSuppressionForm() {
  const [state, action, pending] = useActionState(addSuppressionAction, initial);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" aria-label="Add an address to the do-not-send list">
      <div className="flex flex-col gap-2">
        <label htmlFor="s-email" className="text-label">
          Email address
        </label>
        <input id="s-email" name="email" type="email" required maxLength={254} autoComplete="off" className={inputClass} data-testid="suppression-email" />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="s-reason" className="text-label">
          Reason (optional)
        </label>
        <input id="s-reason" name="reason" type="text" maxLength={200} placeholder="e.g. bounced — mailbox does not exist" className={inputClass} data-testid="suppression-reason" />
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending} data-testid="suppression-add">
          Add to the list
        </Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function RemoveSuppressionForm({ suppressionId, email }: { suppressionId: string; email: string }) {
  const [state, action, pending] = useActionState(removeSuppressionAction, initial);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="suppressionId" value={suppressionId} />
      <Button type="submit" variant="secondary" disabled={pending} aria-label={`Remove ${email} from the list`} data-testid="suppression-remove">
        Remove
      </Button>
      <Status state={state} />
    </form>
  );
}
