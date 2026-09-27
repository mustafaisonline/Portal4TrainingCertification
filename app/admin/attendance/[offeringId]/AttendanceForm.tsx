"use client";

import { useActionState } from "react";
import { saveAttendanceAction, type AttendanceActionState } from "@/modules/attendance/attendance.actions";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { FormStatus } from "@/shared/ui/forms";

/*
 * The editable sheet (Milestone 13 WP4). One form, one Save: each row has a
 * Yes / No / — select named `attended-<registrationId>` and a note named
 * `note-<registrationId>`; the server action validates every row against the
 * offering and audits what changed. Dates are pre-formatted strings so this
 * client component needs no date library.
 */

export type SheetRow = {
  registrationId: string;
  user: { id: string; name: string; email: string };
  displayName: string;
  dateOfBirth: string | null;
  country: string | null;
  attended: boolean | null;
  note: string | null;
  updatedAt: string | null;
  recordedBy: { name: string } | null;
};

const initial: AttendanceActionState = { status: "idle" };

const columns = ["Name", "Email", "Date of birth", "Country", "Attended", "Note", "Updated"];

function formatUpdated(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kuala_Lumpur" }).format(d);
}

export function AttendanceForm({ offeringId, rows }: { offeringId: string; rows: SheetRow[] }) {
  const [state, action, pending] = useActionState(saveAttendanceAction, initial);
  const selectClass =
    "rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground)] px-3 py-2 text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

  return (
    <form action={action} aria-label="Attendance sheet" className="flex flex-col gap-4" data-testid="attendance-form">
      <input type="hidden" name="offeringId" value={offeringId} />
      <Card variant="panel" className="overflow-x-auto p-0">
        <table className="text-body-sm w-full min-w-[960px] border-collapse" data-testid="sheet-table">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {columns.map((c) => (
                <th key={c} scope="col" className="text-label px-4 py-3 font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const answerId = `attended-${r.registrationId}`;
              const noteId = `note-${r.registrationId}`;
              return (
                <tr key={r.registrationId} className="border-b border-[var(--color-line)] last:border-b-0 align-top" data-testid="sheet-row" data-registration={r.registrationId}>
                  <td className="px-4 py-3 text-[var(--color-ink)]" data-testid="sheet-name">
                    {r.displayName}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]" data-testid="sheet-email">
                    {r.user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]" data-testid="sheet-dob">
                    {r.dateOfBirth ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-ink-quiet)]" data-testid="sheet-country">
                    {r.country ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <label htmlFor={answerId} className="sr-only">
                      Attended, {r.displayName}
                    </label>
                    <select id={answerId} name={answerId} defaultValue={r.attended === null ? "" : r.attended ? "yes" : "no"} className={selectClass} data-testid="sheet-attended">
                      <option value="">—</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <label htmlFor={noteId} className="sr-only">
                      Note, {r.displayName}
                    </label>
                    <input id={noteId} name={noteId} type="text" maxLength={200} defaultValue={r.note ?? ""} placeholder="Optional" className={`${selectClass} w-full min-w-[160px]`} data-testid="sheet-note" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-[var(--color-ink-quiet)]" data-testid="sheet-updated">
                    {formatUpdated(r.updatedAt)}
                    {r.recordedBy ? <span className="block text-[var(--color-ink-faint)]">by {r.recordedBy.name}</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
      {state.status === "saved" ? (
        <FormStatus tone="success">
          <span data-testid="sheet-saved">{state.message}</span>
        </FormStatus>
      ) : null}

      <div>
        <Button type="submit" disabled={pending} data-testid="sheet-save">
          {pending ? "Saving…" : "Save attendance"}
        </Button>
      </div>
    </form>
  );
}
