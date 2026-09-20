import { notFound } from "next/navigation";
import { ParticipationView } from "@/components/account/ParticipationView";
import { getOffering, offerings } from "@/data/demoParticipant";

/** Programme participation for one start date (wireframe, 2026-09-20). The
 *  route is static (one page per sample offering — required by the static
 *  export); what it shows depends on the demo session's registrations, read
 *  in the client component. See ParticipationView. */
export function generateStaticParams() {
  return offerings.map((o) => ({ id: o.id }));
}

export default async function ProgrammeParticipationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offering = getOffering(id);
  if (!offering) notFound();
  return <ParticipationView offeringId={offering.id} />;
}
