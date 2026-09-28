"use client";

import { useActionState, useRef, useState } from "react";
import {
  createCouponAction,
  deleteCouponAction,
  setCouponStatusAction,
  updateCouponAction,
  type CouponActionState,
} from "@/modules/commerce/coupons.actions";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { Field, FormStatus, SelectField } from "@/shared/ui/forms";

/*
 * Client forms of /admin/coupons (spec §3/§12; N7). Fields only — every
 * decision (the generated code, validation, audit) is server-side in the
 * coupon actions/repository.
 */

const initial: CouponActionState = { status: "idle" };

export type TrainingOption = { id: string; title: string };

function Status({ state }: { state: CouponActionState }) {
  if (state.status === "idle") return null;
  return <FormStatus tone={state.status === "success" ? "success" : "error"}>{state.message}</FormStatus>;
}

function CouponFields({ trainings, defaults }: { trainings: TrainingOption[]; defaults?: { email: string; programmeId: string; discountPercent: number; expiresAt: string } }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="User email" name="email" type="email" required defaultValue={defaults?.email} placeholder="person@example.com" />
      <SelectField label="Training" name="programmeId" required defaultValue={defaults?.programmeId ?? ""}>
        <option value="" disabled>
          Choose a training…
        </option>
        {trainings.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </SelectField>
      <Field label="Discount %" name="discountPercent" type="number" min={1} max={100} required defaultValue={defaults ? String(defaults.discountPercent) : undefined} placeholder="e.g. 98" />
      <Field label="Valid through (optional, UTC)" name="expiresAt" type="date" defaultValue={defaults?.expiresAt} />
    </div>
  );
}

export function GenerateCouponForm({ trainings }: { trainings: TrainingOption[] }) {
  const [state, action, pending] = useActionState(createCouponAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Generate a new coupon" data-testid="coupon-generate-form">
      <CouponFields trainings={trainings} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="coupon-generate">
          {pending ? "Generating…" : "+ Generate New Coupon"}
        </Button>
        <span data-testid="coupon-generate-status">
          <Status state={state} />
        </span>
      </div>
    </form>
  );
}

export function EditCouponForm({
  id,
  trainings,
  defaults,
}: {
  id: string;
  trainings: TrainingOption[];
  defaults: { email: string; programmeId: string; discountPercent: number; expiresAt: string };
}) {
  const [state, action, pending] = useActionState(updateCouponAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4" aria-label="Edit coupon" data-testid="coupon-edit-form">
      <input type="hidden" name="id" value={id} />
      <CouponFields trainings={trainings} defaults={defaults} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="coupon-save">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="secondary" href="/admin/coupons">
          Done
        </Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function RowActions({ id, status, redeemed }: { id: string; status: "active" | "disabled"; redeemed: boolean }) {
  const [statusState, statusAction, statusPending] = useActionState(setCouponStatusAction, initial);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteCouponAction, initial);
  const deleteFormRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const [confirming, setConfirming] = useState(false);
  if (redeemed) return <span className="text-body-sm text-[var(--color-ink-faint)]">Record</span>;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="secondary" href={`/admin/coupons?edit=${id}`} data-testid="coupon-edit">
        Edit
      </Button>
      <form action={statusAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value={status === "active" ? "disabled" : "active"} />
        <Button type="submit" variant="secondary" disabled={statusPending} data-testid="coupon-toggle">
          {status === "active" ? "Disable" : "Enable"}
        </Button>
      </form>
      <form
        ref={deleteFormRef}
        action={deleteAction}
        onSubmit={(e) => {
          // The portal's own dialog, never window.confirm (founder, 2026-09-28).
          if (confirmed.current) {
            confirmed.current = false;
            return;
          }
          e.preventDefault();
          setConfirming(true);
        }}
      >
        <input type="hidden" name="id" value={id} />
        <Button type="submit" variant="secondary" disabled={deletePending} data-testid="coupon-delete">
          Delete
        </Button>
      </form>
      <ConfirmDialog
        open={confirming}
        title="Delete this coupon?"
        body="The unused coupon and its code stop working immediately. This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Keep"
        onConfirm={() => {
          setConfirming(false);
          confirmed.current = true;
          deleteFormRef.current?.requestSubmit();
        }}
        onCancel={() => setConfirming(false)}
      />
      <Status state={statusState.status === "idle" ? deleteState : statusState} />
    </div>
  );
}
