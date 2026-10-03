---
name: dr-write
description: Write or update a decision record (root DR-0x file) or an ADR entry in docs/architecture/ARCHITECTURE_DECISION_REGISTER.md from a founder decision, with the superseded statements listed. Use when the founder decides something that changes product rules, scope or architecture.
---

# Decision record

Decision records outrank the specifications (`CLAUDE.md` authority hierarchy), so one must exist for every founder decision that changes a product rule, a policy, scope or architecture. Business/product decisions → a root `DR-0N_<TITLE>.md`; technical/architecture decisions → an `ADR-0NN` entry in `docs/architecture/ARCHITECTURE_DECISION_REGISTER.md`.

1. Read the latest DR (e.g. `DR-08_TRAINING_INTEREST_REGISTRATION.md`) or ADR for the exact format; number the new one next in sequence.
2. Header: Status (**Approved by the founder, <date>**, quoting the founder's words and the CR that carried them), what it amends or supersedes, and "DR-01 unchanged" when true.
3. Sections: Why · The decision (numbered, plain, each point testable) · What does not change · Superseded statements (table: document, location, statement, status) · Deployment state (built in dev / deployed, with the tag).
4. Update the pointers: the CR, `CLAUDE.md`'s decision-record table if a new DR is added, `framework/brd.md`, `framework/metadata/business/policy-dr-0N.md` (via `metadata-capture`), and any DR the new one supersedes (a supersession note at its top).
5. Keep DR headers truthful afterwards: when a DR's feature deploys, update its "Built in dev" line in the same change (DR-07's header went stale this way).

Never write a decision the founder has not made; a recommendation is not a decision. If the founder's words leave choices open, return the options with a recommendation to Buddy.
