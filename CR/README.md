# CR — Change Requisitions

**Every new requirement or fix the founder gives becomes ONE file in this folder, created BEFORE any code
is written.** The file is the record *and* the resume point: if a usage limit is hit or a conversation is
lost, a new session reads `PROJECT_STATUS.md`, then this index, then the open CR file, and carries on.

## Naming
`CR-YYYY-MM-DD-HHMM-short-title.md` — the timestamp is **Malaysia time (MYT, UTC+8)** at the moment the
request arrived, so files sort in the order the founder asked.

## What every CR file contains (copy the template below)
1. **Request, verbatim** — the founder's own words, never paraphrased.
2. **Facts gathered** — with where each came from (a URL, a file, the founder). Nothing invented.
3. **Decisions & assumptions** — what the founder answered; what was assumed and is awaiting confirmation.
4. **Plan** — files touched, data/DB impact (a schema change is a RED gate: stop and ask), tests, docs.
5. **Tracker** — one row per step with a status: `NOT STARTED` → `IN PROGRESS` → `BUILT` → `VERIFIED` →
   `DEPLOYED`. Update it after every step.
6. **Progress log** — dated lines, newest last.

**Binding since 2026-10-02:** `CLAUDE.md` ("CHANGE REQUISITIONS") makes this process mandatory for every session.

Working agreement (unchanged): **one CR at a time, one tracker step at a time (a CR may hold several related tasks) on the founder's "go"**; commit, push and
deploy only on the founder's word, except in `buddy` Autonomous mode, where the founder has granted them (CR-2026-10-02-2030); report honestly what was and was not tested.

## Index (newest first)

| CR file | Title | Status |
|---|---|---|
| [CR-2026-10-02-2054-business-ops-metadata-and-prompt-engineering.md](CR-2026-10-02-2054-business-ops-metadata-and-prompt-engineering.md) | Business and operational metadata; prompt-engineering skills + selector agent; per-chat and per-task model rules — BUILT, awaiting push |
| [CR-2026-10-02-2045-framework-followups-milestones-metadata-push.md](CR-2026-10-02-2045-framework-followups-milestones-metadata-push.md) | Framework follow-ups: multi-task CRs, milestone files moved, table/script metadata, push — BUILT |
| [CR-2026-10-02-2034-ai-delivery-framework-folders-agents-skills.md](CR-2026-10-02-2034-ai-delivery-framework-folders-agents-skills.md) | AI delivery framework: `framework/` document set, 3 files moved, 6 agents, 12 skills — BUILT, awaiting founder review |
| [CR-2026-10-02-2030-buddy-default-agent-and-autonomous-push.md](CR-2026-10-02-2030-buddy-default-agent-and-autonomous-push.md) | Buddy is the default agent; autonomous mode may commit/push/deploy — BUILT |
| [CR-2026-10-02-2027-buddy-agent.md](CR-2026-10-02-2027-buddy-agent.md) | `buddy` agent: founder's single point of contact, guided/autonomous modes — BUILT, not yet exercised |
| [CR-2026-10-02-2021-run-cr-skill-pick-latest-open.md](CR-2026-10-02-2021-run-cr-skill-pick-latest-open.md) | `run-cr` skill: execute the latest CR not yet deployed — BUILT, not yet exercised |
| [CR-2026-10-02-2012-project-agents-and-skills.md](CR-2026-10-02-2012-project-agents-and-skills.md) | Project agents (governance-reviewer, test-verifier) and skills (new-cr, resume-work) — BUILT, not yet exercised |
| [CR-2026-10-02-2016-mobile-burger-menu-not-scrollable.md](CR-2026-10-02-2016-mobile-burger-menu-not-scrollable.md) | Mobile burger menu is not scrollable |
| [CR-2026-10-02-2015-email-api-and-account-confirmation.md](CR-2026-10-02-2015-email-api-and-account-confirmation.md) | Email API and confirmation email after creating an account — ACTIVATES the deferred provider decision |
| [CR-2026-10-02-2014-free-diagnostic-score-not-displayed.md](CR-2026-10-02-2014-free-diagnostic-score-not-displayed.md) | Free skill diagnostic: the score is not displayed |
| [CR-2026-10-02-2013-profile-picture-not-visible-on-mobile.md](CR-2026-10-02-2013-profile-picture-not-visible-on-mobile.md) | Profile picture not visible on mobile |
| [CR-2026-10-02-2012-show-name-instead-of-account.md](CR-2026-10-02-2012-show-name-instead-of-account.md) | Header shows the person's name instead of "Account" |
| [CR-2026-10-02-2011-how-it-works-images-missing.md](CR-2026-10-02-2011-how-it-works-images-missing.md) | HOW IT WORKS images missing on the home page — bring them from dev to production |
| [CR-2026-10-02-2010-interest-buttons-route-by-availability.md](CR-2026-10-02-2010-interest-buttons-route-by-availability.md) | Every "Register your interest" / "Register interest" button routes by availability |
| [CR-2026-10-02-0721-interest-button-leads-to-signin-flow.md](CR-2026-10-02-0721-interest-button-leads-to-signin-flow.md) | Hero "Register your interest" button → the sign-in/interest flow (was a mailto) — BUILT, awaiting deploy |
| [CR-2026-10-02-0710-deploy-changes-only-auto-approve.md](CR-2026-10-02-0710-deploy-changes-only-auto-approve.md) | Deploy footer fix + inert BM draft as a delta, `--auto-approve` — **DEPLOYED `v2026.10.02-4`** |
| [CR-2026-10-02-0630-cr-process-binding.md](CR-2026-10-02-0630-cr-process-binding.md) | CR process made binding (CLAUDE.md, resume steps) — folder already existed |
| [CR-2026-10-02-0629-remove-inert-stripe-test-lines.md](CR-2026-10-02-0629-remove-inert-stripe-test-lines.md) | Remove the inert Stripe test pair from the server env file — **DONE** |
| [CR-2026-10-02-0628-bahasa-malaysia-privacy-notice.md](CR-2026-10-02-0628-bahasa-malaysia-privacy-notice.md) | Bahasa Malaysia Privacy notice — DRAFT written (unpublished); needs translator/counsel review + founder's "reviewed" |
| [CR-2026-10-02-0627-footer-credential-integrity-link.md](CR-2026-10-02-0627-footer-credential-integrity-link.md) | Unpublished credential-integrity policy removed from footer/sitemap |
| [CR-2026-10-02-0626-email-provider-deferred.md](CR-2026-10-02-0626-email-provider-deferred.md) | Email provider — **DEFERRED, remind the founder** |
| [CR-2026-10-02-0625-rm2-live-test-no-refund.md](CR-2026-10-02-0625-rm2-live-test-no-refund.md) | RM 2.00 live payment test is not refunded |
| [CR-2026-10-02-0610-publish-legal-documents-and-lift-noindex.md](CR-2026-10-02-0610-publish-legal-documents-and-lift-noindex.md) | Stripe live confirmed, legal documents published, `noindex` lifted |
| [CR-2026-10-01-2345-hero-copy-workspace-positioning.md](CR-2026-10-01-2345-hero-copy-workspace-positioning.md) | Homepage hero copy: training portal → Data & AI workspace (eyebrow, headline, description, benefit chips; cards kept) | BUILT & VERIFIED, uncommitted |
| [CR-2026-10-01-2310-brand-name-dataai-nexus.md](CR-2026-10-01-2310-brand-name-dataai-nexus.md) | Header/footer/title brand name "Data & AI Academy" → "DataAI Nexus" | BUILT & VERIFIED, uncommitted |
| [CR-2026-10-01-2246-assessment-check-card-and-hrd-verification-link.md](CR-2026-10-01-2246-assessment-check-card-and-hrd-verification-link.md) | /assessment: "The Free Assessment Check" as a card, "Assess your Data Foundation" heading removed; HRD verification link on "Who delivers this" | BUILT & VERIFIED, uncommitted |
| [CR-2026-10-01-2138-training-formats-and-interest-registration.md](CR-2026-10-01-2138-training-formats-and-interest-registration.md) | Formats tab for trainers/admin; "Register your interest" (USD 2, non-refundable) with a Users Interest tab | BUILT & VERIFIED — production deploy covered by the founder's 2026-10-01 night instruction ("commit, push … deploy in production") |
| [CR-2026-10-01-2136-menu-naming-domain-and-admin-labels.md](CR-2026-10-01-2136-menu-naming-domain-and-admin-labels.md) | Free Assessment naming, burger menu, domain dataainexus.com (guide written), admin Edit/Delete labels | Steps 1–4 BUILT & VERIFIED, uncommitted; step 5 (domain) awaits the founder's DNS/Caddy/Stripe steps |
| [CR-2026-10-01-1711-personas-interview-prep-and-organisation-screening.md](CR-2026-10-01-1711-personas-interview-prep-and-organisation-screening.md) | Assessment page (renamed from Free Certifications): personas — Assess your Data Foundation · Prepare for Interview (role tests) · Organisation Interview Screening; Organisation role/dashboard; burger menu; free LLM on hold | P0–P4 BUILT & VERIFIED — schema approved by the founder 2026-10-01 night ("go ahead for schema I approve"); release gate PASSED on this tree (Vitest 717/717, Playwright 171/171 on the production build) |
| [CR-2026-10-01-0712-contact-us-company-and-partner-cards.md](CR-2026-10-01-0712-contact-us-company-and-partner-cards.md) | Contact Us: head-office card + partner-location cards (Infocentric, Pakistan) | DEPLOYED (`v2026.10.01`) |
| [../modification.md](../modification.md) *(predates this folder — "M16", 2026-09-30)* | Free Assessment Check, graded certificates, cards redesign, trainer pages removed, HRD wording | DEPLOYED (`v2026.09.30-4`) |
| [../framework/milestones/MILESTONE_15_EXECUTION_PLAN.md](../framework/milestones/MILESTONE_15_EXECUTION_PLAN.md) *(predates this folder — "M15")* | Certificates, verification, PDF, Contact email-only, Stripe-live readiness | DEPLOYED (`v2026.09.30-2`) |

## Template

```markdown
# CR-YYYY-MM-DD-HHMM — <title>
**Received:** <MYT timestamp> · **Status:** NOT STARTED · **Requested by:** founder

## 1. Request (verbatim)
> …

## 2. Facts gathered (with sources)
## 3. Decisions and assumptions
| Ref | What | Status |
## 4. Plan
## 5. Tracker
| # | Step | Status | Updated |
## 6. Progress log
| Date | Entry |
```
