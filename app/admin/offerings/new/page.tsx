import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedExperts } from "@/modules/catalogue/experts/repository";
import { listDeliveryFormatsForAdmin, listProgrammesForAdmin } from "@/modules/catalogue/programmes/repository";
import { Card } from "@/shared/ui/Card";
import { OfferingForm } from "../OfferingForm";

/* New offering — the founder creates a real date here; nothing is seeded
   (DR-02 §4.1). Header structure follows the wireframe's `AdminHeader`. */
export const metadata: Metadata = { title: "New offering" };

export default async function NewOfferingPage() {
  const [programmes, formats, experts] = await Promise.all([
    listProgrammesForAdmin(),
    listDeliveryFormatsForAdmin(),
    listPublishedExperts(),
  ]);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/admin/offerings" className="text-body-sm mb-2 inline-block py-1 text-[var(--color-primary)] underline underline-offset-4">
          ← Scheduled offerings
        </Link>
        <p className="text-label mb-2 text-[var(--color-primary)]">Offering</p>
        <h1 className="text-display">New offering</h1>
      </header>
      <Card variant="panel" className="max-w-[760px] p-6">
        <OfferingForm programmes={programmes} formats={formats} experts={experts.map((x) => ({ id: x.id, name: x.name }))} />
      </Card>
    </div>
  );
}
