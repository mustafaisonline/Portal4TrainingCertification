# Technical metadata

Tables and views (source of truth `prisma/schema.prisma` and `prisma/migrations/`), APIs and integrations (Stripe, Better Auth), and one `.md` per script.

**Written 2026-10-02 (CR-2026-10-02-2045):** all 50 database tables and the 27 enums (generated from `prisma/schema.prisma`), every script in `scripts/`, and every script/config in `deploy/`. **Not yet written:** APIs and integrations (Stripe, Better Auth), architecture standards.

**Index** (85 files):

| File | Item | Source | Status |
|---|---|---|---|
| [reference-enums.md](reference-enums.md) | reference — enumerations | `prisma/schema.prisma` | approved |
| [script-alias-loader.md](script-alias-loader.md) | script — alias-loader | scripts/alias-loader.mjs | approved |
| [script-approve-interview-questions.md](script-approve-interview-questions.md) | script — approve-interview-questions | scripts/approve-interview-questions.ts | approved |
| [script-backup.md](script-backup.md) | script — backup | scripts/backup.sh | approved |
| [script-bulk-review-questions.md](script-bulk-review-questions.md) | script — bulk-review-questions | scripts/bulk-review-questions.ts | approved |
| [script-deploy-00-discovery-sh.md](script-deploy-00-discovery-sh.md) | script — deploy/00-discovery.sh | `deploy/00-discovery.sh` | approved |
| [script-deploy-01-backup-serverscript-sh.md](script-deploy-01-backup-serverscript-sh.md) | script — deploy/01-backup-serverscript.sh | `deploy/01-backup-serverscript.sh` | approved |
| [script-deploy-03-migration-sandbox-serverscript-sh.md](script-deploy-03-migration-sandbox-serverscript-sh.md) | script — deploy/03-migration-sandbox-serverscript.sh | `deploy/03-migration-sandbox-serverscript.sh` | approved |
| [script-deploy-04-release-gate-sh.md](script-deploy-04-release-gate-sh.md) | script — deploy/04-release-gate.sh | `deploy/04-release-gate.sh` | approved |
| [script-deploy-05-deploy-sh.md](script-deploy-05-deploy-sh.md) | script — deploy/05-deploy.sh | `deploy/05-deploy.sh` | approved |
| [script-deploy-06-validate-sh.md](script-deploy-06-validate-sh.md) | script — deploy/06-validate.sh | `deploy/06-validate.sh` | approved |
| [script-deploy-07-rollback-sh.md](script-deploy-07-rollback-sh.md) | script — deploy/07-rollback.sh | `deploy/07-rollback.sh` | approved |
| [script-deploy-09-audit-sh.md](script-deploy-09-audit-sh.md) | script — deploy/09-audit.sh | `deploy/09-audit.sh` | approved |
| [script-deploy-10-server-bootstrap-serverscript-sh.md](script-deploy-10-server-bootstrap-serverscript-sh.md) | script — deploy/10-server-bootstrap-serverscript.sh | `deploy/10-server-bootstrap-serverscript.sh` | approved |
| [script-deploy-Caddyfile-example.md](script-deploy-Caddyfile-example.md) | config — deploy/Caddyfile.example | `deploy/Caddyfile.example` | approved |
| [script-deploy-config-env.md](script-deploy-config-env.md) | config — deploy/config.env | `deploy/config.env` | approved |
| [script-deploy-ecosystem-production-config-js.md](script-deploy-ecosystem-production-config-js.md) | config — deploy/ecosystem.production.config.js | `deploy/ecosystem.production.config.js` | approved |
| [script-deploy-lib-common-sh.md](script-deploy-lib-common-sh.md) | script — deploy/lib/common.sh | `deploy/lib/common.sh` | approved |
| [script-deploy-lib-governance-sh.md](script-deploy-lib-governance-sh.md) | script — deploy/lib/governance.sh | `deploy/lib/governance.sh` | approved |
| [script-deploy-lib-local-release-sh.md](script-deploy-lib-local-release-sh.md) | script — deploy/lib/local-release.sh | `deploy/lib/local-release.sh` | approved |
| [script-deploy-lib-proof-db-mjs.md](script-deploy-lib-proof-db-mjs.md) | script — deploy/lib/proof-db.mjs | `deploy/lib/proof-db.mjs` | approved |
| [script-deploy-lib-server-promote-sh.md](script-deploy-lib-server-promote-sh.md) | script — deploy/lib/server-promote.sh | `deploy/lib/server-promote.sh` | approved |
| [script-deploy-run-sh-template.md](script-deploy-run-sh-template.md) | script — deploy/run.sh.template | `deploy/run.sh.template` | approved |
| [script-deploy-start-sh.md](script-deploy-start-sh.md) | script — deploy/start.sh | `deploy/start.sh` | approved |
| [script-deploy-systemd-p4tc-backup-service.md](script-deploy-systemd-p4tc-backup-service.md) | config — deploy/systemd/p4tc-backup.service | `deploy/systemd/p4tc-backup.service` | approved |
| [script-deploy-systemd-p4tc-backup-timer.md](script-deploy-systemd-p4tc-backup-timer.md) | config — deploy/systemd/p4tc-backup.timer | `deploy/systemd/p4tc-backup.timer` | approved |
| [script-deploy-systemd-p4tc-reminders-service.md](script-deploy-systemd-p4tc-reminders-service.md) | config — deploy/systemd/p4tc-reminders.service | `deploy/systemd/p4tc-reminders.service` | approved |
| [script-deploy-systemd-p4tc-reminders-timer.md](script-deploy-systemd-p4tc-reminders-timer.md) | config — deploy/systemd/p4tc-reminders.timer | `deploy/systemd/p4tc-reminders.timer` | approved |
| [script-grant-admin.md](script-grant-admin.md) | script — grant-admin | scripts/grant-admin.ts | approved |
| [script-import-questions.md](script-import-questions.md) | script — import-questions | scripts/import-questions.ts | approved |
| [script-ingest-datapedia.md](script-ingest-datapedia.md) | script — ingest-datapedia | scripts/ingest-datapedia.ts | approved |
| [script-register-alias.md](script-register-alias.md) | script — register-alias | scripts/register-alias.mjs | approved |
| [script-relabel-unlock-setting.md](script-relabel-unlock-setting.md) | script — relabel-unlock-setting | scripts/relabel-unlock-setting.ts | approved |
| [script-restore-rehearsal.md](script-restore-rehearsal.md) | script — restore-rehearsal | scripts/restore-rehearsal.sh | approved |
| [script-stripe-check.md](script-stripe-check.md) | script — stripe-check | scripts/stripe-check.ts | approved |
| [table-assessment_roles.md](table-assessment_roles.md) | table — assessment_roles | `prisma/schema.prisma` (model `AssessmentRole`) and `prisma/migrations/` | approved |
| [table-attendance_records.md](table-attendance_records.md) | table — attendance_records | `prisma/schema.prisma` (model `AttendanceRecord`) and `prisma/migrations/` | approved |
| [table-audit_log.md](table-audit_log.md) | table — audit_log | `prisma/schema.prisma` (model `AuditLog`) and `prisma/migrations/` | approved |
| [table-auth_accounts.md](table-auth_accounts.md) | table — auth_accounts | `prisma/schema.prisma` (model `AuthAccount`) and `prisma/migrations/` | approved |
| [table-auth_identities.md](table-auth_identities.md) | table — auth_identities | `prisma/schema.prisma` (model `AuthIdentity`) and `prisma/migrations/` | approved |
| [table-auth_rate_limits.md](table-auth_rate_limits.md) | table — auth_rate_limits | `prisma/schema.prisma` (model `AuthRateLimit`) and `prisma/migrations/` | approved |
| [table-auth_sessions.md](table-auth_sessions.md) | table — auth_sessions | `prisma/schema.prisma` (model `AuthSession`) and `prisma/migrations/` | approved |
| [table-auth_two_factors.md](table-auth_two_factors.md) | table — auth_two_factors | `prisma/schema.prisma` (model `AuthTwoFactor`) and `prisma/migrations/` | approved |
| [table-auth_users.md](table-auth_users.md) | table — auth_users | `prisma/schema.prisma` (model `AuthUser`) and `prisma/migrations/` | approved |
| [table-auth_verifications.md](table-auth_verifications.md) | table — auth_verifications | `prisma/schema.prisma` (model `AuthVerification`) and `prisma/migrations/` | approved |
| [table-book_topic_images.md](table-book_topic_images.md) | table — book_topic_images | `prisma/schema.prisma` (model `BookTopicImage`) and `prisma/migrations/` | approved |
| [table-book_topics.md](table-book_topics.md) | table — book_topics | `prisma/schema.prisma` (model `BookTopic`) and `prisma/migrations/` | approved |
| [table-certificate_fee_settings.md](table-certificate_fee_settings.md) | table — certificate_fee_settings | `prisma/schema.prisma` (model `CertificateFeeSetting`) and `prisma/migrations/` | approved |
| [table-certificate_renewals.md](table-certificate_renewals.md) | table — certificate_renewals | `prisma/schema.prisma` (model `CertificateRenewal`) and `prisma/migrations/` | approved |
| [table-certificates.md](table-certificates.md) | table — certificates | `prisma/schema.prisma` (model `Certificate`) and `prisma/migrations/` | approved |
| [table-consents.md](table-consents.md) | table — consents | `prisma/schema.prisma` (model `Consent`) and `prisma/migrations/` | approved |
| [table-coupons.md](table-coupons.md) | table — coupons | `prisma/schema.prisma` (model `Coupon`) and `prisma/migrations/` | approved |
| [table-delivery_formats.md](table-delivery_formats.md) | table — delivery_formats | `prisma/schema.prisma` (model `DeliveryFormat`) and `prisma/migrations/` | approved |
| [table-diagnostic_questions.md](table-diagnostic_questions.md) | table — diagnostic_questions | `prisma/schema.prisma` (model `DiagnosticQuestion`) and `prisma/migrations/` | approved |
| [table-domains.md](table-domains.md) | table — domains | `prisma/schema.prisma` (model `Domain`) and `prisma/migrations/` | approved |
| [table-enquiries.md](table-enquiries.md) | table — enquiries | `prisma/schema.prisma` (model `Enquiry`) and `prisma/migrations/` | approved |
| [table-experts.md](table-experts.md) | table — experts | `prisma/schema.prisma` (model `Expert`) and `prisma/migrations/` | approved |
| [table-faq_entries.md](table-faq_entries.md) | table — faq_entries | `prisma/schema.prisma` (model `FaqEntry`) and `prisma/migrations/` | approved |
| [table-interest_fee_settings.md](table-interest_fee_settings.md) | table — interest_fee_settings | `prisma/schema.prisma` (model `InterestFeeSetting`) and `prisma/migrations/` | approved |
| [table-knowledge_check_attempts.md](table-knowledge_check_attempts.md) | table — knowledge_check_attempts | `prisma/schema.prisma` (model `KnowledgeCheckAttempt`) and `prisma/migrations/` | approved |
| [table-knowledge_check_unlock_settings.md](table-knowledge_check_unlock_settings.md) | table — knowledge_check_unlock_settings | `prisma/schema.prisma` (model `KnowledgeCheckUnlockSetting`) and `prisma/migrations/` | approved |
| [table-orders.md](table-orders.md) | table — orders | `prisma/schema.prisma` (model `Order`) and `prisma/migrations/` | approved |
| [table-organisation_roles.md](table-organisation_roles.md) | table — organisation_roles | `prisma/schema.prisma` (model `OrganisationRole`) and `prisma/migrations/` | approved |
| [table-organisations.md](table-organisations.md) | table — organisations | `prisma/schema.prisma` (model `Organisation`) and `prisma/migrations/` | approved |
| [table-outbound_emails.md](table-outbound_emails.md) | table — outbound_emails | `prisma/schema.prisma` (model `OutboundEmail`) and `prisma/migrations/` | approved |
| [table-payments.md](table-payments.md) | table — payments | `prisma/schema.prisma` (model `Payment`) and `prisma/migrations/` | approved |
| [table-programme_experts.md](table-programme_experts.md) | table — programme_experts | `prisma/schema.prisma` (model `ProgrammeExpert`) and `prisma/migrations/` | approved |
| [table-programme_modules.md](table-programme_modules.md) | table — programme_modules | `prisma/schema.prisma` (model `ProgrammeModule`) and `prisma/migrations/` | approved |
| [table-programme_prices.md](table-programme_prices.md) | table — programme_prices | `prisma/schema.prisma` (model `ProgrammePrice`) and `prisma/migrations/` | approved |
| [table-programmes.md](table-programmes.md) | table — programmes | `prisma/schema.prisma` (model `Programme`) and `prisma/migrations/` | approved |
| [table-refunds.md](table-refunds.md) | table — refunds | `prisma/schema.prisma` (model `Refund`) and `prisma/migrations/` | approved |
| [table-registrations.md](table-registrations.md) | table — registrations | `prisma/schema.prisma` (model `Registration`) and `prisma/migrations/` | approved |
| [table-reviews.md](table-reviews.md) | table — reviews | `prisma/schema.prisma` (model `Review`) and `prisma/migrations/` | approved |
| [table-role_question_options.md](table-role_question_options.md) | table — role_question_options | `prisma/schema.prisma` (model `RoleQuestionOption`) and `prisma/migrations/` | approved |
| [table-role_questions.md](table-role_questions.md) | table — role_questions | `prisma/schema.prisma` (model `RoleQuestion`) and `prisma/migrations/` | approved |
| [table-role_test_attempts.md](table-role_test_attempts.md) | table — role_test_attempts | `prisma/schema.prisma` (model `RoleTestAttempt`) and `prisma/migrations/` | approved |
| [table-scheduled_offerings.md](table-scheduled_offerings.md) | table — scheduled_offerings | `prisma/schema.prisma` (model `ScheduledOffering`) and `prisma/migrations/` | approved |
| [table-stripe_events.md](table-stripe_events.md) | table — stripe_events | `prisma/schema.prisma` (model `StripeEvent`) and `prisma/migrations/` | approved |
| [table-support_payment_settings.md](table-support_payment_settings.md) | table — support_payment_settings | `prisma/schema.prisma` (model `SupportPaymentSetting`) and `prisma/migrations/` | approved |
| [table-topic_question_options.md](table-topic_question_options.md) | table — topic_question_options | `prisma/schema.prisma` (model `TopicQuestionOption`) and `prisma/migrations/` | approved |
| [table-topic_questions.md](table-topic_questions.md) | table — topic_questions | `prisma/schema.prisma` (model `TopicQuestion`) and `prisma/migrations/` | approved |
| [table-training_interests.md](table-training_interests.md) | table — training_interests | `prisma/schema.prisma` (model `TrainingInterest`) and `prisma/migrations/` | approved |
| [table-user_profiles.md](table-user_profiles.md) | table — user_profiles | `prisma/schema.prisma` (model `UserProfile`) and `prisma/migrations/` | approved |
| [table-user_roles.md](table-user_roles.md) | table — user_roles | `prisma/schema.prisma` (model `UserRole`) and `prisma/migrations/` | approved |
| [table-users.md](table-users.md) | table — users | `prisma/schema.prisma` (model `User`) and `prisma/migrations/` | approved |
