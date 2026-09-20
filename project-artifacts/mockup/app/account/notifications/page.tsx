import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Card } from "@/components/ui/Card";

/** Notification centre (S05) — WIREFRAME, 2026-09-20. Static sample list of
 *  the notification TYPES the product will send; nothing is real. The same
 *  events also go by email (see /admin/emails). */
const samples = [
  { when: "Sample", title: "Joining link for Day 1", body: "Your joining information for the Bootcamp is ready." },
  { when: "Sample", title: "Certificate issued", body: "Your Certificate of Completion has been issued. View, print or share it." },
  { when: "Sample", title: "Renewal due in 30 days", body: "Your certificate expires soon. Renew to keep it active." },
  { when: "Sample", title: "Payment received", body: "Thank you — your registration is confirmed. Receipt available under Orders." },
];
export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Notifications</p>
        <h1 className="text-display">Your notifications</h1>
      </header>
      <ul className="flex flex-col gap-3">
        {samples.map((n) => (
          <li key={n.title}>
            <Card variant="panel" className="p-5">
              <p className="text-body-sm font-medium">
                {n.title}
                <SampleTag />
              </p>
              <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">{n.body}</p>
            </Card>
          </li>
        ))}
      </ul>
      <WireframeNote>Sample notifications — illustrating the kinds the product will send. None is real.</WireframeNote>
    </div>
  );
}
