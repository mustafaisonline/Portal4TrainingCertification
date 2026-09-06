# HRD Corp — context, evidence and boundaries

**Established 2026-09-06**, by founder direction, alongside `/hrd-corp`,
`data/hrdCorp.ts`, and `Practitioner.hrdCorpAccreditation` in
`data/practitioners.ts`. The homepage hero mark (`components/HrdCorpBadge.tsx`,
a standalone component) was superseded the same day by a floating card built
directly into `components/HomeHero.tsx` — see its header comment.

This file is the research trail for all of it — what HRD Corp is, what
evidence this project holds, what HRD Corp's own rules permit, and exactly
what the portal does and does not claim as a result.

---

## 1. What HRD Corp is

**Pembangunan Sumber Manusia Berhad (HRD Corp)** is a Malaysian government
agency under the **Ministry of Human Resources**. It administers workforce
training through levy-based funding — registered employers pay a levy, and
can claim back the cost of approved training for their staff. Source:
[hrdcorp.gov.my](https://hrdcorp.gov.my/).

Three schemes relevant here (source: hrdcorp.gov.my):

- **HRD Corp Claimable Course** — the main employer-training-cost scheme.
- **Training Facilities & Renovation (ALAT)** — funds training-room setup.
- **Industrial Training Scheme (ITS)** — financial assistance for
  undergraduate trainees.

## 2. Three distinct statuses — never blur them

| Status | Level | Held? |
|---|---|---|
| **HRD Corp Accredited Trainer** | Individual (the trainer) | **Yes** — Mustafa Qizilbash |
| **HRD Corp Registered Training Provider** | Organisation | **No** — application in progress |
| **HRD Corp Claimable** | Per course | **No** — no course is registered |

This is not a simplification for the portal; it is how HRD Corp itself
structures the scheme (source: hrdcorp.gov.my/training-providers/):

- **Registered Training Provider.** A company/organisation registered with
  SSM or ROS (Berhad/Sdn Bhd, LLP, sole proprietor, association, or
  government/semi-government body), with at least one full-time trainer and
  one support staff, a Corporate Integrity Pledge, and a Master Services
  Agreement. Registration costs RM 1,000 (main office) + RM 500/branch,
  is valid **1 year**, and must be renewed 3 months before or within 6
  months after expiry.
- **Course registration (claimable status).** Registered providers register
  individual programmes via **e-TRiS**, at no extra fee. "Training provider
  can claim the Training Fee only after the training is conducted."
- **Trainer accreditation.** Requires a **Train-the-Trainer (TTT)**
  certificate (or an exemption). Accreditation is personal to the trainer,
  not the organisation.

## 3. What this project holds — the evidence

From the founder's reference archive
(`Malaysia - HRD Requirements/HRD Certificates and Badge/`, read via
`docs/REFERENCE_MATERIAL_ACCESS.md`'s access rules):

| Document | What it shows |
|---|---|
| `HRDTrainer_Certificate.pdf` | **HRD Corp Accredited Trainer**, Trainer ID **68923**, valid **08 Jul 2026 – 08 Jul 2029**, Certificate ID `7471d4a0-493f-11f1-b157-27447d2b99e9` |
| `TTT_Cerfitcate.pdf` | Exemption from the PSMB Train-the-Trainer programme (Certificate No. 21073, 05/05/2026) — the prerequisite the accreditation above depends on |
| `HRDBadge.png` | The badge HRD Corp itself issued for display — used on `/trainers` and the homepage hero |
| `HRDTrainer_Certificate_QRScan_Output.jpeg` (added by the founder, 2026-09-06) | A live scan of the certificate's QR code, resolving to `trainers.hrdcorp.gov.my` and returning **"Verification Successful"** for this exact certificate — confirms the accreditation is genuine and independently checkable today |

**The verification permalink.** `trainers.hrdcorp.gov.my` turned out to be
HRD Corp's **Trainer's Development Management System (TDMS)** login, with a
public "Verify Certificate" link to `/ecert` — a certificate-ID search tool.
Driving it directly (this certificate's ID) and reading
`window.location.href` gave the exact pattern:

```
https://trainers.hrdcorp.gov.my/ecert?id=<certificateId>
```

Reloaded fresh with no prior interaction, this URL renders "Verification
Successful" for Agha Mustafa Ali Khan Qizilbash, Cert Type "Accredited",
validity 08/07/2026–08/07/2029 — confirmed 2026-09-06. It is a genuine
shareable permalink, not a session-dependent result, so `/trainers` links
to it directly rather than to the bare domain (moved there from `/hrd-corp`
2026-09-06 — see §5).

**Not held:** any TP registration e-certificate or number for Your Partner
Technologies, and no course registration reference under e-TRiS. The
"ForHRD" brochure and a `100% HRD CORP CLAIMABLE · PAY RM0` graphic in the
archive show intent, not registration — neither is reproduced in the portal.

**Never reproduced, by rule:** the certificate PDFs (both carry the
founder's passport number) and the passport number itself, in any form. See
`docs/REFERENCE_MATERIAL_ACCESS.md` §5 for the asset-by-asset record.

## 4. HRD Corp's own rules on using its logo and phrases

Source: hrdcorp.gov.my/usage-of-hrd-corp-logo.

- **"Only Training Providers who have a valid registration with HRD Corp
  are allowed to use the HRD Corp logo."** Non-registered entities need
  HRD Corp's prior written consent.
- Two sanctioned marketing phrases exist, both reserved for entities that
  hold the underlying status: **"HRD Corp Registered Training Provider"**
  and **"HRD Corp Claimable"**.
- HRD Corp "reserves the right to take administrative action against any
  Training Provider that fails to adhere to these Terms and Conditions."

**Consequence for this portal:** neither sanctioned phrase may be used as a
present-tense claim about Your Partner Technologies or any course, because
neither status is held yet. `/hrd-corp` states the TP application as
**"in progress"** — a factual, founder-confirmed statement (2026-09-06),
not a use of the reserved phrase.

The trainer's own **Accredited Trainer badge** is a different case: HRD
Corp issued it directly to the individual trainer, embedding a personal
QR/Trainer ID, seemingly for exactly this kind of display. The T&C text
above addresses organisational marketing use of the bare logo; it does not
explicitly address a trainer displaying their own issued badge. This
project proceeds on that reading, at the founder's explicit direction —
worth confirming with HRD Corp directly if zero ambiguity is wanted.

## 5. What the portal actually says — and where

| Claim | True today? | Where it appears |
|---|---|---|
| "Delivered by an HRD Corp Accredited Trainer" | **Yes** | Homepage hero (`HomeHero.tsx`, floating card "03") → links to `/hrd-corp`; also "HRD Corp" in the primary nav (`PublicShell.tsx`, every page) → `/hrd-corp` |
| Full accreditation detail, verification instructions | **Yes** | `/trainers` ("Held today" section) — moved here from `/hrd-corp`, 2026-09-06, founder direction: it's the trainer's own accreditation, so it sits next to the person it belongs to |
| "Your Partner Technologies is an HRD Corp Registered Training Provider" | **No** | Never stated. `/hrd-corp` instead says an application is in progress |
| "This course is HRD Corp Claimable" | **No** | Never stated, anywhere |

**By founder direction (2026-09-06), three surfaces carry HRD Corp
content, and only three:** the homepage hero mark and the primary nav item
(both link to `/hrd-corp`), `/hrd-corp` itself (org-level facts — what HRD
Corp is, registration status, funding), and `/trainers` (the trainer's own
accreditation display, moved there the same day). Courses, certifications,
course detail and about-us still carry nothing — every HRD Corp fact still
lives in exactly one of these two pages, never duplicated between them.

## 6. Boundary held

This accreditation is the **trainer's**, personally. It is not an HRD Corp
endorsement of the Academy's own credential, which — per DR-01 and the
`/certifications` page — is earned through assessed applied work, never
through attendance. Both `/hrd-corp` and `/trainers` state this explicitly;
`/hrd-corp` links to `/certifications`.

## 7. Residual open item

This does not resolve the specifications' existing **`OQ-8`** ("HRD Corp
requirements are general knowledge, not a verified e-TRIS checklist") or
the Mockup Specification's open question 6 ("Which of your programmes are
registered and claimable today?"). Those concern `O10` (the compliance /
evidence-pack feature) and `P18` (the funding page) — unbuilt Tier-B work
this session did not touch. If and when Your Partner Technologies'
Registered Training Provider application is approved and a course is
registered via e-TRiS, `/hrd-corp` and `data/hrdCorp.ts` are the two places
to update — no other page needs to change.
