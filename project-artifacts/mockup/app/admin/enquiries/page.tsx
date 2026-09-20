import { AdminScreen, Disabled } from "@/components/admin/AdminTable";
import { enquiries } from "@/data/adminSamples";

export default function AdminEnquiries() {
  return (
    <AdminScreen
      eyebrow="Enquiries"
      title="Inbox"
      columns={["Ref", "From", "Organisation", "Type", "Subject", "State", ""]}
      rows={enquiries.map((e) => [<span key="i" className="text-mono">{e.id}</span>, e.from, e.org, e.type, e.subject, e.state, <span key="a" className="flex gap-3"><Disabled>Reply</Disabled><Disabled>Close</Disabled></span>])}
      note="Sample enquiries from the Contact and For Organisations forms. The real inbox needs assignment, reply-by-email, states, and a response-time target (none is committed to publicly — SITE_PAGES.md)."
    />
  );
}
