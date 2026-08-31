# Decision B — Authentication: Full Analysis

> **Status: RECOMMENDATION ONLY — PENDING HUMAN APPROVAL** · **ADR-006**
> **Created:** 2026-08-30 · All external facts verified **2026-08-30**; they expire.
> Prepared under `TECHNOLOGY_DECISION_FRAMEWORK.md` and AP-12 (ADR-042).

---

## 0. Candidates, precisely identified

| Candidate | What is actually being evaluated | `[FACT 2026-08-30]` |
|---|---|---|
| **Better Auth** | `better-auth` 1.7.2, MIT, self-hosted library | Published 2026-08-26; repo created 2024-05-19; 29,754 stars; pushed today |
| **Auth.js — stable version** | **`next-auth` 4.24.15, ISC** — this *is* the stable line | v5 has **never** been published to `latest`; it remains `5.0.0-beta.32`. "Auth.js stable" therefore means **v4**, not v5 |
| **Clerk** | Hosted authentication SaaS | Hobby free ≤50,000 MRU; Pro $25/mo; Business $300/mo |

`[ANALYSIS]` **This identification matters.** Earlier documents compared "Auth.js" as though a modern stable release existed. It does not. Evaluating Auth.js honestly means evaluating **v4** — a maintained but legacy line — or accepting a perpetual beta.

---

## A. Cost and AP-12 fit

| | Better Auth | Auth.js v4 | Clerk |
|---|---|---|---|
| Open source | ✅ Yes | ✅ Yes | ❌ No |
| Licence | MIT | ISC | Proprietary |
| Self-hostable | ✅ Yes | ✅ Yes | ❌ No |
| Commercial use restrictions | None | None | None on the free tier `[UNVERIFIED — no explicit restriction found; not positively confirmed]` |
| **Local development without network dependency** | ✅ Fully offline | ✅ Fully offline | ❌ **Requires a Clerk account and network** in dev and CI |
| Free-tier limits | n/a | n/a | 50,000 Monthly Retained Users |
| Credit card required | No | No | `[UNVERIFIED]` — billing FAQ URL returned 404 |
| **Mandatory future paid dependency** | None | None | ⚠️ **Yes — enterprise SSO.** Pro $25/mo + **$75/mo per SSO connection** |
| Scaling cost risk | None | None | $0.02/MRU above 50k, decreasing at volume |
| **AP-12 tier** | **Tier 1** | **Tier 1** | **Tier 2 → Tier 3 at SSO** |

### Free Tier Qualification Test — Clerk

| # | Check | Result |
|---|---|---|
| 1 | Commercial use permitted | `[UNVERIFIED]` No restriction found, but not positively confirmed. **Must be confirmed before selection** |
| 2 | Intended use complies with ToS | `[UNVERIFIED]` |
| 3 | Credit card required | `[UNVERIFIED]` |
| 4 | Supports normal development | ✅ Yes — but **requires network and a vendor account** |
| 5 | Supports MVP validation | ✅ Yes — 50k MRU vastly exceeds MVP scale (~25 learners + one cohort) |
| 6 | Hidden mandatory paid dependency | ⚠️ **Yes — enterprise SSO**, which the Blueprint names as an enterprise sales gate |
| 7 | Data exportable | ✅ **Yes — see §C** |
| 8 | Trigger for mandatory payment | First enterprise SSO connection, or exceeding 50k MRU |

### No Paid Surprise lifecycle

| Stage | Better Auth | Auth.js v4 | Clerk |
|---|---|---|---|
| Local development | Free | Free | **Free, but account + network required** |
| Automated testing | Free | Free | **Free, but CI depends on a third party** |
| Preview environment | Free | Free | Free |
| MVP validation | Free | Free | Free (≤50k MRU) |
| **Initial commercial production** | **Free** | **Free** | **Free** — no non-commercial restriction found |
| Growth / scale | Free | Free | $0.02/MRU >50k; **+$75/mo per SSO connection** |

`[ANALYSIS]` Clerk does **not** have the Vercel problem — no non-commercial restriction was found, and MVP volumes sit far inside the free tier. Its cost trigger is a *capability* (enterprise SSO), not a *volume*. That is a more predictable cliff, but it arrives precisely when the corporate motion the Blueprint describes starts closing enterprise deals.

---

## B. Identity architecture — who owns business identity

**`[APPROVED]` Non-negotiable (ADR-020, AP-04):** our PostgreSQL must remain the authoritative source for the internal immutable user ID, profile, application roles, permissions, organisation membership, enrolments, certification records and examination records. **Authentication technology must never become the authoritative source for product authorization or business identity.**

### The pattern that satisfies this, for all three options

```
OUR DATABASE (authoritative)                    AUTH PROVIDER (authentication only)
┌──────────────────────────────────┐
│ users                            │            ┌────────────────────────────┐
│   id  ← OUR immutable UUID       │◀───────────│ provider subject / user id │
│   email, name, photo, country    │  mapping   │ credentials, sessions,     │
│   target_role                    │            │ social links, MFA factors  │
├──────────────────────────────────┤            └────────────────────────────┘
│ auth_identities                  │
│   user_id → users.id             │   ← the ONLY place a provider ID appears
│   provider, provider_subject     │
├──────────────────────────────────┤
│ user_roles (scope_type,scope_id) │  ← authorization: ALWAYS ours
│ enrolments · candidacies         │
│ credentials · assessment records │  ← business identity: ALWAYS ours
└──────────────────────────────────┘
```

**Rule `[ANALYSIS]`:** a provider's user ID is a **mapping**, never a foreign key from business tables and never the primary key. Every business record references our own UUID. A provider change then rewrites one mapping table and nothing else.

### How each option behaves under that rule

| | Better Auth | Auth.js v4 | Clerk |
|---|---|---|---|
| Where credentials live | **Our PostgreSQL** | **Our PostgreSQL** | **Clerk's systems** |
| Where sessions live | Our PostgreSQL | Our PostgreSQL (database strategy) or JWT | Clerk |
| Does it create its own tables? | **Yes** — its CLI generates and owns `user`, `session`, `account`, etc. | Yes, via the adapter's schema | n/a |
| Can our `users` table be the authoritative business identity? | ✅ Yes — but **requires deliberate separation** (below) | ✅ Yes — same requirement | ✅ Yes — via the mapping table |
| Roles / permissions | Organization plugin exists — **must not be adopted as the authorization source** | No opinion on roles | Organizations exist — **must not be adopted as the authorization source** |

> **`[ANALYSIS]` The subtle trap is the same for Better Auth and Clerk, in opposite directions.** Both offer organisation, role and permission features that look like exactly what `ADR-020` describes. Adopting either would move authorization out of our database and into a dependency — violating AP-04 and ADR-020. **Whichever option is chosen, the organisation/roles feature is explicitly out of scope**, and `user_roles` in our PostgreSQL remains the only authorization source of truth.

`[ANALYSIS]` **Because Better Auth owns its own tables**, the design must keep our business `users` row distinct from Better Auth's `user` row, joined by the mapping — rather than letting Better Auth's table become the application's user table. The convenient shortcut is precisely the thing that would create the lock-in that self-hosting was supposed to avoid.

**Under this pattern the identity-ownership gap between hosted and self-hosted narrows substantially.** It does not close: with Clerk, credentials and MFA factors still live with a third party, and sign-in availability depends on it.

---

## C. Portability and exit

| | Better Auth | Auth.js v4 | Clerk |
|---|---|---|---|
| User export | Direct SQL — it is our database | Direct SQL | ✅ **Dashboard CSV export or `getUserList()` Backend API** `[FACT]` |
| **Password hash portability** | ✅ Ours; format is ours to read | ✅ Ours | ✅ **"includes their hashed passwords"** `[FACT]` — **algorithm not stated in that document** `[UNVERIFIED]` |
| Social identity portability | Provider subject IDs in our DB → re-linkable | Same | Exportable; re-linking requires matching provider subject IDs `[UNVERIFIED whether subjects are included]` |
| MFA portability | TOTP secrets in our DB | n/a (limited MFA in v4) | ⚠️ `[UNVERIFIED]` — MFA factors typically do **not** migrate; users re-enrol |
| Session migration | Sessions are ours; can be preserved | Ours | ❌ Sessions end at migration — users sign in again |
| **Stable internal identity after migration** | ✅ Guaranteed by the mapping pattern | ✅ | ✅ Guaranteed by the mapping pattern |
| Progressive migration feasible | ✅ High | ✅ High | ⚠️ Medium — usually a cutover |
| **User disruption during migration** | **None to minimal** | None to minimal | **Low, if hashes import cleanly; high if they do not** |
| **Exit complexity** | **Low** | **Low** | **Medium** |

> **`[FACT]` This corrects my earlier position.** I previously flagged as the decisive unknown whether Clerk exports password hashes — warning that if it did not, every user would have to reset their password. **Clerk's documentation states the export includes hashed passwords**, available by dashboard CSV and by API. Clerk's portability is materially better than I represented it, and its exit complexity drops from *medium-to-high* to *medium*.
>
> Two caveats remain: the **hash algorithm is not stated** in that document (the receiving system must support it), and **MFA factors and sessions do not migrate**. Users would keep their passwords but re-enrol MFA.

---

## D. Technical and operational maturity

| | Better Auth | Auth.js v4 | Clerk |
|---|---|---|---|
| Current stable status | ✅ **1.7.2 stable**, published 2026-08-26 | ✅ **4.24.15 stable**, published 2026-07-20 | ✅ Commercial product |
| Successor line | — | ⚠️ **v5 beta.32, never released stable** | — |
| Maintenance activity | Very high — repo pushed 2026-08-30 | Moderate — repo pushed 2026-07-22 | Vendor-maintained |
| Age | Created 2024-05-19 (~2 years) | Since 2020 | Established |
| Next.js compatibility | Designed for modern Next.js | ✅ App Router supported via `getServerSession`; ⚠️ **middleware supports JWT sessions only** `[FACT]` | Full |
| Email/password | ✅ | ✅ | ✅ |
| Social login | ✅ | ✅ | ✅ |
| Future enterprise SSO | ✅ Plugin, self-hosted, no per-connection fee | ⚠️ Significant own work | ✅ Configuration — **$75/mo per connection** |
| MFA / passkeys | ✅ Built in | ⚠️ Limited | ✅ Included in Pro |

### Security history — `[FACT verified 2026-08-30, GitHub Advisory Database]`

| | Published advisories | Severity profile | Pattern |
|---|---|---|---|
| **Better Auth** | **20** (2025-02 → 2026-07) | 2 critical, ~11 high | Steady stream; **8 disclosed on 2026-07-07 alone** — the signature of a coordinated audit and responsible disclosure |
| **Auth.js / next-auth** | **14** (2021-02 → 2026-07) | 4 critical, 4 high | Spread over 5 years; **4 disclosed 2026-07-23**, two critical |
| **Clerk** | **Not comparable** | — | Closed-source SaaS; vulnerabilities are not published as ecosystem advisories |

> **`[ANALYSIS]` This data must be read carefully, because the naive reading is wrong in three ways.**
>
> **1. Advisory count is not a risk ranking.** A library with many advisories is one that is being audited and is fixing what is found. A library with none may simply be unexamined. Both open-source candidates received significant disclosure clusters in July 2026 — that is the security ecosystem working, not failing.
>
> **2. Clerk's absence from this table is an artifact, not a result.** A closed-source SaaS does not publish GHSA entries. **Comparing open-source advisory counts against a SaaS with no public disclosure stream systematically flatters the SaaS**, and I will not present it as evidence that Clerk is more secure. What can fairly be said is that Clerk employs a dedicated security team and patches without any action from us.
>
> **3. Where the issues sit matters more than how many.** Better Auth's disclosures concentrate heavily in **plugins**: `oidc-provider` (4), `api-key`, device authorization, SCIM, magic-link, anonymous sessions. **This project needs none of those.** But not all are peripheral — the 2026-04-03 critical (2FA bypass via premature session caching), the IPv6 rate-limiter bypass, and the OAuth state-handling issues touch surfaces closer to core.
>
> **Honest conclusion:** Better Auth's advisory density is high for a two-year-old library, and that is a genuine consideration for the sign-in path of a trust product. It is *mitigable by scope* — most disclosed issues are in features we would not enable — but mitigation-by-scope is a commitment that must be recorded and honoured, not an assumption.

---

## E. Complexity

| | Better Auth | Auth.js v4 | Clerk |
|---|---|---|---|
| Setup complexity | Medium — configure, generate schema, wire routes | Medium — provider config plus an adapter | **Lowest** — hosted components |
| Operational complexity | Low — no new infrastructure; uses approved PostgreSQL | Low | **Lowest** — nothing to run |
| Database requirements | Its own tables in our PostgreSQL | Adapter tables in our PostgreSQL | None |
| Migration complexity (in) | Low | Low | Low |
| Migration complexity (out) | Low | Low | Medium |
| **Long-term maintenance burden** | ⚠️ **Highest** — frequent security releases demand prompt patching | Moderate; ⚠️ **plus an eventual forced move off v4** | **Lowest** — vendor patches without us |

`[ANALYSIS]` The maintenance columns invert the setup columns, and the second is the one that lasts. Clerk is cheapest to adopt and most expensive to leave; Better Auth is cheapest to leave and most demanding to keep patched; Auth.js v4 is comfortable now and carries a deferred, unavoidable migration.

---

## Summary

| Option | Free/Open | Commercial Use | Identity Ownership | Portability | Maturity | Complexity | Lock-in | AP-12 Fit | Recommendation |
|---|---|---|---|---|---|---|---|---|---|
| **Better Auth** | ✅ MIT | ✅ Unrestricted | ✅ **Ours** | ✅ **High** | ⚠️ Stable but young; high advisory density | Medium setup, **high patch burden** | **Low** | ✅ **Tier 1** | ✅ **Recommended, with conditions** |
| **Auth.js v4** | ✅ ISC | ✅ Unrestricted | ✅ Ours | ✅ High | ⚠️ Stable but **legacy — successor never shipped** | Medium; deferred forced migration | Low | ✅ Tier 1 | 🥉 Not recommended |
| **Clerk** | ❌ Proprietary | ✅ `[UNVERIFIED]` | ⚠️ Ours **only via the mapping pattern**; credentials at vendor | ✅ **Medium — better than I earlier stated** | ✅ Strongest operationally | **Lowest** setup and ops | **Medium** | ⚠️ **Tier 2 → 3 at SSO** | 🥈 **Defensible alternative** |

---

## Recommendation

### Proposed specification deviation — this must be decided explicitly

`[SPEC]` MVP Spec §9 names **"Auth.js or Clerk."** On verified current evidence, **neither satisfies the approved principles cleanly**:

- **Auth.js** — the stable line is **v4, a legacy line whose successor has never shipped**. Building the identity foundation of a multi-year product on it means accepting a known future forced migration to a release that has been in beta for years.
- **Clerk** — satisfies stability and operations, but is **Tier 2 under AP-12, becomes Tier 3 at enterprise SSO**, and requires a vendor account and network access for local development and CI, which conflicts with AP-12's local-first clause.

**I am therefore proposing a documented deviation to Better Auth rather than forcing a choice between the two named options.** Per `CLAUDE.md` Rule 5 and Rule 8, **this is your decision, not an inference I am entitled to act on.**

### Recommended: **Better Auth**, subject to five binding conditions

Free and open-source status is necessary but **not** sufficient, and the security evidence in §D is a real consideration. The recommendation therefore comes with conditions that are part of it, not caveats attached to it:

| # | Condition |
|---|---|
| **1** | **Minimum plugin surface only** — email/password, Google social, sessions. **Do not enable** `oidc-provider`, `api-key`, device authorization, SCIM, magic-link or anonymous sessions. Most disclosed advisories sit in exactly these. This is a design commitment, recorded and enforced in review |
| **2** | **Its organisation/roles features are out of scope.** `user_roles` in our PostgreSQL remains the only authorization source of truth (ADR-020, AP-04) |
| **3** | **The mapping pattern is mandatory** — our own immutable UUID as business identity; provider subjects confined to `auth_identities`; no business table ever references a provider ID |
| **4** | **Prompt patching is an operational commitment.** Its disclosure cadence means frequent security releases. Subscribe to its advisory feed and treat updates as priority work. If that commitment cannot be met, **Clerk becomes the better choice** — vendor patching is a real advantage for a two-person team |
| **5** | **Re-evaluate before public launch (Phase 1C)**, when the advisory trend over another six months will be visible |

### Runner-up: **Clerk**

Not selected because it is the only option carrying vendor cost, vendor-held credentials, and a network dependency in local development and CI — the last of which conflicts directly with AP-12's local-first clause. **But the gap is narrower than my previous analysis suggested**: the hash-export finding removes the portability objection I raised, and its operational security posture is a genuine advantage for a small team.

**Choose Clerk instead if** you weigh vendor-operated security above AP-12's cost and portability preference, or if condition 4 cannot be met. That is a legitimate reading of the same evidence — AP-12 itself states that the absence of budget is not a reason to compromise security.

### Not recommended: **Auth.js v4**
Stable and free, but its successor has never shipped. Choosing it means accepting a forced migration at an unknown future date to a release that may still be in beta when it arrives.

### What would change this recommendation

- Auth.js v5 reaching a genuine stable release → reopens the in-specification option properly
- Better Auth's advisory rate not declining over the next 6–12 months → strengthens Clerk
- Confirmation that Clerk's free tier requires a credit card or restricts commercial use → weakens Clerk against the Free Tier Qualification Test
- A corporate pilot requiring enterprise SSO immediately → Clerk delivers it as configuration, at $75/mo per connection
- A residency answer (ADR-032) constraining where identity data may live → strongly favours self-hosted
- Inability to commit to prompt patching → favours Clerk

### Approval required

| # | Decision | Gate |
|---|---|---|
| **B1** | Approve a **documented deviation** from `[SPEC]` MVP §9's two-option set | 🔴 Yours alone |
| **B2** | Select the provider — **Better Auth** (if B1 approved) or **Clerk** | 🔴 |
| **B3** | Accept conditions 1–5 as binding if Better Auth is selected | 🔴 |

**None of these authorises installation.**

> **Recommendation only — pending human approval.**
