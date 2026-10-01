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

Working agreement (unchanged): **one CR / one step at a time on the founder's "go"**; commit, push and
deploy only on the founder's word; report honestly what was and was not tested.

## Index (newest first)

| CR file | Title | Status |
|---|---|---|
| [CR-2026-10-02-0610-publish-legal-documents-and-lift-noindex.md](CR-2026-10-02-0610-publish-legal-documents-and-lift-noindex.md) | Stripe live confirmed, legal documents published, `noindex` lifted |
| [CR-2026-10-01-2345-hero-copy-workspace-positioning.md](CR-2026-10-01-2345-hero-copy-workspace-positioning.md) | Homepage hero copy: training portal → Data & AI workspace (eyebrow, headline, description, benefit chips; cards kept) | BUILT & VERIFIED, uncommitted |
| [CR-2026-10-01-2310-brand-name-dataai-nexus.md](CR-2026-10-01-2310-brand-name-dataai-nexus.md) | Header/footer/title brand name "Data & AI Academy" → "DataAI Nexus" | BUILT & VERIFIED, uncommitted |
| [CR-2026-10-01-2246-assessment-check-card-and-hrd-verification-link.md](CR-2026-10-01-2246-assessment-check-card-and-hrd-verification-link.md) | /assessment: "The Free Assessment Check" as a card, "Assess your Data Foundation" heading removed; HRD verification link on "Who delivers this" | BUILT & VERIFIED, uncommitted |
| [CR-2026-10-01-2138-training-formats-and-interest-registration.md](CR-2026-10-01-2138-training-formats-and-interest-registration.md) | Formats tab for trainers/admin; "Register your interest" (USD 2, non-refundable) with a Users Interest tab | BUILT & VERIFIED — production deploy covered by the founder's 2026-10-01 night instruction ("commit, push … deploy in production") |
| [CR-2026-10-01-2136-menu-naming-domain-and-admin-labels.md](CR-2026-10-01-2136-menu-naming-domain-and-admin-labels.md) | Free Assessment naming, burger menu, domain dataainexus.com (guide written), admin Edit/Delete labels | Steps 1–4 BUILT & VERIFIED, uncommitted; step 5 (domain) awaits the founder's DNS/Caddy/Stripe steps |
| [CR-2026-10-01-1711-personas-interview-prep-and-organisation-screening.md](CR-2026-10-01-1711-personas-interview-prep-and-organisation-screening.md) | Assessment page (renamed from Free Certifications): personas — Assess your Data Foundation · Prepare for Interview (role tests) · Organisation Interview Screening; Organisation role/dashboard; burger menu; free LLM on hold | P0–P4 BUILT & VERIFIED — schema approved by the founder 2026-10-01 night ("go ahead for schema I approve"); release gate PASSED on this tree (Vitest 717/717, Playwright 171/171 on the production build) |
| [CR-2026-10-01-0712-contact-us-company-and-partner-cards.md](CR-2026-10-01-0712-contact-us-company-and-partner-cards.md) | Contact Us: head-office card + partner-location cards (Infocentric, Pakistan) | DEPLOYED (`v2026.10.01`) |
| [../modification.md](../modification.md) *(predates this folder — "M16", 2026-09-30)* | Free Assessment Check, graded certificates, cards redesign, trainer pages removed, HRD wording | DEPLOYED (`v2026.09.30-4`) |
| [../docs/execution/MILESTONE_15_EXECUTION_PLAN.md](../docs/execution/MILESTONE_15_EXECUTION_PLAN.md) *(predates this folder — "M15")* | Certificates, verification, PDF, Contact email-only, Stripe-live readiness | DEPLOYED (`v2026.09.30-2`) |

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
