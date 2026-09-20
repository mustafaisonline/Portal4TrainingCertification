import { AdminScreen } from "@/components/admin/AdminTable";

const rows = [
  ["Verify your email", "Account created", "Register"],
  ["Reset your password", "Reset requested", "Forgot password"],
  ["Registration confirmed + receipt", "Payment confirmed by Stripe webhook", "Checkout"],
  ["Joining information", "Before the first session", "Offering"],
  ["Certificate issued", "Completion recorded", "Certificates"],
  ["Renewal reminder (30 / 7 days)", "Scheduled from expiry date", "Certificates"],
  ["Certificate expired", "Day after expiry", "Certificates"],
  ["Renewal confirmed + receipt", "Payment confirmed by Stripe webhook", "Certificates"],
];
export default function AdminEmails() {
  return (
    <AdminScreen
      eyebrow="Emails"
      title="Transactional emails"
      columns={["Email", "Sent when", "Feature"]}
      rows={rows}
      note="The catalogue of emails the product must send. None exists — the email provider is undecided (ADR-015, decision A2). Reminders must be persisted and idempotent so a restart neither drops nor duplicates them."
    />
  );
}
