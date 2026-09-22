"use client";

import { useActionState } from "react";
import { setEnquiryStatusAction, type EnquiryActionState } from "@/modules/catalogue/enquiries/admin.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * Enquiry status controls (Milestone 8 plan §2 item 3): Mark replied · Close
 * · Reopen. Each is a small form posting the target status to the one
 * server action; the page re-renders from the database. The button for the
 * status the enquiry already has is not shown.
 */

const initial: EnquiryActionState = { status: "idle" };

export function EnquiryStatusActions({ enquiryId, status }: { enquiryId: string; status: "new" | "replied" | "closed" }) {
  const [state, action, pending] = useActionState(setEnquiryStatusAction, initial);
  const choices: { status: "replied" | "closed" | "new"; label: string; testId: string; variant: "primary" | "secondary" }[] = [
    { status: "replied", label: "Mark replied", testId: "enquiry-mark-replied", variant: "primary" },
    { status: "closed", label: "Close", testId: "enquiry-close", variant: "secondary" },
    { status: "new", label: "Reopen", testId: "enquiry-reopen", variant: "secondary" },
  ];
  return (
    <div className="flex flex-col gap-2" data-testid="enquiry-actions">
      <div className="flex flex-wrap items-center gap-2">
        {choices
          .filter((c) => c.status !== status)
          .map((c) => (
            <form key={c.status} action={action}>
              <input type="hidden" name="enquiryId" value={enquiryId} />
              <input type="hidden" name="status" value={c.status} />
              <Button type="submit" variant={c.variant} disabled={pending} data-testid={c.testId}>
                {c.label}
              </Button>
            </form>
          ))}
      </div>
      {state.status !== "idle" ? <FormStatus tone={state.status === "error" ? "error" : "success"}>{state.message}</FormStatus> : null}
    </div>
  );
}
