# Certificate of Completion — Polished Requirement, Open Decisions & Build Record

> **Status: REQUIREMENTS RECORD — authorises nothing.** Created 2026-09-20.
> It does not approve a decision, resolve an open question, change the data
> model, or authorise backend work. Backend work remains subject to the
> execution gate in [`README.md`](README.md) and every RED gate in `CLAUDE.md`.
>
> **What is founder-specified and what is not.** Only §1 is the founder's.
> Everything in §3–§5 is a **PROPOSED** refinement written to best practice —
> rule 8 of `CLAUDE.md` forbids inventing business rules silently, so each
> proposal is marked and every material one appears in §6 as a decision.
> The wireframe (§8) implements the proposals so they can be *seen*; seeing
> them is not approving them.

---

## 1. The original requirement (verbatim, 2026-09-20)

> Once user completes a training, we need to give user a Training Completion
> Certification with a unique ID which expires every year and to keep the ID
> active, user need to pay USD10 every year. This amount can change at later
> stage.
>
> Please show user certificate as well.
>
> Then we need a page where anyone can come and search anyone who has complete
> the training with. Search should be able to be done by user name or unique ID
> of the certificate.
>
> We should generate a unique URL for user certificate so when someone clicks
> that it should show user certificate and active and expire status as well.
>
> Please polish this requirement as per the best practices and implement the
> new requirements.

## 2. Polished statement

> When a participant **completes** the Academy's training programme, the
> Academy issues them a **Certificate of Completion** carrying a **unique,
> non-guessable ID** and its own **public verification web address**. The
> certificate is **active for 12 months**; the holder keeps it active by
> **renewing it each year for a fee, currently USD 10, which the Academy can
> change**. **Anyone** can verify a certificate — by its ID or its address —
> and see the holder's name, the programme, the dates, and whether it is
> **Active** or **Expired**. Anyone can also **search by name**, limited to
> holders who have **agreed to be listed**. The holder can **view, print and
> share** the certificate.

### Glossary
| Term | Meaning |
|---|---|
| **Certificate of Completion** | A record that a person completed the programme. **Not** the Academy's earned credential (see §6 D1) |
| **Certificate ID** | Human-readable unique identifier, e.g. `DAA-2026-K7QM-4XH9` |
| **Verification URL** | `/verify/<Certificate ID>` — public, permanent, shareable |
| **Active** | Today is on or before the expiry date |
| **Renewal due** | Active, and within the renewal window of expiry (still Active) |
| **Expired** | Today is after the expiry date. The completion remains on record |
| **Listed** | The holder has agreed to appear in public **name** search |

---

## 3. Requirements (PROPOSED — MoSCoW)

### 3.1 Issuance
| ID | Requirement | Pri |
|---|---|---|
| R-I1 | A certificate is issued **by the system when completion is recorded** by an authorised person (trainer/admin). The holder cannot request or self-issue one | Must |
| R-I2 | "Completion" has a **defined, recorded criterion** (§6 D2). Attendance alone must not be recorded as completion unless D2 says so | Must |
| R-I3 | Issuance is **idempotent**: one certificate per completed registration; a retry never creates a duplicate ID | Must |
| R-I4 | The certificate is issued with an **initial 12-month validity included** in the programme fee (§6 D5) | Should |
| R-I5 | The holder is notified when their certificate is issued (email — needs `ADR-015`) | Should |

### 3.2 Identifier and URL
| ID | Requirement | Pri |
|---|---|---|
| R-D1 | Format `DAA-YYYY-XXXX-XXXX`; the 8 random characters come from a **31-symbol alphabet with look-alikes removed** (no `0/O`, `1/I/L`) | Must |
| R-D2 | Generated **server-side from a cryptographically secure source**; **not sequential**; **unique** (enforced by a database constraint, not by hope); ≈ 8.5 × 10¹¹ combinations | Must |
| R-D3 | An ID is **never reused or reassigned**, including after expiry or deletion | Must |
| R-D4 | The verification URL is `/verify/<ID>`; because the ID is unguessable, the URL is safe to make public and cannot be enumerated | Must |
| R-D5 | The ID **stays the same across renewals** — renewal "keeps the ID active", it does not issue a new one | Must |
| R-D6 | The ID format includes a **check character** or is otherwise typo-detectable, so a mistyped ID is reported as "not a valid ID" rather than looked up (**optional refinement**) | Could |
| R-D7 | Certificate pages carry `noindex` — reached from a link the holder chose to share, not discovered via search engines | Should |

### 3.3 Lifecycle and renewal
| ID | Requirement | Pri |
|---|---|---|
| R-L1 | Status is **computed from stored dates at request time** (`expires_on` vs today), **not** by a background job flipping a flag — restart-proof and correct by construction (`CLAUDE.md` Service Restart Test) | Must |
| R-L2 | Expiry is **inclusive**: active through the expiry date, expired the next day. Compared as **calendar dates in one stated timezone** (§6 D9) | Must |
| R-L3 | **Renewal window** opens 30 days before expiry and stays open after it lapses (§6 D6). While open, status shows "Active · renewal due" | Should |
| R-L4 | Renewal adds **12 months**. If renewed on time, from the **old expiry** (no paid time lost); if lapsed, from **the renewal date** (§6 D7) | Should |
| R-L5 | An expired certificate remains **verifiable as Expired** — it shows that the holder completed the programme and that the certificate is **not currently active** (§6 D8) | Must |
| R-L6 | Renewal is **manual** by default; **auto-renewal** requires explicit holder consent and stored payment details, and is out of scope until decided (§6 D10) | Should |
| R-L7 | Reminders before expiry (e.g. 30 and 7 days) and on lapse; scheduled, **persisted** and **idempotent** so a restart neither drops nor duplicates them | Should |
| R-L8 | Revocation (misconduct, issuance error) is a **distinct state from Expired**, with reason, actor and audit (§6 D11) | Should |

### 3.4 Fee
| ID | Requirement | Pri |
|---|---|---|
| R-F1 | The renewal fee is **administrator-managed configuration in the database — not a constant in code** | Must |
| R-F2 | Fee changes are **effective-dated**: a change applies to renewals made after it takes effect, never retroactively | Must |
| R-F3 | Every renewal records the **amount, currency and fee-setting version actually charged** | Must |
| R-F4 | The holder sees the **exact amount before paying**; the amount charged is the one shown | Must |
| R-F5 | The amount is **set by the server**, never taken from the browser | Must |
| R-F6 | Fee changes are audited (who, when, old → new) | Must |
| R-F7 | Currency: the founder specified **USD 10**. Whether holders can pay in local currencies is undecided (§6 D5) | — |

### 3.5 Verification page (`/verify/<ID>`)
| ID | Requirement | Pri |
|---|---|---|
| R-V1 | Shows the certificate, holder name, programme, format, completion date, issue date, **expiry date**, and a prominent **Active / Renewal due / Expired** status stated in words and an icon, **never colour alone** | Must |
| R-V2 | **Data minimisation:** nothing else — no email, phone, country, payment, order, address or ID document, ever | Must |
| R-V3 | Status is **live**: responses are not cached beyond a short TTL, so a renewed certificate does not appear expired and vice-versa | Must |
| R-V4 | An unknown ID returns a neutral "no certificate found" with a real 404 status | Must |
| R-V5 | States it records completion and is **not the earned credential**; a printed copy may be out of date | Must |
| R-V6 | Works without an account, on mobile, and with a screen reader | Must |
| R-V7 | A "Copy link" action and a print / save-as-PDF view of the certificate | Should |
| R-V8 | A QR code on the certificate encoding the verification URL (needs a library or server rendering — RED gate) | Could |

### 3.6 Public search
| ID | Requirement | Pri |
|---|---|---|
| R-S1 | **By ID:** exact match (case-, space- and hyphen-insensitive). Finds the certificate whether or not the holder is listed | Must |
| R-S2 | **By name:** returns **only listed** holders; every query word must match the **start of a word** in the name; case- and accent-insensitive | Must |
| R-S3 | **Minimum 3 characters** for a name search; results **capped at 10** with a "narrow your search" hint | Must |
| R-S4 | The page **cannot be used to list or export everyone**: no browse-all, no wildcard, no pagination past the cap | Must |
| R-S5 | "No results" **never reveals** whether an unlisted holder exists | Must |
| R-S6 | **Rate-limited** per client, with abuse monitoring; bot protection if abused | Must |
| R-S7 | Results show name, programme, format, completion date, ID, **status** — nothing more | Must |
| R-S8 | **Same-name holders** are distinguishable by programme, completion date and ID | Must |

### 3.7 Holder controls
| ID | Requirement | Pri |
|---|---|---|
| R-H1 | Holder sees their certificate, live status, expiry, renewal history and the fee | Must |
| R-H2 | **Listing consent:** a clear, revocable choice to appear in public name search, with the effect explained. Consent is **recorded** (who, what wording, when) | Must |
| R-H3 | Turning listing **off** takes effect immediately for name search; the ID/URL keeps working for whoever the holder shared it with | Must |
| R-H4 | Print / save as PDF; copy verification link | Should |
| R-H5 | Renew from the account (§3.3), by card and the other methods per `ACCOUNT_AND_PAYMENT_REQUIREMENTS.md` A9 | Must |
| R-H6 | Correction request for a wrong name (§6 D12) | Should |

### 3.8 Cross-cutting
| ID | Requirement | Pri |
|---|---|---|
| R-X1 | **Audit** every issuance, renewal, listing change, revocation and fee change (`ADR-022`) | Must |
| R-X2 | **PDPA:** lawful basis, notice, and holder rights (access, correction, withdrawal) defined in the Privacy policy before any personal data is published | Must |
| R-X3 | Accessible (WCAG 2.2 AA), responsive to 320px, keyboard-operable | Must |
| R-X4 | Security review; no personal data in logs or URLs other than the ID | Must |

---

## 4. Verified logic (tested in the wireframe)

The pure rules live in `project-artifacts/mockup/lib/certificates.ts` with no
React, storage or clock dependence, so they lift into the backend unchanged.
They were verified with **42 assertions** (Node, 2026-09-20), including:

| Rule | Cases |
|---|---|
| Month arithmetic | 31 Jan + 1 month → 28 Feb (29 in leap years); 29 Feb + 12 months → 28 Feb; ± 12 months round-trips |
| Status boundaries | 31 days left → Active; 30 left → Renewal due; **expires today → still valid**; expired yesterday → Expired; time of day irrelevant |
| Renewal | Not allowed > 30 days early; allowed in window and when expired; on-time renewal extends from the old expiry; lapsed renewal extends from today |
| ID handling | Canonicalises lowercase / spaces / missing hyphens; rejects short IDs and names; alphabet has no look-alikes and 31 symbols |
| Search | Prefix match; case-, accent- and word-order-insensitive; mid-word does not match; **unlisted holder is invisible to name search but found by exact ID**; no partial-ID matching; result cap and truncation flag |

**No test framework exists in the mockup** and adding one is a dependency
decision. The backend build must carry these cases into its own suite
(`TESTING_ARCHITECTURE.md`, Vitest already approved at repository level).

---

## 5. Search and privacy design

```
Input ──▶ looks like an ID? ──yes──▶ EXACT lookup (listed or not) ──▶ 0 or 1 result
                │
                no
                ▼
          ≥ 3 characters? ──no──▶ "Enter at least 3 characters"
                │
               yes
                ▼
   LISTED holders only · every query word is a word-prefix · cap 10
```

Why this shape, in one line each: an **ID is a bearer secret** the holder
chose to share, so it always works; a **name is not**, so name search needs the
holder's consent; the **cap, minimum length and rate limit** stop the page
being a scraping tool; the **neutral "no result"** stops it confirming that a
named person did or did not train.

Publishing names of people who completed a programme is **processing personal
data**. This is why R-X2 makes the Privacy policy (`B2` in
`ACCOUNT_AND_PAYMENT_REQUIREMENTS.md`, unwritten) a **prerequisite**, not a
follow-up.

---

## 6. Decisions the founder needs to make

Each has a recommendation. **None is decided.** The wireframe shows the
recommendation so it can be reacted to.

| # | Decision | Recommendation | Why it matters |
|---|---|---|---|
| **D1** | **Name and positioning.** The founder wrote "Training Completion **Certification**". "Certification" collides with the **earned credential** (`DR-01` one credential; `DR-02` §6 *explicitly rejects* "attend training → receive certificate" as the credential; `OQ-21`). Is this the same artefact as the existing "**Certificate of participation**" (the source site's wording) or a new one? | Call it **Certificate of Completion**; state on the document and the verification page that it is **not** the earned credential; **replace** "certificate of participation" with it rather than keeping two similar artefacts. Certification itself is paused (founder, 2026-09-06) | Prevents the trust product's core claim being diluted by a lookalike |
| **D2** | **What counts as "completed"** and who records it: all sessions attended? a minimum percentage? trainer sign-off? a short assessment? | Trainer records completion against a stated attendance rule; **no** self-declaration | This is the gate to issuance; ambiguity here is the ambiguity `DR-02` §6 warned about |
| **D3** | **Listing consent model:** opt-in vs opt-out; when asked (registration or issue); what is shown | **Opt-in at issue**, revocable; show name, programme, dates, status only. The wireframe defaults the toggle **on** because the founder wants a directory — that default is *not* recommended for production | PDPA. Opt-out publication of names is the highest-risk choice |
| **D4** | **Name-search rules:** minimum length, cap, rate limit; same-name handling | As §3.6 | Anti-scraping and anti-harassment |
| **D5** | **The fee:** USD 10 fixed, or local currency? Is **year 1 included** in the programme price? Who can change it; does a change affect existing holders at their next renewal (recommended) or only new certificates? **Is USD 10 economic** after payment-processing fees and tax? | Year 1 **included**; fee **admin-configured, effective-dated**, applying at the holder's **next renewal**; **check processing fees** — a fixed per-transaction fee is a large share of USD 10 | Revenue model; Stripe fees are not negligible at this amount — verify against current Stripe pricing before committing |
| **D6** | **Renewal window and grace:** 30 days before expiry? any grace after? can a long-lapsed certificate still renew? | Window 30 days before; **no grace**; renewable **at any time** after lapse | Fairness vs revenue |
| **D7** | **Renewal date arithmetic** | On-time → extend from **old expiry**; lapsed → from **renewal date** | Whether early renewers lose paid time |
| **D8** | **What an expired certificate shows** | Remains verifiable as **Expired**; completion retained; **not deleted** | An employer checking an old certificate should learn the truth, not get "not found" |
| **D9** | **Timezone** for "the expiry date" | One stated zone (Malaysia, `MYT`), shown on the page | A date boundary means different days in different places |
| **D10** | **Manual vs auto-renew**; refund of renewals; consumer-protection review of "pay to keep active" | **Manual** with reminders; auto-renew only with explicit consent; take legal advice on the pay-to-stay-active model and on refunds | Consumer law; reputational risk if a lapse feels punitive |
| **D11** | **Revocation** (fraud, error, misconduct): not requested | Add it — a separate state from Expired, with reason and audit; tie to the credential-integrity policy | A public verification page without revocation cannot correct a wrong |
| **D12** | **Wrong-name corrections / reissue / lost** | Correction by request with identity check; same ID retained; audited | Legal-name accuracy |
| **D13** | **Who else may see status** (employers via the corporate dashboard `O01`, HRD Corp evidence `O10`) | Later; out of scope now | Corporate value; reuse of the same verification data |
| **D14** | **Certificate design & issuer identity:** wording, trainer name/title, signatory, logo, **legal issuer name**. "Data & AI Academy" is a **working placeholder name** (`HO-4`) | Approve wording; add the legal entity when known (`B4`); update when the brand is decided | A certificate is a formal document |
| **D15** | **QR code and PDF:** need an encoder library or server rendering | Server-side rendering at issue time; needs approval as a **new dependency/service** (RED) | Print/PDF works today via the browser; QR does not |

---

## 7. Architecture and data implications (conceptual — NOT a schema)

Physical data-model change is a **RED gate** (`CLAUDE.md` Rule 1); nothing
below authorises a table. It lists what the design will need so nothing is
missed:

- **Certificate** — ID (unique), holder link, programme/registration link,
  completion date, issued date, current `expires_on`, status inputs
  (revoked flag/reason), created/updated.
- **Renewal** — certificate, date, amount, currency, **fee-setting version**,
  payment reference, previous and new expiry. **Insert-only** (`ADR-022`).
- **Fee setting** — amount, currency, `effective_from`; history retained.
- **Listing consent** — holder, granted/withdrawn, wording version, timestamp.
- **Notification log** — so reminders are not duplicated or lost on restart.
- **Programme registration** must already exist (see
  `ACCOUNT_AND_PAYMENT_REQUIREMENTS.md` C2) — a certificate belongs to a
  completed registration.

**Payment reuse.** A renewal is a payment like any other in
`ACCOUNT_AND_PAYMENT_REQUIREMENTS.md`: **server-set amount; Stripe payment
confirmed by a signature-verified, idempotent webhook (C4); the certificate's
expiry is extended only by that webhook (C3)** — never by the browser or the
return redirect. Payment states, refunds, receipts and tax (C14, C19, A11, B5)
apply. Renewal is charged in **USD 10 regardless of the currency the holder paid
the programme in** unless D5 says otherwise, which makes multi-currency
handling (C12) relevant here too.

**Expiry needs no job.** Status is computed on read (R-L1). Only **reminders**
need a scheduled job.

**Caching.** Verification responses must be short-lived (R-V3) — a CDN caching
"Expired" for a day after renewal would be a visible defect.

---

## 8. What the wireframe built (2026-09-20) — and what to delete or replace

Routes: `/verify` (public search), `/verify/[id]` (certificate + live status),
`/account/certificate` (holder view, print, share, listing consent, renewal,
demo tools), `/account/certificate/renew` (simulated payment). Footer gains a
"Verify a certificate" link; the account nav, menu, dashboard and participation
page gain the certificate.

**Sample-only, and labelled:** every certificate is invented (names "Alex
Sample" etc.; IDs containing `0`/`1` that the real alphabet never produces, so
they **cannot** collide with or pass as real IDs); a diagonal **SAMPLE**
watermark on each; a banner on every public page; dates are **relative to
today** so the "renewal due" and "expired" examples never drift. A fabricated
public list of "people who completed the training" would be fake social proof
if unlabelled — hence the strictness.

| Wireframe artefact | What it fakes | Replaced by |
|---|---|---|
| `data/certificates.ts` (sample registry, `DEMO_CERT_ID`) | The public registry | The database; server-side search (R-S*) |
| `lib/demoCertificate.ts` | Issuing a certificate, "a year passing", and a renewal — all in `sessionStorage` | Server-issued on recorded completion (R-I1); expiry computed from dates (R-L1); renewal only from a verified webhook (C3/C4) |
| Demo tools panel & "Simulate completing the programme" (`CertificateView.tsx`) | Completion and the clock | Removed |
| `RenewFlow.tsx` `pay()` | A simulated renewal payment | Server-created payment + webhook |
| `components/certificates/records.ts` `useRegistry` | Client-side search over sample data | A server search endpoint, rate-limited |
| `verificationUrl()` | Builds the URL in the browser | Server-known canonical URL |
| Static `generateStaticParams` for `/verify/[id]` | Pre-builds only known IDs | A dynamic route resolving any ID at request time |
| `data/certificateConfig.ts` (`RENEWAL_FEE`, window, validity) | The fee as a constant | Admin-managed, effective-dated setting (R-F1/F2) |
| QR placeholder in `CertificateDocument.tsx` | A missing QR | Real QR (R-V8, D15) |
| Listing toggle defaulting **on** | The founder's "everyone searchable" | Opt-in consent, recorded (D3, R-H2) |

**Reusable as-is:** `lib/certificates.ts` (the tested rules), the certificate
document design, the verification and search screens' structure and copy, the
status chip, and the print stylesheet.

## 9. Test checklist for the real build

- Every case in §4, in the backend suite.
- **Boundary:** a certificate is Active on its expiry date and Expired the next
  day, in the stated timezone, across a DST-free zone and at midnight.
- **Concurrency:** two renewals at once → one extension per paid webhook;
  a replayed webhook does not extend twice.
- **Fee change:** a change made today does not alter a renewal already in
  progress at yesterday's price; the recorded amount equals the amount shown.
- **Tampering:** a browser-supplied amount/currency is ignored.
- **Privacy:** an unlisted holder is unreachable by name in every code path
  (including error messages and response timing); response bodies contain no
  field outside R-V2.
- **Enumeration:** brute-force ID guessing is rate-limited and detected.
- **Cache:** renewal is reflected on the verification page within the stated TTL.
- **Restart:** kill and restart all services; certificates, statuses and
  pending reminders survive (`CLAUDE.md` Service Restart Test).
- **Accessibility and mobile:** verification and search at 320px; status not by
  colour alone; keyboard and screen-reader pass.

## 10. Relationship to other records

- [`BACKEND_HANDOFF_INDEX.md`](BACKEND_HANDOFF_INDEX.md) — the master map of every wireframe screen and simulation.
- `ACCOUNT_AND_PAYMENT_REQUIREMENTS.md` — the payment, auth, email and
  legal-document dependencies this feature inherits (A1–A12, B1–B6, C1–C22).
- `DR-01`, `DR-02` §6, `OQ-21`, `ADR-018` — the **earned credential** and its
  own (deferred) public verification page. **This certificate must not be
  built into that surface or described as that credential.**
- `ADR-014` — Stripe. `ADR-022` — audit/immutability. `ADR-006` — auth.
- `project-artifacts/mockup/docs/SITE_PAGES.md` and `MOCK_DATA_REGISTER.md` —
  what the wireframe shows and what is faked.
