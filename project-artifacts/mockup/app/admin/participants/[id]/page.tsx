import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, AdminTable, Kv } from "@/components/admin/AdminTable";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getParticipant, orders, participants } from "@/data/adminSamples";
import { getOffering } from "@/data/demoParticipant";

export function generateStaticParams() {
  return participants.map((p) => ({ id: p.id }));
}
export default async function AdminParticipantDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = getParticipant(id);
  if (!p) notFound();
  const off = p.offeringId ? getOffering(p.offeringId) : undefined;
  const theirOrders = orders.filter((o) => o.who === p.name);
  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow="Participant" title={p.name} back={{ href: "/admin/participants", label: "Participants" }} />
      <Card variant="panel" className="p-6">
        <Kv rows={[["Email", p.email], ["Country", p.country], ["Account created", p.joined], ["Public listing", p.listed === undefined ? "—" : p.listed ? "Listed" : "Not listed"]]} />
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" type="button" disabled>Email participant</Button>
          <Button variant="secondary" type="button" disabled>Export data (PDPA)</Button>
          <Button variant="secondary" type="button" disabled>Delete account</Button>
        </div>
      </Card>
      <h2 className="text-h1">Registrations</h2>
      {off ? (
        <AdminTable columns={["Offering", "Payment", "Attendance", "Completion"]} rows={[[<Link key="o" href={`/admin/offerings/${off.id}`} className="text-[var(--color-primary)] underline underline-offset-4">{off.formatName} · {off.dates}</Link>, p.payment ?? "", p.attendance ?? "", p.completion ?? ""]]} />
      ) : (
        <p className="text-body-sm text-[var(--color-ink-faint)]">No registrations.</p>
      )}
      <h2 className="text-h1">Orders</h2>
      {theirOrders.length ? <AdminTable columns={["Order", "Item", "Amount", "State"]} rows={theirOrders.map((o) => [<span key="i" className="text-mono">{o.id}</span>, o.item, o.amount, o.state])} /> : <p className="text-body-sm text-[var(--color-ink-faint)]">No orders.</p>}
      <h2 className="text-h1">Certificate</h2>
      {p.certificateId ? (
        <Card variant="panel" className="p-5">
          <p className="text-body-sm">
            <Link href={`/admin/certificates/${p.certificateId}`} className="text-mono text-[var(--color-primary)] underline underline-offset-4">{p.certificateId}</Link>
          </p>
        </Card>
      ) : (
        <p className="text-body-sm text-[var(--color-ink-faint)]">None issued.</p>
      )}
      <WireframeNote>Sample record. Notes, support history and consent records (which document version, when) belong here too.</WireframeNote>
    </div>
  );
}
