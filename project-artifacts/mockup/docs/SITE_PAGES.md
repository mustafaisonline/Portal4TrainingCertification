# Site pages — what exists, what is missing, what is blocked

**Established 2026-09-02**, when About and Contact were added by founder
direction along with the instruction to add "other pages required to make our
portal professional".

This file answers that instruction honestly: it lists what a professional
training-and-certification portal needs, what was built, and — importantly —
**what was deliberately not built, and why.**

---

## Built

| Route | Purpose | Content status |
|---|---|---|
| `/` | Homepage (P01) | Real |
| `/programmes`, `/programmes/[slug]` | Portfolio and detail | Real — migrated, with published pricing |
| `/trainers` | Trainer directory, selection standard, published work | Real |
| `/about` | Organisation identity, commitments, founder, honest current state | **Real — every positioning claim traced to DR-02 §1/§2/§6/§7.** Nothing about scale, history, clients, team size, founding date or accreditation is stated, because none is established |
| `/contact` | Three enquiry routes, enquiry form, genuine channels | **Real, with one gap — see below** |
| `/diagnostic`, `/diagnostic/result` | Capability assessment (P05/P06) | Pre-DR-02 baseline |
| `/journey-placeholder` | Labelled next-stage placeholder | Placeholder, labelled |

## ⚠ Open gap on `/contact` — there is no business email address

**No email address, telephone number, office address, company registration or
response-time commitment appears anywhere on that page, because none exists in
any approved source.** Inventing one would be the most damaging kind of
fabrication on a portal asking for training budgets — a wrong address silently
loses real enquiries.

What is shown instead is genuine: the founder's own published channels
(LinkedIn, Medium, YouTube, Substack — exact URLs from `data/practitioners.ts`)
and the location recorded there.

**Needed from the founder:** a monitored business email address. Ideally also
the registered legal entity name, which several of the pages below depend on.

The enquiry form is **inert** — no backend exists — and says so, rather than
showing a fake success state.

---

## Not built, and why

These are the pages a professional portal in this sector is expected to have.
Each is listed with what actually blocks it. **None is blocked on effort.**

### Blocked on legal drafting — an agent must not write these

| Page | Why it is needed | Why it was not written |
|---|---|---|
| **Terms of service** | Named in the footer; required before any transaction | A binding legal instrument. Drafting it would be inventing the contract between the Academy and its participants |
| **Privacy policy** | Legally required once the enquiry form collects personal data — including in Malaysia (PDPA) | Must describe what is *actually* collected, stored, where, and for how long. None of that is decided, and a policy describing an imaginary system is worse than none |
| **Refund & cancellation policy** | **A prerequisite for taking payment at all** | `OQ-2`/`OQ-9` record refund policy per product type as unresolved. Stripe cannot responsibly go live without it |
| **Credential integrity policy** | Named in the footer; it is the substance of the credential's worth | Product policy — appeals, revocation, misconduct. `ADR-018`, `OQ-21` |

Until these exist, the footer marks them **"not yet published"** rather than
presenting them as working links. A footer that promises documents which do
not exist is a small dishonesty that costs trust when discovered.

### Blocked on the product existing

| Page | Blocked on |
|---|---|
| **Verify a credential** (public lookup) | No credential has been issued. `ADR-018`/`ADR-039`. The footer says "available once the first credential is issued" |
| **Schedule / upcoming dates** | State A — no confirmed public inventory. Inventing dates is prohibited (`HD-7`, `HO-2`) |
| **Sign in / account** | No authentication exists in the mockup by design |
| **Checkout** | See the payments record below |

### Deliberately not added

- **Blog / insights** — the founder publishes on Medium and Substack already.
  A second, empty channel in the portal would be an obligation with no content
  behind it. The existing links do the job.
- **Testimonials / case studies** — no cohort has run. Fabricating social
  proof is the single most damaging thing this portal could do.
- **Careers** — nothing to advertise. The `/trainers` page already carries the
  open-position signal.
- **FAQ** — every genuinely frequent question is currently answered on the
  page where it arises. An FAQ assembled now would be inventing policy.

---

## Payments — Stripe

**Recorded, not implemented.** See
[`../../../docs/architecture/ARCHITECTURE_DECISION_REGISTER.md` ADR-014](../../../docs/architecture/ARCHITECTURE_DECISION_REGISTER.md).

The founder confirmed on 2026-09-02 that Stripe is the gateway and that an
account exists. That confirms the Stripe half of ADR-014, which had been
sitting at *PENDING HUMAN APPROVAL*.

**Nothing was implemented in the mockup, and that is the correct outcome:**

1. **There is no backend.** No database, no authentication, no server actions,
   no API routes — by design. ADR-014 requires `orders`/`candidacies` records
   to be authoritative, updated by idempotent, signature-verified webhooks and
   reconcilable after an outage. None of that can exist here.
2. **Entitlement must never derive from the payment provider** (ADR-014). That
   demands real persistence, which the Service Restart Test would fail today.
3. **A payment flow in a mockup would be a simulated success state** —
   explicitly prohibited. A fake "payment received" is the worst possible thing
   to mock.
4. **Refund policy is unresolved** (`OQ-2`, `OQ-9`) and is a prerequisite.
5. **Secrets.** Live Stripe keys must never be handled by an agent or
   committed. They belong in the deployment environment.

**What Stripe needs before it can be built:** candidacy/registration records
in a real backend · the Malaysian rail decision (ADR-014's other half, still
open) · refund policy per product type · the invoicing legal entity and tax
treatment (`OQ-9`) · webhook endpoint with signature verification and
idempotency · `HO-10` (whether individual online payment is offered at all)
resolved.

Until then, every commercial CTA in the portal correctly stops at **explore**
or **enquire** — which is what `HO-10` requires.
