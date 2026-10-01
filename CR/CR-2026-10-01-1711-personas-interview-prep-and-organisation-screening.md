# CR-2026-10-01-1711 — Personas on Free Certifications: Assess your Data Foundation · Prepare for Interview · Organisations Interview Screening

**Received:** 2026-10-01 17:11 MYT · **Status:** REVISED with the founder's responses (§1b) — **awaiting the founder's approval to go ahead** · **Requested by:** founder

## 1. Request (verbatim)

> Few Changes
>
> On Free Certificate page: we need to introduce text for multiple personas
> We need to add card for each personas e.g.
> Assess your Data Foundation: Which is for the currenct 200 questions test
> Prepare for Interview: When user will click this,
> control will take use to a dedicated page for Prepare for Interview page.
> Aim of this page and test is to prepare or let people assessment themselves for the iinterview relaveant to thi=eir roles.
> On this page there will be on card for each Role, so user wil be able to give test as per the role.
> Now at backend we can have questions bank for each role e.g 1000 question for each role. When user takes test, randam 100 questions comes.
> Organizations Interviews Screening:
> When user will click this, control will take use to a dedicated page for Organizations Interviews page
> Aim of this page to conduct initial screen for companies
> On this page there will be on card for each Role, so user wil be able to give test as per the role.
> Now at backend we can have questions bank for each role e.g 1000 question for each role. When user takes test, randam 100 questions comes. but this time, at admin side, we will allow companies to add their quesrtions in their relevant test. We wll make sure, their quesrtions must come in the tests.
> To see this tab at the on your dasboard, company has to email us. Then Admin shoudl be able to give a role this user as Organsation. Just like admin give role of trainer to the person.
> At the moment, in header burger menu, we have two dashboard items i.e., User Dashbaords, Admin Dashboard, now we need to add Orgnization Dashboard.
> Then we need to bring al the Footer items in the Buger menu in the footer.
> Check if we can implement free LLM as well
> Aim is to let Organizations, load their Role's JD, Candidate's Resume and Test Resume and get the scoring accordingly.(Edited)
>
> *(founder, same message)* First let me know if you understand my requirement and make a new CR file for this requirement

## 1b. The founder's responses (2026-10-01, second message) — BINDING; the newest word wins over §2–§6

Verbatim:

> Pelase also cahnge Free Certifications name to Assessment everywehre
>
> **Prepare for Interview:** Make it 100 quesrtiosn to start with. Please note in this test, each querstions will have details answer jsut like someone answer an interview questions. Please add 2 roles i.e., Data Engineer and AI Engineer as first ones.
>
> **Organisations — Interview Screening:** When someone click this card, the next screen will have cards for Companies or Education sector regsitered to get interview screening done. Then when someone click a coompany, then roles cards will come. As first company, add YPT and add same above mentioend rolwes as sampek i.e., Data Engineer and AI Engineer as first one. Please note at dashboard screen, each company will have tab to add a role and their questions and answers in it.
>
> **Question banks:** Please generate these questions from internet as per the best practice to start with.
>
> **Server size:** I didn't get this point.
>
> **Free LLM:** Place this on-hold
>
> **Questions I need answered:** Agree with all the recommendation except below, for which i am giving answers — Page text: persona-neutral headline? **Yes** · Menus: **Yes**
>
> Based on these respons, please udpate hte CR files and ask my approved to go ahead.

**Decisions recorded (R) and assumptions (X) made where a response left room — an X is applied unless the founder objects:**

| Ref | What |
|---|---|
| **R1** | **Rename "Free Certifications" → "Assessment" everywhere** (header and footer menu labels, page title and hero eyebrow, the Home card, search/sitemap labels, docs, legal-draft mentions, tests). The three-persona page headline becomes **persona-neutral** (agreed) |
| **R2** | **Prepare for Interview** is a dedicated page with **one card per role**. **First roles: Data Engineer and AI Engineer.** **Start with 100 questions per role** (the test draws up to 100 at random — so initially a role's whole bank in shuffled order — and grows as the bank grows). **Each question carries a detailed model answer, written the way a strong candidate would answer it in an interview**, shown after the test |
| **R3** | **Organisations — Interview Screening** is a three-step journey: the persona card → a screen of **registered organisations** (**Companies** and **Education sector**) as cards → click an organisation → that organisation's **role cards** → the test. **First organisation: YPT (Your Partner Technologies), with the same two sample roles (Data Engineer, AI Engineer).** |
| **R4** | **Each organisation's dashboard has a tab to add a role and that role's questions and answers.** (An organisation can therefore have roles of its own, and add questions to the shared roles for its own tests.) Company questions always appear in that company's tests (the agreed rule C2) |
| **R5** | **Question banks:** I generate the starting questions for the two roles "from the internet as per best practice" — see **X3** for how I do that responsibly |
| **R6** | **Free LLM: ON HOLD.** Nothing about AI scoring is built or designed further until the founder reopens it (§5 kept for the record) |
| **R7** | All earlier recommendations are **accepted** except where R2–R4 change them: persona-neutral headline ✔, burger menu / Organisation Dashboard / footer links in the burger menu ✔, "Coming soon" cards until their pages exist ✔, Prepare for Interview is **free, account required, timed (90 min proposed), score + per-topic breakdown + answers at the end, no certificate** ✔, fresh random draw every attempt ✔, company rule = **all** company questions (cap 20) + random bank questions to make up the test, shuffled, never shown outside that company's tests ✔, company questions need **administrator approval** ✔, organisation record + "Organisation" role granted in Admin → Users like Trainer ✔ |
| **X1** | **The Assessment page URL.** The label changes everywhere (R1). *Assumption:* the URL changes too, to **`/assessment`**, with a permanent redirect from `/free-certifications` (and the retired `/free-learning/knowledge-check`) so every link keeps working. *(Earlier the founder kept `/free-certifications`; "everywhere" now suggests renaming — confirm.)* |
| **X2** | **Question format.** *Assumption:* **multiple choice** (five options, one correct — auto-scored, as everywhere today) **plus a detailed model answer** shown with each question afterwards (R2). If the founder meant **open written answers** instead, that needs a human (or, later, AI) to score them — say so and §6 changes |
| **X3** | **Generating the questions "from the internet".** I will research current public best-practice sources for each role (public role descriptions, vendor documentation, well-known engineering practices) to build a **topic blueprint**, then **write original questions and model answers** from it, and **cite the sources in the CR**. I will **not copy** any site's question list (copyright). They are loaded as **drafts**; only questions you (or a delegate) mark **reviewed** are ever shown, exactly as the 3,830 topic questions work today. AI-written content can contain mistakes — the review step is real, not a formality |
| **X4** | **Organisation list page.** *Assumption:* the list of registered organisations is **public** (anyone can browse; **signing in is required to take a test**, as today), shows each organisation's **name, type (Company / Education) and logo if supplied**, and lists only organisations an administrator has registered and that have at least one published role. Candidates are told **before they start** that the result is shared with that organisation |
| **X5** | **An organisation's own role.** A role an organisation creates is **private to it**: its test uses only that organisation's approved questions, and **needs at least 10 approved questions** before it can be published (a minimum is needed for a meaningful test). The shared roles (Data Engineer, AI Engineer) use the shared bank **plus** that organisation's questions |
| **X6** | **YPT** is created as the first organisation (type: Company), its users being whoever you name (your administrator account to start), with Data Engineer and AI Engineer as its roles |

**Still to confirm (only what I cannot decide myself):** **X1** (rename the URL?), **X2** (multiple choice + detailed answer, or open written answers?), **X3** (the review step is yours/your delegate's), **X4** (public list + consent notice).

## 1c. Founder: "implement all the requirements before we implement to production" (2026-10-01) — BINDING

> Lets implement all the requiremen before we implemnt to production

**Recorded as:** the founder asked for **P2, P3 and P4 to be built now, in dev, before anything further goes to production** (P0 + P1 are built and verified but **not deployed**). This is treated as **approval to create the additive schema sketched in §6 in the development and test databases** (CLAUDE.md Rule 1: the proposal was shown in §6 and in the previous message). **Production is not touched**: before any deploy the migration SQL is shown to the founder first, and the deploy still happens only on the founder's word.

### Final design for P2–P4 (what is being built)

**Data (one additive migration):** `organisations` (name, slug, type company/education, logo path, contact email, published) · `assessment_roles` (slug, name, description, position, published; `organisation_id` NULL = a **shared** role, set = that organisation's **private** role) · `organisation_roles` (which roles an organisation offers: shared ones it enabled + its own) · `role_questions` (+ `role_question_options`): stem, category (for the per-topic breakdown), five options with one correct, **`model_answer`** (the detailed interview-style answer), status `draft | pending | reviewed | rejected`, `organisation_id` NULL = shared bank / set = that organisation's own question · `role_test_attempts` (user, role, optional organisation, question ids, answers, score, started/finished, `shared_with_organisation` acknowledgement). Time limit, percentage and "who may see" are **derived**, never stored. Organisation membership uses the **existing** `user_roles` (`org_admin`, scope = organisation).

**Rules:** a test = up to **100** questions, **90 minutes** (server-enforced, auto-scored at the deadline, like the Free Assessment Check), one running test per person, a fresh random draw every attempt. **Prepare for Interview** (`/assessment/interview`): shared roles only; free; account required; result = score + per-category breakdown + every question with the correct answer **and the model answer**; "Your results" list. **Organisation screening** (`/assessment/organisations` → organisation → role → test): the test = **all of that organisation's approved questions for the role (up to 20)** + random shared-bank questions to make up the number, shuffled; the candidate is told **before starting** that the result is shared with that organisation; the organisation sees only its own candidates' results. An organisation's **private** role needs **≥ 10 approved questions** before it is listed. Organisation questions are **pending until an administrator approves** them; only `reviewed` questions are ever served.

**Screens:** public — the two role-card pages, the organisation list and organisation role pages, intro, running test, result. **Organisation Dashboard** (`/organisation`, Organisation role): tabs **Overview · Roles (add a role from the catalogue or create your own) · Questions (add/edit questions and answers per role, see approval status) · Results (candidates per role, CSV export)**. **Admin:** Interview roles (shared roles, question bank per role, review/approve, draft import), Organisations (create, edit, publish, link roles), an **approval queue** for organisation questions, and **Admin → Users → "Grant Organisation access"** (choose the organisation) like Trainer.

**Starting content:** roles **Data Engineer** and **AI Engineer**; **100 original multiple-choice questions each with detailed model answers**, written from a public best-practice topic blueprint (sources cited in the files), loaded as **drafts**; **YPT (Your Partner Technologies)** created as the first organisation (company) offering both roles. A bulk "approve all drafts" operator script exists for the founder's use; **nothing is approved automatically** and production data is not touched.

## 2. My understanding (to be confirmed or corrected by the founder)

The Free Certifications page (`/free-certifications`) stops being one test and becomes a **gateway with three persona cards**, each with its own short text:

| # | Persona card | Who it is for | Where it goes | What it is |
|---|---|---|---|---|
| 1 | **Assess your Data Foundation** | Anyone learning data & AI | The current **Free Assessment Check** (200 questions, 3 hours, Charlie/Bravo/Alpha) | Exists today — becomes card #1, nothing about the test changes |
| 2 | **Prepare for Interview** | A person preparing for a job interview in a role | A **dedicated page** with **one card per role**; the person picks a role and takes that role's test | **Self-assessment** for interviews. Each role has its own question bank (target **≈1,000 questions per role**); each attempt draws **100 at random** |
| 3 | **Organisations — Interview Screening** | Companies doing a first-round screen | A **dedicated page** with **one card per role** | Same role banks (≈1,000 per role, **100 random** per attempt) **plus the company's own questions**, which an administrator-side screen lets the company add to its relevant test — and **the company's questions must always appear** in its tests |

Around that:

- **Organisation role.** A company that wants this emails us; an administrator then gives that user an **Organisation** role in Admin → Users, **exactly like the Trainer role is granted today**. Only such users see the organisation features.
- **Header menu.** The account menu already shows **User Dashboard**, **Trainer Dashboard** (trainers) and **Admin Dashboard** (admins). A new **Organisation Dashboard** is added, shown only to people holding the Organisation role.
- **Footer → burger menu.** All the footer's links (Explore list and legal links) must also be reachable from the burger (hamburger) menu.
- **Free LLM — a feasibility check, not a build yet.** The aim: an organisation uploads a **role's job description (JD)**, a **candidate's résumé** and the candidate's **test result**, and gets a **score/summary accordingly**. I am asked to **check whether a free LLM can do this**.

What I am **not** assuming: that the two new tests are free of charge, that they issue certificates or grades, or that candidates are invited by the company — these are questions in §4.

## 3. Facts gathered from the codebase (what exists today)

| Area | Today | Source |
|---|---|---|
| Free Certifications page | One persona only: the Free Assessment Check. The page, URL and name "Free Certifications" stay (DR-04, DR-06) | `app/(public)/free-certifications/page.tsx` |
| Question banks | `TopicQuestion` (+ `TopicQuestionOption`) — questions belong to book **topics**, reviewed in admin; the Free Assessment Check draws 200 from the whole reviewed bank (3,800+). `DiagnosticQuestion` is a separate small bank. **There is no concept of a "role" bank.** | `prisma/schema.prisma` lines ~695, 1198, 1220 |
| Attempts | `KnowledgeCheckAttempt` stores size, `questionIds`, answers, score, started/finished, public ID, revocation. Not tied to a role or an organisation | `schema.prisma` ~1237 |
| Roles | `user_roles` is scoped RBAC (platform / organisation / offering scope). The role enum **already contains `org_admin`** and the scope type **`organisation`** exists — but **there is no `organisations` table** (a scope id would point at nothing) | `schema.prisma` ~337–372 |
| Granting a role | Admin → Users → a person → grant/revoke **administrator** and **trainer** (`grantTrainerAction`, `RoleActions.tsx`); every change is audited | `app/admin/users/[id]/RoleActions.tsx` |
| Header account menu | **User Dashboard** (everyone), **Trainer Dashboard** (→ `/admin`, for trainers), **Admin Dashboard** (→ `/admin`, for platform admins) | `src/modules/identity/components/AccountMenu.tsx` |
| Burger (mobile) menu vs footer | The header's mobile panel lists the five primary links; the footer has the "Explore" list (Knowledge Hub, Free Certifications, Professional Trainings, About Us, Schedule, FAQ, Reviews, Contact Us) and the legal links | `src/shared/chrome/site-nav.ts`, `PublicShell.tsx` |
| Server size | The production Droplet has **≈2 GB RAM, no GPU** (deploy validation: "mem 715/1967 MB") | deploy logs |
| Accounts & data | Candidate/person data is personal data under Malaysia's PDPA; the Privacy draft lists what is collected. Nothing about résumés, job descriptions or sharing results with a third-party company exists yet | `src/content/legal/privacy.ts` |

## 4. Questions for the founder (first round — ANSWERED in §1b; kept for the record)

**A. The persona cards (page 1)**
1. **A1 — Card text.** I will draft a heading + two lines per persona; you approve the words. Should the page headline change from "Take the Free Assessment Check…" to a persona-neutral headline (e.g. "Test yourself. Prepare. Screen.")? *Recommended: yes — three equal cards under a neutral hero.*
2. **A2 — Ship order.** Persona 2 and 3 pages do not exist yet. *Recommended: show the three cards from the first release, with cards 2 and 3 marked **"Coming soon"** (not clickable) until their pages are ready, so each phase can go live on its own.*

**B. Prepare for Interview (persona 2)**
3. **B1 — The roles.** Which roles get a card? (e.g. Data Analyst, Data Engineer, Data Scientist, ML/AI Engineer, BI Developer, Data Architect, AI Product Manager, …) *Please send the list; I will start with the roles you name.*
4. **B2 — Who writes ≈1,000 questions per role?** That is the largest piece of work in this CR. *Recommended: AI-drafted in bulk from your role lists, loaded as **drafts**, then reviewed in Admin (we already do this for the 3,830 topic questions: import as drafts → review → only reviewed questions are ever served). I can generate and load drafts; **quality review stays with you or a delegate**. Start with ~200 per role and grow.*
5. **B3 — The test.** 100 random questions per attempt — a time limit? (Free Assessment Check has 3 h.) A pass mark / grade? Does the person see the **correct answers and explanations** afterwards (it is practice)? A certificate? Is it **free**? *Recommended: free, account required (like today), a time limit of e.g. 90 minutes, a score + per-topic breakdown + answers and explanations at the end, **no certificate** (it is self-assessment), results kept in "Your results".*
6. **B4 — Fresh draws.** Same rule as today: every attempt a new random 100 from that role's reviewed bank. *Recommended: yes.*

**C. Organisations — Interview Screening (persona 3)**
7. **C1 — Who takes the company's test, and how do they get to it?** The brief says "conduct initial screen for companies". *Recommended: the company creates a **screening link/invite per role** in its dashboard; the candidate opens it, signs in (or registers) and takes the test; the **company then sees that candidate's result**. The candidate is told, before starting, that the result will be shared with that company (PDPA consent). Without a link, the page is the same role list for everyone.* Please confirm — this is the biggest design choice.
8. **C2 — "Their questions must come in the tests."** *Recommended rule: a company test = **all** of the company's own questions for that role (up to a cap, e.g. 20) **plus** random questions from the role bank to make 100; shuffled. A company's questions appear **only** in that company's tests, never in the public role test and never for another company.*
9. **C3 — Company questions: format and moderation.** Multiple choice (5 options, one correct — same as everywhere) only? Do company questions need **administrator approval** before they are served? *Recommended: MCQ only; the administrator approves (a company question is shown to people — abuse and quality risk).*
10. **C4 — What the company sees.** Per candidate: name, score, per-topic breakdown, time taken, and (later) the LLM summary; export to CSV? *Recommended: a results table per role + CSV export; candidates' answers visible only as scores unless you want more.*

**D. The Organisation role and dashboard**
11. **D1 — The role.** Use the existing `org_admin` role (shown as **"Organisation"** in the UI) and add the missing **organisations** record (company name, contact email). One Organisation record can have several users. Admin → Users gets **"Grant Organisation access"** (with the company it belongs to), just like Trainer. *Recommended: yes.*
12. **D2 — The menu.** "Organisation Dashboard" appears in the account menu **only for people holding the role**, pointing at a new `/organisation` area (role list, company questions, screening links, candidate results). *Recommended: yes.*

**E. Menu changes**
13. **E1 — "Footer items in the burger menu in the footer"** — I read this as: **put every footer link (Explore list + legal links) into the header's burger menu** too. Is that right, and should the footer keep them as well? *Recommended: yes, and the footer keeps them.* Note: the "dashboard items" you mention live in the **account menu** (avatar dropdown), not the mobile burger — I will add Organisation Dashboard there.

**F. Free LLM (feasibility — see §5)**
14. **F1 — Scope of the first look.** I will write a short, sourced feasibility note (options, cost, privacy, quality) **before any build**. *Recommended: yes; the decision to use any external AI service is yours (it is a RED-gate item).*

## 5. Free LLM — preliminary feasibility — **ON HOLD (founder, 2026-10-01); kept for the record**

*(from general knowledge; to be re-verified with current provider terms before any decision)*

| Option | Fits? | Notes |
|---|---|---|
| **Self-host an open-weight model** on our own server | **Not on today's Droplet** (≈2 GB RAM, no GPU). Would need a bigger/separate machine (a monthly cost) or accept a very small model (≤3 B parameters) that is slow on CPU and weaker at reading CVs against a JD | Data stays with us (best for privacy) |
| **A provider's free API tier** | Possible for a pilot | Rate-limited, no service guarantee, terms **change often**, and several free tiers allow prompts to be used to improve the provider's models — **unsuitable for résumés** unless the terms say otherwise. Sending résumés abroad also needs a consent/notice update (PDPA). Adds an **external service** (CLAUDE.md RED gate) |
| **No LLM: transparent rule-based scoring** | **Yes, now** | Extract skills/keywords from the JD and the résumé, compare, combine with the test score; explainable and free; a good baseline and a safe default |
| **Bring-your-own-key** (the organisation supplies its own AI account) | Possible | Cost and data terms sit with the company; we store the key encrypted |

Risks that apply to **any** option: résumés and JDs are **personal/confidential data** (storage, retention, encryption, deletion); automated scoring in hiring can be **unfair or wrong**, so it must be an **aid for a human**, never an automatic reject; candidates should be told it is used. *Recommendation: build the role banks and the organisation screening first (phases P2–P4); then run a time-boxed LLM spike (P5) with a rule-based baseline, and bring you a cost/privacy/quality comparison to choose from.*

## 6. Plan — phases (REVISED for §1b; each started only on the founder's "go")

| Phase | What | Needs | Schema? |
|---|---|---|---|
| **P0** | **Rename "Free Certifications" → "Assessment" everywhere** (R1/X1: labels, page title, Home card, nav, search/sitemap, docs, legal mentions, tests; URL → `/assessment` with 308 from the old paths) **+ the three persona cards and persona-neutral headline** on that page: card 1 live (the Free Assessment Check), cards 2 and 3 "Coming soon" | X1 | No |
| **P1** | Header account menu: **Organisation Dashboard** (role-gated) · **all footer links added to the burger menu** | none | No |
| **P2** | **Prepare for Interview**: `/assessment/interview` with role cards (**Data Engineer**, **AI Engineer**); per-role question banks (**100 questions each to start**, MCQ + detailed model answer); a role test (up to 100 random, 90 min, free, account required, score + breakdown + answers + "Your results"); admin screens (roles, import drafts, review); I generate the first 2 × 100 draft questions from public best practice (X3) | X2, X3 | **Yes — RED gate** |
| **P3** | **Organisation foundation**: `organisations` record (name, type Company / Education, logo, contact email), Admin → Users **"Grant Organisation access"** (with the organisation, like Trainer), `/organisation` dashboard shell, **YPT seeded as the first organisation** | none | **Yes — RED gate** |
| **P4** | **Organisation Interview Screening**: `/assessment/organisations` (cards for registered Companies and Education organisations) → organisation page with **role cards** → test (company questions always included, up to 20, plus bank fill to 100); **organisation dashboard tabs: add a role, add questions & answers (admin approval queue)**, candidate results | X4, X5 | **Yes — RED gate** |
| **P5** | ~~Free LLM spike~~ | — | **ON HOLD (R6)** |
| **P6** | Docs: **DR-07** (Assessment naming; personas; role tests; organisation screening — supersedes DR-04's page name), legal drafts re-versioned (Terms/Privacy: sharing results with organisations), FAQ, admin help, CR close-out | after P2–P4 | No |

**Schema sketch (for approval at P2–P4 — nothing is changed now):** `assessment_roles` (slug, name, description, published, position, optional `organisation_id` for an organisation's private role) · `role_questions` (+ options and a `model_answer` text; status draft / reviewed / approved; optional `organisation_id` for company questions; source note) · `role_test_attempts` (user, role, optional organisation, question ids, answers, score, started/finished, deadline derived) · `organisations` (name, slug, type company/education, logo path, contact email, published flag) with membership through the existing scoped `user_roles` (role `org_admin` shown as "Organisation", scope = organisation). All additive; each phase shows the exact SQL before it touches production, as agreed. **No résumé/JD storage** — the LLM item is on hold.

**Admin side (as you asked):** Admin → Users gets the Organisation grant; a new Admin → Interview roles screen (roles, banks, import, review, counts); a company-question approval queue; the existing results/audit patterns are reused.

**Documentation:** DR-07; PROJECT_STATUS; this CR kept current; Terms/Privacy drafts re-versioned when résumés/sharing arrive (P4/P5).

## 7. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 0 | CR written; understanding confirmed back; codebase surveyed | **DONE** | 2026-10-01 |
| 0b | Founder's responses recorded (§1b) | **DONE** | 2026-10-01 |
| P0 | Rename to "Assessment" everywhere + persona cards and headline | **BUILT and VERIFIED in dev (uncommitted)** — `/assessment` (308 from `/free-certifications` and `/free-learning/knowledge-check`), three persona cards (card 1 live, 2–3 "Coming soon"), persona-neutral headline, labels renamed in nav/Home/admin/docs, `DR-07_ASSESSMENT_PERSONAS.md` | 2026-10-01 |
| P1 | Organisation Dashboard menu item + footer links in the burger menu | **BUILT and VERIFIED in dev (uncommitted)** — `isOrganisationUser`, menu item (desktop + mobile), role-gated `/organisation` shell, every footer link in the burger menu | 2026-10-01 |
| P2 | Prepare for Interview (Data Engineer, AI Engineer; 100 questions each) | **BUILT and VERIFIED in dev (uncommitted)** — schema + domain layer, `/assessment/interview` (role cards, intro, test, result with model answers), admin Interview roles, seed (Data Engineer + AI Engineer, 100 draft questions each), `interview:approve-all` | 2026-10-01 |
| P3 | Organisation foundation (record, role grant, dashboard shell, YPT) | **BUILT and VERIFIED in dev (uncommitted)** — `organisations`, Organisation role in Admin → Users, Admin → Organisations, YPT seeded | 2026-10-01 |
| P4 | Organisation Interview Screening | **BUILT and VERIFIED in dev (uncommitted)** — `/assessment/organisations` → role cards → test with the organisation's questions + consent; Organisation Dashboard tabs; approval queue | 2026-10-01 |
| P5 | Free LLM | **ON HOLD** | 2026-10-01 |
| P6 | Docs, DR-07, legal drafts, close-out | **PARTLY DONE** — DR-07 extended (§4); Terms/Privacy drafts updated and re-versioned `DRAFT-2026-10-01`; still to do at deploy: show the migration SQL, FAQ/help text if wanted | 2026-10-01 |

## 8. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-01 17:11 | CR created on the founder's request ("let me know if you understand … and make a new CR file"). Understanding restated (§2); codebase surveyed — roles (`org_admin` role and `organisation` scope already exist but no organisations table), no role-based question banks, the account menu's three dashboard items, the 2 GB / no-GPU server; 14 questions raised with recommendations (§4); free-LLM options sketched (§5). **No code changed.** Waiting for the founder's answers and a "go" on P0/P1. |
| 2026-10-01 | **Founder's responses received and recorded (§1b):** rename "Free Certifications" → "Assessment" everywhere; Prepare for Interview starts with 100 questions per role, each with a detailed interview-style model answer, roles Data Engineer + AI Engineer; Organisation screening becomes persona card → registered Companies/Education cards → organisation's role cards → test, YPT first with the same two roles, and each organisation's dashboard gets a tab to add a role and its questions and answers; I generate the starting questions from public best practice (original wording, cited, loaded as drafts for review); free LLM on hold; all other recommendations accepted. Assumptions X1–X6 written down for confirmation. Phases revised (P5 on hold). **No code changed — the founder asked me to update the CR and ask approval to go ahead.** |
| 2026-10-01 | **"go ahead" — P0 and P1 built.** Route moved to `/assessment` with 308s from the old paths; labels renamed everywhere users or admins read them (history comments left); three persona cards with the persona-neutral headline; Organisation role helper + menu item + role-gated `/organisation` shell (moved inside the public layout so it has the header/footer); burger menu carries all footer links; `DR-07` written. **Tests:** new `tests/e2e/assessment.spec.ts` (5: redirects + no "Free Certification" text, persona cards, a11y light/dark + no overflow at 375/768/1280, burger footer links, Organisation menu/role gate) and `tests/unit/organisation-role.test.ts`; existing specs updated for the rename. Screenshots reviewed (page + burger). Assumption **X1** (URL renamed) applied — founder said "everywhere". Next: full regression, then the founder's word to commit/deploy; P2–P4 need schema SQL approval first. |
| 2026-10-02 (overnight) | **Founder: *"re-run the gate, commit, push … deploy in production; move new questions bank to production"*** — gate PASSED on the committed tree (tsc · Vitest 717/717 · build · Playwright 171/171 on the production build); **committed `401f642`, pushed to origin/main; tag `v2026.10.01-2` proven by `release.yml`; audit GO (0 warnings)**. The promotion itself was refused by the assistant's harness (unattended production deploy — a permission boundary, honoured). **Remaining, the founder's hand:** `deploy/start.sh --env production --tag v2026.10.01-2`, then on the server `npm run db:seed` and `npm run interview:approve-all -- <admin email>` (per `PROJECT_STATUS.md`'s 2026-10-02 entry, commands written out). |
| 2026-10-01 (night) | **Founder: *"please go ahead for schema I approve. Please implement phase P2-P4."*** — explicit Rule-1 approval of the P2–P4 schema (migration `20261001095148_interview_assessment_and_organisations`, shown to him in full: 6 additive tables — `organisations`, `assessment_roles`, `organisation_roles`, `role_questions`, `role_question_options`, `role_test_attempts` — 2 enums, no existing table touched). State confirmed on disk: migration applied to **dev and test** (`prisma migrate status`: both up to date, 20/20); `src/modules/assessment/` domain layer present; `/assessment` shows all three personas live, `/assessment/interview` both roles at 100 questions · 90 min · model answers, `/assessment/organisations` shows YPT (2 roles) with the consent sentence. The outstanding **full production-build release-gate run** started (`deploy/04-release-gate.sh`). Production untouched; deploy still needs the founder's explicit word. ⚠ Note for production: role questions deploy as **drafts** — the founder bulk-approves (same `interview:approve-all` pattern as the 3,830 topic questions) or reviews them in Admin → Interview roles. |
| 2026-10-01 | **"implement all the requirements before we implement to production" — P2, P3 and P4 BUILT in dev.** Parallel agents: (1) schema + domain layer (migration `20261001095148_interview_assessment_and_organisations`, `src/modules/assessment/`), (2) 100 Data Engineer + (3) 100 AI Engineer original questions with model answers (sources cited, drafts), (4) candidate pages, (5) Organisation dashboard, (6) admin screens + seed + approve-all script. Main session: integration, fixes (a test-parsing slip, slow-registration timeout, an awkward sentence), legal drafts, DR-07 §4, visual checks. **Verification:** tsc clean · Vitest 70 files / 700 · new browser specs pass (interview 5, organisations 5, dashboard 9, admin interview 9, admin organisations 9, assessment 5) — full production-build run to follow. **Not deployed; founder to see the migration SQL first.** Free LLM remains on hold. |
