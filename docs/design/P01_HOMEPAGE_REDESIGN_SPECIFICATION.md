# P01 Homepage — Redesign Specification

**Document type:** Screen-level design specification. Implementation-independent.
**Version:** 1.0 · **Created:** 2026-08-31
**Screen:** `P01` Homepage · **Work package:** WBS `4.1.2`
**Status:** **SPECIFICATION APPROVED FOR AUTHORING — implementation NOT authorized.**

> ## ⛔ THIS DOCUMENT AUTHORISES NO DESIGN OR IMPLEMENTATION WORK
>
> It defines **what the redesigned Homepage must communicate, contain and enable.** It deliberately does **not** define visual identity, typography, layout, colour or component code. Those belong to a later, separately authorised **Homepage Visual Design** stage.
>
> **Nothing in `project-artifacts/mockup/` may be modified on the authority of this document.**

---

## 1. Authority and position in the documentation set

This document sits **below** the approved baseline and **above** any future visual design work.

```
DR-02_EXPERT_LED_DELIVERY_MODEL.md          strategic correction — outranks everything below
        ↓
DATA_AI_ACADEMY_MVP_BUILD_SPEC.md §6        authoritative: screen list, priorities, pathways
        ↓
..._MOCKUP_SPECIFICATION.md §4 P01 brief    authoritative: what P01 must communicate
        ↓
   ▶ THIS DOCUMENT                          how P01 realises that brief, section by section
        ↓
Homepage Visual Design (not authorised)     look, feel, layout, components
        ↓
Homepage Implementation (not authorised)    code
```

**Where this document and any source above it conflict, the source above wins and this document is wrong.** It introduces no new product rule, resolves no open decision, and creates no requirement not traceable to an approved source.

**Primary inputs.** `DR-02` (whole); `MVP_BUILD_SPEC.md` §1, §4, §5, §6, §7, §11, §12; `MOCKUP_SPECIFICATION.md` §1.3, §1.4, §4 `P01` rewritten brief, §13, §15.2, §16; `BLUEPRINT.md` §1, §3, §10.5, §14, §25; `ARCHITECTURE_DECISION_REGISTER.md` ADR-043, ADR-044; `docs/architecture/README.md` open questions; `docs/execution/PROJECT_PLAN_WBS.md` WP 4.1.x, 4.4.x; and the Homepage Design Strategy of 2026-08-31, whose decisions are recorded durably in §3 below.

---

## 2. How to read this document

| If you are… | Read |
|---|---|
| Approving the direction | §3 (decision record) → §4 → §6 |
| Producing the visual design | §4 → §5 → §6 → §7–§13 → §14 |
| Checking what may not be built | §15 (retirement map) → §17 (open decisions) → §19 |
| Continuing this work in a new session | §3 first, then everything |

**Section identifiers `H0`–`H9` are stable.** They name Homepage sections and follow the same never-reuse discipline as screen identifiers (`MOCKUP_SPECIFICATION.md` §"BINDING RULE"). A retired section identifier is not recycled.

**Illustrative copy is marked `[EXAMPLE]`.** No sentence in this document is approved marketing copy. Examples exist to convey message intent and register, and must be rewritten by whoever owns the words.

---

## 3. Durable decision record

*This section is the repository's record of the Homepage Design Strategy stage completed 2026-08-31. It exists so that no Homepage decision lives only in conversation.*

### 3.1 APPROVED — binding on the Homepage redesign

| # | Decision | Rationale | Source |
|---|---|---|---|
| **HD-1** | The Homepage is positioned as an **expert-led professional learning and capability development platform** — not a course catalogue, self-paced library, content platform, events calendar, or generic corporate training site | The identity defect DR-02 exists to correct | DR-02 §1; approval of 2026-08-31 |
| **HD-2** | **Three pathways, in this priority order:** explore programmes *(primary)* · train your team *(major secondary)* · assess your capability *(supporting)* | Re-derived from the corrected journeys | `MVP_BUILD_SPEC.md:394`; `MOCKUP_SPECIFICATION.md:534-542` |
| **HD-3** | The **primary CTA supports programme discovery** and must not assume a large catalogue exists | Works at any inventory level | Approval §2.1 |
| **HD-4** | **"Start free diagnostic (10 min)" is preserved** as a Homepage CTA, repositioned from dominant to supporting. The inference *"self-paced retired → diagnostic retired"* is explicitly invalid | The offer's value — real insight before anything is asked — is unaffected by the delivery-model correction | Approval §2.2; `MOCKUP_SPECIFICATION.md:542`; DR-02 `:388` |
| **HD-5** | The diagnostic's downstream role is **reframed**: capability insight → relevant development areas → relevant programmes and/or scheduled offerings. It must not route into a self-paced course/path funnel | The old funnel is retired; the instrument is not | Approval §2.3; `MVP_BUILD_SPEC.md:135` |
| **HD-6** | **Founder-led credibility at launch, network-ready by design.** Mustafa Qizilbash is the initial confirmed practitioner. The Homepage must not be architected around one expert, and must not imply more than one exists | Honest representation + expandable model, held together | DR-02 §7; approval §3.1, §3.6 |
| **HD-7** | **No fabricated experts, programmes, offerings, dates, capacities, prices, testimonials, employers or statistics** — including in fixture data | `MVP_BUILD_SPEC.md:710` — "a fake expert falsifies the claim itself" | DR-02 §4.1, §7; approval §3.4, §4.1 |
| **HD-8** | The Homepage must remain **credible and useful in three inventory states** — none, small, growing — without fake programme cards | Launch inventory is an unresolved commercial decision | Approval §4.2 |
| **HD-9** | **Programme and Scheduled Offering remain distinct concepts** and must not be collapsed. No booking, calendar, capacity or waitlist mechanism is designed | Programme = the proposition; offering = a delivery instance | DR-02 §4; ADR-043 `:1018-1019`; approval §4.3 |
| **HD-10** | **Capability areas replace the catalogue-style domain grid.** They express areas in which capability is developed, never categories containing courses, and carry **no counts** | Domain survives as subject scope and seeded data; depth-as-value is retired | `MOCKUP_SPECIFICATION.md:357`; ADR-023; approval §5 |
| **HD-11** | Certification is communicated as **philosophy and standard**, never as an automatic consequence of attending, registering or participating | `OQ-21` is open; DR-02 §6 — attendance alone is never sufficient | DR-02 §6; approval §6 |
| **HD-12** | The organisational journey is **discoverable and important but does not compete with the hero.** It routes to the existing corporate journey and is enquiry-shaped, never a self-service purchase | Corporate is first-class; its MVP workflow boundary is an entry path only | DR-02 §8; approval §7 |
| **HD-13** | The **third differentiator slot stays visibly empty.** `D0`, `D1` and `D2` are active; `D3` is under reassessment and no replacement may be invented | Filling the gap would be exactly the silent drift DR-02 removes | `MOCKUP_SPECIFICATION.md:150`; DR-02 §9 |
| **HD-14** | **One CTA in the header, ever.** Competing calls to action reduce total conversion | Rule survives the correction | `MOCKUP_SPECIFICATION.md:1986` |

### 3.2 OPEN — must not be silently converted into requirements

| # | Open item | Homepage consequence | Owner |
|---|---|---|---|
| **HO-1** | **Whether the Homepage primarily surfaces *programmes* or *scheduled offerings*** in its discovery section | Recorded as **explicitly open**. §10 specifies a structure that works either way and does not select one by inference | Product owner |
| **HO-2** | **Launch programme inventory** — which, how many, when | Determines which of the three states in §10 is live at launch | Product owner |
| **HO-3** | **Launch domain / capability-area scope** — the count is not five and is not fixed | §11 specifies count-agnostic representation | Product owner (WBS 4.4.2) |
| **HO-4** | **Platform and credential naming** | The masthead wordmark cannot be finalised. Blocks WP 4.1.1, which precedes this work package | Product owner (WBS 4.4.1) |
| **HO-5** | **Which pathway leads visually**, given the fixed priority order | A visual-design decision, deliberately left to that stage | Visual design stage |
| **HO-6** | **Diagnostic CTA noun** — "diagnostic" vs "capability assessment" | §9.5 states the preference and the tension without resolving it | Product owner |
| **HO-7** | **Pricing presentation** | No price, range or fee appears on `P01` until decided | Product owner |
| **HO-8** | **`OQ-21`** — programme participation in the credential model | §12 defines permitted and forbidden language so copy cannot resolve it accidentally | Product owner |
| **HO-9** | **`OQ-22`** — assessor supply and scaling | No public claim about assessor network, scale or capacity | Product owner |
| **HO-10** | **Individual online payment** (`ADR-014` / `OQ-2`) | No "register and pay now" on `P01` | Product owner |
| **HO-11** | **Corporate MVP workflow boundary** | "Train your team" lands on an enquiry, never a purchase flow | Product owner |
| **HO-12** | **International delivery commercial terms** | Capability may be stated; terms may not be invented | Product owner |
| **HO-13** | **`D3` replacement differentiator** | Third slot stays empty | Product owner |
| **HO-14** | **Whether the founder's current employer is named anywhere** | §8.6 recommends against and explains why; not resolved here | Product owner |

### 3.3 PROVISIONAL — discussed, not approved, not binding

- Section ordering `H3`–`H9` below the pathways is a **recommendation**, not an approved requirement. The visual design stage may reorder with reasoning.
- All `[EXAMPLE]` copy is illustrative register-setting only.
- The suggested treatment of capability areas as the pre-inventory carrier of discovery (§10.3, §11) is a proposed mechanism, not an approved product rule.
- Any evolution beyond a single practitioner is **anticipated structurally** but is not a commitment that additional experts will be recruited.

---

## 4. Homepage purpose, audience and first impression

### 4.1 The single primary job

> **Establish, within seconds, that this is an independent professional training and certification organisation whose learning is delivered live by practitioners — and route the visitor to what they can actually attend, commission, or find out about themselves.**

Identity first, routing second. The current implementation fails the first and does the second well.

### 4.2 Audience priority

| Rank | Audience | Why |
|---|---|---|
| **Primary** | The individual professional deciding whether to attend | The pathway hierarchy serves them first (`HD-2`) |
| **Primary (co-equal, separate surface)** | The organisational buyer — L&D, CDO office, HR | Corporate is first-class and is how V1 is funded (DR-02 §8) |
| Secondary | The employer arriving via a credential verification link | Blueprint `:922` — where a hiring manager first meets the brand |
| Secondary | The undecided professional who cannot yet name their gap | The diagnostic's audience |
| **Must not drive** | Trainers seeking work · community members · contributors · academic partners | Association-shaped surfaces retired (DR-02 §12) |

**Resolution of the two co-equal primaries:** the hero addresses the individual; a distinct, unmissable, differently-shaped section addresses the organisation. They are not split 50/50 in the hero. An individual arriving undecided will bounce off a page addressed to procurement.

**Weighting caveat.** Blueprint `:613` records that visitors commonly arrive on a knowledge article or credential page, **not** the Homepage. `P01` is the page that *resolves identity*; it is not assumed to be the funnel's mouth.

### 4.3 The first-few-seconds understanding

The visitor should be able to say:

> **"This is a professional training and certification organisation where experienced practitioners teach data and AI capability live — and where the credential has to be earned, not attended."**

They should **not** come away thinking: online course platform · video library · certification exam body · membership association · consultancy that also trains.

---

## 5. Messaging principles

1. **Substance over aspiration.** Say what happens, who does it, and what it produces. Banned register: *transform your future · unlock your potential · learn anything · world-class courses · industry-leading · cutting-edge.* Blueprint `:1606` — "direct, expert, encouraging, never condescending and never hype."
2. **Presence is the message.** Every section should be readable as evidence that a person teaches this. Language must never let live delivery read as video (DR-02 `:65`).
3. **Show the mechanism, assert nothing.** A rubric fragment beats "rigorously assessed." A named practitioner beats "expert-led." Blueprint `:1399` — "Trust is designed, not asserted."
4. **Honest scarcity.** Where something is small or not yet running, say so plainly. The existing proof band already does this and sets the standard.
5. **Specific over superlative.** *"Twenty-four years building enterprise data platforms"* is worth more than *"deep expertise."*
6. **Practitioner register, not corporate register.** Intelligent, plain, internationally readable. Avoid jargon stacks and avoid marketing cadence.
7. **No claim the product cannot honour.** Nothing about seats, prices, payment, AI capability, assessor scale, or certification automatically following attendance.
8. **Terminology.** *Participant* where a person is in a programme; *practitioner* or *expert* for who delivers; *programme* never *course*; *capability area* never *category*.

---

## 6. Information architecture

Ten sections including the global shell. This is the smallest structure that carries the corrected model. Ordering below the pathways is a recommendation (§3.3).

| ID | Section | Status | Serves |
|---|---|---|---|
| `H0` | Global shell — masthead + footer | Redesign | All |
| `H1` | Hero | Redesign | Individual |
| `H2` | The three pathways | Reframe | All |
| `H3` | Practitioner credibility | New | Individual + organisation |
| `H4` | What expert-led delivery actually means | New | Individual |
| `H5` | Programme discovery | New | Individual |
| `H6` | Capability areas | Reframe | Individual + organisation |
| `H7` | How capability is recognised | Reframe | Individual + employer |
| `H8` | For organisations | Reframe | Organisation |
| `H9` | Credibility and honest position | Reframe | All |

*(Closing action is a component of `H9`, not a separate section — the current implementation's fourth diagnostic CTA is retired and does not need a replacement section of its own.)*

Each section is specified below against the required fields: **purpose · primary message · content · CTA · dynamic vs static · launch-state · future-state · truthfulness constraints.**

---

### `H0` — Global shell

- **Purpose.** Resolve identity before the visitor reads body copy; provide stable navigation and legally required footer content.
- **Primary message.** An independent professional training and certification organisation.
- **Content.** Wordmark · primary navigation, intent-led, maximum six items · sign-in · one CTA · footer with sitemap, legal, and credential verification entry.
- **CTA.** **Exactly one** in the header (`HD-14`), matching the page's primary CTA (§14).
- **Dynamic vs static.** Static editorial.
- **Launch state.** Navigation items must not promise screens that do not exist; an item with no destination is omitted, not stubbed.
- **Future state.** Items are added as destinations become real.
- **Truthfulness constraints.** ⚠️ The footer must **lose** *"Accreditation — Governance & standards council."* This is named as a live defect in both DR-02 `:24` and the `P01` brief's "What must not appear." The organisation is not a standards body. **Credential verification stays** — it is a trust surface, not an accreditation claim.
- ⚠️ **Blocked by `HO-4`.** The wordmark cannot be finalised until naming is decided.

---

### `H1` — Hero

Specified in full in §7.

---

### `H2` — The three pathways

- **Purpose.** Route by intent without a mega-menu, and make the corporate pathway visible above the fold-adjacent region.
- **Primary message.** There are three things you might be here to do.
- **Content.** Three routes, in the priority order fixed by `HD-2`:

| Priority | Pathway | Intent served | Destination |
|---|---|---|---|
| Primary | **Explore programmes** | *"What can I attend, and when?"* | `P10` / `P24` |
| Major secondary | **Train your team** | *"Can you deliver this for my organisation?"* | `P17` → `P19` |
| Supporting | **Assess your capability** | *"Where do I actually stand?"* | `P05` → `P06` |

- **CTA.** One per route.
- **Dynamic vs static.** Static editorial.
- **Launch state.** All three present regardless of inventory. If programme discovery has no inventory, the first route leads to the capability-area view specified in §10.3 — it is never removed and never dead-ends.
- **Future state.** Unchanged. This section is inventory-independent by design.
- **Truthfulness constraints.** The third route must not promise a personalised recommendation the product does not produce (§9.7).
- **Retired.** The former third door *"Teach or partner"* is removed — the accredited-partner model is retired (DR-02 §12; Blueprint `:78`).

---

### `H3` — Practitioner credibility

Specified in full in §8.

---

### `H4` — What expert-led delivery actually means

- **Purpose.** Make "live" concrete, and pre-empt the assumption that "online" means pre-recorded video. This is the section that most directly prevents a marketplace reading.
- **Primary message.** You are in a room — physical or live online — with a practitioner and with peers, working through real problems.
- **Content.** What a session actually involves: interaction, questions, discussion of the participant's own situation, worked practical examples, expert feedback, peers from other organisations. Delivery formats named plainly — face-to-face and live online. A clear statement that materials **prepare, extend and reinforce** delivery rather than replace it.
- **CTA.** Optional, low emphasis → `P10`.
- **Dynamic vs static.** Static editorial.
- **Launch state.** Fully available now — it depends on no inventory and no data. **This section is the strongest thing the Homepage can say on day one.**
- **Future state.** Unchanged; may gain genuine participant evidence once cohorts have run.
- **Truthfulness constraints.** Must not describe a session recording as a product. Must not imply a self-paced route exists. Must not name a conferencing vendor — ADR-044 keeps the architecture provider-neutral and selects no vendor.

---

### `H5` — Programme discovery

Specified in full in §10.

---

### `H6` — Capability areas

Specified in full in §11.

---

### `H7` — How capability is recognised

- **Purpose.** Position certification honestly, and carry `D1` — evidence over recall.
- **Primary message.** The credential is earned through assessed applied work judged by a qualified human, not by attending.
- **Content.** What the credential asserts · that assessment is against a published rubric with worked exemplars · that a qualified person reads the work and writes reasoning. Preferred device: **show a rubric fragment**, as the current implementation already does — it is the single strongest element on the existing page.
- **CTA.** *See how the credential is earned* → `P15`.
- **Dynamic vs static.** Static editorial; the rubric fragment must be drawn from the **real** rubric once authored (`MVP_BUILD_SPEC.md:704` — never faked).
- **Launch state.** Available once the rubric exists. Until then, the section states the standard without displaying a fabricated fragment.
- **Future state.** May link to exemplars as they are published.
- **Truthfulness constraints.** ⚠️ **`OQ-21` boundary — binding.** See §12 for permitted and forbidden formulations. No claim about assessor numbers, network or capacity (`HO-9`). No credential ladder or bands (DR-01).

---

### `H8` — For organisations

Specified in full in §13.

---

### `H9` — Credibility and honest position

- **Purpose.** Substantiate trust without fabricating scale, and close the page.
- **Primary message.** Here is published work you can judge us by, here is honestly where we are, and here is what to do next.
- **Content.** Three components:
  1. **Published knowledge** — a small set of genuine articles with version stamps. Carries `D2`. Low emphasis; this is a credibility layer, not a conversion path.
  2. **Honest position** — a plain statement of the organisation's current stage. **The existing implementation's proof band is already correct and should be preserved in substance.**
  3. **Closing action** — a single repeat of the primary CTA.
- **CTA.** Primary CTA repeated once. Knowledge link at low emphasis.
- **Dynamic vs static.** Articles are dynamic and must be real; the honest position is static editorial, revised as reality changes.
- **Launch state.** If no articles are published, the component is omitted rather than filled.
- **Future state.** As genuine proof accumulates — named employers who recognise the credential, cohorts actually delivered — the honest-position component is progressively replaced by evidence. **Numbers appear only when real.**
- **Truthfulness constraints.** ⚠️ `MVP_BUILD_SPEC.md:845` — employer recognition claims require **actual employers who have said yes**; ship the band empty rather than padded. No participant counts, no cohort counts, no testimonials until genuine.

---

## 7. Hero specification (`H1`)

The hero carries the correction. If it reads as a course platform, nothing below rescues it.

### 7.1 Primary audience
The individual professional. The organisational buyer is served by `H2` and `H8`, not by splitting the hero.

### 7.2 Primary message
**Expert-led capability development, delivered live by a practitioner, with an outcome that has to be earned.**

The hero must carry `D0` as a **compound proof, not three separate facts**. `MOCKUP_SPECIFICATION.md:144` requires the mockup to show *"a named genuine expert, a real delivery format, and a real date — early and unmistakably."*

> **Design consequence.** A hero showing a date without a person reads as an events listing. A hero showing a person without delivery context reads as a consultant's personal site. The differentiator exists only when practitioner **and** delivery format appear together. Where a real date exists it belongs here too — but see §7.11, because a date is the one element that may not exist at launch.

### 7.3 Supporting message
Who this is for, and what changes as a result — expressed as capability, not as content. `[EXAMPLE]` *"For data and AI professionals who need to do the work, not just describe it."*

### 7.4 Primary CTA
**Explore programmes** (`HD-3`). Wording is finalised in §14.1. Must not assume a catalogue; must not promise a price or a checkout.

### 7.5 Secondary CTA
One only. Recommended: a route into `H4` / `P10` — *how delivery works* — because the most common unspoken objection is *"is this actually live, or is it videos?"*

**The diagnostic does not appear in the hero.** It appears at `H2` and `H9` per §9.

### 7.6 Trust and credibility signals permitted in the hero
- The practitioner's name and a genuine, specific credibility line (§8.4)
- Delivery formats — face-to-face, live online
- Location and international capability, stated without commercial terms (`HO-12`)
- A genuine photograph, subject to §16

### 7.7 Visual role
The hero establishes **a person and a practice**, not a product screenshot and not an abstract graphic. Reference: Blueprint `:1607` — real people in real work contexts; diagrams over stock photography; *"abstract 'glowing brain' AI imagery is banned."*

### 7.8 Whether the founder's photograph may appear in the hero
**Permitted, with conditions** — see §16 for the asset assessment.

- ✅ A **genuine** photograph of Mustafa Qizilbash may appear.
- ⛔ The **AI-generated portrait must not be used** anywhere on the Homepage (§16.2). A synthetic portrait on a page whose central claim is *a real practitioner teaches this* falsifies the claim it decorates.
- ⚠️ The best genuine asset currently in the repository is **800 × 800 px**, which is below what a large hero treatment needs. Either the hero uses the photograph at a modest, appropriate size, or a new genuine photograph is commissioned. **This is a content-production dependency, not a design problem to solve with upscaling or generation.**

### 7.9 What must not appear in the hero
Course counts · catalogue depth · "browse our courses" · a lesson or video affordance · a credential ladder or bands · an AI feature as a differentiator · a standards-council or accreditation claim · fabricated dates, prices, capacities or participant numbers · stock photography of people at laptops · a `D3` claim.

### 7.10 What the hero must deliberately avoid communicating
- That learning happens *in the portal* — it does not (DR-02 §3)
- That content is the product — the practitioner and the room are
- That certification follows from attending (§12)
- That a large catalogue exists behind the CTA
- That the organisation is a certification body that examines but does not teach

### 7.11 Hero behaviour when no date exists
If no scheduled offering is publicly confirmed, the hero carries **practitioner + delivery format + how to register interest**, and omits the date element entirely. It must not display a placeholder date, a "coming soon" date, or a fabricated one. See §10.2.

---

## 8. Practitioner credibility specification (`H3`)

### 8.1 Should the Homepage carry a dedicated section?
**Yes.** `D0` is the foundational differentiator and it is a *person*. The hero can name the practitioner; it cannot carry enough substance to make the claim credible to a sceptical corporate buyer.

### 8.2 Strategic purpose
Convert *"expert-led"* from an adjective into verifiable fact — enough credibility to support trust, without becoming a CV.

### 8.3 Placement and prominence
Immediately after `H2`. High prominence, second only to the hero. It answers the question a visitor forms the moment they understand the model: *"taught by whom?"*

**Explicitly not a "Meet our experts" grid of placeholder cards.** At launch there is one confirmed practitioner and the design must state that as a strength — a named, accountable practitioner — rather than disguising it with empty slots.

### 8.4 Genuine information that may be surfaced

Every item below is supported by an authorized source (§18). **Nothing here is approved copy; it is a permitted-claims list**, and every claim requires founder confirmation before publication.

**Tier 1 — cross-source consistent; safe to specify**
- Based in Kuala Lumpur, Malaysia
- 24+ years of international experience in data and analytics
- Enterprise delivery across banking, energy, telecom, government and enterprise sectors
- Senior data-platform leadership roles, including at a national energy company and a regional bank programme
- **DAMA CDMP** certification, plus certifications including PMI project management and a data-governance credential
- Author of books on data engineering, AI and enterprise architecture
- Host of the **"Let's Talk About Data!"** podcast, launched June 2024, featuring global data and AI leaders
- Founder and administrator of a long-running global big-data practitioner community
- Master's degree in Information Technology; Bachelor's degree in Commerce
- Actively publishing on data and AI as of August 2026

**Tier 2 — single-source or volatile; require founder confirmation before publication**
- Exact book count · exact podcast episode count · community member count · follower counts · the count of authored frameworks/methodologies. **Follower and episode counts change and differ between sources — they are poor Homepage claims and are not recommended.**

**Tier 3 — conflicting; must not be stated without explicit founder confirmation**
- **Current employer and current role.** The repository résumé and the public LinkedIn profile do not agree (§18.3).

### 8.5 What belongs on a deeper profile page (`P23`), not the Homepage
Full role history · complete certification list · full publication list · detailed framework descriptions · speaking and media history · academic engagements. The Homepage carries **three or four** substantiating facts; `P23` carries the record.

### 8.6 Naming a current employer — recommendation
**Recommended: do not name a current employer on `P01`.** Three reasons: it is the one fact whose sources conflict (§18.3); naming a current employer on a commercial training site implies an endorsement that has not been given; and the credibility claim rests on *track record*, which is stronger and more stable than *current job title*. **This is a recommendation, not a resolution — recorded as `HO-14`.**

### 8.7 How this component scales (`HD-6`)

```
LAUNCH            one named practitioner, presented in depth
   ↓
GROWTH            several practitioners, each tied to capability areas or programmes
   ↓
MATURE            a network, with the Homepage showing a representative subset
```

**Binding structural requirements:**
1. The section must be **structurally plural** — a repeatable component rendering *n* practitioners — while displaying exactly the number that genuinely exist.
2. Adding a practitioner must be **a data operation plus content, never a redesign** (DR-02 `:206`).
3. Copy must not be written so that a second practitioner makes it false. `[EXAMPLE]` — *"Founded and led by…"* survives growth; *"Our sole expert…"* does not; *"Meet our team of experts"* is false today.
4. No empty slots, ghost cards, silhouettes or "more experts joining soon."
5. The layout must not visually depend on a grid of three.

### 8.8 Truthfulness constraints
⛔ No fabricated practitioner, biography, credential, testimonial, employer, award or engagement — including in fixture data (`HD-7`). ⛔ No implied faculty. ⛔ No AI-generated likeness (§16.2).

---

## 9. Diagnostic specification (`H2` route + `H9` presence)

### 9.1 Homepage role
A **supporting entry point** and the strongest low-commitment route for a visitor who cannot yet name their gap — plus, per `MOCKUP_SPECIFICATION.md:542`, the corporate land motion.

**It is preserved, not demoted out of relevance.** It becomes the *most prominent* CTA on `P17` (corporate), where Blueprint `:1030` records the land motion as *"sell the diagnosis first."* Its Homepage prominence decreases; its overall product role does not.

### 9.2 Placement
- As the **third pathway** in `H2`
- Present at most **twice** on the page, against four times in the current implementation
- ⛔ **Not** in the masthead (`MOCKUP_SPECIFICATION.md:1986`) · ⛔ **not** the hero primary CTA · ⛔ **not** the closing CTA

### 9.3 Message
`[EXAMPLE]` *"Not sure where your gaps actually are? Ten minutes, no account needed to start, and you get a specific answer — not a score."*

Register rules from `MOCKUP_SPECIFICATION.md:629` apply: no test language — no *correct*, *wrong*, *score*, *pass*.

### 9.4 Relationship to programme discovery (`HD-5`)

```
CAPABILITY INSIGHT      named, specific, plain-language gaps
        ↓
DEVELOPMENT AREAS       what those gaps mean in practice
        ↓
RELEVANT PROGRAMME(S) / SCHEDULED OFFERING(S)
```

⛔ **Must not become:** insight → learning path → milestone ladder → course list → lesson. That is the retired funnel.

**The Homepage's only obligation here** is to set the expectation that the result leads toward relevant expert-led development. It does **not** specify `P06`'s content, which is out of scope for this stage.

### 9.5 CTA wording (`HD-4`, `HO-6`)

**Preserved: "Start free diagnostic (10 min)".**

Its three load-bearing elements are all worth keeping: the verb, *free*, and an honest duration. The offer is unaffected by the delivery-model correction.

**One unresolved tension, flagged and not resolved.** The corrected specifications rename `P05` to **Capability Assessment** (`MVP_BUILD_SPEC.md:396`), so *"diagnostic"* now sits inconsistently with the vocabulary elsewhere, and *"capability assessment"* reads better to the corporate buyer where the offer converts hardest. Against that, *"diagnostic"* is shorter, more distinctive, and lower-commitment for an individual — and *"assessment"* risks reading as a test to be passed, which §9.3's register rule exists to avoid.

**Specification:** retain the CTA's **shape** — *verb + free + honest duration*. Treat the noun as an open decision alongside naming (`HO-4`, `HO-6`). **The visual design stage must not silently change this wording.**

### 9.6 Expectation to set before the user starts
That it is free · that it takes about ten minutes · that it produces a specific, named result rather than a score · that "I'm not sure" is a legitimate answer · that starting requires no payment and no commitment. Whether an account is needed to see the **full** result is `P06`'s concern and is not stated on `P01`.

### 9.7 What must no longer be implied
⛔ That it produces a personalised *learning path* · ⛔ that it leads to self-paced course consumption · ⛔ that it is the primary way to engage · ⛔ that it is a prerequisite for anything · ⛔ that an algorithm generates a bespoke recommendation — the product resolves a named gap to a **relevant programme**, and the Homepage must not promise more.

---

## 10. Programme discovery specification (`H5`)

### 10.1 The constraint this section exists to solve
The primary pathway points at the one thing that may be empty at launch. `MVP_BUILD_SPEC.md:297` warns that *"an empty calendar fails the same way an empty catalogue would."*

**Governing principle:** the section's **structure is inventory-independent**. One genuine programme must read as deliberate selectivity; the count is data, not design.

### 10.2 State A — no confirmed public offering inventory

- **Behaves as:** a statement of *what is offered and how it is delivered*, not a listing.
- **Content:** the shape of a programme — outcomes as capabilities, delivery formats, typical duration, what happens in the room — expressed generically and truthfully. Capability areas (§11) carry discovery in this state.
- **CTA:** register interest, or make an enquiry. Wording must not imply a schedule exists.
- ⛔ **Forbidden:** placeholder cards · "coming soon" cards · greyed-out programmes · fabricated dates or names · a "0 programmes" empty state · a countdown.
- **This state must be designed first**, because it is the most likely launch condition and the easiest to get wrong.

### 10.3 State B — small launch inventory

- **Behaves as:** a short, confident list of what genuinely runs.
- **Content:** per entry — programme name, what a participant will be able to do, delivery format, and (where a scheduled offering exists) date and location. Presented as a curated set, not as search results.
- **CTA:** primary → `P24` / `P10`.
- **Design requirement:** the layout must be **dignified at n = 1**. A single entry must not look like a grid missing two items. ⛔ No "showing 3 of 3" · no filters · no sort · no facets · no "view all" implying more.
- **This is the state the design should be optimised for.**

### 10.4 State C — growth inventory

- **Behaves as:** a curated Homepage selection with a clear route to the full listing on `P24`.
- **Content:** a deliberately limited selection — nearest dates, or a representative spread across capability areas.
- ⛔ **The Homepage never becomes the listing.** Facets, sort and search belong on `P24`, and even there must not reconstruct a catalogue.
- **Guard:** growth must not reintroduce depth-as-value. The Homepage shows *a few*, never *how many*.

### 10.5 Programme vs Scheduled Offering (`HD-9`, `HO-1`)

The distinction is preserved and the Homepage must not collapse it:

| Concept | Is | Answers |
|---|---|---|
| **Programme** | The learning proposition — outcomes, shape, who delivers | *"What is this, and what will I be able to do?"* |
| **Scheduled offering** | A specific delivery instance — format, dates, location, capacity, assigned expert | *"When can I attend, and where?"* |

> ⚠️ **`HO-1` is explicitly open.** Whether `H5` leads with programmes or with scheduled offerings is **not decided here** and must not be inferred. This specification defines a structure that supports either: an entry is a **programme identity** with **offering attributes attached where they exist**. Which of the two is visually dominant is a decision for the product owner, informed by `HO-2`.

**Not designed here, and not to be designed by the visual stage:** booking engines · calendars · seat allocation · capacity mechanics · waitlists · recurrence. ADR-043 `:1018` — *"Capacity is named; the mechanism enforcing it is not designed."* ⛔ Consequently **no "N seats left" indicator** may appear — it has no architectural support.

### 10.6 Truthfulness constraints
⛔ No invented programme names, counts, dates, capacities, locations or prices (`HD-7`, `HO-2`, `HO-7`). ⛔ No "register and pay" (`HO-10`). Prototype fixtures are permitted **only** as clearly-labelled fixture data (`MVP_BUILD_SPEC.md:686`) and must never be published outside the prototype.

---

## 11. Capability areas specification (`H6`)

### 11.1 How this differs from the retired catalogue model

| Retired domain grid | Capability areas |
|---|---|
| Categories *containing* courses | Areas in which professional capability is *developed* |
| Carried course counts | **Carry no counts of anything** |
| Entry point into a catalogue | Orientation, and a route to relevant programmes |
| Fixed at five | Count is unresolved and must not be hardcoded (`HO-3`) |
| Depth signalled value | Depth is irrelevant; relevance is the signal |

### 11.2 Purpose
Let a visitor locate themselves by subject before they engage with a specific programme — and, in State A, carry discovery when there is no inventory to list.

### 11.3 Content
Per area: name, and one line describing the capability developed — expressed as what a practitioner can *do*. ⛔ No counts, no chips implying volume, no "explore N programmes."

### 11.4 CTA
Low emphasis. Routes to relevant programmes where they exist; in State A, to registering interest.

### 11.5 Launch and future state
Renders correctly at **any** count — a three-area and a six-area layout must both be dignified. ⛔ **The design must not encode five**, nor assume a symmetric grid. As programmes accumulate, areas may become filters on `P24` — never on `P01`.

### 11.6 Truthfulness constraints
Areas shown must be ones the organisation can genuinely deliver in. ⛔ An area with no genuine capability behind it must not be listed to complete a grid.

**Note.** `docs/FINDINGS.md` F3 in the mockup artifact (five tiles vs three) is superseded by DR-02 §4.1 and by this section. It is recorded here so the stale finding is not re-litigated.

---

## 12. Certification language boundary (`H7`) — binding

`OQ-21` is open (`HO-8`). This section exists so that copy cannot resolve it by accident.

### ✅ Permitted formulations
- The credential is earned through assessed applied work, judged by a qualified person against a published rubric
- Participation in an expert-led programme is **part of** the pathway
- Assessment is meaningful, human, and reasoned
- The credential is independently verifiable and portable

### ⛔ Forbidden formulations
- *"Attend and get certified"* · *"Complete the programme to earn your credential"*
- *"Certification on completion"* · *"Registered participants receive…"*
- Any construction where attendance, completion, participation or registration is the **subject** of a sentence whose object is the credential
- Any statement of **how** participation is represented in the requirement model — that is precisely what `OQ-21` holds open
- Credential levels, ladders or bands (DR-01)
- Claims about assessor numbers, network or capacity (`HO-9`)
- Any stated SLA or turnaround time on `P01`

### The test
> If a reader could conclude *"if I attend, I get the credential"* — the copy has resolved `OQ-21` and must be rewritten.

---

## 13. Organisational journey specification (`H8`)

- **Purpose.** Serve the co-equal corporate audience without competing with the individual hero.
- **Primary message.** The buyer is not purchasing training; they are purchasing **provable capability change, defensible spend and reduced risk** (Blueprint `:1017`).
- **Content.** Engagement formats — private cohorts, on-site and international delivery, live online · what the organisation receives — cohort visibility, attendance evidence, funding documentation · a route to the diagnostic as the entry offer.
- **CTA.** **Enquiry-shaped only** → `P17`, then `P19`. `[EXAMPLE]` *"Talk to us about your team."* ⛔ Never a purchase, a quote engine, a seat count or a price.
- **Placement.** A distinct, visually differentiated band — a deliberate change of texture that signals *this part is for a different reader*. Not a card in a three-up grid; not competing for hero space.
- **Dynamic vs static.** Static editorial.
- **Launch state.** Fully available now — it depends on no inventory. **With `H3` and `H4`, this is one of three sections that are fully deliverable on day one.**
- **Future state.** May gain genuine case evidence once cohorts have been delivered. ⛔ No fabricated logos, testimonials or client names (`HD-7`).
- **Truthfulness constraints.** ⚠️ HRD Corp / funding support may be mentioned **only** within what `OQ-8` supports — WBS records it as *"not a verified checklist."* No claim of registered or claimable status without confirmation. ⛔ No CRM, proposal, contract or account-management affordance (`HO-11`; DR-02 `:257`).
- ⛔ **`P17` is not redesigned by this document.** `H8` routes to it and must not restate or pre-empt its content.

---

## 14. CTA strategy

### 14.1 Hierarchy

| Tier | CTA | Destination | Placement |
|---|---|---|---|
| **Primary** | Explore programmes | `P24` / `P10` | Masthead (the single header CTA) · hero · `H9` close |
| **Major secondary** | Train your team | `P17` → `P19` | `H2` route · `H8` band |
| **Supporting / exploratory** | Start free diagnostic (10 min) *(noun open — `HO-6`)* | `P05` | `H2` route · one further instance |
| **Low emphasis** | How delivery works | `P10` / `H4` | Hero secondary |
| **Utility** | Verify a credential | `P16` | Footer |

### 14.2 Primary CTA wording
**Recommended: "Explore programmes."** It works at any inventory level, carries the corrected vocabulary, and promises browsing rather than buying — appropriate while payment is unresolved (`HO-10`).

Considered and not recommended: *"See upcoming dates"* (fails State A) · *"View our catalogue"* (retired vocabulary) · *"Book now"* (promises a mechanism that does not exist) · *"Get started"* (generic; says nothing).

⚠️ In **State A** the primary CTA must be re-worded to match reality — e.g. registering interest — rather than leading to an empty listing. The visual design stage must specify both variants.

### 14.3 Binding constraints
1. **One CTA in the header, ever** (`HD-14`)
2. **The diagnostic is not the header CTA and not the hero primary** (§9.2)
3. **No CTA implies payment, booking, seat reservation or immediate access**
4. **No CTA leads to a screen that does not exist** — a route without a destination is omitted, not stubbed

---

## 15. Retirement and replacement map

| Existing `P01` element | Status | Future treatment | Reason |
|---|---|---|---|
| Hero headline *"Learn what you're missing…"* | **Reframe** | Three claims stand; the first claim's mechanism becomes expert-led delivery. Headline must carry a practitioner and a delivery format | `MOCKUP_SPECIFICATION.md` §1.3 reframed |
| Hero sub-line (individuals only) | **Redesign** | Retain individual focus in the hero; corporate served at `H2`/`H8` | Corporate is now co-equal |
| **Hero CTA = diagnostic** | **Reframe** | Preserved as supporting at `H2`; hero primary becomes *Explore programmes* | `HD-2`, `HD-4` |
| Header CTA = diagnostic | **Retire from header** | Replaced by the primary CTA | `MOCKUP_SPECIFICATION.md:1986` |
| Secondary link *See how certification works* | **Retain** | May re-point to `P15` or to `H4` | Still valid |
| Three-door **mechanism** | **Retain** | The intent-led segmentation pattern is sound and specification-endorsed | `MOCKUP_SPECIFICATION.md:534` |
| Door 1 *Build my career* | **Reframe** | → **Explore programmes** | `HD-2` |
| Door 2 *Train my team* | **Retain, promote** | → `P17`/`P19`, enquiry-shaped | DR-02 §8 |
| Door 3 *Teach or partner* | **Retire** | Removed; no replacement | Accredited-partner model retired |
| Evidence block — rubric fragment (`D1`) | **Retain** | Moves to `H7`; must use the real rubric once authored | `MVP_BUILD_SPEC.md:704` |
| Evidence block — version stamp (`D2`) | **Retain** | Moves to `H9` knowledge component | `D2` active |
| Evidence block — cited AI answer (`D3`) | **Retire** | Slot **left empty**; no replacement invented | `HD-13` |
| Credential section | **Reframe** | Becomes `H7` under the §12 language boundary | `OQ-21` open |
| Five domain tiles | **Reframe** | Become capability areas (`H6`), count-agnostic | `HD-10`, `HO-3` |
| **Course counts on tiles** | **Retire** | Removed entirely; no equivalent metric | Depth-as-value retired |
| **Honest proof band** | **Retain** | Preserved in substance as `H9`'s honest-position component | Already correct |
| Organisations teaser — heatmap visual | **Reframe** | Effective device; must be labelled illustrative and must not imply live functionality | `HD-7` |
| Organisations teaser — *"live view"* copy | **Redesign** | Overclaims functionality that does not exist | Truthfulness |
| Knowledge library strip | **Reframe** | Survives, demoted to `H9` credibility layer | Not a conversion path |
| Closing CTA (4th diagnostic instance) | **Retire** | Replaced by the primary CTA at `H9` | §9.2 |
| Footer *"Accreditation — Governance & standards council"* | **Retire** | Removed entirely | Named as a defect twice |
| Footer sitemap / legal / verify | **Reframe** | Labels follow corrected navigation; verification retained | — |
| Nav *Learn · Certification · For organisations · Knowledge library* | **Redesign** | Re-derived; *Learn* must not imply a catalogue | DR-02 `:378` |
| Design tokens · `Button` / `Card` / `Chip` · `SkillMeter` · diagnostic canvas | **Retain unchanged** | Reused as-is | DR-02 `:380` — *"Retained unchanged"* |
| Mockup watermark | **Retain** | Honesty discipline | §20.3 risk 10 |
| **Absent: practitioner · delivery format · date · location · programme** | **New** | `H1`, `H3`, `H4`, `H5` | These five absences are the substance of the redesign |

---

## 16. Visual design direction and image assets

*Direction only. No colours, type sizes, spacing values or components are specified here — the design foundation in `project-artifacts/mockup/docs/DESIGN_FOUNDATION.md` and `MOCKUP_SPECIFICATION.md` §16 already govern those and are unchanged.*

### 16.1 Visual personality
Blueprint `:1567` — **precise · clear · confident · warm · substantive.** Blueprint `:1563` — the intersection of a professional standards body (trust, precision, restraint) and a modern software product (clarity, speed, warmth). Avoid both the sterile institutional look of legacy certification bodies **and** the neon-gradient aesthetic of AI startups.

### 16.2 Repository image asset assessment

Assets inspected under the authorization of this stage. **None were modified, moved, copied or staged.**

| Asset | Size | Assessment |
|---|---|---|
| `Reference Material/Resume/Mustafa/Resume -Editable/Mustafa_Pic.jpg` | 800×800 | ✅ **Best genuine option.** Authentic professional headshot, business attire, neutral background. Suitable for `H3`; adequate for a modest hero treatment |
| `Reference Material/Resume/Mustafa/Mustafa_Photo.jpg` | 457×457 | ✅ Same genuine headshot, lower resolution. Small sizes only |
| `Reference Material/Resume/Mustafa/Mustafa_AI_Photo.jpeg` | 1254×1254 | ⛔ **AI-generated / AI-enhanced portrait. Must not be used.** Highest resolution and most polished — and therefore the most dangerous. A synthetic portrait on a page claiming *a real practitioner teaches this* falsifies the very claim it decorates, and would breach `HD-7` and DR-02 §7 |
| `Reference Material/Trainer Photos/` — 3 files | ~1179×777 | ⛔ **Not training photographs despite the folder name.** They are recreational cricket-team photographs from a corporate sports event. Unusable for any Homepage purpose |

> ### ⚠️ Content-production dependency — the most significant asset gap
>
> **The repository contains no genuine photography of expert-led delivery** — no teaching, no session, no room, no participants. `H1` and `H4` are the sections that most need it, and no design technique substitutes for it.
>
> **Required, and outside this stage:** commission or supply genuine photography of real delivery. Until it exists, `H4` must be carried by **typography, diagram and structure** rather than by imagery. ⛔ Stock photography and AI-generated imagery are both prohibited substitutes.

### 16.3 Photography and imagery principles
- **Authenticity is non-negotiable.** Genuine photographs of genuine people in genuine contexts, or no photograph.
- ⛔ **Banned:** AI-generated portraits or scenes · stock photography of people at laptops · glowing brains · humanoid robots · binary-code backgrounds · handshake imagery (Blueprint `:1607`; `MOCKUP_SPECIFICATION.md` §16.9).
- **Regional truth.** The audience is Southeast Asia, the Middle East and beyond. Imagery must reflect it without tokenism.
- **Diagram over photograph** wherever a diagram carries the meaning better — this is the fallback while delivery photography does not exist.
- **A photograph of one person is not a weakness.** Presented with confidence and substance it is stronger than a synthetic crowd.

### 16.4 Layout and hierarchy principles
- One dominant element per section; exactly one primary action per screen (`MOCKUP_SPECIFICATION.md` §16.2)
- Generous whitespace — restraint is the credibility signal for a trust product
- **The `Feature` card treatment appears at most once** on the page
- Sections must degrade gracefully at *n* = 1 for every repeatable component
- Two-rail maximum; 8px grid; content max-width and reading measure per the existing design foundation

### 16.5 How to avoid a generic course-marketplace appearance
| Marketplace pattern | Do instead |
|---|---|
| Card grid of thumbnails with titles and prices | A short, dignified list with outcomes and delivery formats |
| Star ratings, enrolment counts, "bestseller" badges | A named practitioner and a published rubric |
| Category tiles with counts | Capability areas with no counts |
| "Browse", "catalogue", "enrol now" | "Explore programmes", "register interest", "talk to us" |
| Video thumbnails and play affordances | Diagrams, and a description of what happens in the room |
| Faceted search above the fold | No search on `P01` |

---

## 17. Screen dependencies and open-decision impact

### 17.1 Dependencies

| Dependency | Classification | Note |
|---|---|---|
| `P05` Diagnostic | **Existing and reusable** | Built and working. ⛔ Not redesigned here |
| `P06` Diagnostic Result | **Existing but requires later reconciliation** | ⚠️ Currently renders *"Your recommended path"*, numbered milestones and a **"Start this path"** CTA — retired-model vocabulary in working code. Expected divergence per the mockup `README.md`; **must not be treated as a correct baseline.** Reconciliation is separately authorised work |
| `P24` Scheduled Offerings | **Missing — new screen** | The primary CTA's destination. Does not exist |
| `P10` Programme Detail | **Missing — new screen** | Reframed from the retired path-detail concept |
| `P23` Expert Profile | **Missing — new screen** | `H3`'s "read more" destination |
| `P17` Corporate & Funding | **Missing — new screen** | Specified in `MOCKUP_SPECIFICATION.md` §4; not implemented. ⛔ Not redesigned here |
| `P19` Corporate Enquiry | **Missing — new screen** | The corporate CTA's true destination |
| `P15` Credential Detail | **Missing — new screen** | `H7`'s destination |
| `P16` Public Verification | **Missing — new screen** | Footer utility link |
| `N01`/`N03` Knowledge | **Missing — new screens** | `H9`'s low-emphasis destination |
| Public navigation | **Existing but requires reconciliation** | `PublicShell.tsx` carries retired nav and the standards-council footer |
| Design foundation | **Existing and reusable** | Tokens and primitives retained unchanged (DR-02 `:380`) |
| Genuine expert content | **Open decision / content dependency** | Permitted claims listed in §8.4; founder confirmation required |
| Genuine delivery photography | **Missing — content dependency** | §16.2 |
| Programme inventory | **Open decision** | `HO-2` |

> ### ⚠️ Governing dependency finding
> **`P01` is the entry point to a set of screens that do not yet exist.** Nine of its destinations are unbuilt. Any Homepage implementation before those exist will either dead-end or require placeholder destinations. The visual design stage may proceed on this specification; **implementation sequencing must account for this.**

### 17.2 Where open decisions affect the design

*Design around the uncertainty rather than inventing an answer.*

| Open decision | Design accommodation |
|---|---|
| `HO-1` programme vs offering emphasis | `H5` structured to support either; neither selected |
| `HO-2` launch inventory | Three states specified (§10) |
| `HO-3` capability-area scope | Count-agnostic layout (§11.5) |
| `HO-4` naming | Wordmark treated as a variable |
| `HO-6` diagnostic noun | CTA **shape** fixed; noun left open |
| `HO-7` pricing | No price surface on `P01` |
| `HO-8` `OQ-21` | Language boundary in §12 |
| `HO-9` `OQ-22` | No assessor claims |
| `HO-10` payment | CTAs stop at *explore* and *enquire* |
| `HO-11` corporate boundary | `H8` is enquiry-shaped only |
| `HO-12` international terms | Capability stated, terms omitted |
| `HO-13` `D3` | Third slot empty |
| `HO-14` employer naming | Recommendation given (§8.6); not resolved |

---

## 18. Source material for practitioner claims

### 18.1 Authorized sources consulted
1. **Repository résumé** — `Reference Material/Resume/Mustafa/Resume -Editable/` (2-page résumé, supplied by the founder). Inspected under the authorization of this stage; not modified.
2. **Medium portfolio** — the profile page explicitly authorized for this stage.
3. **Public LinkedIn profile** — public, unauthenticated view.

*(`Reference Material/` remains out of scope for modification under the standing constraint. Inspection was explicitly authorized for this stage; nothing was modified, moved, copied, staged or committed.)*

### 18.2 Factual versus inferred
Every claim in §8.4 Tier 1 appears in **at least one authorized source and is consistent with the others.** Tier 2 items appear in a **single** source or are inherently volatile. Nothing in §8.4 is inferred, extrapolated or generated.

### 18.3 ⚠️ Identified source conflict — must be resolved by the founder before publication
**Current employment.** The repository résumé's most recent listed role ends **September 2025**; the public LinkedIn profile shows a **different current employer**. The Homepage must not state a current role or employer until the founder confirms what should be published. See §8.6 for the recommendation to omit employer entirely.

**Volatile figures.** Follower counts differ between sources, and podcast episode counts increase over time. Neither is recommended as Homepage copy.

### 18.4 Standing rule
> External profile information is **source material for determining what genuine credibility may responsibly be represented** — it is not approved product copy. Every factual claim requires founder confirmation before publication.

---

## 19. What this document does not authorize

⛔ No modification of `project-artifacts/mockup/` — no `.ts`, `.tsx`, `.css`, component, page, route, navigation or fixture data
⛔ No redesign of `P05`, `P06` or `P17`
⛔ No creation of `P10`, `P23`, `P24`, `P15`, `P16`, `P19` or any other screen
⛔ No image creation, modification, copying, relocation or generation
⛔ No expert profile, programme, scheduled offering, date, price or capacity data
⛔ No schema, migration, API, table or service
⛔ No resolution of any item in §3.2
⛔ No modification of `DR-01`, `DR-02`, the three root specifications, architecture documents, ADRs, or execution documents
⛔ No visual design, layout, colour selection or pixel-level specification

---

## 20. Recommended next stages

1. **Product-owner decisions** — `HO-1` through `HO-4` at minimum. `HO-2` and `HO-4` are prerequisites the WBS already records as blocking (WP 4.4.1 blocks 4.1.1, which precedes 4.1.2; WP 4.4.2 is recorded as blocking the Homepage directly).
2. **Founder confirmation of the §8.4 permitted-claims list**, and resolution of the §18.3 conflict.
3. **Genuine delivery photography** — commissioned or supplied (§16.2).
4. **Homepage Visual Design** — separately authorised, taking this document as its brief.
5. **Homepage Implementation** — separately authorised, and sequenced against the missing-screen dependency in §17.1.

---

*P01 Homepage Redesign Specification v1.0 · 2026-08-31 · Specification only — implementation not authorized.*
