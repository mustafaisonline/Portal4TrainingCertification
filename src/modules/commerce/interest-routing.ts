import type { DeliveryFormatRecord } from "@/modules/catalogue/programmes/types";
import { findPublishedProgrammeBySlug } from "@/modules/catalogue/programmes/repository";
import { getCurrentUser } from "@/modules/identity/session";
import { enabledInterestSetting, formatIdsWithoutOpenDate } from "./interest.repository";

/*
 * CR-2026-10-02-2010 (founder, 2026-10-02; answers: Stripe is reached only when
 * logged in; several open dates → the schedule filtered to the training; the
 * generic /schedule button → the Trainings list): the ONE place that decides
 * where a "Register your interest" / "Register interest" button goes for a
 * training.
 *
 *   interest feature off, or every format already has an open date   → null (the caller keeps its enquiry link)
 *   some format has no open date, signed out                         → the sign-in page, returning to the training's formats
 *   some format has no open date, signed in                          → the training's formats (the interest form; card payment on Stripe)
 *
 * A format WITH an open date never reaches this helper's answer: those buttons
 * are "Register" and go to /checkout/<offering>, which itself requires sign-in
 * before Stripe — Stripe is never reachable signed out.
 */

/** The one sign-in link for registering interest, shared by the format slot, the hero button and every other interest button. */
export function interestSignInHref(programmeSlug: string): string {
  return `/sign-in?return-to=${encodeURIComponent(`/programs/${programmeSlug}#formats`)}`;
}

/** Pure decision, given what the caller already loaded. */
export function interestDestination(input: { programmeSlug: string; signedIn: boolean; interestEnabled: boolean; formatsWithoutOpenDate: number }): string | null {
  if (!input.interestEnabled || input.formatsWithoutOpenDate === 0) return null;
  return input.signedIn ? `/programs/${input.programmeSlug}#formats` : interestSignInHref(input.programmeSlug);
}

/** For callers that hold the formats already (the training page). */
export async function interestHrefForFormats(input: { programmeSlug: string; formats: DeliveryFormatRecord[]; now?: Date }): Promise<string | null> {
  const now = input.now ?? new Date();
  const [user, setting] = await Promise.all([getCurrentUser(), enabledInterestSetting(now)]);
  if (!setting || input.formats.length === 0) return null;
  const noDate = await formatIdsWithoutOpenDate(input.formats.map((f) => f.id), now);
  return interestDestination({ programmeSlug: input.programmeSlug, signedIn: Boolean(user), interestEnabled: true, formatsWithoutOpenDate: noDate.size });
}

/** For callers that know only the training's slug (the schedule page). Null when the training is not published. */
export async function interestHrefForTraining(programmeSlug: string, now = new Date()): Promise<string | null> {
  const programme = await findPublishedProgrammeBySlug(programmeSlug);
  if (!programme) return null;
  return interestHrefForFormats({ programmeSlug, formats: programme.deliveryFormats, now });
}
