"use client";

import { useActionState, useEffect, useState } from "react";
import { replyToEnquiryAction, type EnquiryActionState } from "@/modules/catalogue/enquiries/admin.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus, TextAreaField } from "@/shared/ui/forms";

/*
 * Reply to an enquiry from Admin → Enquiries (CR-2026-10-03-1226). The text is
 * emailed to the person through the outbox; the enquiry is then marked replied.
 * Controlled so a failed send keeps what was typed; cleared after a success.
 */

const initial: EnquiryActionState = { status: "idle" };

export function EnquiryReplyForm({ enquiryId, to }: { enquiryId: string; to: string }) {
  const [state, action, pending] = useActionState(replyToEnquiryAction, initial);
  const [text, setText] = useState("");
  useEffect(() => {
    if (state.status === "done") setText("");
  }, [state]);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate data-testid="enquiry-reply-form">
      <input type="hidden" name="enquiryId" value={enquiryId} />
      <TextAreaField label="Reply by email" name="reply" rows={6} value={text} onChange={(e) => setText(e.target.value)} hint={`Sent to ${to}. The original message is quoted underneath.`} required />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} data-testid="enquiry-reply-send">
          {pending ? "Sending…" : "Send reply"}
        </Button>
        {state.status !== "idle" ? <FormStatus tone={state.status === "error" ? "error" : "success"}>{state.message}</FormStatus> : null}
      </div>
    </form>
  );
}
