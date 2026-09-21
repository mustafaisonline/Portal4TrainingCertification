/*
 * SEED DATA — PORTED VERBATIM 2026-09-21 from project-artifacts/mockup/data/faq.ts
 * (ADR-045 PORT list: "content files become seed data"). Founder-reviewed
 * content; edit the values here and re-run `npm run db:seed` — never in a
 * migration (ADR-029). The original header comment follows.
 */
/**
 * FAQ content — added 2026-09-20, founder direction ("add a page of standard
 * FAQ"). The earlier record (docs/SITE_PAGES.md) had deliberately NOT built
 * an FAQ because assembling one means inventing policy. The founder now
 * wants one, so the rule applied here is:
 *
 *   EVERY ANSWER IS EITHER (a) a fact already stated elsewhere in this portal
 *   or its approved sources, or (b) an honest "not yet decided / not yet
 *   published" pointing to where the answer will appear.
 *
 * No answer invents a rule. Questions marked `tbc: true` are the ones whose
 * real answer is an open founder decision — the wireframe shows the question
 * so it is not forgotten, with a "to be confirmed" answer. When a decision
 * lands, replace the answer here; no component changes are needed.
 */
export type Faq = { q: string; a: string; href?: string; hrefLabel?: string; tbc?: boolean };

export const faqGroups: { title: string; items: Faq[] }[] = [
  {
    title: "The programme",
    items: [
      { q: "What do you teach?", a: "One programme: Data Blueprint & AI / Vibe Coding — building real products with AI-assisted development on trusted data foundations. It is delivered live by a practitioner, not as pre-recorded videos.", href: "/DataBlueprint-AIVibeCoding", hrefLabel: "See the programme" },
      { q: "Do I need a coding background?", a: "No. The programme is designed for people with no coding experience." },
      { q: "How is it delivered?", a: "Live, in three formats: Bootcamp (2 days), Accelerator (2 weeks, 2 hours a day) and Mastery (4 weeks, 1 hour a day). Sessions are led by the trainer." },
      { q: "Who teaches it?", a: "Mustafa Qizilbash, an HRD Corp Accredited Trainer. His profile and accreditation are on the Trainers page.", href: "/trainers", hrefLabel: "Meet the trainer" },
      { q: "When is the next start date?", a: "Public dates are not yet published. The Schedule page shows how dates will appear, and you can register your interest there.", href: "/schedule", hrefLabel: "Schedule", tbc: true },
    ],
  },
  {
    title: "Registering and paying",
    items: [
      { q: "How do I register?", a: "Create an account, sign in, choose a start date on the programme page, and pay. Payments are processed by Stripe.", href: "/register", hrefLabel: "Create an account" },
      { q: "How much does it cost?", a: "Published launch prices are shown in Malaysian ringgit, Pakistani rupee and US dollars on the programme page; you choose the currency at checkout. The launch prices are time-limited." , href: "/DataBlueprint-AIVibeCoding#investment", hrefLabel: "See prices" },
      { q: "Which payment methods can I use?", a: "Credit and debit cards, and other methods to be confirmed once the payment account is configured.", tbc: true },
      { q: "Can I cancel or move to another date? Will I get a refund?", a: "The refund and cancellation policy has not been published yet. Do not register on assumptions about refunds until it is.", href: "/refund-policy", hrefLabel: "Refund & cancellation policy", tbc: true },
      { q: "Can my company pay by invoice, or claim through HRD Corp?", a: "Talk to us. No programme is currently registered as HRD Corp claimable — the HRD Corp page explains the current status honestly.", href: "/for-organisations", hrefLabel: "For organisations" },
      { q: "Will I get a receipt or invoice?", a: "Yes, once payments are connected. The invoicing entity and tax treatment are being finalised.", tbc: true },
    ],
  },
  {
    title: "The certificate",
    items: [
      { q: "What do I get when I finish?", a: "A Certificate of Completion with a unique ID and its own web address that anyone can check. It records that you completed the programme; it is not the Academy's earned credential." , href: "/account/certificate", hrefLabel: "About the certificate" },
      { q: "Does the certificate expire?", a: "It is active for 12 months from issue. To keep it active, renew it each year for a fee — currently USD 10. The fee may change; you always see the amount before you pay." },
      { q: "What if I don't renew?", a: "The certificate shows as Expired on its verification page. It is not deleted — it still shows that you completed the programme, and you can renew it later." },
      { q: "How can someone verify my certificate?", a: "By its ID or its link on the Search Candidate page. Name search finds you only if you have chosen to be listed; you control that from your account.", href: "/verify", hrefLabel: "Search Candidate" },
      { q: "Is this the same as certification?", a: "No. The Academy's earned credential — assessed through applied work — is a separate, future offering. This certificate records completion of the training." },
    ],
  },
  {
    title: "Your account and data",
    items: [
      { q: "What personal data do you keep, and how is it used?", a: "The Privacy policy will set this out under the Personal Data Protection Act. It is not published yet.", href: "/privacy", hrefLabel: "Privacy policy", tbc: true },
      { q: "Can my name be found publicly?", a: "Only if you turn on \"Show my name in public search\" for your certificate. Otherwise it can be verified only by its ID or link, which you choose whom to share with." },
      { q: "I forgot my password.", a: "Use the Forgot password link on the sign-in page.", href: "/forgot-password", hrefLabel: "Reset password" },
      { q: "How do I contact you?", a: "Use the enquiry form on the Contact page.", href: "/contact-us", hrefLabel: "Contact us" },
    ],
  },
];
