import { notFound } from "next/navigation";
import { ReceiptView } from "@/components/account/ReceiptView";
import { getOffering, offerings } from "@/data/demoParticipant";

/** Receipt for one order — wireframe, 2026-09-20. Static route per sample
 *  offering (export requirement); content from the demo session. */
export function generateStaticParams() {
  return offerings.map((o) => ({ id: o.id }));
}
export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getOffering(id)) notFound();
  return <ReceiptView offeringId={id} />;
}
