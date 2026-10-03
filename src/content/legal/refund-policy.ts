import type { LegalDocument } from "./types";

/*
 * Refund & cancellation policy — DRAFT for review by a Malaysian-qualified
 * lawyer. Drafted 2026-09-21 on founder direction.
 *
 * THE RULE (founder decision, 2026-09-21 — resolves OQ-2 / OQ-9 for the
 * scheduled public offerings):
 *   ≥ 14 calendar days before the start date  → 100% refund
 *   7–13 calendar days before                  →  50% refund
 *   < 7 days before, or after the start        →  no refund
 *   One free transfer to a later scheduled date of the same training is
 *   always allowed before the start date. If the Academy cancels or
 *   reschedules, the participant chooses a full refund or a transfer.
 *   Refunds go back to the original payment method via Stripe (typically
 *   5–10 business days, set by the bank/card issuer). Private/corporate
 *   cohorts are governed by their own agreement.
 *
 * The schedule is repeated in the table below and summarised in the Terms of
 * service §8; tests/unit/legal-content.test.ts checks the numbers are present.
 * Nothing here asserts compliance with the Consumer Protection Act 1999; the
 * draft is intended to meet it and must be reviewed before publication.
 *
 * UPDATED 2026-09-28 (founder: "update content of all [footer legal] items
 * as per our final changes on the portal") — "Programme" renamed to
 * "Training" throughout, matching the site-wide wording adopted 2026-09-27;
 * §1 gained a paragraph on "Support the Academy" one-off payments (ADR-048),
 * which have no refund tier and were not covered when this draft was first
 * written.
 */

export const refundPolicy: LegalDocument = {
  key: "refund",
  title: "Refund & cancellation policy",
  version: "2026-10-03",
  status: "published",
  lastUpdated: "2026-10-03",
  summary:
    "When a training registration can be cancelled or moved to another date, how much is refunded, how to do it, and what happens if the Academy has to cancel or reschedule.",
  sections: [
    {
      heading: "1. What this policy covers",
      paragraphs: [
        "This policy applies to registrations for the scheduled public offerings of Data & AI Academy trainings that you register and pay for on this portal, operated by Your Partner Technologies (business registration number 202401023226 (1569075-K)). It forms part of the Terms of service.",
        "It does not apply to private or corporate cohorts, which are governed by the written agreement for that cohort (see section 8).",
        "Certificate of Completion renewal fee: the fee you pay to renew a certificate is not refundable once the renewal has been applied, because the extension to the certificate's expiry date is delivered immediately when the payment is confirmed. If you believe a renewal was charged in error — for example, you were charged twice — raise it through Contact us, and we will look into it and handle it manually.",
        "Free Assessment Check certificate unlock: the one-time fee you may pay to unlock the printable Certificate of Achievement for a passed Free Assessment Check is not refundable once the certificate has been shown, because the certificate is delivered immediately when the payment is confirmed. The result itself, its ID and its public verification page are free and are never withheld. If you believe an unlock was charged in error, raise it through Contact us.",
        "Register your interest: the small fee you pay to register your interest in a training format (shown before you pay; currently USD 2) is not refundable and is not credited against the training fee. It records that you want the training in that format, so the trainer can plan it; it does not reserve a seat, and the day-based schedule in section 2 does not apply to it. A participant in Pakistan registers interest without the fee. If you believe it was charged in error — for example, you were charged twice — raise it through Contact us.",
        "Support the Academy: this is a one-off payment that grants no service or benefit in return, so the day-based schedule in section 2 does not apply to it. If you paid by mistake, or want to ask for a refund for another reason, raise it through Contact us and we will consider it.",
        "\"Start date\" means the first scheduled session of the offering you registered for, in the time zone shown on the offering. Days are counted as calendar days before that date, not business days.",
      ],
    },
    {
      heading: "2. Cancelling your registration",
      paragraphs: [
        "You may cancel a registration at any time before the start date. How much is refunded depends on how far ahead of the start date you cancel:",
        "The percentage is applied to the amount you actually paid for that registration, in the currency you paid in. Refunds are net of the payment-processing fee charged to us by our payment provider on the original transaction, which the provider does not return when a payment is refunded; that fee is deducted from the refundable amount and is shown to you before you confirm a cancellation. We do not deduct any other administrative charge.",
        "A registration cannot be cancelled for a refund once the offering has started, and no refund is due for sessions you do not attend.",
      ],
      table: {
        caption: "Refund schedule for a cancellation by the participant",
        columns: ["When you cancel", "Refund"],
        rows: [
          ["14 or more calendar days before the start date", "100% of the amount paid"],
          ["7 to 13 calendar days before the start date", "50% of the amount paid"],
          ["Fewer than 7 days before the start date, or after it", "No refund"],
        ],
      },
    },
    {
      heading: "3. How to cancel",
      paragraphs: [
        "Cancel from the registration in your account area on this portal, or through Contact us, using the email address on your account. Either way, tell us which offering you are cancelling.",
        "The date we receive your cancellation — the moment you confirm it in the account area, or the time your email reaches us — is the date used to decide which line of the schedule applies. We confirm every cancellation by email, with the refund amount, so you have a record.",
        "If you registered on behalf of someone else, the cancellation must come from the account that made the registration.",
      ],
    },
    {
      heading: "4. Transferring to a later date instead",
      paragraphs: [
        "Rather than cancel, you may transfer your registration once, free of charge, to a later scheduled date of the same training, provided you ask before the start date of the offering you are leaving and the later offering has a place available. Ask from your account area or through Contact us.",
        "After a transfer, the refund schedule in section 2 is counted from the start date of the new offering — but the transfer itself is not a cancellation, and no refund is made for it.",
        "A second transfer is not available under this policy; if you cannot attend the new date, section 2 applies. A transfer to a different training, or to another person, is not available under this policy; if you need either, write to us through Contact us and we will tell you what is possible.",
      ],
    },
    {
      heading: "5. If the Academy cancels or reschedules",
      paragraphs: [
        "If we cancel an offering, or move its start date, we will tell you by email as early as we can. You then choose one of the following, whatever the timing:",
      ],
      bullets: [
        "A full refund — 100% of the amount you paid for that registration, or",
        "A transfer to another scheduled date of the same training, at no extra charge. This does not use up the free transfer described in section 4.",
      ],
    },
    {
      heading: "6. How and when refunds are paid",
      paragraphs: [
        "Refunds are returned to the payment method you originally paid with, through Stripe, our payment processor. We cannot refund to a different card, account or person, and refunds are made in the currency you paid in.",
        "The amount refunded is the percentage due under section 2, less the payment-processing fee that Stripe charged us on your original payment. Stripe does not return that fee when a payment is refunded, so it is deducted from the refund rather than absorbed by the Academy. The exact fee and the resulting refund are shown to you on the cancellation screen before you confirm.",
        "We instruct the refund promptly once a cancellation is confirmed. How long it then takes to appear depends on your bank or card issuer — typically 5 to 10 business days, sometimes longer for some banks and e-wallets. If a refund has not arrived after 15 business days, tell us through Contact us and we will chase it with Stripe and give you the reference.",
        "If you paid in a currency other than the one your bank account uses, the amount that arrives may differ from the amount you paid because of exchange-rate movements and your bank's fees. Those differences are outside our control and are not refunded by us.",
      ],
    },
    {
      heading: "7. Sales and Service Tax on refunds",
      paragraphs: [
        "Where Malaysian Sales and Service Tax (SST) was charged on a registration, it is refunded in the same proportion as the price. Our SST position is: we are not currently registered for Sales and Service Tax, so no SST is charged. Your refund confirmation shows the tax element separately where it applies.",
      ],
    },
    {
      heading: "8. Private and corporate cohorts",
      paragraphs: [
        "Trainings delivered privately for an organisation are arranged under a separate written agreement between the Academy and that organisation, which sets out its own dates, fees, cancellation and rescheduling terms. This policy does not apply to them, and an individual employee's place on such a cohort is a matter between the employee and the organisation.",
      ],
    },
    {
      heading: "9. Your rights under consumer law",
      paragraphs: [
        "Nothing in this policy removes or limits any guarantee, right or remedy you have under the Consumer Protection Act 1999 or any other Malaysian law that cannot be excluded by agreement. In particular, if a training is not delivered with reasonable care and skill, or is materially not as described, you may have remedies under that Act in addition to this policy.",
        "If we cannot resolve a refund dispute with you directly, you may be able to bring a claim before the Tribunal for Consumer Claims Malaysia.",
      ],
    },
    {
      heading: "10. Changes to this policy",
      paragraphs: [
        "We may change this policy from time to time. The current version, its version number and its effective date are shown on this page. A change does not apply to a registration that was already confirmed under the earlier version, unless the change is to your benefit or is required by law.",
      ],
    },
    {
      heading: "11. Contact",
      paragraphs: [
        "Your Partner Technologies (business registration number 202401023226 (1569075-K)), 15-03A, One Jelatek Condominium, Jalan Jelatek, Kementah, 54200 Kuala Lumpur W.P. Kuala Lumpur, Malaysia.",
        "Contact: use the Contact Us page of this portal.",
        "Effective date of this version: 3 October 2026. Version: 2026-10-03.",
      ],
    },
  ],
};
