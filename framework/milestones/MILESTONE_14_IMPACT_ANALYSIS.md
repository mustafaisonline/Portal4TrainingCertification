# Milestone 14 — Impact analysis: Take-away books · Free Learning from *I Am Datapedia!* · Free Certification · certificate rules · header restructure

> **Status: ANALYSIS ONLY — 2026-09-27. Nothing is built, no schema is changed, no file outside `docs/` is touched.**
> **Trigger:** the founder's "New more change" note of 2026-09-27, with the instruction *"properly analyse and do a thorough impact analysis before we start implementing … these also require database change, so be careful"*.
> **Read first:** §3 (two collisions with approved decision records) and §9 (decisions P1–P18). The rest is the evidence.

---

## 1. What was asked — restated as six items

| # | Item | In the founder's words (condensed) |
|---|---|---|
| **A** | **Take away** | As Trainer Mustafa Qizilbash: give away soft copies of all my books; links and costs from five `a.co` links |
| **B** | **Certificate rules** | Paid training: certificate visible only after the review. **Free** training: visible only after the review **and a US$10 payment** for that training |
| **C** | **Free diagnostic** | Keep the 10-question home-page diagnostic free; results are not saved — say so on the home section |
| **D** | **Free Learning** (replaces `/diagnostic`) | Rename everywhere. Page with two items: **Learn Free** (all ~380 topics of *I Am Datapedia!*, searchable; a topic page = content on top, then 100 MCQs, 5 options each, 10 per page, Submit per page shows right/wrong) and **Give Free Test and Gain Certificate**. Book reference + Amazon link. Backend: a **topics table** (text + images per row) and a **questions table** (100 questions × 5 answers per topic, with correct/wrong) |
| **E** | **Free Certification** (new page, header, footer) | Tests of **50 / 100 / 200** questions, "just like the diagnostic gives 10 today" |
| **F** | **Header** | Exactly: Home · **Trainings & HRD Corp** (merged) · **Free Training & Certification** (merged) · Trainers · Reviews · a **search bar** ("Search Candidates or Training") replacing "Search Candidate" · Burger |

---

## 2. What exists today (facts, verified 2026-09-27)

| Area | Today |
|---|---|
| **Books** | The five links resolve to ASINs **B0F1NT87CL** (*I Am Datapedia!*), **B0FGTR7Z1N** (*Four 4s Formula*), **B0F46TJ5YN** (*Agentic AI…*), **B0FB2MKZPK** (*Data Engineering Technical Standards…*), **B0FDKDST38** (*Lakebase*) — **the same five books already seeded** on the Trainer profile (`prisma/seed-data/practitioners.ts`, `books[]` with title, subtitle, Amazon URL, cover in `public/books/`). They are stored in the expert's `profile` JSON and **deliberately not rendered** on `/trainers` today. Amazon refuses automated reads, so **no price** is available to me. |
| **Book file** | `Book/I Am Datapedia.docx` (72 MB) and `Book/I Am Datapedia External Design.pdf` (12 MB) — **untracked, not ignored**. The `.docx` has **384 `Heading1` paragraphs** (≈ the 380 topics), **429 embedded images**, ~1.19 million characters of text, and 2,369 list paragraphs. Co-authored with Bill Inmon and Marco Wobben (the seeded subtitle). |
| **Diagnostic** | `/diagnostic` (P05) and the home band: **10 questions** from `diagnostic_questions` (seeded; 1 domain), answers kept in the browser only (`localStorage`, in-progress + hand-off to `/diagnostic/result`); **nothing is saved server-side today**, so item C's rule already holds — only the sentence is missing. Header label "Free Diagnostic". |
| **Certificates** | One credential (DR-01): the **Certificate of Completion**, issued by an administrator recording completion on a **paid, confirmed registration** of a scheduled date (M6). The document is behind the review gate; ID and `/verify` are public. No "free training" exists — every registration is an order. |
| **Orders** | `order_kind` = registration · certificate_renewal · support. Regions decide currency; **Pakistan never pays by card** (founder rule 2026-09-26). |
| **Header** | Home · HRD Corp · Trainings · Trainers · Free Diagnostic · About Us · Reviews · Search Candidate (`/verify`). Footer: Trainings · Trainers · About Us · Schedule · For Organisations · FAQ · Reviews · Contact Us + legal. `/verify` searches certificates by **ID** exactly and by **holder name** for listed holders — nothing searches trainings. |
| **Pages to merge** | `/hrd-corp` (203 lines: what HRD Corp is, claimability, steps), `/programs` (108 lines: training cards + support card). `/diagnostic` + a new Free Certification page. |
| **Tests touching these** | `tests/e2e/public.spec.ts`, `trainings.spec.ts`, `readiness.spec.ts` (header labels, diagnostic band, `/verify`); `tests/integration/catalogue.test.ts` (diagnostic questions). |

---

## 3. ⛔ Two collisions with approved decision records — must be resolved before any build

### 3.1 DR-02 (approved 2026-08-31, binding on all specifications)

DR-02 §1 "We are not": *"… a generic LMS · a **self-paced content consumption platform**"*, and its supersession list rejects the portal as a *"browsable course catalogue"* where learning happens. Item **D — Learn Free** is 380 topics of book content read and quizzed on the portal; item **E** is an online exam. **That is self-paced content consumption and a generic-LMS feature.** The constitution forbids me to reinterpret the record; it does not forbid the founder from amending it.

Two honest ways to read the request:

- **(a) Reference material, not a course.** *I Am Datapedia!* is published as the Academy's **open reference** ("the book, online") that supports expert-led training — the way DR-02 says the portal *supports* the ecosystem. The topic quizzes are self-checks. This needs a **short amendment to DR-02** (a new DR-03) stating that publishing the founder's own reference work, free, does not make the portal a course marketplace; expert-led delivery remains the only *training*.
- **(b) A free self-paced course with an exam and a certificate.** This is exactly what DR-02 excludes and would need DR-02 rewritten. I do not recommend it.

### 3.2 DR-01 (approved 2026-08-30) — one credential

DR-01: *"One certification — a single credential definition. No ladder, no levels, no tiers in the product."* Item **E — "Gain Certificate"** for passing a 50/100/200-question test is a **second credential** (knowledge-tested, unattended, unpaid or US$10). Whatever it is called, it is not the Certificate of Completion (which requires attendance at an expert-led date and an administrator's record of completion — M6, and M13 N6).

Options:

- **(a) Not a credential: a "Knowledge Check result".** Pass a test → a **dated result page with a unique ID** ("Free Knowledge Check — 200 questions — 87% — <ID>"), verifiable, shareable, clearly **not** the Certificate of Completion, never listed as a credential. DR-01 stands; a DR-03 note records it. **Recommended.**
- **(b) A second credential.** Amend DR-01 explicitly ("two credentials: Completion and Knowledge"). Everything DR-01 protects (one badge design, one verification shape, the credential-integrity policy) is reopened.

**Item B's second sentence** ("free training … review and paid US$10") only makes sense once (a) or (b) is chosen: today there is no free training and no certificate that is not a Certificate of Completion. Under 3.2(a) the US$10 would **unlock the Knowledge Check document** (like the review unlocks the Completion document) — a new order kind, no seat, no refund tier.

---

## 4. Impact by item

### A — Take away (books)
- **Data:** the five books exist in the expert profile JSON. Showing them needs **no schema** (render the `books[]` already seeded on `/trainers` and on a "Take away" section). Adding a **price** per book needs a field (`price`, `currency`) in that JSON — no migration — **but the price must come from you**: Amazon cannot be read by the portal, and a stale price on our page contradicts Amazon's.
- **"Give away soft copies":** hosting the PDFs for download is a **file-storage decision** (ADR-008, still open — the profile photo is the only binary we store, in the database). Book PDFs are 12–72 MB each; five of them do not belong in PostgreSQL rows or in the repository. Options: DigitalOcean Spaces (new external service — RED), or link to Amazon only (no hosting). Also: **rights** — two of the books are co-authored; giving away soft copies needs the co-authors' consent, which is your call, not the portal's.
- **Recommendation:** render the books with their Amazon links (and prices you supply) now; "soft copy" download only after ADR-008 is decided.

### B — Certificate rules
- **Paid training:** already exactly so (M6 gate; M13 kept it). No change.
- **Free training + US$10:** depends on §3. New `order_kind` value (`knowledge_check_unlock` or similar), a fixed USD price (constant or a settings row like the support payment), Stripe session, webhook branch, orders read models (5 places, as ADR-048 did), refund-policy sentence ("not refundable once unlocked"), **Pakistan** (card impossible — local partner for US$10? or exempt?).

### C — Free diagnostic
- Nothing server-side changes. One sentence on the home band and on `/diagnostic`: "Your answers stay in your browser; we do not save them." Trivial. (Keep the 10 questions; E uses a different bank — see D.)

### D — Free Learning (the big one)
- **Rename** `/diagnostic` → `/free-learning` (redirect kept), header/footer labels, tests.
- **Content ingestion — the real cost.** 384 topics with 429 images and 1.19 M characters must be converted from `.docx` into per-topic HTML (or Markdown) with images extracted, then loaded into the database. Doing this by hand is weeks; doing it by tool needs a **one-off conversion tool** (`pandoc` or the `mammoth` npm package) — **new technology, even if dev-time only → your approval**. Expect manual clean-up: headings that are not topics (TOC, chapter titles), figures, tables, cross-references.
- **Images:** 429 files. Same ADR-008 question as A: `public/` in the repository (simple, but 429 files and ~tens of MB in git) vs object storage vs database bytes (not recommended at this volume).
- **Questions — 100 per topic × 380 topics = 38,000 questions with 190,000 options.** These do not exist. Nobody can write them by hand for this milestone. The realistic options: (a) start with **far fewer** per topic (e.g. 5–10) written by you; (b) **generate** them with an AI model from each topic's text, then review — a product and quality decision (and a new external API — RED) that the constitution requires you to make explicitly; (c) ship Learn Free **without** per-topic quizzes first. **The schema can hold 100; the content cannot appear by itself.**
- **Schema (new tables, all additive):** `book_topics` (id, slug, position, title, body, source ref, published), `book_topic_images` (or images inline as `/free-learning/images/<file>` paths — no table), `topic_questions` (topic_id, position, stem), `topic_question_options` (question_id, position, text, is_correct — exactly one correct per question, enforced by a partial unique index). Per-page "Submit" showing right/wrong needs **no storage** (answers checked server-side, nothing saved) unless you want progress kept — say so (that would add `topic_quiz_attempts`).
- **Search** over 380 topics: PostgreSQL full-text (`tsvector` column or expression index) — no new technology.
- **Copyright:** publishing the full text of a co-authored, commercially sold book, free, on the portal is your and your co-authors' decision. I will not ingest it until you confirm you hold the rights to do so.

### E — Free Certification
- Question bank: reuse the topic questions (D) — 50/100/200 drawn at random across topics — so E has no content of its own but depends entirely on D's questions existing. A 200-question test needs at least 200 good questions in the bank.
- Attempts must be **stored** (Rule 6: a result that can be unlocked, verified and shared cannot live in the browser): `knowledge_check_attempts` (user, size, questions served, answers, score, passed, unique result ID), plus the unlock order (B).
- Pass mark, time limit, retake rule, who may sit (signed-in only?), whether questions repeat — all undecided (§9).
- Verification: extend `/verify` to resolve a Knowledge Check ID (3.2 a) — or a separate page.

### F — Header
- **Merges:** "Trainings & HRD Corp" = `/programs` + `/hrd-corp` on one page (HRD Corp content below the training cards, anchor from the fee cards' "Via HRD Corp" figure); `/hrd-corp` redirects. "Free Training & Certification" = `/free-learning` with the two items (D) and the tests (E); `/diagnostic` redirects.
- **About Us** leaves the header (stays in the footer — confirm).
- **Search bar:** replaces the "Search Candidate" item; one input, placeholder "Search Candidates or Training"; results: certificates by ID / listed holder name (today's `/verify` logic, keeping its rate limit) **and** published trainings by title/summary (new, simple `ILIKE`/full-text). Lands on `/search?q=` showing both groups. `/verify` stays as the certificate page (footer "Search completion certificates").
- **Tests:** ~6 e2e specs assert header labels and the diagnostic band; all updated.

---

## 5. ⛔ Physical data model changes (Rule 1 — each needs approval; none applied)

| Table / change | For | Kind | Notes |
|---|---|---|---|
| `book_topics` | D | new | ~384 rows; `body` as sanitised HTML; `search` tsvector |
| `topic_questions` + `topic_question_options` | D, E | new | exactly one `is_correct` per question (partial unique index) |
| `knowledge_check_attempts` (+ `…_answers` or a JSON column) | E | new | stored result with a unique public ID |
| `order_kind` + `knowledge_check_unlock` | B | enum value | US$10 unlock; nullable offering/programme as `support` already is |
| `book_topic_images` | D | **optional** | only if images go in the database (not recommended) |
| *(no change)* `experts.profile` JSON for prices | A | — | JSON field, no migration |

Volume: 38,000 questions is a content problem, not a database problem; the tables are small either way.

---

## 6. New technology / services that would be needed (Rule 5 — each needs approval)

| Need | Candidate | Runtime or dev-time | Alternative |
|---|---|---|---|
| `.docx` → HTML per topic | `pandoc` (system tool) or `mammoth` (npm) | dev-time, one-off script | manual (weeks) |
| Image hosting for 429 topic images and 5 book PDFs | DigitalOcean Spaces (ADR-008) | runtime | `public/` in git for images; **no** PDF hosting |
| Question generation at scale | an LLM API | dev-time | fewer, hand-written questions |
| Full-text search | PostgreSQL built-in | runtime | none needed |

---

## 7. Sizing (honest)

| Phase | Content | Schema | Build effort (working days, excluding your content work) |
|---|---|---|---|
| **Phase 1** — header + search bar + merges + renames + diagnostic sentence + books shown with links | none | none | 2–3 |
| **Phase 2** — Learn Free: ingestion tool, topics tables, learning pages, topic search | the book (rights!) | 1–2 tables | 4–6 + clean-up of 384 topics |
| **Phase 3** — topic quizzes | **38,000 questions** or a smaller number | 2 tables | 2 + however the questions are produced |
| **Phase 4** — Free Certification tests, stored attempts, Knowledge Check ID, `/verify` | questions from Phase 3 | 1 table | 3–4 |
| **Phase 5** — US$10 unlock (order kind, Stripe, webhook, read models, policy) | — | enum value | 2–3 |
| **Phase 6** — soft-copy give-away | PDFs + rights | ADR-008 | after storage is decided |

Every phase ends with tsc · Vitest · Playwright on the production build, as before.

---

## 8. Risks and observations (not decisions)

1. **Repository hygiene:** `Book/` (84 MB) is untracked and not ignored. It must **not** be committed (Rule: no large binaries; the ReferenceMaterial archive is the right home). I will add `Book/` to `.gitignore` only when you say so.
2. **Rights:** the book is co-authored and sold; publishing it free online and giving away PDFs are the authors' decisions.
3. **Brand promise:** DR-02 §1 "We are not … a self-paced content consumption platform". Phase 2–4 look like one unless framed as (3.1 a) and kept subordinate to expert-led training in copy and navigation.
4. **Question quality:** generated questions with a wrong "correct" answer damage credibility more than no quiz.
5. **Pakistan and US$10:** the card rule makes the unlock unpayable for Pakistan participants unless exempted or routed to the local partner.
6. **Search bar and rate limits:** `/verify` limits searches per client (10/min) to stop name enumeration; a header search must keep that for the certificate half.

---

## 9. ⛔ Founder decisions — answered 2026-09-27 (see `MILESTONE_14_EXECUTION_PLAN.md` §1 for the answers as given; the table below is the question set as asked)

| # | Question | Recommendation |
|---|---|---|
| **P1** | Amend **DR-02** to allow publishing *I Am Datapedia!* as free **reference material** supporting expert-led training (3.1 a)? | **Yes (a)** — record as DR-03 |
| **P2** | Free Certification result: **(a)** a "Knowledge Check" result with a verifiable ID, explicitly not a credential (DR-01 stands) or **(b)** a second credential (amend DR-01)? | **(a)** |
| **P3** | Do you hold, or have the co-authors' agreement for, the right to publish the book's full text online free of charge? | Required before Phase 2 |
| **P4** | Give away **PDF soft copies** now (needs a storage decision, ADR-008) or **Amazon links only** now, PDFs later? | Links now |
| **P5** | Book **prices** on the Take-away section: supply them, or show "See price on Amazon"? | "See price on Amazon" (never stale) |
| **P6** | Where does Take-away live: on `/trainers` (your profile) and on Free Learning? | Both |
| **P7** | Approve `pandoc` **or** `mammoth` as a one-off conversion tool (dev-time only)? | `mammoth` (npm, stays in `devDependencies`, no system install) |
| **P8** | Topic images: `public/free-learning/` in the repository, or object storage (ADR-008)? | `public/` for now; revisit with ADR-008 |
| **P9** | Questions per topic for the first release: **100 as asked**, or **start smaller** (5–10) and grow? | Start with what can be reviewed |
| **P10** | How are questions produced: written by you, generated by an AI model and reviewed by you (new external API → approval), or the quizzes wait? | Generated + reviewed, if you approve the API; otherwise wait |
| **P11** | Topic quiz answers: checked and shown, **nothing stored** (as asked), or keep progress per person? | Nothing stored |
| **P12** | Free test rules: pass mark (e.g. 70%), time limit, retakes, signed-in only? | 70% · no limit · unlimited retakes · signed-in |
| **P13** | US$10 unlock: applies to the Knowledge Check document only; **Pakistan**: exempt, local partner, or excluded? | Exempt Pakistan from the fee |
| **P14** | Refund policy line for the unlock: non-refundable once unlocked? | Yes |
| **P15** | Header: **About Us** to the footer only? | Yes |
| **P16** | Merged pages: HRD Corp content **below** the training cards on `/programs` (title "Trainings & HRD Corp"), `/hrd-corp` redirects? | Yes |
| **P17** | Search bar results page `/search?q=` with two groups (certificates, trainings), `/verify` kept for the footer link? | Yes |
| **P18** | `Book/` folder: add to `.gitignore` and keep the source in ReferenceMaterial? | Yes |

**Sequencing recommendation:** Phase 1 first (no schema, visible immediately), then Phase 2 once P1, P3, P7, P8 are answered, then 3–5.
