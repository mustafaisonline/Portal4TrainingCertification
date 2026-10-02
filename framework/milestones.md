# milestones.md — Milestones

> Version 1.0 · 2026-10-02. The **single milestone tracker**: each milestone traces to BRD areas in [`brd.md`](brd.md) and to work packages in [`wbs.md`](wbs.md). Detailed plans and completion reports stay where they are (`docs/execution/`) as traceability records; this file links to them rather than copying them. **When a milestone is achieved, update its row here, in the same change** (skill `milestones-update`).
> Statuses: NOT STARTED · IN PROGRESS · DONE · DEPLOYED · BLOCKED. Source: `docs/execution/PROJECT_STATUS.md` as at 2026-10-02 and the milestone plans' own status lines.

| M | Milestone | BRD | Status | Detail |
|---|---|---|---|---|
| M1 | Walking skeleton | BR-1 | DONE | [plan](milestones/MILESTONE_1_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_1_COMPLETION_REPORT.md) |
| M2 | Identity & access | BR-4 | DONE | [plan](milestones/MILESTONE_2_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_2_COMPLETION_REPORT.md) |
| M3 | Catalogue & public portal | BR-3 | DONE | [plan](milestones/MILESTONE_3_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_3_COMPLETION_REPORT.md) |
| M4 | Registration & payment | BR-5 | DONE | [plan](milestones/MILESTONE_4_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_4_COMPLETION_REPORT.md) |
| M5a | User profile | BR-4 | DONE | [plan](milestones/MILESTONE_5A_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_5A_COMPLETION_REPORT.md) |
| M5b | Reviews | BR-6 | DONE | [plan](milestones/MILESTONE_5B_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_5B_COMPLETION_REPORT.md) |
| M6 | Certificate of Completion & verification | BR-2 | DONE | [plan](milestones/MILESTONE_6_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_6_COMPLETION_REPORT.md) |
| M7 | Renewal reminders | BR-2 | DONE | [plan](milestones/MILESTONE_7_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_7_COMPLETION_REPORT.md) |
| M8 | Trainer / admin operations | BR-7 | DONE on existing schema; §5 items await approval | [plan](milestones/MILESTONE_8_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_8_COMPLETION_REPORT.md) |
| M9 | Production readiness | BR-11 | DONE (code, runbooks) | [plan](milestones/MILESTONE_9_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_9_COMPLETION_REPORT.md) |
| M10 | Launch cutover | BR-11 | Readiness audit DONE; production live as UAT, public launch is the founder's | [plan](milestones/MILESTONE_10_EXECUTION_PLAN.md) · [report](milestones/MILESTONE_10_COMPLETION_REPORT.md) |
| M11 | DigitalOcean deployment framework & Stripe go-live | BR-11, BR-5 | DEPLOYED (production live, UAT) | [plan](milestones/MILESTONE_11_EXECUTION_PLAN.md) · [`deploy/README.md`](../deploy/README.md) |
| M12 | Trainer role & training management | BR-7 | DONE (built 2026-09-26) | [plan](milestones/MILESTONE_12_EXECUTION_PLAN.md) |
| M13 | Participant journey | BR-8 | Approved and built per plan; confirm in plan §status | [plan](milestones/MILESTONE_13_EXECUTION_PLAN.md) |
| M14 | Free learning, Knowledge Check, header restructure | BR-9 | Phases 1–5 per plan; confirm in plan §status | [plan](milestones/MILESTONE_14_EXECUTION_PLAN.md) |
| M15 | Portal journey, certificates, Stripe live, Contact | BR-2, BR-5, BR-9 | DEPLOYED `v2026.09.30-2` | [plan](milestones/MILESTONE_15_EXECUTION_PLAN.md) |
| M16 | Assessment change round (Free Assessment Check, graded certificates) | BR-9 | DEPLOYED `v2026.09.30-4` | [`modification.md`](../modification.md) · `DR-06` |
| CR | Change requisitions from 2026-10-01 onward (personas, interest registration, launch prep, UX fixes) | BR-9…BR-12 | See [`CR/README.md`](../CR/README.md) — the live tracker | `CR/` |

**Rows marked "confirm in plan §status"** were not re-verified when this file was created (2026-10-02); `milestones-update` must read the plan's own status line before changing them. No status here is newer than the sources named above.
