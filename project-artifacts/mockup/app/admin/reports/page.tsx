import { AdminHeader, AdminTable, Stat } from "@/components/admin/AdminTable";
import { WireframeNote } from "@/components/auth/FormParts";

export default function AdminReports() {
  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow="Reports" title="Reports" action="Export" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registrations · 30 days" value="4" />
        <Stat label="Completion rate" value="2 of 3" sub="Bootcamp, last date" />
        <Stat label="Certificates renewed" value="1 of 2" sub="on time" />
        <Stat label="Enquiry → registration" value="1 of 4" />
      </div>
      <AdminTable columns={["Report", "Description"]} rows={[["Attendance by offering", "Per-session presence, exportable — the HRD Corp evidence input"], ["Revenue by currency and method", "Paid / pending / refunded, per month"], ["Certificate status", "Active, renewal due, expired, revoked; listing opt-in rate"], ["Regional pricing usage", "Which currency buyers chose — informs decision A8"], ["Enquiries funnel", "New → replied → registered"]]} sampleFirstCol={false} />
      <WireframeNote>Sample figures. Success metrics for the product are governed by MVP_BUILD_SPEC §12.3 — these are operational reports, not those metrics.</WireframeNote>
    </div>
  );
}
