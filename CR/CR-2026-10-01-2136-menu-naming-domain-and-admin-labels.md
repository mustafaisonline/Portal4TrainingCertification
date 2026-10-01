# CR-2026-10-01-2136 — Free Assessment naming, burger menu, domain dataainexus.com, admin Edit/Delete labels

**Received:** 2026-10-01 21:36 MYT · **Status:** PLANNED — questions in §3, awaiting the founder's "go" · **Requested by:** founder

## 1. Request (verbatim)

> New more change
>
> * http://localhost:3100/assessment
>    * Section: 'Assess your Data Foundation Check' is actually rename of section: 'The Free Assessment'
>    * Section Your results is related to section 'The Free Assessment Check'
>    * Menu name in header and footer: Free Certifications to 'Free Assessment'
> * Burger menu is not updated with all items in Header and Footer menu items. Please update accordingly.
> * We have bought domain name: dataainexus.com please update whole portal accordlingly.
>    * Please guide how to update connect digital ocean and domain name
> * http://localhost:3100/admin/interview: Plaease add option for edit and delete. Edit means Organisation will be able to add their questions and answers in the questions bank.
> * http://localhost:3100/admin/users: change Open link to Edit
> * http://localhost:3100/admin/orders: change Open link to Edit.
>
> Please create a folder where can call CR (Change Requisition) and when ever I give a new requirement or a fix any, we must create a new .md files with timestamp to record, We will also use it to implement one by one even if our limit hit or our memory goes out.

(The `CR/` folder already exists — this is its next record. A second request in the same message — Formats and Interest registration — is `CR-2026-10-01-2138-training-formats-and-interest-registration.md`.)

## 2. My understanding and the facts

| # | Item | What I understand / what exists today |
|---|---|---|
| **A** | `/assessment` section names | The page's first section is the test, currently titled **"The Free Assessment Check"**; persona card 1 is "Assess your Data Foundation". You want the **section titled "Assess your Data Foundation"** (the same name as its card), with **"Your results" clearly belonging to it** — shown *inside* that section as its "Your results" sub-section, not as a separate block. The test's own name "Free Assessment Check" stays as a small label inside the section |
| **B** | Menu label | The header and footer label (now "Assessment") becomes **"Free Assessment"**, with the address `/assessment` unchanged. The page's eyebrow/title and the Home card use the same name so the portal says one thing |
| **C** | "Burger menu is not updated with all items in Header and Footer" | Two menus could be meant. **(1) The phone menu (☰)** already lists the header items, then "More" (About Us, Schedule, FAQ, Contact Us, Search completion certificates) and "Legal" (4 policies) — built 2026-10-01 but **not yet deployed**. **(2) The avatar dropdown** (User / Trainer / Organisation / Admin Dashboard, Sign out) has **no header or footer items at all**. *Proposal:* put **every header and footer item into both menus** (the dropdown gets "Menu" + "More" + "Legal" sections under the dashboards), so whichever you open is complete |
| **D** | Domain `dataainexus.com` | The code never hard-codes the host — links, QR codes, sitemap and emails come from `APP_BASE_URL`; only deploy tooling and docs mention the old `198-199-67-177.sslip.io`. **Found by DNS lookup:** the domain (Network Solutions) uses **HostGator nameservers** and today points to a HostGator parking address `208.91.197.15` — **not your server** — and has **no mail records**. The cut-over is therefore DNS → Caddy → `APP_BASE_URL` → Stripe webhook → deploy config. **A step-by-step guide is written: `docs/operations/DOMAIN_SETUP.md`** (and summarised in the reply) |
| **E** | `/admin/interview` Edit + Delete | The roles table has a role-name link and a publish toggle but no Edit/Delete. Add **Edit** (opens the role page: details + its question bank) and **Delete** (only when safe — see Q2). "Edit means Organisation will be able to add their questions and answers in the question bank": organisations **already** add questions in their own dashboard (they wait for admin approval). *Proposal:* in the role's Edit page, the **administrator can also add a question on behalf of an organisation** (choose the organisation) — see Q3 |
| **F** | `/admin/users`, `/admin/orders` | The link at the end of each row reads "Open"; it becomes **"Edit"** (accessible name kept, e.g. "Edit Aisha"). Same for any other admin list that says "Open" for the same action *(I will list them before changing)* |

## 3. Questions (recommendations in *italics*)

1. **Q1 — Which burger menu?** *Both, as in C.* Tell me if you meant only one.
2. **Q2 — Deleting an interview role.** A role may have questions, test attempts and organisation links. *Recommended: **Delete is allowed only when the role has no test attempts**; it then removes the role, its questions and its organisation links (after a confirmation that shows the counts, audited). A role that has attempts can only be **unpublished** (the page says so). Never delete results.* OK?
3. **Q3 — "Edit" for organisations.** *Recommended: keep organisations adding their own questions in their dashboard (admin approves) AND let the administrator add a question on an organisation's behalf from the role's Edit page.* Or did you mean something else?
4. **Q4 — Domain.** After DNS works: keep the old `sslip.io` address as a **permanent redirect** (so certificate QR codes already issued keep verifying)? *Recommended: yes, permanently.* Also: should the "official" website address of the portal appear anywhere else (for example the Contact page)? *Recommended: no, it appears automatically wherever a link is needed.*
5. **Q5 — "Free Assessment" for the whole page.** The page also hosts Organisation screening (free to candidates). *Recommended: use "Free Assessment" as the menu/page name, as asked.*

## 4. Plan (one step at a time on the founder's "go")

| # | Step | Needs | Schema? |
|---|---|---|---|
| 1 | `/assessment`: rename the section, nest "Your results"; "Free Assessment" in header, footer, page eyebrow, Home card; tests + docs | — | No |
| 2 | Burger menu: header + footer items in the phone menu (done, undeployed) **and** the avatar dropdown; tests | Q1 | No |
| 3 | Admin lists: "Open" → "Edit" (Users, Orders, and any same-pattern list); tests | — | No |
| 4 | `/admin/interview`: Edit and Delete per role (delete only with no attempts), admin "add question for an organisation"; tests | Q2, Q3 | No (a delete function in the repository) |
| 5 | Domain: **you** do DNS, Caddy, `APP_BASE_URL`, Stripe (guide); **I** then switch `deploy/config.env`, add the legacy redirect to `Caddyfile.example`, update docs, deploy and verify | DNS live | No |

## 5. Tracker

| # | Step | Status | Updated |
|---|---|---|---|
| 0 | CR written; DNS facts gathered; `docs/operations/DOMAIN_SETUP.md` written | **DONE** | 2026-10-01 |
| 1–4 | Build | **BUILT, VERIFIED, COMMITTED and DEPLOYED** (`401f642`, live in `v2026.10.02-1`) | 2026-10-02 |
| 5a | DNS (HostGator A records → Droplet) · Caddy · `APP_BASE_URL` | **DONE** — live and verified from outside | 2026-10-02 |
| 5b | Stripe webhook URL → `https://dataainexus.com/api/stripe/webhook` | **DONE** — founder: Stripe Send test webhook returned 200 | 2026-10-02 |
| 5c | `deploy/config.env` DOMAIN + `Caddyfile.example` legacy redirect | **DONE**, committed with this entry; proven by the next governed deploy | 2026-10-02 |

## 6. Progress log

| Date (MYT) | Entry |
|---|---|
| 2026-10-01 21:36 | CR created from the founder's message. DNS investigated read-only: registrar Network Solutions, HostGator nameservers, A → 208.91.197.15 (parking), no MX. `docs/operations/DOMAIN_SETUP.md` written (two DNS routes, Caddy file incl. the permanent legacy redirect, `APP_BASE_URL`, Stripe webhook, deploy-config switch). **No code changed.** |
| 2026-10-01 21:50 | Steps 1–4 built on the founder's "go ahead with CR 1". **1** `/assessment` section = "Assess your Data Foundation" with "Your results" nested; header/footer/Home card/eyebrow say "Free Assessment". **2** the avatar dropdown carries Menu + More + Legal (every header and footer item) under the dashboards. **3** Users and Orders lists: "Open" → "Edit". **4** `/admin/interview`: Edit link, publish toggle and Delete (portal confirmation; refused when the role has test attempts — unpublish instead; audit `assessment_role.deleted`); the role page's add-question form can add on an organisation's behalf (pending/approved, the organisation's own question, not the shared bank). No schema change. Tests: new `tests/e2e/cr-2136-menus-and-admin-labels.spec.ts` (5 passed, axe light+dark), `deleteRole` integration test; Vitest 701 passed; `next build` clean. |
| 2026-10-02 22:00 (MYT) | Cut-over executed. Founder had pointed `@`/`www` at `198.199.67.177` (Route B, HostGator zone); ran the Caddy and `APP_BASE_URL` steps as root (backups `Caddyfile.bak-*`, `production.env.bak-*` on the server). Verified externally: `https://dataainexus.com` 200 with a Let's Encrypt certificate; `www.dataainexus.com` and `198-199-67-177.sslip.io` (+www) → 301 to the apex preserving the path; `/sitemap.xml` and `/robots.txt` use `https://dataainexus.com`; `/api/health` db up; pages still `noindex, nofollow`. Rollback: restore the two `.bak-*` files, `systemctl reload caddy`, `pm2 reload p4tc-production`. |
