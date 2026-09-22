# Milestone 8 — "Trainer / admin operations" · Completion Report

> **Status: IMPLEMENTED · TESTED (existing-schema scope) · §5 items await founder approval** · 2026-09-23
> Plan: [`MILESTONE_8_EXECUTION_PLAN.md`](MILESTONE_8_EXECUTION_PLAN.md) (§2 items 1, 2, 3, 6 here; items 4, 5, 7 in Part 2). **§5 items were not built** — every one still requires founder approval.
> Instruction: founder's overnight instruction of 2026-09-22; executed 2026-09-23 on `feat/production-foundation`. Commit `a2b820d` (both parts, code and tests) · `64728c8` (plan) · not pushed.

---

## Part 1 — Navigation, overview, orders, enquiries, reports

### Requested task
Plan §2 items 1, 2, 3 and 6 on the existing schema only: an admin navigation source and sub-navigation bar; the overview page as a live status board; read-only orders & payments with filters, totals and a detail; enquiries with status filter, search, detail and Mark replied / Close / Reopen with an audit row; five server-computed reports with CSV download through a session- and role-gated route handler; unit, integration and e2e tests; axe on every new page.

### Understanding / scope
- Everything reads and writes tables that already exist. **No schema change, no migration, no new dependency, no new external service.**
- Orders are **read-only** (plan §3 G1): refunds are viewed, and the screens say refunds on behalf of a participant are made from the Stripe dashboard until §5 A2 is decided.
- Enquiry states stay `new · replied · closed`; Reopen returns to `new` (G2). No email is sent from the admin screens.
- Reports use **MYT calendar months** and **the order's own currency**, no FX (G5). Processing fees are reported "where known" — the count of orders carrying a fee is shown next to the sum so a partial figure is never mistaken for a total.
- Out of scope and untouched: `/admin/users`, `/admin/audit`, `/api/me/export`, `app/account/**`, `tests/helpers/*`, `prisma/**`, `project-artifacts/**`.

### Changes made (files)
| Area | File | What |
|---|---|---|
| Navigation | `src/shared/chrome/admin-nav.ts` (new) | One list of all nine admin entries (Overview · Offerings · Orders · Enquiries · Reviews · Certificates · Users · Audit log · Reports) and `isAdminItemActive` (Overview exact, others prefix) |
| | `src/shared/chrome/AdminNav.tsx` (new) | Client bar: `nav aria-label="Admin"`, horizontal, scrolls sideways on mobile, `aria-current="page"` — the AccountFrame treatment |
| | `app/admin/layout.tsx` | Renders `AdminNav` above every admin screen. **Gate unchanged** (`authorise("platform_admin")`, sign-in redirect / 403) |
| Overview | `app/admin/page.tsx` | Status board: pending reviews, open (new) enquiries, certificates issued and expiring within 30 days, confirmed registrations on upcoming dates, revenue this MYT month per currency (paid orders minus succeeded refunds), last reminder run (newest `job.run` audit row for `certificate-reminders`, else "Not yet"). Every card links to its screen. Existing test ids kept: `admin-title`, `admin-offerings-link`, `admin-reviews-pending`, `admin-reviews-link`, `admin-certificates-issued`, `admin-certificates-link`, `admin-certificates-fee-link` |
| Orders | `src/modules/commerce/admin-orders.repository.ts` (new) | `listOrdersForAdmin({status, kind, currency, from, to, q, page})` with totals (count, sum by currency) over the **filtered set**; `getOrderForAdmin(id)` with buyer, payment (amount, fee, receipt, intent, charge), refunds, registration (cancellation, transfer facts), renewal/certificate code, and the audit rows for the order, its registration and its refunds merged oldest-first; `listOrderCurrencies()`. `q` is an order uuid or part of the buyer email; dates are inclusive MYT calendar days on `created_at`; unparseable dates are ignored |
| | `app/admin/orders/page.tsx` (new) | Filters via GET, table (`order-row`), totals line (`admin-orders-totals`, `admin-orders-count`), pagination, read-only note |
| | `app/admin/orders/[id]/page.tsx` (new) | Detail (`order-detail`), payment/refunds/registration/history cards; 404 for an unknown id |
| Enquiries | `src/modules/catalogue/enquiries/admin.repository.ts` (new) | `listEnquiriesForAdmin({status, kind, q, page})`, `getEnquiryForAdmin`, `countOpenEnquiries`, `setEnquiryStatus(tx, id, actor, status)` — update + `enquiry.status_changed` audit `{status}` before/after in the caller's transaction; same-status call is a no-op with no audit row |
| | `src/modules/catalogue/enquiries/admin.actions.ts` (new) | `setEnquiryStatusAction(prev, formData)` — authorises `platform_admin` first, `withTransaction`, `revalidatePath` |
| | `app/admin/enquiries/page.tsx`, `app/admin/enquiries/[id]/page.tsx`, `app/admin/enquiries/EnquiryStatusActions.tsx` (new) | List (`enquiry-row`), detail with the message as text (`enquiry-message`), status chip (`enquiry-status`), buttons Mark replied / Close / Reopen (the current state's button is hidden), history table from `audit_log` |
| Reports | `src/modules/reports/csv.ts` (new) | `toCsv(headers, rows)`: RFC 4180 (CRLF records, quoting of `,` `"` CR LF, doubled quotes); **formula-injection guard** — a string starting with `=` `+` `-` `@` tab or CR is prefixed with `'`; numbers are emitted raw. `csvFilename` |
| | `src/modules/reports/months.ts` (new) | MYT month keys, ranges (via the certificate zone helper), labels |
| | `src/modules/reports/queries.ts` (new) | `registrationsPerOffering`, `revenueByMonth({month?})`, `certificatesSummary(now)`, `reviewsByState`, `enquiriesByStatus`, plus `confirmedUpcomingRegistrations`, `lastJobRun` for the board |
| | `src/modules/reports/registry.ts` (new) | Catalogue of the five reports; each built once as typed rows and projected to `display` (page) and `rows` (CSV) |
| | `app/admin/reports/page.tsx` (new) | Each report as a table with "Download CSV" |
| | `app/admin/reports/[report]/csv/route.ts` (new) | `GET` gated by `authorise("platform_admin")` itself (route handlers are outside the layout): signed out → redirect to sign-in; no role → 403; unknown key → 404; `text/csv; charset=utf-8`, `Content-Disposition: attachment`, `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` |
| Tests | `tests/unit/admin-nav.test.ts`, `tests/unit/csv.test.ts`, `tests/integration/admin-operations.test.ts`, `tests/e2e/admin-operations.spec.ts` (new) | See below |

### What was not changed
- `prisma/schema.prisma`, migrations, seed — untouched (Rule 1).
- Authentication and authorisation architecture — unchanged; every new screen sits behind the existing `platform_admin` gate and every new write/route re-authorises itself.
- `app/admin/users/**`, `app/admin/audit/**`, `app/api/me/**`, `app/account/**`, `tests/helpers/*`, `playwright.config.ts`, `next.config.ts`, `package.json` — not touched by Part 1.
- No existing admin page other than `layout.tsx` and `page.tsx` was modified; `certificates/repository.ts` was not edited (the certificate status predicates are re-stated in `reports/queries.ts` with a pointer to their source).

### Testing
| Layer | What | Result |
|---|---|---|
| Type-check | `npx tsc --noEmit --incremental false` over the whole tree (including the other agents' uncommitted files) | **clean** |
| Unit | `admin-nav.test.ts` (12: href shape, no duplicates, full list/order, a page exists under `app/` for every href — skips with a message for `/admin/users` and `/admin/audit` if Part 2 has not landed; `isAdminItemActive`), `csv.test.ts` (17: quoting cases, CRLF, padding, formula prefix for each trigger, negative numbers not guarded, filename) | **29 passed** |
| Integration (real test DB) | `admin-operations.test.ts` (13): orders search/filters/totals/date range/id lookup, detail with fee, refund, cancellation facts and merged audit; enquiry replied → closed → reopened with three audit rows and before/after, no-op writes nothing, unknown id refused; MYT month boundaries; revenue by month equals Prisma aggregates for gross, refunds, net, known fees; registrations per offering equals direct counts; certificates summary sums to issued; reviews/enquiries equal `groupBy`; `lastJobRun`; every report builds with consistent widths and a correct CSV header row | **13 passed** |
| Full Vitest | `npx vitest run` | **38 files, 375 tests passed** |
| E2E (Playwright, `tests/e2e/admin-operations.spec.ts`, 5 tests) | sub-nav with all nine entries and `aria-current`; overview figures render; orders list by email with totals, status filter to empty, detail with payment/registration/history, 404 for unknown id; enquiry list, status filter, detail message as text, Mark replied / Close / Reopen with the audit rows appearing and persisted with before/after; reports page, CSV download (200, `text/csv`, attachment filename, `no-store`, header row, CRLF), registrations CSV header, 404 for unknown key; participant gets **403** on `/admin`, `/admin/orders`, `/admin/orders/[id]`, `/admin/enquiries`, `/admin/enquiries/[id]`, `/admin/reports` and on the CSV route; signed-out CSV request redirects to sign-in; **axe clean** (WCAG 2.0/2.1/2.2 A+AA) on overview, orders list, order detail, enquiries list, enquiry detail (before and after actions), reports | **5 passed** |

**How the e2e run was performed.** Next.js 16 holds a lock on `.next/dev` and refuses a second `next dev` in the same directory; another session's dev server (port 3100, dev database) was running in the repository throughout. The Playwright spec was therefore executed from an exact copy of the working tree in the session scratchpad (rsync of the tree, APFS clone of `node_modules`, same `playwright.config.ts`, same `DATABASE_URL_TEST`), on port 3101, and the copy was deleted afterwards. No process that this session did not start was touched. The orchestrator should re-run `npm run test:e2e -- tests/e2e/admin-operations.spec.ts` in the repository once port 3100 is free.

One axe finding surfaced and was fixed during the run: the report tables scroll horizontally and held nothing focusable (`scrollable-region-focusable`); the scroll container is now a focusable labelled region.

### Documentation updated
- This report (draft).
- Code comments cite the plan sections and defaults (G1, G2, G5) at each screen and module.
- No specification or ADR was changed. `MILESTONE_8_EXECUTION_PLAN.md` is not edited by the Part 1 agent (status line to be flipped by the orchestrator).

### Risks or observations (not acted upon)
1. **`registration.transferred` column is always zero** in the registrations report — by design of M4 (a transfer moves the same row). The report says so in its note.
2. **Revenue "net" is net of refunds only.** Fees are a separate column with the count of orders that carry one, because Stripe reports the fee asynchronously and an unknown fee is not zero.
3. **CSV has no UTF-8 BOM.** RFC 4180 output; Excel on Windows may mis-read non-ASCII names in a double-clicked file (opens correctly via Import). Adding a BOM is a one-line change if the founder prefers Excel convenience.
4. **Month label** uses fixed English abbreviations rather than `Intl` because ICU versions disagree on the en-GB short form of September ("Sep" vs "Sept").
5. The order detail links "Open user" to `/admin/users/[id]` and the reminders card links to `/admin/audit` — both Part 2 routes; they now exist in the tree but were not visited by the Part 1 e2e.
6. `admin-nav.test.ts` asserts a page file exists for every nav href; with Part 2 present it runs 12/12 with no skips.
7. Pre-existing console noise during e2e (`Encountered a script tag while rendering React component`, Better Auth `ECONNRESET` on sign-out) is unrelated to this milestone.

### Human decisions required
- None for Part 1 to ship. The plan's §5 items (A1–A7: organisations, refund-on-behalf rule, invoices, attendance, account deletion, two-person rule, trainer role semantics) remain **open founder decisions** and were not implemented.
- Optional: confirm the CSV BOM preference (observation 3).

---

## Part 2 — Users & roles, audit log, data export

### Changes made (files)
| Plan item | Files | What |
|---|---|---|
| §2.4 Users & roles | `src/modules/identity/admin-users.repository.ts`, `admin-users.actions.ts`, `app/admin/users/page.tsx`, `app/admin/users/[id]/page.tsx`, `app/admin/users/[id]/RoleActions.tsx` | `listUsersForAdmin({q, role, page})` (25/page; name/email contains; confirmed-registration and certificate counts) · `getUserForAdmin(id)` (identity, **masked** profile summary from the existing `getProfile` view — no ciphertext selected, no decrypt call, no photo bytes; registrations, orders, certificates, reviews, consents, role rows with granter/revoker emails, role history from `audit_log`) · `grantPlatformAdmin` / `revokePlatformAdmin` wrap the existing `grantRole` / `revokeRole` (the same row is re-activated on re-grant because of the unique key) with the refusals `self_revoke`, `last_admin` (count taken inside the same transaction) and `not_admin` · server actions gate on `authorise("platform_admin")` and revalidate the affected routes · revoke needs a ticked confirmation and is not offered on the administrator's own page |
| §2.5 Audit log | `src/modules/platform/audit/admin.repository.ts`, `app/admin/audit/page.tsx`, `app/admin/audit/[id]/page.tsx` | `listAuditForAdmin({action, entityType, entityId, actorUserId, from, to, page})` newest first, 50/page, actor email resolved in code, `null` actor shown as *system* · `listAuditFilterValues()` (distinct actions and entity types, so the selects never offer a value no row has) · detail shows before/after as pretty JSON in `<pre>` · **no write anywhere on these screens**: the only form is the GET filter (the e2e asserts every form's method is GET) |
| §2.7 Data export | `src/modules/identity/data-export.ts`, `app/api/me/export/route.ts`, `app/account/profile/page.tsx` (one "Your data" card) | `buildDataExport(userId)` → account, masked profile, roles, registrations, orders, payments, refunds, reviews, certificates, renewals, consents, audit rows as actor — every query filtered by owner (payments, refunds and renewals reached only through the owned order or certificate); BigInt → number, Dates → ISO · route: session or 401; reads no query parameters; writes `profile.exported` (carrying only `{exportedAt, format, version}`) in the same transaction; `application/json`, attachment `my-data-YYYY-MM-DD.json`, `no-store`, `nosniff` |

### Defaults taken (founder may change)
1. Administrator-visible profile summary: legal and display name, mobile, country · nationality, organisation, job title, ID type + masked number, date of birth, photo yes/no, checkout-complete time. Address, LinkedIn, industry, experience band, marketing consent and "heard about" are not shown. The export contains the full masked `ProfileView` — it is the person's own data.
2. The role filter offers every enum role; only `platform_admin` is grantable (G3). Grant/revoke write a fixed audit reason; no free-text reason field (not requested).
3. The export includes the person's `roles` rows — their own data under the access right.

### Testing (Part 2)
| Layer | File | Result |
|---|---|---|
| Integration | `admin-users.test.ts` (8: grant → revoke with audit rows; self-revoke refused; last-administrator refused inside a rolled-back transaction so it holds whatever else is in the database; re-grant updates the same row; search) | pass |
| Integration | `audit-admin.test.ts` (5: filters, pagination, actor resolution, detail) | pass |
| Integration | `data-export.test.ts` (4: only the owner's rows, no plaintext ID number, `profile.exported` written, headers) | pass |
| E2E | `admin-users-audit.spec.ts` (4, serial): list by email, detail with masked ID and no raw number in the page, grant → the page re-renders from the database and swaps the grant form for the revoke form, filter by role, revoke needs the confirmation, role history shows both events and the acting administrator, self-revocation not offered; audit log lists the grant with the actor and shows the JSON on its detail; participant 403 on `/admin/users` and `/admin/audit`; signed-in download of `/api/me/export` (200, JSON, filename header, own email inside), guest 401; axe clean | pass — one assertion corrected by the orchestrator: the spec first waited for a success sentence inside the grant form, but the page replaces that form with the revoke form after the action, which is the truthful confirmation |

## Combined verification (orchestrator, 2026-09-23)
| Check | Result |
|---|---|
| `tsc --noEmit --incremental false` | clean |
| Vitest | **375 / 375** (two consecutive runs) |
| Playwright | **62 / 62 passed 2026-09-23** — the whole suite, run by the orchestrator against a production build (`npx next build && PLAYWRIGHT_SERVER=start npm run test:e2e`, because another session's `next dev` held the directory lock) |
| `next build` | clean |
| Plan §4 criteria | 1 ✅ 403/200 on every screen and the CSV route · 2 ✅ grant/revoke atomic with audit; self and last-administrator refused · 3 ✅ enquiry audit before/after · 4 ✅ report figures equal direct aggregates · 5 ✅ CSV quoting and formula guard · 6 ✅ export owner-only, ID masked, query ignored · 7 ✅ audit screen writes nothing · 8 ✅ axe, tsc, Vitest, Playwright, build |

**Commits:** `a2b820d` (code and tests) · `64728c8` (plan). **§5 (A1–A7) remains open for the founder** — nothing there was built.
