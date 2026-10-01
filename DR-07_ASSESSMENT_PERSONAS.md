# DECISION RECORD DR-07 — "ASSESSMENT": THE RENAMED PAGE AND ITS THREE PERSONAS

**Status:** Approved by the founder, 2026-10-01 (change request `CR/CR-2026-10-01-1711-personas-interview-prep-and-organisation-screening.md`: *"Pelase also cahnge Free Certifications name to Assessment everywehre"*, the persona cards, and "go ahead"). **Supersedes DR-04** (which permitted "Free Certifications" as the page and menu name). DR-01 is **unchanged**. Built in **dev** (not yet deployed): P0 and P1 (§1) and P2–P4 (§4).

## 1. The decision

1. **Name.** The page and menu item formerly called **"Free Certifications"** are now **"Assessment"** — header, footer, mobile menu, the Home card, search, admin labels, documents. The address moved with it: **`/assessment`**; `/free-certifications` and the retired `/free-learning/knowledge-check` redirect there permanently (308), so shared links keep working.
2. **Three personas.** The page is a gateway with one card per persona and a persona-neutral headline ("Test yourself. Prepare. Screen."):
   - **Assess your Data Foundation** (*for learners*) — the Free Assessment Check of DR-06, unchanged.
   - **Prepare for Interview** (*for job seekers*) — per-role interview self-assessment (§4.1); live from P2.
   - **Organisations — Interview Screening** (*for organisations*) — screening for companies and education institutions (§4.2); live from P4.
3. **Organisation role.** The existing `org_admin` role is shown as **"Organisation"**. People holding it (in any scope) see an **Organisation Dashboard** item in the account menu (desktop and mobile) pointing at `/organisation`, a role-gated page that is a **shell** until the organisation phases are built. The role is granted by an administrator, like Trainer (the Admin → Users grant action arrives with P3).
4. **Burger menu.** Every footer link (Explore list, "Search completion certificates", and the legal links) is also in the header's burger (mobile) menu; the footer keeps them.

## 4. P2–P4: role tests, organisations and the Organisation role (founder, 2026-10-01: *"implement all the requirements before we implement to production"*)

1. **Prepare for Interview** (`/assessment/interview`): one card per **published shared role** — **Data Engineer** and **AI Engineer** first. A role's bank starts at **100 original multiple-choice questions**, each with a **detailed model answer written the way a strong candidate would answer in an interview**; a test draws **up to 100 at random** (fresh every attempt), **90 minutes** (server-enforced, auto-scored at the deadline), **free, account required, no certificate, no pass mark**; the result shows the score, a per-topic breakdown and **every question with the correct answer and the model answer**. Only questions an administrator has marked **reviewed** are ever served. Starting content was written from public best-practice sources (cited in `prisma/seed-data/interview-questions/*.json`) in original wording and is loaded as **drafts**; **nothing is approved automatically** — `npm run interview:approve-all` (operator script) or Admin → Interview roles approves them, on the founder's instruction.
2. **Organisation screening** (`/assessment/organisations`): cards of **published organisations** (**Company** or **Education sector**) → an organisation's role cards → the test. A screening test = **all of that organisation's approved questions for the role (up to 20) + random shared-bank questions up to 100**, shuffled; the candidate must **confirm before starting that the result is shared with that organisation**; the organisation sees only its own candidates (name, email, role, score, time). First organisation: **YPT (Your Partner Technologies)** with the same two roles.
3. **Organisation role and dashboard.** The `org_admin` role is shown as **"Organisation"**, granted in **Admin → Users** like Trainer. `/organisation` has the tabs **Overview · Roles** (add a role from the catalogue or create the organisation's own — listed only with ≥ 10 approved questions) **· Questions** (add/edit questions and answers; **every organisation question is pending until an administrator approves it**; editing an approved question returns it to pending) **· Results** (candidates per role, CSV export). Admin: **Interview roles**, **Organisations**, an **approval queue**.
4. **Data.** Additive migration `20261001095148_interview_assessment_and_organisations` (6 tables, 2 enums; no drops). **Shown to the founder before production**; applied to dev and test only so far.
5. **Privacy and terms.** The Terms and Privacy drafts now cover interview assessments and the sharing of results with an organisation after the candidate's confirmation (version `DRAFT-2026-10-01`).
6. **On hold (founder):** résumé/job-description scoring with a free LLM — nothing built, no résumé or JD storage.

## 2. What does not change

DR-05 (the Certificate of Achievement), DR-06 (the Free Assessment Check: 200 questions, 3 hours, grades Charlie/Bravo/Alpha, 60 % pass mark, free attempt) and the certificate gate; the `KC-` ID prefix; the running-test URL `/free-learning/knowledge-check/<id>`.

## 3. Superseded statements

| Document | Location | Statement | Status under DR-07 |
|---|---|---|---|
| `DR-04` | §2.1 | "Free Certifications" is the page / menu name for the free product line | **Superseded** — the name is "Assessment" (§1.1) |
| `DR-06` | header | "the page and menu name stay 'Free Certifications' at `/free-certifications`" | **Superseded by DR-07 §1.1** (name and address); the rest of DR-06 stands |
