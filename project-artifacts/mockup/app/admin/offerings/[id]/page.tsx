import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, AdminTable, Disabled, Kv } from "@/components/admin/AdminTable";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { participants, sessionsByOffering } from "@/data/adminSamples";
import { getDeliveryFormat, getOffering, offerings } from "@/data/demoParticipant";

export function generateStaticParams() {
  return offerings.map((o) => ({ id: o.id }));
}
export default async function AdminOfferingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = getOffering(id);
  if (!o) notFound();
  const f = getDeliveryFormat(o);
  const roster = participants.filter((p) => p.offeringId === o.id);
  const sessions = sessionsByOffering[o.id] ?? [];
  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow="Offering" title={`${o.formatName} · ${o.dates}`} action="Edit offering" back={{ href: "/admin/offerings", label: "Dates & seats" }} />
      <Card variant="panel" className="p-6">
        <Kv rows={[["Format", `${f?.duration} · ${f?.schedule}`], ["Seats", `${roster.length} registered · capacity 16`], ["Status", "Open"], ["Trainer", "Mustafa Qizilbash"], ["Joining information", "Not yet set — sent to participants before the first session"], ["Materials", "Released on registration"]]} />
        <div className="mt-5 flex flex-wrap gap-3">
          <Button type="button" disabled>Set joining information</Button>
          <Button variant="secondary" type="button" disabled>Email all participants</Button>
          <Button variant="secondary" type="button" disabled>Cancel offering</Button>
        </div>
      </Card>
      <h2 className="text-h1">Sessions & attendance</h2>
      <AdminTable columns={["Session", "Date", "Present", "Absent", ""]} rows={sessions.slice(0, 5).map((s) => [s.label, s.date, String(s.present), String(s.absent), <Disabled key="r">Record attendance</Disabled>])} />
      {sessions.length > 5 && <p className="text-body-sm text-[var(--color-ink-faint)]">… {sessions.length - 5} more sessions</p>}
      <h2 className="text-h1">Roster</h2>
      <AdminTable columns={["Participant", "Payment", "Attendance", "Completion", ""]} rows={roster.map((p) => [<Link key="n" href={`/admin/participants/${p.id}`} className="text-[var(--color-primary)] underline underline-offset-4">{p.name}</Link>, p.payment ?? "", p.attendance ?? "", p.completion ?? "", <span key="a" className="flex gap-3"><Disabled>Mark complete</Disabled><Disabled>Move date</Disabled></span>])} />
      <WireframeNote>Sample roster and attendance. "Mark complete" is the action that issues a Certificate of Completion (decision D2 defines completion); attendance is recorded per session by the trainer and is the evidence an HRD Corp claim needs.</WireframeNote>
    </div>
  );
}
