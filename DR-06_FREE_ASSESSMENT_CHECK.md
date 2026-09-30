# DECISION RECORD DR-06 — THE FREE ASSESSMENT CHECK (200 QUESTIONS, 3 HOURS, GRADED CERTIFICATES)

**Status:** Approved by the founder, 2026-09-30 (change round M16, recorded in `modification.md` §0b/§0c: *"We still give free attempt for certification … remove the three buttons of 50, 100, 200 … We only want to keep 200 questions … add the time of 3 hours … three kind of certificate … Charlie / Bravo / Alpha"*; every assumption confirmed the same day). **Amends DR-03 §2.4 and §3 (sizes and pass mark) and builds on DR-05.** DR-01 is **unchanged** (§4). **DR-04 is unchanged** — the page and menu name stay "Free Certifications", at the same URL `/free-certifications`.

## 1. Why

DR-03 defined a free Knowledge Check of 50, 100 or 200 questions with a 70 % pass mark and no time limit; DR-05 let a *passed* one issue a "Certificate of Achievement". The founder now wants the free attempt to be a single, more rigorous assessment with graded outcomes.

## 2. The decision

1. **Name.** Everywhere a person or administrator reads it, the free attempt is **"The Free Assessment Check"** (was "the free Knowledge Check"). Internal names — database tables, code modules, and the `KC-` ID prefix — are **not** renamed (IDs already shared must keep verifying).
2. **One test.** **200 questions**, drawn at random from the whole reviewed question bank (3,800+) — a **fresh draw for every attempt and every person**. The 50 and 100-question options are retired.
3. **Time.** **Three hours** from the start, enforced by the server (deadline = start + 3 h; nothing stored for it). When time is up the attempt is **scored automatically as it stands** (unanswered = wrong). There is no "unfinished test" concept: a person has at most one running test, and otherwise only finished results ("Your results").
4. **Pass mark and grades.** A new attempt **passes at 60 %**. The percentage is rounded **down** to a whole number and banded:

   | Grade | Percentage | Correct answers (of 200) |
   |---|---|---|
   | **Charlie** | 60–70 % | 120–141 |
   | **Bravo** | 71–80 % | 142–161 |
   | **Alpha** | 81–100 % | 162–200 |
   | *(not passed)* | below 60 % | 0–119 |

   The grade is **derived** from the score and never stored.
5. **The certificate.** A passed Free Assessment Check earns the **Certificate of Achievement** (DR-05) with a prominent **grade line** ("Grade: ALPHA · 81–100 %"). It is valid one year from the pass date, can be revoked by an administrator, is verifiable at `/verify/<ID>` with the grade shown, and is **still not** a Certificate of Completion or the Academy's earned credential (DR-01, DR-05 §2.3).
6. **Cost.** The **attempt stays free.** Viewing, printing and downloading the certificate remains behind the existing gate (a Free Learning review plus the unlock fee — USD 10 by default, Pakistan exempt, switchable by an administrator). Nothing about the fee changes.
7. **Existing results.** Results already issued (sizes 50/100/200, 70 % mark, no grade) **stay exactly as issued and verifiable**; they are not re-graded, hidden or deleted. The new rules apply to 200-question attempts.
8. **HRD wording (same round).** Wherever the portal mentions HRD Corp it now says: *"HRD Corp claims are for Malaysian citizens and are normally made through an employer registered with HRD Corp."* (`HRD_CLAIM_NOTE`, `src/content/hrd-corp.ts`). The rule that no course or organisation may be called "HRD Corp Claimable / Registered" unless it holds that status is unchanged.

## 3. Superseded statements

| Document | Location | Statement | Status under DR-06 |
|---|---|---|---|
| `DR-03` | §2.4 | the Knowledge Check offers 50, 100 or 200 questions, no time limit | **Superseded** — one 200-question test with a 3-hour limit (§2.2–2.3) |
| `DR-03` | §2.4 / §3 | pass mark 70 % | **Superseded for new attempts** — 60 %, with grades (§2.4); issued results keep their mark (§2.7) |
| `DR-03` / `DR-05` | wording | "the free Knowledge Check" / "Knowledge Check result" | **Renamed** in visible wording to "Free Assessment Check" (§2.1) |
| `DR-05` | §2.4 | valid one year, revocable, Valid / Expired / Revoked | **Unchanged** — the grade is added to the certificate and verify page |
| `DR-04` | all | "Free Certifications" as the page / menu name | **Unchanged** |

## 4. What DR-01 still means (unchanged)

The Academy issues **one credential**: the Certificate of Completion, earned by attending an expert-led training. The Free Assessment Check certificates — Charlie, Bravo and Alpha alike — record a passed self-administered online assessment and say so on their face.

## 5. Not decided here

- Renewal of an expired Certificate of Achievement (still not built — it lapses; a new attempt is free).
- Whether the credential-integrity policy (not yet written) should describe the grades.
- A "do not repeat questions you saw recently" fairness rule — not added; every attempt is an independent random draw.
