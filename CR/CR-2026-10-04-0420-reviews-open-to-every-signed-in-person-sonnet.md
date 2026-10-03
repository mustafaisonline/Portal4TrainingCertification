# CR-2026-10-04-0420 — Reviews: anyone who is signed in can share one (always approved by an administrator before the public sees it)

**Received:** 2026-10-04 04:20 MYT · **Status:** DEPLOYED `v2026.10.04-1` · **Requested by:** founder · **Model:** sonnet

## 1. Request (verbatim)

> Please tell me about the REview page. Can anyone with account can give review or onlyonce they have done somesort of test?
> (after the assistant's explanation) Yes. Plus now, I also want anyone who has signed-in, can give review as there will be people who only come to learn from Knowledge hub. Just make sure, very review must be approved by admin before pblic can see it.

## 2. Facts gathered

- Today a **registration review** needs a confirmed (paid) registration whose date has ended (one per registration). A second kind, **"diagnostic"** (the "free learner" review), already exists: any signed-in person can submit it (no registration, rate-limited), it is a private note unless the person chooses to make it public, and it sits in a small collapsed box "Tried Free Learning or the free diagnostic? Share a review".
- **Every** review — both kinds — is public only when: the reviewer consented to public **and** an administrator approved it **and** it is marked visible (`publicWhere()`; moderation in Admin → Reviews). So "every review approved by an administrator before the public sees it" is already how it works.
- The public card for that kind shows the programme title "Free Learning & the free diagnostic".
- **No Prisma schema change is needed** (the kind and the nullable registration already exist).

## 3. Decisions (assistant's reading — shout if wrong)

- The free-learner review becomes the main, always-open **"Share your experience"** option for **any signed-in person**, with wording that says you do not need to have taken a training (Knowledge Hub, Assessment, anything on the portal). It keeps the same rules: public only with the person's consent **and** an administrator's approval; otherwise private.
- Its public label becomes **"Knowledge Hub & free tools"** (was "Free Learning & the free diagnostic").
- The certificate gate is unchanged (still tied to the person's own registrations).
- Abuse limits unchanged (the existing submission rate limit).

## 4. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 1 | Founder decision | **DONE** (see §1) | 2026-10-04 |
| 2 | Build (copy/layout/label; tests) | IN PROGRESS | 2026-10-04 |
| 3 | Verify, deploy | NOT STARTED | — |

## 5. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-04 04:20 | CR created; code inspected read-only; no schema change needed. |
| 2026-10-04 06:10 | **BUILT & VERIFIED.** The free-learner review is now the always-open section "Not taken a training? You can still review us" (for every signed-in person), its public label is **"Knowledge Hub & free tools"**; same rules (private unless consented; public only after an administrator approves). No schema change. e2e: a person with no training reviews, it is pending and not public, then public after approval. |
| 2026-10-04 00:37 MYT (16:36 UTC, 2026-10-03) | **DEPLOYED `v2026.10.04-1` (`12a14e2`).** Gate, backup, migration sandbox (`20261004090000_offering_status_pending_review`), promote, validation PASSED, 0 warnings. Live check in a browser at 375 px: no theme icon in the header, theme switch in the menu and the footer, no horizontal overflow; health reports the new migration. |
