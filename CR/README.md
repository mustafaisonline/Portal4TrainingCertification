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
