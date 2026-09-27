"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { trainingAccess } from "@/modules/catalogue/programmes/admin-access";
import { ATTENDANCE_NOTE_MAX, AttendanceError, saveAttendance, type AttendanceEntry } from "./repository";

/*
 * The attendance sheet's one action (Milestone 13 WP4). Authorises FIRST
 * with the same `trainingAccess()` the admin layout uses — an administrator
 * for every date, a Trainer for their own (N7) — because an action is its own
 * HTTP endpoint (ADR-020). The form carries, per registration, an answer
 * (`attended-<id>` = yes | no | "") and a note (`note-<id>`); nothing else.
 */

export type AttendanceActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "saved"; message: string; savedAt: string };

const ANSWER = /^attended-([0-9a-f-]{36})$/;

export async function saveAttendanceAction(_prev: AttendanceActionState, formData: FormData): Promise<AttendanceActionState> {
  const access = await trainingAccess();
  if (!access.ok) {
    return {
      status: "error",
      message: access.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to record attendance.",
    };
  }
  const offeringId = String(formData.get("offeringId") ?? "").trim();

  const entries: AttendanceEntry[] = [];
  for (const [key, value] of formData.entries()) {
    const m = ANSWER.exec(key);
    if (!m || typeof value !== "string") continue;
    const registrationId = m[1]!;
    const answer = value.trim().toLowerCase();
    const noteRaw = formData.get(`note-${registrationId}`);
    const note = typeof noteRaw === "string" ? noteRaw.trim().slice(0, ATTENDANCE_NOTE_MAX + 1) : null;
    entries.push({ registrationId, attended: answer === "yes" ? true : answer === "no" ? false : null, note });
  }

  try {
    const result = await withTransaction((tx) => saveAttendance(tx, { offeringId, actorUserId: access.user.id, entries, scope: access.scope }));
    revalidatePath(`/admin/attendance/${offeringId}`);
    revalidatePath("/admin/attendance");
    revalidatePath("/account", "layout"); // the participant's My Trainings shows the answer
    const savedAt = new Date().toISOString();
    const message =
      result.answered === 0
        ? "No answers to save — choose Yes or No for at least one participant."
        : result.changed === 0
          ? `Nothing changed — the ${result.answered} answer${result.answered === 1 ? "" : "s"} on the sheet already matched.`
          : `Attendance saved — ${result.changed} ${result.changed === 1 ? "entry" : "entries"} updated.`;
    return { status: "saved", message, savedAt };
  } catch (err) {
    if (err instanceof AttendanceError) {
      const message =
        err.reason === "note_too_long"
          ? `A note is longer than ${ATTENDANCE_NOTE_MAX} characters.`
          : err.reason === "registration_not_on_offering"
            ? "One of the rows no longer belongs to this date. Reload the sheet and try again."
            : "This date could not be found.";
      return { status: "error", message };
    }
    console.error(`[attendance] save failed for offering ${offeringId}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "Attendance could not be saved. Please try again." };
  }
}
