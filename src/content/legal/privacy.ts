import type { LegalDocument } from "./types";

/*
 * Privacy policy — DRAFT for review by a Malaysian-qualified lawyer.
 * Drafted 2026-09-21 on founder direction. Structured around the Personal
 * Data Protection Act 2010 (as amended) — the seven principles (General,
 * Notice and Choice, Disclosure, Security, Retention, Data Integrity, Access),
 * the rights of access and correction, and cross-border transfer (s.129).
 * Nothing here asserts compliance; the document is INTENDED to meet the Act
 * and must be reviewed before publication.
 *
 * Facts used: data held — name, email, country, registrations, orders,
 * consents, audit entries; Stripe as payment processor; hosting location NOT
 * yet decided (so the draft says data may be stored or processed outside
 * Malaysia, subject to confirmation); session cookie and theme preference
 * only, no advertising cookies. Providers not yet chosen are "[to be named]".
 */

export const privacyPolicy: LegalDocument = {
  key: "privacy",
  title: "Privacy policy",
  version: "DRAFT-2026-09-21",
  status: "draft",
  lastUpdated: "2026-09-21",
  summary:
    "What personal data the Data & AI Academy collects, why, who it is shared with, where it may be stored, how long it is kept, and your rights under the Personal Data Protection Act 2010.",
  sections: [
    {
      heading: "About this draft",
      paragraphs: [
        "This is a draft prepared for review by a Malaysian-qualified lawyer. It is not yet in force. Until a reviewed version is published on this page with an effective date, it is not a notice under the Personal Data Protection Act 2010 and should not be relied on as one.",
        "It is written to serve as the written notice required by the Notice and Choice Principle of the Personal Data Protection Act 2010 (as amended), and to reflect the Act's other principles — General, Disclosure, Security, Retention, Data Integrity and Access — together with the 2024 amendments on breach notification and the appointment of a data protection officer where applicable. That intention has not yet been confirmed by legal review.",
        "The following details are not yet known and appear as placeholders in square brackets. They must be completed before publication:",
      ],
      bullets: [
        "[SSM registration number]",
        "[registered business address]",
        "[contact email]",
        "[data protection contact / officer]",
        "[phone number]",
        "[effective date]",
        "[to be named] — the hosting and email providers, once chosen",
        "[retention periods] — how long each category of data is kept",
        "Where the portal's data is hosted, and therefore whether a cross-border transfer takes place (see section 7)",
        "A Bahasa Malaysia version of this notice, if counsel advises that one is required",
      ],
    },
    {
      heading: "1. Who is responsible for your data",
      paragraphs: [
        "The Data & AI Academy portal is operated by Your Partner Technologies, a training practice in Kuala Lumpur, Malaysia (business registration number [SSM registration number]; registered address [registered business address]). Your Partner Technologies decides how and why your personal data is processed, and is the data user for the purposes of the Personal Data Protection Act 2010.",
        "Questions about this policy, or about your data, go to [data protection contact / officer] at [contact email].",
      ],
    },
    {
      heading: "2. What we collect",
      paragraphs: [
        "We collect only what the portal needs to run your account, your registrations and your certificate. Specifically:",
      ],
      bullets: [
        "Account details — your name, email address and a password. The password is stored only as a one-way hash; we cannot read it.",
        "Profile details — the country you tell us you are in. This decides the currency you are charged in (see the Terms of service).",
        "Registrations — which offerings you have registered for, their status, and attendance and completion as recorded by the trainer.",
        "Orders — what you paid, in which currency, when, by which method type (for example \"card\"), and the payment reference our payment processor gives us. We never receive or store your card number.",
        "Consents — which version of the Terms of service and this policy you accepted, and when.",
        "Certificates — if one is issued, your name as it appears on the certificate, the programme and format, the completion, issue and expiry dates, the certificate identifier, any renewal you pay for, and whether you have chosen to be listed in public name search (see section 6).",
        "Audit entries — a record of significant actions on your account (such as sign-in, a change of password, a registration or a refund), with a time stamp, kept so we can investigate problems and show what happened.",
        "Messages — anything you send us through the contact form or by email, so we can reply.",
      ],
    },
    {
      heading: "3. Why we use it, and the legal basis",
      paragraphs: [
        "We process your personal data for the following purposes. In each case the processing is necessary to perform our agreement with you, to meet a legal obligation, or is done with your consent, which you give when you create an account and accept this policy.",
      ],
      bullets: [
        "To create and run your account, and to let you sign in securely.",
        "To take and confirm your registration for an offering, and to deliver the programme to you.",
        "To take payment, issue receipts, process refunds and keep the financial records the law requires.",
        "To decide which currency and price apply to you, based on your profile country.",
        "To record completion and, where earned, to issue and verify your Certificate of Completion.",
        "To send you the messages the service needs — confirmations, reminders, changes to an offering, receipts and notices about your account. These are not marketing.",
        "To answer your questions and resolve complaints.",
        "To keep the portal secure, prevent misuse and investigate problems.",
        "To comply with the law, including tax and consumer-protection law.",
      ],
    },
    {
      heading: "4. Marketing",
      paragraphs: [
        "We do not send marketing messages unless you have separately opted in to receive them. If you do opt in, every marketing email carries a way to opt out, and you can also opt out by writing to [contact email]. Opting out of marketing does not stop the service messages described above, which you need in order to attend what you have registered for.",
      ],
    },
    {
      heading: "5. Who we share it with",
      paragraphs: [
        "We do not sell personal data, and we do not share it for anyone else's marketing. We disclose personal data only as follows:",
      ],
      bullets: [
        "Stripe — our payment processor. When you pay, you enter your payment details directly with Stripe, which processes the payment under its own privacy policy. We receive confirmation of payment, not your card details.",
        "Hosting provider [to be named] — the servers and database on which the portal and its data run.",
        "Email provider [to be named] — used to deliver the service messages described in section 3.",
        "The trainer of an offering you registered for — your name and email address, so that attendance and completion can be recorded and you can be admitted to the sessions.",
        "HRD Corp or your employer — only where you ask us to provide evidence of your attendance or completion, for example to support a training claim, and only what is needed for that purpose.",
        "Authorities — where the law requires us to disclose, for example to a court, a regulator or a law-enforcement agency acting within its powers.",
      ],
    },
    {
      heading: "6. Public certificate verification",
      paragraphs: [
        "If you are issued a Certificate of Completion, anyone who has its certificate identifier, or the link to it, can confirm on this portal that the certificate is genuine. Verification by identifier or link always works. The verification page shows the name on the certificate, the programme and its format, the completion date, the issue date, the expiry date and the certificate's current status. If a certificate has been revoked, the page says so.",
        "The portal also offers a public search by name. That search returns only holders who have chosen to be listed in it. Being listed is optional and is off unless you turn it on from your account. When you turn it on we record that choice, with the wording you agreed to and the time. You can withdraw it at any time from your account, and the withdrawal takes effect immediately for name search; the identifier and link continue to work.",
        "Whether reached by identifier, link or name search, the verification page never shows your email address, your country, your contact details or any identity-document details. Certificate dates are calendar dates in Malaysia time (Asia/Kuala_Lumpur).",
        "If you have a concern about how your certificate can be verified, write to [contact email].",
      ],
    },
    {
      heading: "7. Where your data is stored, and transfers outside Malaysia",
      paragraphs: [
        "The location where the portal is hosted has not yet been decided. Your personal data may therefore be stored or processed on servers outside Malaysia, and our payment processor and other providers may process data outside Malaysia.",
        "Where a transfer outside Malaysia takes place we will rely on one of the grounds permitted by section 129 of the Personal Data Protection Act 2010 (as amended) — such as your consent, the transfer being necessary to perform our agreement with you, or the recipient being bound to protect the data to a standard at least equivalent to the Act — and we will put appropriate contractual and technical safeguards in place. This section will be updated with the confirmed hosting location before this policy is published.",
      ],
    },
    {
      heading: "8. How we keep it secure",
      paragraphs: [
        "We take practical steps to protect your personal data against loss, misuse, unauthorised access, alteration and disclosure, in keeping with the Security Principle. These include:",
      ],
      bullets: [
        "Encryption of data in transit between your browser and the portal (HTTPS).",
        "Passwords stored only as salted one-way hashes, never in a readable form.",
        "Card and bank details handled by Stripe, never by the portal.",
        "Access controls, so that staff and trainers see only what their role needs.",
        "An audit log of significant actions on accounts and records.",
        "Providers chosen and contracted to protect the data they process for us.",
      ],
    },
    {
      heading: "9. If something goes wrong",
      paragraphs: [
        "If a personal data breach occurs that is likely to cause you significant harm, we will notify the Personal Data Protection Commissioner and affected individuals as the Personal Data Protection Act 2010 (as amended in 2024) requires, and we will tell you what happened, what data was involved and what we are doing about it.",
      ],
    },
    {
      heading: "10. How long we keep it",
      paragraphs: [
        "We keep personal data only for as long as it is needed for the purposes above, and then delete or anonymise it, in keeping with the Retention Principle. The specific periods are to be confirmed: [retention periods]. The principles that will govern them are:",
      ],
      bullets: [
        "Account and profile details — for as long as your account is open, and for a short period afterwards so a closed account can be restored if closing it was a mistake.",
        "Registration and completion records — for as long as needed to support your Certificate of Completion, since a certificate can be verified for years after it is issued.",
        "Orders and payment records — for the period Malaysian tax law requires financial records to be kept, which is typically seven years.",
        "Consent records — for as long as the account exists and for the limitation period afterwards, so we can show what you agreed to.",
        "Audit entries — for a fixed period sufficient to investigate security incidents and disputes.",
        "Messages you send us — until your query is resolved and for a reasonable period afterwards.",
      ],
    },
    {
      heading: "11. Keeping it accurate",
      paragraphs: [
        "In keeping with the Data Integrity Principle, we rely on you to keep your name, email address and country accurate, and you can change them in your account area at any time. Your name should be entered as you want it to appear on a certificate. If you notice an error in a record we hold, tell us and we will correct it.",
      ],
    },
    {
      heading: "12. Your rights",
      paragraphs: [
        "Under the Personal Data Protection Act 2010 (as amended) you have the following rights. To exercise any of them, write to [data protection contact / officer] at [contact email]. We may ask you to confirm your identity first, and we will respond within the time the Act allows.",
      ],
      bullets: [
        "Access — to ask for a copy of the personal data we hold about you. The Act permits a modest fee for this; we will tell you before charging one.",
        "Correction — to have inaccurate, incomplete, misleading or out-of-date data corrected.",
        "Withdrawal of consent — to withdraw consent to processing that relies on it, by written notice. Because some processing is needed to run your account and registrations, withdrawing consent may mean we can no longer provide the service; we will tell you if that is so.",
        "Preventing processing likely to cause distress — to require us to stop processing that is causing, or is likely to cause, unwarranted and substantial damage or distress.",
        "Marketing — to require us to stop using your data for direct marketing.",
        "Complaint — if you are not satisfied with our response, you may complain to the Personal Data Protection Commissioner of Malaysia (Jabatan Perlindungan Data Peribadi).",
      ],
    },
    {
      heading: "13. Cookies",
      paragraphs: [
        "The portal uses a small number of cookies and browser storage entries, all of which are needed for it to work or to remember a preference. None is used for advertising, and we do not use third-party tracking or analytics cookies.",
      ],
      bullets: [
        "Session cookie — keeps you signed in as you move between pages. It is deleted when you sign out or when the session expires.",
        "Theme preference — remembers whether you chose the light or dark appearance. It contains no personal data.",
        "Payment — when you pay, Stripe may set its own cookies on its checkout page to detect fraud and complete the payment; these are governed by Stripe's privacy policy.",
      ],
    },
    {
      heading: "14. Children",
      paragraphs: [
        "The portal is intended for adults. We do not knowingly collect personal data from anyone under 18 without the consent of a parent or guardian. [Founder to confirm the age rule in the Terms of service, section 3; this section will follow it.] If you believe a child has created an account without that consent, tell us at [contact email] and we will delete the account.",
      ],
    },
    {
      heading: "15. Changes to this policy",
      paragraphs: [
        "We may change this policy — for example, when we confirm our hosting provider, add a programme or need to reflect a change in the law. The current version, its version number and its effective date are shown on this page. If a change materially affects how we use your data, we will tell you by email or when you next sign in, and where the law requires it we will ask for your consent again.",
      ],
    },
    {
      heading: "16. Contact",
      paragraphs: [
        "Your Partner Technologies (business registration number [SSM registration number]), [registered business address], Kuala Lumpur, Malaysia.",
        "Data protection: [data protection contact / officer]. Email: [contact email]. Telephone: [phone number].",
        "Effective date of this version: [effective date]. Version: DRAFT-2026-09-21 (not yet in force).",
      ],
    },
  ],
};
