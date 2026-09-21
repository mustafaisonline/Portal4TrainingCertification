import type { LegalDocument } from "./types";

/*
 * Terms of service — DRAFT for review by a Malaysian-qualified lawyer.
 * Drafted 2026-09-21 on founder direction. Written in plain English from the
 * product facts recorded in the specifications and decision records; no third
 * party's terms were copied. Nothing here asserts legal compliance — the
 * document is INTENDED to meet the named Malaysian statutes and must be
 * reviewed before it is published or relied on.
 *
 * Facts used (do not add others without founder direction): operator "Your
 * Partner Technologies" (src/content/hrd-corp.ts); one published programme;
 * account required to register; prices in MYR, PKR (Pakistan profile country
 * only) and USD; payment via Stripe; Certificate of Completion; refund rule
 * of 2026-09-21 (see ./refund-policy.ts). Everything unknown is a
 * square-bracket placeholder (see LEGAL_PLACEHOLDERS in ./types.ts).
 */

export const termsOfService: LegalDocument = {
  key: "terms",
  title: "Terms of service",
  version: "DRAFT-2026-09-21",
  status: "draft",
  lastUpdated: "2026-09-21",
  summary:
    "The agreement between Your Partner Technologies and anyone who creates an account or registers for a Data & AI Academy programme: registering, paying, cancelling, taking part, and the Certificate of Completion.",
  sections: [
    {
      heading: "About this draft",
      paragraphs: [
        "This is a draft prepared for review by a Malaysian-qualified lawyer. It is not yet in force, and nothing in it is a term, policy or undertaking until a reviewed version is published on this page with an effective date.",
        "It is written to be read alongside the Consumer Protection Act 1999 (including the Consumer Protection (Electronic Trade Transactions) Regulations 2012), the Contracts Act 1950, the Electronic Commerce Act 2006 and the Personal Data Protection Act 2010 (as amended). It is intended to meet those laws; that intention has not yet been confirmed by legal review.",
        "The following details are not yet known and appear as placeholders in square brackets. They must be completed before publication:",
      ],
      bullets: [
        "[SSM registration number]",
        "[registered business address]",
        "[contact email]",
        "[phone number]",
        "[effective date]",
        "[SST registration status]",
        "Whether participants under 18 may register with a parent's or guardian's consent, or not at all (see section 3)",
      ],
    },
    {
      heading: "1. Who we are and what these terms cover",
      paragraphs: [
        "The Data & AI Academy is operated by Your Partner Technologies, a training practice in Kuala Lumpur, Malaysia (business registration number [SSM registration number]; registered address [registered business address]). In these terms, \"the Academy\", \"we\" and \"us\" mean Your Partner Technologies.",
        "These terms apply when you create an account on this portal, register for a programme, pay for a registration, attend a programme, or hold a Certificate of Completion. By doing any of these things you agree to these terms. If you do not agree, please do not use the portal.",
        "The Privacy policy and the Refund & cancellation policy form part of these terms. Where a private or corporate cohort is delivered under a separate written agreement, that agreement governs and these terms apply only where it is silent.",
      ],
    },
    {
      heading: "2. Definitions",
      paragraphs: ["A few words carry a specific meaning in these terms."],
      bullets: [
        "\"Programme\" — a Data & AI Academy training programme described on this portal.",
        "\"Offering\" — a scheduled delivery of a programme with a start date, a format (live online, face-to-face or private cohort) and a trainer.",
        "\"Registration\" — your booked place on a particular offering.",
        "\"Start date\" — the first scheduled session of an offering, in the time zone shown on the offering.",
        "\"Certificate of Completion\" — the certificate the Academy may issue when a participant completes a programme, as recorded by the trainer.",
        "\"Participant\" and \"you\" — the person who holds the account and registration.",
      ],
    },
    {
      heading: "3. Your account and who may register",
      paragraphs: [
        "You need an account to register for a programme. An account is created with your name, an email address and a password, and you must keep those details accurate. You are responsible for keeping your password confidential and for everything done under your account; tell us at [contact email] as soon as you know of any unauthorised use.",
        "You must be at least 18 years old to create an account and register. [Founder to confirm: participants under 18 may register only where a parent or guardian gives consent in writing — or, if preferred, may not register at all.]",
        "You may register on behalf of someone else only if you have their permission and provide their correct details; the person who attends is the participant for the purposes of the Certificate of Completion.",
        "We may suspend or close an account that is used in breach of these terms, or where we reasonably believe the details given are false. Section 8 explains the conduct we expect.",
      ],
    },
    {
      heading: "4. Registering for an offering",
      paragraphs: [
        "A registration is a booking for a specific offering. It is confirmed when we accept your registration and, for a paid offering, when payment has been received. We confirm by email and in your account area.",
        "Each offering shows what is included — the sessions, format, dates, materials and any prerequisites. Places may be limited; a registration is not confirmed until you receive our confirmation, and we may decline a registration where the offering is full or where the prerequisites are not met.",
        "Offerings are delivered by expert trainers, live. The portal supports that delivery — it is where you register, pay, keep your records and check your certificate — but the learning itself takes place in the live sessions, whether online or in person.",
      ],
    },
    {
      heading: "5. Prices, currency and taxes",
      paragraphs: [
        "Prices are shown on the offering before you register and again at checkout. The price you see at checkout is the price you pay, subject only to the tax note below.",
        "Prices are published in three currencies. The currency you are charged in depends on the country recorded in your account profile:",
      ],
      bullets: [
        "Malaysian ringgit (MYR) — the standard price.",
        "Pakistani rupee (PKR) — a regional scholarship price, available only to accounts whose profile country is Pakistan.",
        "United States dollar (USD) — for everyone else.",
      ],
    },
    {
      heading: "6. Sales and Service Tax",
      paragraphs: [
        "Prices are shown inclusive or exclusive of Malaysian Sales and Service Tax (SST) as indicated at checkout. Our SST position is: [SST registration status]. Where SST applies, the amount is shown before you confirm payment and appears on your receipt.",
        "If you are charged in a currency other than MYR, your bank or card issuer may apply its own conversion rate and fees. Those are outside our control and are not refundable by us.",
      ],
    },
    {
      heading: "7. Paying",
      paragraphs: [
        "Payment is taken online through Stripe, our payment processor. Depending on what is enabled at the time, you may pay by card or by Malaysian online banking or e-wallet methods offered at checkout.",
        "Your card and bank details are entered on, and handled by, Stripe. The Academy never receives or stores your card number. We receive confirmation that payment succeeded, the amount, the currency, the method type and a Stripe reference, which we keep as our record of the order.",
        "A registration is paid when Stripe confirms the payment to us. If a payment fails or is reversed, the registration is not confirmed and we may release the place.",
      ],
    },
    {
      heading: "8. Cancelling, transferring and refunds",
      paragraphs: [
        "You may cancel a registration or transfer it to a later scheduled date of the same programme, subject to the Refund & cancellation policy, which forms part of these terms. In short: cancelling 14 or more calendar days before the start date gives a full refund; 7 to 13 days before gives a 50% refund; fewer than 7 days before, or after the start date, gives no refund. One free transfer to a later date of the same programme is always allowed before the start date.",
        "Refunds are returned to the original payment method through Stripe. The Refund & cancellation policy explains how to cancel, how transfers work and how long refunds take.",
        "Nothing in this section removes any right you have under the Consumer Protection Act 1999.",
      ],
    },
    {
      heading: "9. If the Academy cancels or reschedules",
      paragraphs: [
        "Sometimes we have to cancel or reschedule an offering — for example, if too few people register or the trainer is unavailable. If that happens we will tell you as early as we can, by email to the address on your account.",
        "You then choose either a full refund of what you paid for that registration, or a transfer to another scheduled date of the same programme at no extra charge. We are not responsible for other costs you may have incurred in connection with the offering, such as travel or accommodation, and we recommend that you do not book non-refundable travel until an offering is confirmed.",
      ],
    },
    {
      heading: "10. Taking part: conduct and materials",
      paragraphs: [
        "Programmes are delivered live, with other participants. We ask you to attend the sessions you have registered for, to treat the trainer and other participants with respect, and to follow reasonable instructions given during a session. We may remove a participant from a session, or from a programme, for conduct that disrupts it or that is abusive, discriminatory or unlawful; in that case no refund is due.",
        "The programme materials — slides, exercises, datasets, notes, recordings and anything else we provide — belong to the Academy or to those who license them to us. We grant you a personal, non-transferable licence to use them for your own learning. You may not record sessions, copy or share the materials with people who are not registered, publish them, sell them, or use them to deliver training yourself, without our written permission.",
        "Work you create during a programme, such as your own exercise solutions, remains yours. If you share it in a session, you allow the trainer and other participants to discuss it as part of the learning.",
      ],
    },
    {
      heading: "11. Certificate of Completion",
      paragraphs: [
        "On completing a programme, as recorded by the trainer, you may be issued a Certificate of Completion. What counts as completion is described on the programme page. The certificate records your name, the programme, the completion date and a certificate identifier.",
        "Certificates can be verified by anyone who has the certificate identifier, through the public verification page on this portal. The Privacy policy explains what the verification page shows.",
        "A Certificate of Completion confirms that you completed the programme. It is not a professional licence, an academic qualification or a guarantee of employment, promotion or any particular outcome.",
        "We may correct a certificate that contains an error, and we may revoke a certificate if it was issued in error or obtained through misconduct, such as impersonation or dishonest submission of work. When the Academy publishes its credential-integrity policy, corrections and revocations will follow it; until then we will tell you in writing before revoking a certificate and give you an opportunity to respond.",
      ],
    },
    {
      heading: "12. What we do not promise, and limits on our liability",
      paragraphs: [
        "We will deliver each offering with reasonable care and skill, as described on the offering page. We do not promise that a programme will produce any particular result for you, your work or your business, or that the content will suit every purpose. The programmes are training, not professional advice about your own situation.",
        "Nothing in these terms excludes or limits any guarantee, right or remedy you have under the Consumer Protection Act 1999 or any other law that cannot be excluded or limited by agreement. Nothing in these terms limits our liability for death or personal injury caused by our negligence, or for fraud.",
        "Subject to the paragraph above, and to the extent permitted by law, we are not liable for indirect or consequential loss, loss of profit, loss of business or loss of data, and our total liability to you in connection with a registration is limited to the amount you paid for that registration.",
      ],
    },
    {
      heading: "13. Your personal data",
      paragraphs: [
        "We handle personal data in accordance with the Personal Data Protection Act 2010 (as amended) and our Privacy policy, which explains what we collect, why, who we share it with, where it may be stored, how long we keep it and how you can exercise your rights. Please read it; it forms part of these terms.",
      ],
    },
    {
      heading: "14. Changes to these terms",
      paragraphs: [
        "We may change these terms from time to time — for example, when we add a programme, change how payment works or need to reflect a change in the law. The current version, its version number and its effective date are always shown on this page.",
        "A change does not apply to a registration that was already confirmed under the earlier version, unless the change is required by law or is to your benefit. If a change matters to you, we will tell you by email or when you next sign in, and you will be asked to accept the new version before you register again.",
      ],
    },
    {
      heading: "15. Governing law and disputes",
      paragraphs: [
        "These terms are governed by the laws of Malaysia, and the courts of Malaysia have jurisdiction over any dispute arising from them, except where the law gives you the right to bring a claim elsewhere.",
        "If something goes wrong, please contact us first at [contact email]; most problems can be sorted out directly. If you are a consumer in Malaysia and we cannot resolve a dispute, you may be able to bring a claim before the Tribunal for Consumer Claims Malaysia, which hears consumer claims up to the limit set under the Consumer Protection Act 1999 without the need for a lawyer.",
        "These terms are written in English. If a translation is provided, the English version prevails where they differ.",
      ],
    },
    {
      heading: "16. General",
      paragraphs: [
        "These terms, the Privacy policy and the Refund & cancellation policy are the whole agreement between you and the Academy about the portal and your registrations. If any part of these terms is found to be unenforceable, the rest still applies. If we do not enforce a term on one occasion, we may still enforce it later. You may not transfer your registration to another person except as the Refund & cancellation policy allows.",
        "Notices to you are sent to the email address on your account. Notices to us should be sent to [contact email].",
      ],
    },
    {
      heading: "17. Contact",
      paragraphs: [
        "Your Partner Technologies (business registration number [SSM registration number]), [registered business address], Kuala Lumpur, Malaysia.",
        "Email: [contact email]. Telephone: [phone number].",
        "Effective date of this version: [effective date]. Version: DRAFT-2026-09-21 (not yet in force).",
      ],
    },
  ],
};
