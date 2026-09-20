import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, AdminTable, Kv } from "@/components/admin/AdminTable";
import { WireframeNote } from "@/components/auth/FormParts";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { participants } from "@/data/adminSamples";
import { SAMPLE_IDS } from "@/data/certificates";

export function generateStaticParams() {
  return SAMPLE_IDS.map((id) => ({ id }));
}
export default async function AdminCertificateDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = participants.find((x) => x.certificateId === id);
  if (!p) notFound();
  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow="Certificate" title={id} back={{ href: "/admin/certificates", label: "Certificates" }} />
      <Card variant="panel" className="p-6">
        <Kv rows={[["Holder", <Link key="h" href={`/admin/participants/${p.id}`} className="text-[var(--color-primary)] underline underline-offset-4">{p.name}</Link>], ["Programme", "Data Blueprint & AI / Vibe Coding"], ["Issued", "Sample"], ["Expires", "Sample — see public page for live status"], ["Public listing", p.listed ? "Listed (holder consent recorded: sample)" : "Not listed"], ["Public page", <Link key="v" href={`/verify/${id}`} className="text-[var(--color-primary)] underline underline-offset-4">/verify/{id}</Link>]]} />
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" type="button" disabled>Correct holder name</Button>
          <Button variant="secondary" type="button" disabled>Reissue PDF</Button>
          <Button variant="secondary" type="button" disabled>Revoke (reason required)</Button>
        </div>
      </Card>
      <h2 className="text-h1">History</h2>
      <AdminTable columns={["Event", "When", "By", "Detail"]} rows={[["Issued", "Sample", "Mustafa Qizilbash", "Completion recorded"], ["Renewal reminder", "Sample", "System", "30 days before expiry"], ["Renewed", "Sample", "Holder", "USD 10 · card · webhook-confirmed"]]} />
      <WireframeNote>Sample. Every event on a certificate is an insert-only audit row (ADR-022). Revocation must record reason and actor and show as Revoked (not Expired) on the public page (D11).</WireframeNote>
    </div>
  );
}
