import type { Metadata } from "next";
import Link from "next/link";
import { PACK_CREDITS, PASS_DAYS } from "@/modules/agentic/products";

/*
 * Agentic AI terms (CR-2026-10-04-0112 / -0113): a standalone page, accepted at checkout by the buyer's own tick, so the
 * versioned portal Terms are not touched. The renewal wording is the assistant's draft of the founder's intent ("package can
 * change on the last days of your renewal date") — to be reviewed by the founder and a lawyer before heavy promotion.
 */
export const metadata: Metadata = { title: "Agentic AI terms", description: "What you buy, the licence, refunds, packs and plans for Agentic AI downloads." };

const sections: { h: string; p: string[] }[] = [
  { h: "1. What these terms cover", p: ["These terms apply when you buy or download an agent or skill from the Agentic AI section of the portal — a single item, a pack, or a plan. They sit alongside the portal's Terms of service and Privacy policy. If they disagree, these terms apply to Agentic AI purchases."] },
  { h: "2. What you are buying", p: ["An agent or skill is a small set of text files (with a manual and an install guide) that you add to your own Claude Code projects. You are buying a licence to use the files, not ownership of them."] },
  { h: "3. Licence", p: ["You may use what you download for yourself and inside your own organisation, on as many projects as you like, and adapt it to your needs. You may not sell it, resell it, publish it, or share the download with people outside your organisation.", "It is provided as is, without warranty. An agent or skill instructs an AI model: review what it does before you rely on it, and keep your own backups. We are not responsible for what an AI model does when you use it."] },
  { h: "4. Payment and refunds", p: ["Prices are shown in US dollars before you pay and are charged on Stripe's secure page. A download is a digital product and is non-refundable once you have downloaded it (or, for a pack, once a credit has been used). If a file is damaged or does not match its description, reply to the email we send you and we will put it right.", "Each purchase has a receipt in Orders & receipts."] },
  { h: "5. Single items and packs", p: ["A single item is yours to download again whenever you are signed in.", `A pack gives you ${PACK_CREDITS} credits. One credit unlocks one agent or skill for good; items you already have never cost a credit. Credits do not expire.`] },
  { h: "6. Plans", p: [`A plan is a one-off payment that gives you access for ${PASS_DAYS} days from the day you pay. It does not renew automatically and we never charge you again unless you buy again.`, "Agentic AI Unlimited lets you download every agent and skill while it is active. Portal Unlimited includes that and also unlocks your Certificates of Achievement (the printable certificate for a passed Free Assessment Check) without the unlock fee, as often as you need.", "If you buy the same plan while it is still active, the new period starts when the current one ends, so you lose nothing. When a plan ends you keep the items you bought or claimed with credits, but not the ones you only downloaded through the plan.", "We email you before a plan ends so you can renew if you wish."] },
  { h: "7. Changes", p: ["We may change prices or what a plan includes. A change applies from your next purchase; it does not affect a plan you have already paid for, and we will tell you at least 30 days before a change takes effect for existing plan holders. Items you have bought stay yours."] },
  { h: "8. Contact", p: ["Use the Contact Us form on the portal for anything about a purchase. We reply by email."] },
];

export default function AgenticTermsPage() {
  return (
    <section className="mx-auto max-w-[820px] px-6 py-14">
      <p className="text-label mb-3 text-[var(--color-primary)]">
        <Link href="/agentic-ai" className="underline underline-offset-4">
          Agentic AI
        </Link>
      </p>
      <h1 className="text-display mb-2" data-testid="agentic-terms-title">
        Agentic AI terms
      </h1>
      <p className="text-body-sm mb-8 text-[var(--color-ink-faint)]">Last updated 4 October 2026</p>
      <div className="flex flex-col gap-7">
        {sections.map((s) => (
          <div key={s.h}>
            <h2 className="text-h2 mb-2">{s.h}</h2>
            {s.p.map((t) => (
              <p key={t} className="text-body-sm mb-2 text-[var(--color-ink-quiet)]">
                {t}
              </p>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
