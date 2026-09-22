import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/modules/catalogue/programmes/types";
import { CERTIFICATE_STATUS_LABEL } from "@/modules/certificates/constants";
import { dateColumnToIso, todayIso } from "@/modules/certificates/dates";
import { statusOf } from "@/modules/certificates/rules";
import { getUserForAdmin, ROLE_LABEL } from "@/modules/identity/admin-users.repository";
import { authorise } from "@/modules/identity/session";
import { REVIEW_MODERATION_LABEL, REVIEW_VISIBILITY_LABEL } from "@/modules/reviews/constants";
import { Card } from "@/shared/ui/Card";
import { Chip } from "@/shared/ui/Chip";
import { formatCalendarDate, formatDateRange, formatTimestamp } from "@/shared/util/dates";
import { GrantAdmin, RevokeAdmin } from "./RoleActions";

/*
 * /admin/users/[id] — one person in full (M8 plan §2 item 4): identity
 * facts, the MASKED profile summary (the ID number only ever as its last
 * four — the same view the profile page renders; no photo), registrations,
 * orders, certificates, reviews, consents, and roles with their history.
 * The two role actions are the only writes. Unknown id → 404.
 */
export const metadata: Metadata = { title: "User" };

export const dynamic = "force-dynamic";

const dash = "—";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const result = await authorise("platform_admin");
  if (!result.ok) return null; // the layout has already refused
  const { id } = await params;
  const user = await getUserForAdmin(id);
  if (!user) notFound();
  const today = todayIso(new Date());
  const isSelf = user.id === result.user.id;
  const th = "text-label px-6 py-3 font-semibold";
  const td = "px-6 py-3 align-top";

  return (
    <div className="flex flex-col gap-6" data-testid="user-detail" data-user-id={user.id}>
      <header>
        <Link href="/admin/users" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Users
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Person</p>
        <h1 className="text-display" data-testid="admin-user-title">
          {user.name}
        </h1>
        <p className="text-body-sm mt-2 break-all text-[var(--color-ink-quiet)]" data-testid="admin-user-email">
          {user.email}
        </p>
        <div className="mt-3 flex flex-wrap gap-2" data-testid="admin-user-roles">
          {user.roles
            .filter((r) => r.active)
            .map((r) => (
              <Chip key={r.id} tone={r.role === "platform_admin" ? "primary" : "neutral"}>
                {ROLE_LABEL[r.role]}
              </Chip>
            ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="panel" className="p-6">
          <h2 className="text-h2 mb-4">Account</h2>
          <dl className="text-body-sm grid gap-y-3">
            <div>
              <dt className="text-label mb-1">Email</dt>
              <dd className="break-all">
                {user.email} · {user.emailVerifiedAt ? `verified ${formatTimestamp(user.emailVerifiedAt)}` : "not verified"}
              </dd>
            </div>
            <div>
              <dt className="text-label mb-1">Name</dt>
              <dd>{user.name}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Country</dt>
              <dd>{user.country ?? dash}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">Registered</dt>
              <dd>{formatTimestamp(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-label mb-1">User id</dt>
              <dd className="text-mono break-all">{user.id}</dd>
            </div>
          </dl>
        </Card>

        <Card variant="panel" className="p-6" data-testid="admin-user-profile">
          <h2 className="text-h2 mb-1">Profile</h2>
          <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">As the person entered it. The ID number is never shown in full anywhere; the photo is visible to the person only.</p>
          {user.profile ? (
            <dl className="text-body-sm grid gap-y-3 sm:grid-cols-2 sm:gap-x-6">
              <div>
                <dt className="text-label mb-1">Legal name</dt>
                <dd>{user.profile.legalName}</dd>
              </div>
              <div>
                <dt className="text-label mb-1">Display name</dt>
                <dd>{user.profile.displayName ?? dash}</dd>
              </div>
              <div>
                <dt className="text-label mb-1">Mobile</dt>
                <dd>{user.profile.phoneE164 ?? dash}</dd>
              </div>
              <div>
                <dt className="text-label mb-1">Country · nationality</dt>
                <dd>
                  {user.profile.countryCode ?? dash} · {user.profile.nationalityCode ?? dash}
                </dd>
              </div>
              <div>
                <dt className="text-label mb-1">Organisation</dt>
                <dd>{user.profile.organisation ?? dash}</dd>
              </div>
              <div>
                <dt className="text-label mb-1">Job title</dt>
                <dd>{user.profile.jobTitle ?? dash}</dd>
              </div>
              <div>
                <dt className="text-label mb-1">ID document</dt>
                <dd data-testid="admin-user-id-masked">
                  {user.profile.idType ? (user.profile.idType === "nric" ? "NRIC" : "Passport") : dash} {user.profile.idNumberMasked ?? ""}
                </dd>
              </div>
              <div>
                <dt className="text-label mb-1">Date of birth</dt>
                <dd>{user.profile.dateOfBirth ?? dash}</dd>
              </div>
              <div>
                <dt className="text-label mb-1">Photo</dt>
                <dd>{user.profile.hasPhoto ? "Uploaded" : "None"}</dd>
              </div>
              <div>
                <dt className="text-label mb-1">Complete for checkout</dt>
                <dd>{user.profile.completedAt ? `Yes · ${formatTimestamp(user.profile.completedAt)}` : "Not yet"}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-body-sm text-[var(--color-ink-quiet)]" data-testid="admin-user-no-profile">
              No profile has been saved yet.
            </p>
          )}
        </Card>
      </div>

      <Card variant="panel" className="p-6" data-testid="admin-user-role-actions">
        <h2 className="text-h2 mb-1">Administrator access</h2>
        <p className="text-body-sm mb-4 text-[var(--color-ink-faint)]">
          Platform administrator is the only role granted from here in the MVP. Every change is written to the audit log with the acting administrator.
        </p>
        {user.isPlatformAdmin ? <RevokeAdmin userId={user.id} name={user.name} isSelf={isSelf} /> : <GrantAdmin userId={user.id} name={user.name} />}
      </Card>

      <Card variant="panel" className="overflow-x-auto p-0">
        <h2 className="text-h2 px-6 pt-6">Roles</h2>
        <table className="text-body-sm w-full min-w-[720px] border-collapse" data-testid="admin-user-roles-table">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["Role", "Scope", "Granted", "Granted by", "Revoked", "Revoked by"].map((c) => (
                <th key={c} scope="col" className={th}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {user.roles.map((r) => (
              <tr key={r.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="admin-user-role-row" data-active={r.active ? "true" : "false"}>
                <td className={td}>
                  {ROLE_LABEL[r.role]}
                  {r.active ? null : <span className="text-[var(--color-ink-faint)]"> (revoked)</span>}
                </td>
                <td className={td}>
                  {r.scopeType}
                  {r.scopeId ? <span className="text-mono break-all text-[var(--color-ink-quiet)]"> {r.scopeId}</span> : null}
                </td>
                <td className={`${td} whitespace-nowrap text-[var(--color-ink-quiet)]`}>{formatTimestamp(r.grantedAt)}</td>
                <td className={`${td} break-all text-[var(--color-ink-quiet)]`}>{r.grantedByEmail ?? (r.grantedByUserId ? r.grantedByUserId : "system")}</td>
                <td className={`${td} whitespace-nowrap text-[var(--color-ink-quiet)]`}>{r.revokedAt ? formatTimestamp(r.revokedAt) : dash}</td>
                <td className={`${td} break-all text-[var(--color-ink-quiet)]`}>{r.revokedAt ? (r.revokedByEmail ?? r.revokedByUserId ?? "system") : dash}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h3 className="text-body-lg px-6 pt-6 font-medium">Role history</h3>
        <table className="text-body-sm w-full min-w-[720px] border-collapse" data-testid="admin-user-role-history">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["When", "Change", "Role", "By", "Reason"].map((c) => (
                <th key={c} scope="col" className={th}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {user.roleHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                  No role changes recorded.
                </td>
              </tr>
            ) : (
              user.roleHistory.map((h) => (
                <tr key={h.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="admin-user-role-event">
                  <td className={`${td} whitespace-nowrap text-[var(--color-ink-quiet)]`}>{formatTimestamp(h.createdAt)}</td>
                  <td className={td}>{h.action === "role.granted" ? "Granted" : "Revoked"}</td>
                  <td className={td}>
                    {h.role} · {h.scopeType}
                  </td>
                  <td className={`${td} break-all text-[var(--color-ink-quiet)]`}>{h.actorEmail ?? h.actorUserId ?? "system"}</td>
                  <td className={`${td} text-[var(--color-ink-quiet)]`}>{h.reason ?? dash}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card variant="panel" className="overflow-x-auto p-0">
        <h2 className="text-h2 px-6 pt-6">Registrations</h2>
        <table className="text-body-sm w-full min-w-[720px] border-collapse" data-testid="admin-user-registrations">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["Offering", "Dates", "Status", "Registered", ""].map((c, i) => (
                <th key={i} scope="col" className={th}>
                  {c || <span className="sr-only">Open</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {user.registrations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                  No registrations.
                </td>
              </tr>
            ) : (
              user.registrations.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="admin-user-registration-row">
                  <td className={td}>
                    {r.programmeTitle}
                    {r.formatName ? <span className="text-[var(--color-ink-quiet)]"> · {r.formatName}</span> : null}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{formatDateRange(r.startsOn, r.endsOn)}</td>
                  <td className={td}>
                    <Chip tone={r.status === "confirmed" ? "primary" : "neutral"}>{r.status}</Chip>
                  </td>
                  <td className={`${td} whitespace-nowrap text-[var(--color-ink-quiet)]`}>{formatTimestamp(r.createdAt)}</td>
                  <td className={td}>
                    <Link href={`/admin/offerings/${r.offeringId}/participants`} className="text-[var(--color-primary)] underline underline-offset-4">
                      Roster
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card variant="panel" className="overflow-x-auto p-0">
        <h2 className="text-h2 px-6 pt-6">Orders</h2>
        <table className="text-body-sm w-full min-w-[720px] border-collapse" data-testid="admin-user-orders">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["Placed", "Kind", "Programme", "Amount", "Status", "Paid", "Order id"].map((c) => (
                <th key={c} scope="col" className={th}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {user.orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                  No orders.
                </td>
              </tr>
            ) : (
              user.orders.map((o) => (
                <tr key={o.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="admin-user-order-row">
                  <td className={`${td} whitespace-nowrap text-[var(--color-ink-quiet)]`}>{formatTimestamp(o.createdAt)}</td>
                  <td className={td}>
                    {o.kind === "registration" ? "Registration" : "Certificate renewal"}
                    {o.certificateCode ? <span className="text-mono text-[var(--color-ink-quiet)]"> {o.certificateCode}</span> : null}
                  </td>
                  <td className={td}>{o.programmeTitle}</td>
                  <td className={`${td} whitespace-nowrap`}>{formatMoney(o.amountMinor, o.currency)}</td>
                  <td className={td}>
                    <Chip tone={o.status === "paid" ? "primary" : "neutral"}>{o.status.replace("_", " ")}</Chip>
                  </td>
                  <td className={`${td} whitespace-nowrap text-[var(--color-ink-quiet)]`}>{o.paidAt ? formatTimestamp(o.paidAt) : dash}</td>
                  <td className={`${td} text-mono break-all text-[var(--color-ink-quiet)]`}>{o.id}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <Card variant="panel" className="overflow-x-auto p-0">
        <h2 className="text-h2 px-6 pt-6">Certificates</h2>
        <table className="text-body-sm w-full min-w-[720px] border-collapse" data-testid="admin-user-certificates">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left">
              {["Certificate ID", "Programme", "Issued", "Expires", "Status", ""].map((c, i) => (
                <th key={i} scope="col" className={th}>
                  {c || <span className="sr-only">Open</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {user.certificates.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                  No certificates.
                </td>
              </tr>
            ) : (
              user.certificates.map((c) => {
                const status = statusOf({ expiresOn: dateColumnToIso(c.expiresOn), revokedAt: c.revokedAt }, today).status;
                return (
                  <tr key={c.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="admin-user-certificate-row">
                    <td className={`${td} text-mono`}>{c.certificateId}</td>
                    <td className={td}>{c.programmeTitle}</td>
                    <td className={`${td} whitespace-nowrap`}>{formatCalendarDate(c.issuedOn)}</td>
                    <td className={`${td} whitespace-nowrap`}>{formatCalendarDate(c.expiresOn)}</td>
                    <td className={td}>
                      <Chip tone={status === "active" ? "primary" : "neutral"}>{CERTIFICATE_STATUS_LABEL[status]}</Chip>
                    </td>
                    <td className={td}>
                      <Link href={`/admin/certificates/${c.id}`} className="text-[var(--color-primary)] underline underline-offset-4">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="panel" className="overflow-x-auto p-0">
          <h2 className="text-h2 px-6 pt-6">Reviews</h2>
          <table className="text-body-sm w-full border-collapse" data-testid="admin-user-reviews">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {["Programme", "Rating", "State", ""].map((c, i) => (
                  <th key={i} scope="col" className={th}>
                    {c || <span className="sr-only">Open</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.reviews.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                    No reviews.
                  </td>
                </tr>
              ) : (
                user.reviews.map((r) => (
                  <tr key={r.id} className="border-b border-[var(--color-line)] last:border-b-0" data-testid="admin-user-review-row">
                    <td className={td}>
                      {r.kind === "diagnostic" ? "Free diagnostic" : r.programmeTitle}
                      <p className="text-[var(--color-ink-faint)]">{formatCalendarDate(r.submittedAt)}</p>
                    </td>
                    <td className={td}>{r.rating ?? dash}</td>
                    <td className={td}>
                      <div className="flex flex-wrap gap-1.5">
                        <Chip tone={r.moderationStatus === "approved" ? "primary" : "neutral"}>{REVIEW_MODERATION_LABEL[r.moderationStatus]}</Chip>
                        <Chip>{REVIEW_VISIBILITY_LABEL[r.visibilityStatus]}</Chip>
                        {r.consentPublic ? null : <Chip>private</Chip>}
                      </div>
                    </td>
                    <td className={td}>
                      <Link href={`/admin/reviews/${r.id}`} className="text-[var(--color-primary)] underline underline-offset-4">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <Card variant="panel" className="overflow-x-auto p-0">
          <h2 className="text-h2 px-6 pt-6">Consents</h2>
          <table className="text-body-sm w-full border-collapse" data-testid="admin-user-consents">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-left">
                {["Document", "Version", "Accepted"].map((c) => (
                  <th key={c} scope="col" className={th}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.consents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-[var(--color-ink-quiet)]">
                    No consents recorded.
                  </td>
                </tr>
              ) : (
                user.consents.map((c) => (
                  <tr key={`${c.documentKey}-${c.documentVersion}`} className="border-b border-[var(--color-line)] last:border-b-0">
                    <td className={td}>{c.documentKey}</td>
                    <td className={td}>{c.documentVersion}</td>
                    <td className={`${td} whitespace-nowrap text-[var(--color-ink-quiet)]`}>{formatTimestamp(c.acceptedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <p className="text-body-sm text-[var(--color-ink-faint)]">
        Every change to this person is in the{" "}
        <Link href={`/admin/audit?entityType=user&entityId=${user.id}`} className="text-[var(--color-primary)] underline underline-offset-4" data-testid="admin-user-audit-link">
          audit log
        </Link>
        .
      </p>
    </div>
  );
}
