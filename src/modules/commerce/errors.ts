/*
 * Commerce module (Milestone 4) — the errors the services throw. Each carries
 * a stable `code` so a server action can choose the sentence a person sees
 * without string-matching messages, and so a test can assert the reason.
 * Nothing here is ever swallowed: the action logs the error with context and
 * then surfaces it.
 */

export type CommerceErrorCode =
  | "offering_not_found"
  | "offering_not_open"
  | "offering_full"
  | "offering_started"
  | "already_registered"
  | "order_pending"
  | "documents_unpublished"
  | "consent_required"
  | "profile_incomplete"
  | "no_price_for_region"
  | "card_payment_unavailable"
  | "order_not_found"
  | "registration_not_found"
  | "registration_not_active"
  | "transfer_used"
  | "transfer_same_offering"
  | "transfer_wrong_programme"
  | "refund_failed";

export class CommerceError extends Error {
  readonly code: CommerceErrorCode;
  constructor(code: CommerceErrorCode, message: string) {
    super(message);
    this.name = "CommerceError";
    this.code = code;
  }
}

/** Stripe keys are absent — the product says so; nothing pretends to succeed
 *  (M4 plan §6 commitment 6). */
export class PaymentsNotConfiguredError extends Error {
  constructor(variable: string) {
    super(
      `Payments are not configured: ${variable} is not set. Add the Stripe ${variable === "STRIPE_SECRET_KEY" ? "secret key" : "webhook signing secret"} to .env.local (test mode) or the platform secret store (ADR-030). Until then no payment can be started or verified.`,
    );
    this.name = "PaymentsNotConfiguredError";
  }
}

/** A webhook request whose signature does not verify — answered 400, never
 *  stored as processed (M4 plan §6 commitment 5). */
export class InvalidSignatureError extends Error {
  constructor(detail: string) {
    super(`Stripe webhook signature could not be verified: ${detail}`);
    this.name = "InvalidSignatureError";
  }
}
