# Milestone 14 — Execution plan: Free Learning, Knowledge Check, Take-away, header restructure

> **Status: Phase 1 APPROVED and in progress 2026-09-27; Phases 2–5 planned, each schema change still to be applied only after the §4 approval line is answered.**
> **Trigger:** the founder's "New more change" note of 2026-09-27; the impact analysis ([`MILESTONE_14_IMPACT_ANALYSIS.md`](MILESTONE_14_IMPACT_ANALYSIS.md)) and its decisions P1–P20 answered the same day; **DR-03** ([`../../DR-03_FREE_LEARNING_AND_KNOWLEDGE_CHECK.md`](../../DR-03_FREE_LEARNING_AND_KNOWLEDGE_CHECK.md)) amends DR-02.

## 1. Decisions as given (2026-09-27)

| # | Decision | Founder's answer |
|---|---|---|
| P1 | DR-02 | **Change the rule**: free self-paced learning is a product line ("self train, not expert-led") → DR-03 |
| P2 | Free Certification result | **(a)** a Knowledge Check result with a verifiable ID, not a credential (DR-01 stands) |
| P3 | Rights | Co-authored, **published by the founder alone** — proceed |
| P4 / P8 | Storage | **PostgreSQL** for PDFs and images (no object storage); served through routes |
| P5 | Book prices | **"See price on Amazon"** |
| P6 | Take-away placement | **Both** — trainer profile and Free Learning |
| P7 / P10 | Tools | **Free, open-source only**: `mammoth` for `.docx`; questions drafted with the assistant in this workspace, held as *draft* until reviewed |
| P9 | Questions per topic | **Start with 10** |
| P11 | Topic quiz answers | **Nothing stored** |
| P12 | Knowledge Check rules | **70 %**, no time limit, unlimited retakes, **signed-in only** |
| P13 | US$10 unlock and Pakistan | **Exempt** Pakistan |
| P14 | Refund line | **Non-refundable** once shown |
| P15 | Header | About Us **footer only** |
| P16 | Merge | HRD Corp content **below** the training cards on `/programs`, titled "Trainings & HRD Corp"; `/hrd-corp` redirects |
| P17 | Search | `/search?q=` with two groups; `/verify` kept for the footer |
| P18 | `Book/` | Ignored; source stays in ReferenceMaterial |
| P19 | Give-away files | *(not answered — assumed)* the PDFs the founder places in the workspace; none generated from the `.docx` |
| P20 | "Free training" in the certificate rule | *(not answered — assumed)* the Knowledge Check, not the topic pages |

## 2. Phases

### Phase 1 — no schema (approved; built first)
1. **Header** (`site-nav.ts`, `PublicShell.tsx`): Home · Trainings & HRD Corp (`/programs`) · Free Training & Certification (`/free-learning`) · Trainers · Reviews · **search bar** (placeholder "Search Candidates or Training", submits to `/search?q=`) · burger. About Us stays in the footer; the footer gains Free Training & Certification.
2. **Trainings & HRD Corp**: the HRD Corp sections move from `/hrd-corp` into a shared component rendered below the training cards on `/programs` (anchor `#hrd-corp`); `/hrd-corp` → 308 redirect to `/programs#hrd-corp`.
3. **Free Learning**: `/free-learning` landing with two items — **Learn Free** (the book reference, Amazon link, "topics are being prepared" until Phase 2) and **Give Free Test and Gain Certificate** (the Knowledge Check, "coming" until Phase 4; the existing 10-question diagnostic stays reachable as the free taster at `/free-learning/diagnostic`). `/diagnostic` and `/diagnostic/result` → 308 redirects.
4. **Diagnostic sentence**: "Your answers stay in your browser — we do not save them" on the home band and on the diagnostic page.
5. **Take-away**: the trainer's `books[]` rendered on `/trainers` (each trainer with books) and on `/free-learning`, with "See price on Amazon" links.
6. **Search page** `/search?q=`: certificates (today's rules and rate limit, shared with `/verify`) and published trainings by title/summary.
7. `.gitignore`: `Book/`.
8. Tests: `site-nav` unit; `public`, `readiness`, `trainings` e2e updated; new `search` e2e; axe.

### Phase 2 — Learn Free (needs §4 rows 1–2)
Ingestion script (`scripts/ingest-datapedia.ts`, `mammoth`, dev-time): `.docx` → one row per `Heading1` topic (title, slug, HTML body with images referenced by id) + image bytes → `book_topics`, `book_topic_images`; a `published` flag so clean-up can happen topic by topic. Pages: `/free-learning/topics` (search, list), `/free-learning/topics/<slug>` (content), image route `/free-learning/images/<id>`. Admin: a read-only list with publish/unpublish and a "re-import" guard.

### Phase 3 — Topic quizzes (needs §4 row 3)
`topic_questions` + `topic_question_options` (one correct per question). 10 questions per topic drafted in this workspace from the topic text, inserted as `draft`; Admin → Free Learning → Questions to mark *reviewed*; only reviewed questions are served. Topic page: questions after the content, 10 per page, Submit per page → right/wrong shown, nothing stored.

### Phase 4 — Knowledge Check (needs §4 row 4)
`/free-learning/knowledge-check`: signed-in only; choose 50 / 100 / 200; questions drawn at random from reviewed questions across topics (refused honestly while the bank is smaller than the size); attempt stored (`knowledge_check_attempts`: user, size, question ids, answers, score, passed, public ID); result page; `/verify/<id>` resolves a Knowledge Check ID with its own wording ("Knowledge Check result — not a credential"); the result document behind **review + unlock** (Phase 5), the ID and status never gated; a "Knowledge Checks" section under the account's Certifications tab, visibly separate.

### Phase 5 — US$10 unlock (needs §4 row 5)
`order_kind` + `knowledge_check_unlock`; fixed **USD 10** (a settings row like the support payment, so it can be changed without a deploy); Stripe session; webhook branch; orders read models; refund-policy sentence (non-refundable); Pakistan exempt (region from the profile); a review of "Free Learning" (a review row without a registration — the reviews model already allows `registrationId` null) is the other half of the gate.

### Phase 6 — Soft-copy give-away (needs §4 row 6; after the PDFs exist)
`book_files` (expert book id, filename, mime, bytes) served through a signed-in route with a download count; the Take-away section gains "Download".

## 3. What is deliberately NOT in this milestone
Object storage (ADR-008 stays open) · question generation by an external API · a second credential · any change to the Certificate of Completion, fees, regions or the M13 attendance/review rules · video or any content that is not the founder's own book.

## 4. ⛔ Physical data model changes — Rule 1 (each row applied only after the founder answers **"§4 rows … approved"**)

| # | Table / change | Phase | Columns (summary) | Reversible |
|---|---|---|---|---|
| 1 | `book_topics` | 2 | id, position, slug (unique), title, body_html, source_heading, published, search (tsvector), created/updated | drop |
| 2 | `book_topic_images` | 2 | id, topic_id (FK), position, mime, bytes (bytea), alt | drop |
| 3 | `topic_questions` + `topic_question_options` | 3 | question: id, topic_id, position, stem, status (draft/reviewed), reviewed_by/at · option: id, question_id, position, text, is_correct (partial unique: one true per question) | drop |
| 4 | `knowledge_check_attempts` | 4 | id, user_id, size (50/100/200), question_ids (json), answers (json), score, passed, public_id (unique), started/finished | drop |
| 5 | `order_kind` + `knowledge_check_unlock`; `knowledge_check_unlock_settings` | 5 | enum value; settings: amount_minor, currency, enabled, effective_from · **built with one addition: `orders.knowledge_check_attempt_id` (nullable FK) — see §6 Phase 5** | value stays unused / drop (and drop the column) |
| 6 | `book_files` | 6 | id, expert_id, title, filename, mime, bytes (bytea), size, downloads | drop |

No existing table or column changes in any phase — with the one exception noted on row 5 (an added nullable column on `orders`, flagged at build time; nothing existing altered).

## 5. Order of work and verification
Phase 1 → (approval of §4 rows 1–2) Phase 2 → (row 3) Phase 3 → (row 4) Phase 4 → (row 5) Phase 5 → (row 6, PDFs) Phase 6. Every phase: tsc · Vitest · Playwright on the production build · confirmed on `localhost:3100` · docs (`PROJECT_STATUS.md`, this file §6, ADR-050).

## 6. Completion notes

### Phase 1 — built 2026-09-27 (no schema change)
- **Header** (`site-nav.ts`, `PublicShell.tsx`): Home · Trainings & HRD Corp · Free Training & Certification · Trainers · Reviews, a search bar ("Search Candidates or Training") on desktop and at the top of the mobile panel, the burger. About Us and the new item in the footer. `tests/unit/site-nav.test.ts` pins the five labels.
- **Trainings & HRD Corp** (`/programs`): the HRD Corp sections (`src/shared/marketing/HrdCorpSections.tsx`, copy unchanged) below the training cards at `#hrd-corp`; `/hrd-corp` → 308. The section's "Certifications" link still points at a route that does not exist (pre-existing on the old page) — left for the founder's copy review.
- **Free Training & Certification** (`/free-learning`): the two items as asked — Learn Free (book reference, Amazon link, "topics coming" until Phase 2) and Give Free Test and Gain Certificate (the Knowledge Check described, "coming with the topics"; the ten-question diagnostic linked as the taster); the **Take away** books (five, from the seeded trainer profile, "See price on Amazon"). The diagnostic flow and result moved to `/free-learning/diagnostic[/result]`; `/diagnostic` and `/diagnostic/result` → 308.
- **Diagnostic sentence** ("your answers stay in your browser: we do not save your diagnostic results") on the home band and the diagnostic page; the mockup's stale "Certificate of Attempt … USD 10 … 50/100/200 diagnostics" sentence, which promised things that did not exist, is gone.
- **Take away on `/trainers`**: the lead trainer's five books under "Take away — published work" (`TakeAwayBooks.tsx`).
- **Search** (`/search?q=`): trainings by every word in title/subtitle/summary (`searchPublishedProgrammes`), certificates by ID or listed name with `/verify`'s classifier and the **shared** rate limit (`src/modules/certificates/search-limit.ts`, also used by `/verify`).
- `.gitignore`: `Book/`.
- Tests: `tests/e2e/search.spec.ts` (header items, search bar → `/search`, redirects, a training by word, a certificate by ID and by listed name, empty states, the merged page, the Free Learning items and take-away, the not-saved sentence, axe); `public`, `trainings`, `readiness`, `certificates` specs updated. The search bar's accessible label is "Find a candidate or a training" (not "Search…") so it never collides with the admin screens' own Search fields.
- **Verified 2026-09-27:** tsc clean · **Vitest 456/456** · **Playwright 76/76** on the production build · confirmed on `localhost:3100` (header at 1440 px fits without overflow; `/free-learning`, `/search?q=vibe`, `/programs#hrd-corp`).

### Phase 2 — built 2026-09-27 (§4 rows 1–2 approved: "§4 rows 1–2 approved, start Phase 2")
- **Schema:** migration `20260927081708_free_learning_book_topics` — `book_topics` (position, slug, title, body_html, body_text, source_heading, word_count, published, imported_at) and `book_topic_images` (topic, position, mime, **bytes**, alt; cascade with the topic). Search is a case-insensitive contains on title and text (383 rows — no tsvector needed yet; row 1's "search (tsvector)" column was not added).
- **Tool (P7):** `mammoth` 1.13 (BSD-2) as a devDependency; used only by the script.
- **Import:** `scripts/ingest-datapedia.ts` (`npm run learning:import -- "<path to .docx>" [--draft] [--only <slug>]`): `.docx` → HTML → one topic per `Heading 1` (`src/modules/free-learning/import.ts`: split, sanitise — scripts, handlers, `javascript:` links and Word bookmark anchors removed — text, slug, word count), stored one topic per transaction through `replaceTopicFromImport`; a re-run matches by slug, replaces body and images, and **keeps an administrator's unpublish decision**. Undisplayable EMF images are dropped and counted. **Run on the dev database 2026-09-27: 383 topics, 174,867 words, 447 images (60 MB) stored, 2 EMF dropped; every topic published.** Slugs follow the source headings exactly (e.g. the book's "Master andReference Data Management" → `master-andreference-data-management`) — the founder can fix headings in the source and re-import.
- **Pages:** `/free-learning/topics` (list in book order, search `?q=`, count, honest empty states), `/free-learning/topics/<slug>` (the topic, its images from the database, previous/next, a "self-check coming" note for Phase 3), `/free-learning/images/<id>` (public, immutable cache; 404 when the topic is unpublished); the landing's Learn Free card now says **"Browse N topics"**.
- **Admin → Free Learning** (`/admin/free-learning`, administrators only): every topic with slug, words, images, status, and a Publish/Unpublish switch (audited `book_topic.published_changed`). Importing is the script, never a browser upload.
- **Tests:** `tests/unit/free-learning-import.test.ts` (split, front matter, slugs and suffixes, sanitising, helpers), `tests/integration/free-learning.test.ts` (import + image URL rewrite, re-import replaces images without orphans and keeps unpublish, audit, readers' list/search/neighbours/count), `tests/e2e/free-learning.spec.ts` (list, search, topic page with the served image, landing link, admin unpublish → 404s → publish, audited; axe).
- **Not stored, by design (P11):** nothing about the reader.
- **Verified 2026-09-27:** tsc clean · **Vitest 467/467** (+11) · **Playwright 78/78** on the production build (+2) · confirmed on `localhost:3100`: `/free-learning/topics?q=metadata` (72 matches), `/free-learning/topics/what-is-an-entity` (text, its image loaded from the database, "Entity Recognition →"), the landing's "Browse 383 topics".

### Phase 3 — built 2026-09-27 (§4 row 3 approved: "§4 row 3 approved, start Phase 3")
- **Schema:** migration `20260927082804_free_learning_topic_questions` — enum `topic_question_status` (draft · reviewed), `topic_questions` (topic, position, stem, explanation, status, reviewed by/at) and `topic_question_options` (question, position, text, is_correct). "Exactly one correct of five" is enforced by the repository on every write rather than by a partial unique index (Prisma's migration diff would fight an index it cannot express).
- **Authoring (P9–P10):** questions are JSON files, one per topic, under `prisma/seed-data/free-learning-questions/` (`{ topic, questions: [{ stem, options[5], correct, explanation }] }`), loaded by `npm run learning:import-questions -- <file|folder> [--replace-drafts]` as **drafts**; a topic that already has questions is skipped unless `--replace-drafts`, which removes its drafts and never its reviewed questions. **First batch drafted in this workspace from the topics' own text: topics 1–10, 100 questions**, imported to the dev database as drafts. The remaining 373 topics are drafted the same way in later sessions, batch by batch — nothing is generated blind.
- **Review (P10):** Admin → Free Learning shows "n of m reviewed" per topic; `/admin/free-learning/<topic>/questions` lists every question with its five options and the correct one marked, per-question *Mark reviewed / Back to draft*, and *Mark all drafts reviewed*; each change audited (`topic_question.status_changed`). **Readers see reviewed questions only.**
- **The self-check on the topic page:** ten reviewed questions a page (`?page=`), radio buttons, *Submit answers* → the server marks the page and answers with right / wrong / not answered, the correct letter and the explanation, and a score for the page; *Try this page again*, *Previous 10*, *Next 10*. The correct options are never in the page HTML; **nothing is stored** (P11). A topic with no reviewed questions keeps the "being prepared" note.
- **Tests:** `tests/unit/free-learning-quiz.test.ts` (validation), `tests/integration/free-learning-quiz.test.ts` (import skip/replace semantics keeping reviewed questions, readers' pages without answers, server-side marking ignoring drafts and unknown ids, bulk review with audit, pagination clamp, counts), `tests/e2e/free-learning-quiz.spec.ts` (drafts invisible; admin reviews one then all; the reader answers, submits, sees verdicts and the page score, moves to the next page; axe).
- **Verified 2026-09-27:** tsc clean · **Vitest 479/479** (+12) · **Playwright 80/80** on the production build (+2) · confirmed on `localhost:3100`: topic 1's ten drafts reviewed at Admin → Free Learning → Questions, then `/free-learning/topics/what-is-data` marked "1 of 10" with Correct / Wrong / Not answered and the correct letters; the page HTML carries no answers.

### Phase 4 — built 2026-09-27 (§4 row 4 approved: "§4 row 4 approved, start Phase 4")
- **Schema:** migration `20260927084158_free_learning_knowledge_check` — `knowledge_check_attempts` (user, size, question ids in the order served, answers so far, score, passed, public ID `KC-YYYY-XXXX-XXXX`, the holder's name at finish, started/finished). One table; nothing existing changed.
- **The bank:** reviewed questions of published topics. A size the bank cannot serve is shown **disabled with the count available** — never a shortened check passed off as the full one (`/free-learning/knowledge-check`, signed-in only; the landing's item 2 opens it once 50 are reviewed and says "n reviewed so far — opens at 50" until then).
- **The check:** `startAttempt` draws `size` distinct reviewed questions, shuffled with `crypto.randomInt`; ten a page, answers saved on every page change (only served questions, only positions 1–5), Finish from any page; a finished attempt cannot be reopened for answering. Correct options never reach the page.
- **The result:** score, pass at **70 %** (P12), the holder's legal name snapshotted, a **KC id** (the certificate alphabet with a `KC-` prefix so it can never be mistaken for a `DAA-` Certificate of Completion), audited `knowledge_check.finished`; copy-ID and copy-link buttons. **`/verify/<KC id>`** shows the result with "not a Certificate of Completion, not the Academy's credential"; the `/verify` and `/search` boxes recognise a KC id and go there. Under **Certifications**, a visibly separate "Your Knowledge Check results" list (DR-03 §3). Unlimited retakes; unfinished attempts can be continued.
- **Deferred to Phase 5, said on the result page:** the printable result document behind the review + US$10 unlock.
- **Tests:** `tests/unit/knowledge-check.test.ts` (id shape, sizes, pass mark), `tests/integration/knowledge-check.test.ts` (bank = reviewed of published; refusal while too small; 50 distinct questions; pages without answers; saving only served questions; scoring 36/50 = pass; name snapshot; KC id; verify lookup case-insensitive; audit; finish idempotent; a fail still gets an id), `tests/e2e/knowledge-check.spec.ts` (signed-out redirect; start page states the bank and disables 200; a full 50-question run across five pages with answers kept when going back; result 45/50 passed; the finished attempt redirects to its result; `/verify`, `/verify?q=` and `/search?q=` resolve the id; Certifications lists it as a result beside "no certificate"; axe). The test-user cleanup helper now clears a reviewer's attribution and removes their attempts (both restrict the user row).
- **Verified 2026-09-27:** tsc clean · **Vitest 486/486** (+7) · **Playwright 82/82** on the production build (+2) · confirmed on `localhost:3100`: with 10 reviewed questions the start page says so and every size is disabled; the landing's item 2 says "10 reviewed questions so far — opens at 50".

### Phase 5 — built 2026-09-27 (§4 row 5 approved: "§4 row 5 approved, start Phase 5")
- **Schema:** migration `20260927085708_free_learning_knowledge_check_unlock` — `order_kind` gains `knowledge_check_unlock`; new insert-only `knowledge_check_unlock_settings` (enabled, amount, currency, label, effective-dated, note, audited `knowledge_check_unlock.changed`), seeded once at **USD 10.00**; **and ONE column not in row 5's wording: `orders.knowledge_check_attempt_id` (nullable UUID, FK → `knowledge_check_attempts`, on delete restrict)**, so an unlock order names the attempt it pays for — the same pattern as `orders.certificate_id` for renewals. Without it "which attempt is unlocked?" would have to be inferred from audit JSON, which is not a source of truth. ⚠ Flagged here and in the completion report as a necessary addition to the approved row; reversible (drop the column). Nothing existing was changed or retyped.
- **The gate** (`src/modules/commerce/unlock.service.ts`): the document is shown when BOTH hold — (1) a review of Free Learning exists for the person (the reviews model's `diagnostic` kind, no registration; hidden or rejected still counts, as for certificates) and (2) the fee is settled: a PAID `knowledge_check_unlock` order for that attempt, **or none is due because the profile country is Pakistan** (P13, the card-payment rule — region from `pricing.ts`). The ID and `/verify` are never gated (DR-03 §3). Fee states: `paid · exempt · required · unavailable` (setting off).
- **Checkout:** `startUnlockCheckout` — one transaction creates the pending order (amount from the setting in force, never the browser; region `international`; 30-minute hold; audited `order.created` with the attempt's public ID) then asks Stripe for a session (product name "Knowledge Check result document — KC-…"); refuses an unfinished or foreign attempt (`unlock_not_finished`), an exempt person (`unlock_fee_exempt`), a switched-off setting (`unlock_unavailable`), an open pending order (`unlock_order_pending`) and an attempt already paid (`unlock_already_paid`). The webhook's `knowledge_check_unlock` branch marks the order paid, records the payment, audits `payment.succeeded` and queues `commerce.knowledge-check-unlocked` with the document link. Refund policy §1 gains the sentence: the unlock is **not refundable once the document has been shown**.
- **Screens:** the result page's "Result document" card lists the two conditions with their state (`result-gate-review`, `result-gate-fee`), links the review to `/reviews#free-learning`, offers **Pay USD 10 with Stripe** (or says honestly that payments are not configured), shows server truth for `?order=` / `?cancelled=1`, and once unlocked links **View and print the document** → `/free-learning/knowledge-check/<id>/document` (owner only; refused back to the result page until the gate holds). The document (`KnowledgeCheckDocument.tsx`) is deliberately not the certificate's design: "Knowledge Check result", name, score, pass, date, ID, verification URL, and the not-a-credential sentence on the document itself. **Admin → Orders → Knowledge Check unlock fee** (`/admin/orders/unlock`): the same insert-only, effective-dated form as the support setting; the Orders kind filter and every order read model (account, admin list, user detail, data export) show "Knowledge Check result document · One-time unlock".
- **Bug found by the new test and fixed:** the admin user detail and the data export titled every offering-less order "Support the Academy"; both now use the shared `offeringlessOrderTitle(kind)`.
- **Tests:** `tests/integration/knowledge-check-unlock.test.ts` (seeded setting; validation and audit; gate states incl. Pakistan exempt-but-review-needed; checkout refusals; the pending order names the attempt and is priced from the setting; signed webhook → paid + audit + email, replay harmless; every read model), `tests/e2e/knowledge-check-unlock.spec.ts` (both conditions open → document route refuses → Pay answers "not configured" → a Free Learning review satisfies condition 1 → a Pakistan profile is exempt → the document opens with the name and the not-a-credential sentence; the admin setting page from Orders, off → on, audited; axe on every page). `knowledge-check.spec.ts`'s "coming next phase" assertion replaced by the gate.
- **Verified 2026-09-27:** tsc clean · **Vitest 495/495** (+9) · **Playwright 84/84** on the production build (+2; the full run showed the one stale Phase 4 assertion, corrected and re-run green) · confirmed on `localhost:3100`: Admin → Orders shows the "Knowledge Check unlock fee" link and the kind filter; the setting page shows USD 10.00 in force with its history.
- **Not built:** Phase 6 (soft-copy give-away) waits on §4 row 6 and the PDFs. A live Stripe round trip of the unlock was not run (test keys only on this laptop; the founder's `stripe listen` check is the same as for `/support`).
