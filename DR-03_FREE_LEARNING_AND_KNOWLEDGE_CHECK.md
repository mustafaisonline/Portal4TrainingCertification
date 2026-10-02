# DECISION RECORD DR-03 — FREE SELF-PACED LEARNING AND THE KNOWLEDGE CHECK

**Status:** Approved by the founder, 2026-09-27 (chat: *"Let's change the rule … it will be self train, not expert-led"*; decisions P1–P20 of `framework/milestones/MILESTONE_14_IMPACT_ANALYSIS.md` §9). Binding on all three specifications and on DR-02.
**Amends:** DR-02 §1 ("We are not … a generic LMS · a self-paced content consumption platform") — **partially**, as stated in §2 below. DR-01 is **unchanged** (§3).

## 1. Why

The founder decided on 2026-09-27 to publish his book *I Am Datapedia!* on the portal as **free, self-paced learning** — every topic readable and quizzable online — and to offer a **free knowledge test** (50, 100 or 200 questions) to account holders. DR-02, as written, excludes self-paced content consumption from what the Academy is. The founder chose to change that rule rather than reframe the feature.

## 2. The decision (amends DR-02)

1. The Academy offers **two kinds of learning**: **expert-led training** (DR-02 §2 — face-to-face, live online, corporate/private, international; paid; certified by the Certificate of Completion) and **free self-paced learning** (the founder's own published work, read and self-checked on the portal). The second is a product line in its own right, not a support material for the first.
2. DR-02 §1 "We are not" is amended: the phrases *"a generic LMS"* and *"a self-paced content consumption platform"* no longer exclude **the Academy's own free learning content**. Everything else in that list stands: not a course marketplace, not a video-first platform, not a professional association or standards body.
3. Free learning is **free**: no fee, no seat, no order. Reading and topic self-checks store nothing about the reader (P11).
4. **The Knowledge Check** (free certification test) is for **signed-in account holders** only; pass mark 70 %, no time limit, unlimited retakes (P12). Its result is stored (a result that can be verified cannot live in a browser).

## 3. What DR-01 still means (unchanged)

The Academy still issues **one credential**: the **Certificate of Completion**, earned by attending an expert-led date and recorded by an administrator. A passed Knowledge Check produces a **Knowledge Check result** with a unique, verifiable ID (P2 a). It is **not a credential**, is never called a certificate of the Academy's credential, is not listed on the credential-integrity policy as one, and does not appear as a certificate in the holder's Certifications tab; it has its own place. Showing the result document requires a review of the free learning (as for paid trainings) **and** the US$10 unlock (P13: participants in Pakistan are exempt from the fee; P14: non-refundable once shown).

## 4. What this record does NOT decide

- Object storage (ADR-008): book PDFs and topic images are stored in PostgreSQL for now (founder, 2026-09-27), served through routes, backed up with the database.
- Question authorship: the first release carries **10 questions per topic** (P9), drafted with the AI assistant in this workspace from the topic's text and held as *draft* until the founder marks them *reviewed*; only reviewed questions are served (P10).
- Rights: the founder confirmed he alone publishes the book (P3).
- The schema for topics, questions, options and knowledge-check attempts is approved **separately** under Rule 1 (Milestone 14 execution plan §4).

## 5. Superseded statements

| Document | Location | Statement | Status under DR-03 |
|---|---|---|---|
| `DR-02` | §1 "We are not" | "a generic LMS · a self-paced content consumption platform" | **Narrowed** — excludes third-party or marketplace content, not the Academy's own free learning |
| `DR-02` | §4 (supersession of "self-paced course platform" wording) | applies to the *training* product | Unchanged for training; free learning is a separate line |
| `DATA_AI_ACADEMY_PORTAL_BLUEPRINT.md` | any "diagnostic" positioning of P05 | the free diagnostic is the only self-serve feature | **Extended** — Free Learning and the Knowledge Check join it |
