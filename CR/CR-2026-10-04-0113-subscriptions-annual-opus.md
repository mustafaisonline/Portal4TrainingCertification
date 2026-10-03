# CR-2026-10-04-0113 — Annual subscriptions: Agentic AI unlimited and portal-level unlimited

**Received:** 2026-10-04 01:10 MYT · **Status:** ASSESSED — awaiting the founder's answers (§3) · **Requested by:** founder · **Model:** opus

## 1. Request (verbatim)

> * Unlimited for annual subscription of USD10. Term and conditions are, package can change on the last days of your renewal date.   [Agentic AI — see CR-0112]
>    * We can an item: Subscription:
>       *
>       *
>       * Unlimited for annual subscription of USD20 at portal level.
>          * user will can download unlimited certificates as well.
>          * Term and conditions are, package can change on the last days of your renewal date.
>       * where user will get linked
>
> Pelase create CR doc accordlinging. I an going to sleep, Pelase ask any querions, if you have anout these new requirements

## 2. Facts gathered (read-only, 2026-10-04)

- Two different annual prices were written: **USD 10/year** (unlimited Agentic AI downloads) and **USD 20/year "at portal level"** (unlimited downloads including "certificates"). It is not stated whether the USD 20 plan **includes** the USD 10 Agentic AI plan.
- "Download unlimited certificates": training Certificates of Completion are the holder's own and are not a paid download today; the paid download today is the **Free Assessment Check result document unlock** (a fee). DR-03 §3 / DR-04: that result is **not a credential and must never be called a "certificate"**; training completion certificates stay unchanged (DR-01: one credential).
- "Package can change on the last days of your renewal date" is not a complete sentence in policy terms; a legal text is needed (what can change: price? included items? with how much notice?). The Terms are versioned and re-accepted when changed.
- Technically, "annual subscription" can be **(a)** a one-off payment for 365 days of access (no card kept, no automatic renewal) or **(b)** a true recurring Stripe Subscription (automatic renewal, cancellation, failed-payment handling, invoices) — (b) is a new payment mechanism and new schema (RED).

## 3. Questions for the founder (with the assistant's recommendation)

1. **Relationship of the two plans:** is USD 20 "everything" (all Agentic AI downloads + all result documents + unlimited document unlocks) and USD 10 "Agentic AI only"? Recommendation: yes, two plans: **Agentic AI Unlimited (USD 10/year)** and **Portal Unlimited (USD 20/year, includes Agentic AI)**.
2. **What "unlimited certificates" means:** unlimited unlock of the paid **result documents** (Free Assessment Check) — and anything else? Training Certificates of Completion remain as they are (not paid downloads). Confirm. (Wording must say "result document", never "certificate", for the free assessment — DR-03/04.)
3. **One-off annual pass or automatic renewal?** Recommendation: start with a **one-off annual pass** (pay once, 365 days, we email before it ends, you renew by choice) — no recurring billing, no stored-card handling, far less risk. Automatic renewal can be a later CR. Which do you want?
4. **The "package can change at renewal" terms:** proposed wording for lawyer/your review: "We may change the price or what a plan includes. A change applies from your next renewal, and we will tell you at least 30 days before it. Your current term is not affected." Is that the intent? Who reviews the legal text?
5. **"where user will get linked"** — the sentence was cut off. Please tell me what should be linked (e.g. the person's downloads page, or their subscription to their account).
6. **Menu:** "Subscription" as its own item in the Product panel, leading to a plans page. Confirm.
7. **Approval** for the schema + payment work, after I show the design (see CR-0112).

## 4. Impacted elements

Plans page, plan table (proposed schema), checkout (new order kind), entitlement checks in the download and document-unlock paths, expiry reminder email + bell notice, Terms/Refund/Privacy text (version bump, re-consent), Orders & receipts, tests. **RED gates:** schema change and payment logic; (b) would add Stripe Subscriptions.

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder answers §3 | OPEN | 2026-10-04 |
| 2 | Build (after the answers; RED gates need explicit approval first) | NOT STARTED | — |
| 3 | Verify (tests, reviews) | NOT STARTED | — |
| 4 | Show on the local site (screenshots) then deploy | NOT STARTED | — |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-04 01:10 | CR created from the founder's message (sent while the assistant was building CR-2250); nothing built. The founder went to sleep and asked the assistant to record questions. |
