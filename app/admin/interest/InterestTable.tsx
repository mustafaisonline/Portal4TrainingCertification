"use client";

import { useActionState, useState } from "react";
import { markNotifiedAction, type NotifiedState } from "@/modules/commerce/interest.actions";
import { Button } from "@/shared/ui/Button";
import { FormStatus } from "@/shared/ui/forms";

/*
 * The Users Interest list with its "Mark as notified" action (CR-2026-10-01-2138,
 * F4). Rows arrive as plain strings, already formatted by the page; the checkbox
 * values are interest ids, and the server re-applies the caller's scope — a
 * Trainer can only ever mark people interested in their own trainings.
 */

export type InterestTableRow = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  dateOfBirth: string;
  training: string;
  format: string;
  registered: string;
  fee: string;
  notified: string;
};

const initial: NotifiedState = { status: "idle" };

export function InterestTable({ rows }: { rows: InterestTableRow[] }) {
  const [state, action, pending] = useActionState(markNotifiedAction, initial);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const allChecked = rows.length > 0 && checked.size === rows.length;
  const toggle = (id: string) =>
    setChecked((c) => {
      const next = new Set(c);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <form action={action} aria-label="People interested" data-testid="interest-form">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" disabled={pending || checked.size === 0} data-testid="interest-mark-notified">
          {pending ? "Saving…" : `Mark ${checked.size > 0 ? checked.size : "selected"} as notified`}
        </Button>
        <span role="status" data-testid="interest-mark-status">
          {state.status === "done" ? <FormStatus tone="success">{state.message}</FormStatus> : null}
          {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="text-body-sm w-full min-w-[900px] text-left" data-testid="interest-table">
          <caption className="sr-only">People who registered interest</caption>
          <thead>
            <tr className="text-label border-b border-[var(--color-line)]">
              <th scope="col" className="w-10 py-2 pr-3">
                <input
                  type="checkbox"
                  aria-label="Select everyone listed"
                  checked={allChecked}
                  onChange={() => setChecked(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
                  className="h-4 w-4"
                  data-testid="interest-select-all"
                />
              </th>
              <th scope="col" className="py-2 pr-4">Person</th>
              <th scope="col" className="py-2 pr-4">Mobile</th>
              <th scope="col" className="py-2 pr-4">Date of birth</th>
              <th scope="col" className="py-2 pr-4">Training · format</th>
              <th scope="col" className="py-2 pr-4">Registered</th>
              <th scope="col" className="py-2">Notified</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--color-line)] align-top" data-testid="interest-row" data-interest={r.id}>
                <td className="py-3 pr-3">
                  <input type="checkbox" name="id" value={r.id} checked={checked.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.name || r.email}`} className="h-4 w-4" />
                </td>
                <th scope="row" className="py-3 pr-4 font-normal">
                  <span className="block font-medium text-[var(--color-ink)]">{r.name || "—"}</span>
                  <span className="block break-all text-[var(--color-ink-quiet)]">{r.email}</span>
                </th>
                <td className="py-3 pr-4 text-[var(--color-ink-quiet)]">{r.mobile || "—"}</td>
                <td className="py-3 pr-4 text-[var(--color-ink-quiet)]">{r.dateOfBirth || "—"}</td>
                <td className="py-3 pr-4 text-[var(--color-ink-quiet)]">
                  {r.training}
                  <br />
                  <span className="text-[var(--color-ink-faint)]">{r.format}</span>
                </td>
                <td className="py-3 pr-4 text-[var(--color-ink-quiet)]">
                  {r.registered}
                  <br />
                  <span className="text-[var(--color-ink-faint)]">{r.fee}</span>
                </td>
                <td className="py-3 text-[var(--color-ink-quiet)]" data-testid="interest-notified">
                  {r.notified || "Not yet"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </form>
  );
}
