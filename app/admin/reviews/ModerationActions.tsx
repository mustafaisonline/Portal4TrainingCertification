"use client";

import { useActionState, useId } from "react";
import { hideReviewAction, moderateReviewAction, restoreReviewAction, type AdminReviewActionState } from "@/modules/reviews/admin.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus, inputClass } from "@/shared/ui/forms";

/*
 * Per-review moderation controls (requirements §7.4): Approve · Reject (with
 * a note, in a disclosure) · Hide from public · Restore. Each is a small form
 * posting to its server action; the list re-renders from the database.
 * Restore is disabled — with the reason — when the learner did not consent
 * to public display, and the server refuses it regardless.
 */

const initial: AdminReviewActionState = { status: "idle" };

export function ModerationActions({
  reviewId,
  moderationStatus,
  visibilityStatus,
  consentPublic,
  compact = false,
}: {
  reviewId: string;
  moderationStatus: "pending" | "approved" | "rejected";
  visibilityStatus: "visible" | "hidden";
  consentPublic: boolean;
  compact?: boolean;
}) {
  const [modState, modAction, moderating] = useActionState(moderateReviewAction, initial);
  const [hideState, hideAction, hiding] = useActionState(hideReviewAction, initial);
  const [restoreState, restoreAction, restoring] = useActionState(restoreReviewAction, initial);
  const noteId = useId();
  const busy = moderating || hiding || restoring;
  const status = [modState, hideState, restoreState].find((s) => s.status !== "idle");
  const btn = compact ? "px-3! py-1.5!" : "";

  return (
    <div className="flex flex-col gap-2" data-testid="moderation-actions">
      <div className="flex flex-wrap items-center gap-2">
        {moderationStatus !== "approved" ? (
          <form action={modAction}>
            <input type="hidden" name="reviewId" value={reviewId} />
            <input type="hidden" name="decision" value="approved" />
            <Button type="submit" disabled={busy} className={btn} data-testid="review-approve">
              Approve
            </Button>
          </form>
        ) : null}
        {visibilityStatus === "visible" ? (
          <form action={hideAction}>
            <input type="hidden" name="reviewId" value={reviewId} />
            <Button type="submit" variant="secondary" disabled={busy} className={btn} data-testid="review-hide">
              Hide from public
            </Button>
          </form>
        ) : (
          <form action={restoreAction}>
            <input type="hidden" name="reviewId" value={reviewId} />
            <Button
              type="submit"
              variant="secondary"
              disabled={busy || !consentPublic}
              title={consentPublic ? undefined : "The learner asked to keep this private"}
              aria-disabled={!consentPublic ? true : undefined}
              className={btn}
              data-testid="review-restore"
            >
              Restore
            </Button>
          </form>
        )}
      </div>
      {moderationStatus !== "rejected" ? (
        <details className="text-body-sm">
          <summary className="cursor-pointer text-[var(--color-primary)] underline underline-offset-4" data-testid="review-reject-open">
            Reject…
          </summary>
          <form action={modAction} className="mt-2 flex flex-col gap-2">
            <input type="hidden" name="reviewId" value={reviewId} />
            <input type="hidden" name="decision" value="rejected" />
            <label htmlFor={noteId} className="text-label">
              Note <span className="font-normal normal-case tracking-normal text-[var(--color-ink-faint)]">(optional, kept in the audit log)</span>
            </label>
            <textarea id={noteId} name="note" rows={2} maxLength={1000} className={`${inputClass} resize-y`} />
            <div>
              <Button type="submit" variant="secondary" disabled={busy} className={btn} data-testid="review-reject">
                Reject
              </Button>
            </div>
          </form>
        </details>
      ) : null}
      {status ? <FormStatus tone={status.status === "error" ? "error" : "success"}>{status.message}</FormStatus> : null}
    </div>
  );
}
