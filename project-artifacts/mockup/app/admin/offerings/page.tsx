import { AdminScreen, Disabled } from "@/components/admin/AdminTable";
import { getDeliveryFormat, offerings } from "@/data/demoParticipant";

const seats: Record<string, string> = { bootcamp: "11 / 16", accelerator: "12 / 12", mastery: "6 / 20" };
export default function AdminOfferings() {
  return (
    <AdminScreen
      eyebrow="Dates & seats"
      title="Scheduled offerings"
      action="Add a date"
      columns={["Format", "Dates", "Schedule", "Seats filled", "Status", ""]}
      rows={offerings.map((o) => [o.formatName, o.dates, getDeliveryFormat(o)?.schedule ?? "", seats[o.id], seats[o.id].startsWith("12 /") ? "Full — waitlist" : "Open", <Disabled key="e">Edit</Disabled>])}
      note="Sample dates and seat counts. Real offerings need dates, capacity, open/closed/waitlist states and an audit trail (requirements A6, C11)."
    />
  );
}
