"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buyAgenticAction, claimAgenticAction, type AgenticFormState } from "@/modules/agentic/actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

const initial: AgenticFormState = { status: "idle" };

/** One "Buy" button with the digital-goods acknowledgement the server requires (CR-2026-10-04-0112). */
export function BuyForm({ sku, label, testId, variant = "primary", payNote }: { sku: string; label: string; testId: string; variant?: "primary" | "secondary"; payNote?: string }) {
  const [state, action, pending] = useActionState(buyAgenticAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3" data-testid={`${testId}-form`}>
      <input type="hidden" name="sku" value={sku} />
      <label className="text-body-sm flex items-start gap-2 text-[var(--color-ink-quiet)]">
        <input type="checkbox" name="acknowledged" value="yes" className="mt-1 h-4 w-4" required data-testid={`${testId}-ack`} />
        <span>
          I understand this is a digital download, non-refundable once downloaded, and I accept the{" "}
          <Link href="/agentic-ai/terms" className="text-[var(--color-primary)] underline underline-offset-4">
            Agentic AI terms
          </Link>
          .
        </span>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={variant} disabled={pending} data-testid={testId}>
          {pending ? "Taking you to Stripe…" : label}
        </Button>
        {payNote ? <span className="text-body-sm text-[var(--color-ink-faint)]">{payNote}</span> : null}
      </div>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}

export function ClaimForm({ slug, creditsLeft }: { slug: string; creditsLeft: number }) {
  const [state, action, pending] = useActionState(claimAgenticAction, initial);
  return (
    <form action={action} className="flex flex-col gap-2" data-testid="agentic-claim-form">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending} data-testid="agentic-claim">
          {pending ? "Preparing…" : "Use 1 credit and download"}
        </Button>
        <span className="text-body-sm text-[var(--color-ink-quiet)]">
          {creditsLeft} {creditsLeft === 1 ? "credit" : "credits"} left — this item is yours for good once you claim it.
        </span>
      </div>
      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
    </form>
  );
}
