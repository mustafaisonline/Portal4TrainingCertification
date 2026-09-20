import Link from "next/link";
import { AdminScreen } from "@/components/admin/AdminTable";
import { getDeliveryFormat, offerings } from "@/data/demoParticipant";

const seats: Record<string, string> = { bootcamp: "11 / 16", accelerator: "12 / 12", mastery: "6 / 20" };
const state: Record<string, string> = { bootcamp: "Open", accelerator: "Full — waitlist (2)", mastery: "Open" };
export default function AdminOfferings() {
  return (
    <AdminScreen
      eyebrow="Dates & seats"
      title="Scheduled offerings"
      action="Add a date"
      columns={["Format", "Dates", "Schedule", "Seats", "Status", "Trainer", ""]}
      rows={offerings.map((o) => [o.formatName, o.dates, getDeliveryFormat(o)?.schedule ?? "", seats[o.id], state[o.id], "Mustafa Qizilbash", <Link key="l" href={`/admin/offerings/${o.id}`} className="text-[var(--color-primary)] underline underline-offset-4">Open</Link>])}
      note="Sample dates and seat counts. Real offerings need dates, capacity, open/closed/cancelled/waitlist states, a trainer assignment, joining information, and an audit trail (A6, C11)."
    />
  );
}
