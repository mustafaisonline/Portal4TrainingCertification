/*
 * One error class for the role-test domain: the UI maps `reason` to wording;
 * `message` is for logs. Pure (importable from client-safe modules).
 */

export type AssessmentErrorReason =
  /** Input failed validation (the message says which field). */
  | "invalid_input"
  /** The thing asked for does not exist (or is not visible to this person). */
  | "not_found"
  /** A slug is already used. */
  | "slug_taken"
  /** The role or organisation is missing, unpublished, not offered, or the wrong kind for this test. */
  | "role_unavailable"
  /** The bank cannot make a test yet (nothing to draw, or a private role below its minimum). */
  | "bank_too_small"
  /** An organisation test was started without the candidate acknowledging that the result is shared. */
  | "organisation_ack_required"
  /** The 90 minutes are up. */
  | "time_expired"
  | "already_finished"
  | "not_finished"
  /** A question cannot be edited or deleted in its current status. */
  | "not_editable"
  /** The actor may not touch this organisation's data. */
  | "forbidden"
  /** An organisation does not offer this role. */
  | "role_not_offered";

export class AssessmentError extends Error {
  constructor(
    readonly reason: AssessmentErrorReason,
    message: string,
  ) {
    super(message);
    this.name = "AssessmentError";
  }
}
