import { AdminHeader, AdminTable, Disabled, Kv } from "@/components/admin/AdminTable";
import { WireframeNote } from "@/components/auth/FormParts";
import { Card } from "@/components/ui/Card";
import { currencyChoices, getFlagship, PROGRAMME_TITLE } from "@/data/demoParticipant";

/** Programme content management — the one programme's title, formats, prices,
 *  curriculum and materials. Edits are disabled; content is real (courses.ts). */
export default function AdminProgramme() {
  const c = getFlagship();
  if (!c) return null;
  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow="Programme" title={PROGRAMME_TITLE} action="Edit programme" />
      <Card variant="panel" className="p-6">
        <Kv rows={[["Level", c.level], ["Duration", c.duration], ["Certificate", c.certificate], ["Status", "Published (title & curriculum placeholder — founder to confirm)"]]} />
      </Card>
      <h2 className="text-h1">Delivery formats</h2>
      <AdminTable columns={["Format", "Duration", "Schedule", "Total time", ""]} rows={(c.deliveryFormats ?? []).map((f) => [f.name, f.duration, f.schedule, f.totalTime, <Disabled key="e">Edit</Disabled>])} sampleFirstCol={false} />
      <h2 className="text-h1">Published prices</h2>
      <AdminTable columns={["Currency", "Original", "Offer", "Today", ""]} rows={currencyChoices.map((cc) => { const p = c.pricing?.[cc.key]; return [cc.name, p?.original ?? "", p?.discount ?? "", p?.today ?? "", <Disabled key="e">Edit</Disabled>]; })} sampleFirstCol={false} />
      <h2 className="text-h1">Curriculum · {c.modules.length} modules</h2>
      <AdminTable columns={["#", "Module", "Points", ""]} rows={c.modules.map((m, i) => [String(i + 1).padStart(2, "0"), m.title, String(m.points?.length ?? 0), <Disabled key="e">Edit</Disabled>])} sampleFirstCol={false} />
      <h2 className="text-h1">Supporting materials</h2>
      <AdminTable columns={["Material", "Released", ""]} rows={(c.included ?? []).map((m) => [m, "On registration (to be decided per item)", <Disabled key="u">Upload</Disabled>])} sampleFirstCol={false} />
      <WireframeNote>Content is the real programme record; price and offer edits must be effective-dated and audited (decision A10). Materials release rules per DR-02 §5 are undecided.</WireframeNote>
    </div>
  );
}
