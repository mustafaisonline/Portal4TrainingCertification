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
 *   One free transfer to a later scheduled date of the same programme is
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
 */

export const refundPolicy: LegalDocument = {
  key: "refund",
  title: "Refund & cancellation policy",
  version: "DRAFT-2026-09-21",
  status: "draft",
  lastUpdated: "2026-09-21",
  summary:
    "When a programme registration can be cancelled or moved to another date, how much is refunded, how to do it, and what happens if the Academy has to cancel or reschedule.",
  sections: [
    {
      heading: "About this draft",
      paragraphs: [
        "This is a draft prepared for review by a Malaysian-qualified lawyer. It is not yet in force, and no refund or cancellation term applies until a reviewed version is published on this page with an effective date.",
        "It is written to be read alongside the Consumer Protection Act 1999 — including the Consumer Protection (Electronic Trade Transactions) Regulations 2012, which require an online seller to state its cancellation and refund terms clearly before a purchase — and the Contracts Act 1950. It is intended to meet those laws; that intention has not yet been confirmed by legal review.",
        "The following details are not yet known and appear as placeholders in square brackets. They must be completed before publication:",
      ],
      bullets: [
        "[SSM registration number]",
        "[registered business address]",
        "[contact email]",
        "[phone number]",
        "[effective date]",
        "[SST registration status]",
      ],
    },
    {
      heading: "1. What this policy covers",
      paragraphs: [
        "This policy applies to registrations for the scheduled public offerings of Data & AI Academy programmes that you register and pay for on this portal, operated by Your Partner Technologies (business registration number [SSM registration number]). It forms part of the Terms of service.",
        "It does not apply to private or corporate cohorts, which are governed by the written agreement for that cohort (see section 8).",
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
        "Cancel from the registration in your account area on this portal, or by emailing [contact email] from the email address on your account. Either way, tell us which offering you are cancelling.",
        "The date we receive your cancellation — the moment you confirm it in the account area, or the time your email reaches us — is the date used to decide which line of the schedule applies. We confirm every cancellation by email, with the refund amount, so you have a record.",
        "If you registered on behalf of someone else, the cancellation must come from the account that made the registration.",
      ],
    },
    {
      heading: "4. Transferring to a later date instead",
      paragraphs: [
        "Rather than cancel, you may transfer your registration once, free of charge, to a later scheduled date of the same programme, provided you ask before the start date of the offering you are leaving and the later offering has a place available. Ask from your account area or by emailing [contact email].",
        "After a transfer, the refund schedule in section 2 is counted from the start date of the new offering — but the transfer itself is not a cancellation, and no refund is made for it.",
        "A second transfer is not available under this policy; if you cannot attend the new date, section 2 applies. A transfer to a different programme, or to another person, is not available under this policy; if you need either, write to [contact email] and we will tell you what is possible.",
      ],
    },
    {
      heading: "5. If the Academy cancels or reschedules",
      paragraphs: [
        "If we cancel an offering, or move its start date, we will tell you by email as early as we can. You then choose one of the following, whatever the timing:",
      ],
      bullets: [
        "A full refund — 100% of the amount you paid for that registration, or",
        "A transfer to another scheduled date of the same programme, at no extra charge. This does not use up the free transfer described in section 4.",
      ],
    },
    {
      heading: "6. How and when refunds are paid",
      paragraphs: [
        "Refunds are returned to the payment method you originally paid with, through Stripe, our payment processor. We cannot refund to a different card, account or person, and refunds are made in the currency you paid in.",
        "We instruct the refund promptly once a cancellation is confirmed. How long it then takes to appear depends on your bank or card issuer — typically 5 to 10 business days, sometimes longer for some banks and e-wallets. If a refund has not arrived after 15 business days, tell us at [contact email] and we will chase it with Stripe and give you the reference.",
        "If you paid in a currency other than the one your bank account uses, the amount that arrives may differ from the amount you paid because of exchange-rate movements and your bank's fees. Those differences are outside our control and are not refunded by us.",
      ],
    },
    {
      heading: "7. Sales and Service Tax on refunds",
      paragraphs: [
        "Where Malaysian Sales and Service Tax (SST) was charged on a registration, it is refunded in the same proportion as the price. Our SST position is: [SST registration status]. Your refund confirmation shows the tax element separately where it applies.",
      ],
    },
    {
      heading: "8. Private and corporate cohorts",
      paragraphs: [
        "Programmes delivered privately for an organisation are arranged under a separate written agreement between the Academy and that organisation, which sets out its own dates, fees, cancellation and rescheduling terms. This policy does not apply to them, and an individual employee's place on such a cohort is a matter between the employee and the organisation.",
      ],
    },
    {
      heading: "9. Your rights under consumer law",
      paragraphs: [
        "Nothing in this policy removes or limits any guarantee, right or remedy you have under the Consumer Protection Act 1999 or any other Malaysian law that cannot be excluded by agreement. In particular, if a programme is not delivered with reasonable care and skill, or is materially not as described, you may have remedies under that Act in addition to this policy.",
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
        "Your Partner Technologies (business registration number [SSM registration number]), [registered business address], Kuala Lumpur, Malaysia.",
        "Email: [contact email]. Telephone: [phone number].",
        "Effective date of this version: [effective date]. Version: DRAFT-2026-09-21 (not yet in force).",
      ],
    },
  ],
};
