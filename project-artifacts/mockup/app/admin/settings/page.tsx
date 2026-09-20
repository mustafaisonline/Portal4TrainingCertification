import { AdminHeader, AdminTable, Disabled } from "@/components/admin/AdminTable";
import { WireframeNote } from "@/components/auth/FormParts";
import { RENEWAL_FEE, RENEWAL_WINDOW_DAYS, VALIDITY_MONTHS } from "@/data/certificateConfig";
import { currencyChoices, paymentMethods } from "@/data/demoParticipant";

export default function AdminSettings() {
  return (
    <div className="flex flex-col gap-6">
      <AdminHeader eyebrow="Fees & settings" title="Settings" />
      <h2 className="text-h1">Certificate</h2>
      <AdminTable columns={["Setting", "Current value", "Effective from", "Changed by", ""]} rows={[["Renewal fee", `${RENEWAL_FEE.currency} ${RENEWAL_FEE.amount} per year`, "—", "—", <span key="a" className="flex gap-3"><Disabled>Change (effective-dated)</Disabled><Disabled>History</Disabled></span>], ["Validity", `${VALIDITY_MONTHS} months`, "—", "—", <Disabled key="c">Change</Disabled>], ["Renewal window", `${RENEWAL_WINDOW_DAYS} days before expiry`, "—", "—", <Disabled key="c">Change</Disabled>], ["Name-search rules", "Listed holders only · min 3 chars · max 10 results", "—", "—", <Disabled key="c">Change</Disabled>]]} sampleFirstCol={false} />
      <h2 className="text-h1">Commerce</h2>
      <AdminTable columns={["Setting", "Current value", ""]} rows={[["Currencies offered", currencyChoices.map((c) => c.code).join(" · "), <Disabled key="c">Change</Disabled>], ["Regional price eligibility", "Not decided (A8) — anyone may choose any currency", <Disabled key="c">Set rule</Disabled>], ["Payment methods", paymentMethods.map((m) => m.label).join(" · ") + " (provisional)", <Disabled key="c">Configure</Disabled>], ["Tax treatment", "Not decided (B5)", <Disabled key="c">Set</Disabled>], ["Invoicing entity", "Not set (B4)", <Disabled key="c">Set</Disabled>], ["Stripe", "Not connected (test mode first; keys live only in the deployment environment)", <Disabled key="c">Connect</Disabled>]]} sampleFirstCol={false} />
      <h2 className="text-h1">Policies</h2>
      <AdminTable columns={["Document", "Status", "Version", ""]} rows={[["Terms of service", "Not published", "—", <Disabled key="p">Publish</Disabled>], ["Privacy policy", "Not published", "—", <Disabled key="p">Publish</Disabled>], ["Refund & cancellation policy", "Not published", "—", <Disabled key="p">Publish</Disabled>], ["Credential integrity policy", "Not published", "—", <Disabled key="p">Publish</Disabled>]]} sampleFirstCol={false} />
      <WireframeNote>Every value here is a proposed default or an open decision. Fee changes must be effective-dated and audited (R-F1, R-F2, R-F6); policy publication must version documents so consent records point at the version accepted (C7).</WireframeNote>
    </div>
  );
}
