import { LOCAL_PARTNER_PAYMENT_MESSAGE } from "@/modules/catalogue/programmes/types";
import type { CommerceErrorCode } from "./errors";

/** Founder rule 2026-09-26: participants in Pakistan do not pay by card.
 *  The same sentence appears on the pricing cards and on the checkout
 *  screen when a Pakistan-profile participant reaches it (defined beside
 *  `PRICE_REGIONS`, re-exported here for the commerce callers). */
export { LOCAL_PARTNER_PAYMENT_MESSAGE };

/** The sentence a person sees for each service error — shared by the
 *  checkout and registration server actions. */
export const COMMERCE_MESSAGES: Record<CommerceErrorCode, string> = {
  offering_not_found: "This date no longer exists. Choose another from the schedule.",
  offering_not_open: "Registration for this date is not open.",
  offering_full: "This date is now full. Choose another from the schedule, or register interest for the next one.",
  offering_started: "This date has already started.",
  already_registered: "You are already registered for this date — see My registrations.",
  order_pending: "You already started a payment for this date. Finish it in the Stripe tab, or try again in 30 minutes when that hold expires.",
  documents_unpublished: "Registration is closed: the Terms, Privacy and Refund documents have not been published yet.",
  consent_required: "Please tick the box to agree to the Terms of service, Privacy policy and Refund & cancellation policy.",
  profile_incomplete: "A few profile details are needed before you can register — open Your profile, complete them, and come back to pay.",
  no_price_for_region: "No price is published for your region yet. Please contact us and we will help.",
  card_payment_unavailable: LOCAL_PARTNER_PAYMENT_MESSAGE,
  order_not_found: "We could not find that order.",
  registration_not_found: "We could not find that registration.",
  registration_not_active: "That registration is no longer active.",
  transfer_used: "This registration has already used its free transfer.",
  transfer_same_offering: "Choose a different date to transfer to.",
  transfer_wrong_programme: "Transfers are only possible between dates of the same programme.",
  refund_failed:
    "Your registration is cancelled, but the refund could not be issued automatically. It has been recorded and we will resolve it with you by email — nothing further is needed from you.",
};

export const PAYMENTS_NOT_CONFIGURED_MESSAGE =
  "Online payments are not configured on this installation yet, so no payment can be taken. Nothing has been charged.";
