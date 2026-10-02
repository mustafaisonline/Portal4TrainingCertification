# reference — enumerations

| Field | Value |
|---|---|
| Category | technical |
| Kind | standard (database enums) |
| Source of truth | `prisma/schema.prisma` |
| Owner | founder |
| Version / date | generated 2026-10-02 |
| Status | approved |

## Purpose
The 27 PostgreSQL enum types used by the tables, with their allowed values.

| Enum (DB type) | Values | Used by |
|---|---|---|
| `IdDocumentType` (`id_document_type`) | nric, passport | user_profiles |
| `ReviewKind` (`review_kind`) | registration, diagnostic | reviews |
| `ReviewCategory` (`review_category`) | programme_experience, course_content, certification_process, user_experience, technical_issue, other | reviews |
| `ReviewModeration` (`review_moderation`) | pending, approved, rejected | reviews |
| `ReviewVisibility` (`review_visibility`) | visible, hidden | reviews |
| `UserRoleName` (`user_role_name`) | participant, expert, assessor, org_admin, platform_admin | user_roles |
| `RoleScopeType` (`role_scope_type`) | platform, organisation, offering | user_roles |
| `OutboundEmailStatus` (`outbound_email_status`) | queued, sent, failed | outbound_emails |
| `ProgrammeLevel` (`programme_level`) | foundation, practitioner, architect, executive, builder, mentorship | programmes |
| `ProgrammeStatus` (`programme_status`) | published, unlisted, retired | programmes |
| `PriceRegion` (`price_region`) | malaysia, pakistan, international, malaysia_hrdcorp | orders, programme_prices |
| `DeliveryModality` (`delivery_modality`) | live_online, face_to_face, corporate_private | scheduled_offerings |
| `OfferingStatus` (`offering_status`) | planned, open, full, completed, cancelled | scheduled_offerings |
| `EnquiryKind` (`enquiry_kind`) | general, organisation, programme_interest | enquiries |
| `EnquiryStatus` (`enquiry_status`) | new, replied, closed | enquiries |
| `OrderStatus` (`order_status`) | pending, paid, expired, failed, cancelled, refunded, partially_refunded | orders |
| `OrderKind` (`order_kind`) | registration, certificate_renewal, support, knowledge_check_unlock, interest | orders |
| `CouponStatus` (`CouponStatus`) | active, disabled | coupons |
| `PaymentStatus` (`payment_status`) | succeeded, refunded, partially_refunded | payments |
| `RefundReason` (`refund_reason`) | participant_cancellation, academy_cancellation, manual | refunds |
| `RefundStatus` (`refund_status`) | pending, succeeded, failed | refunds |
| `RegistrationStatus` (`registration_status`) | confirmed, cancelled, transferred | registrations |
| `StripeEventStatus` (`stripe_event_status`) | received, processed, ignored, failed | stripe_events |
| `TopicQuestionStatus` (`topic_question_status`) | draft, reviewed | topic_questions |
| `OrganisationType` (`organisation_type`) | company, education | organisations |
| `RoleQuestionStatus` (`role_question_status`) | draft, pending, reviewed, rejected | role_questions |
| `InterestStatus` (`interest_status`) | pending, confirmed, expired | training_interests |
