import { AdminScreen, Disabled } from "@/components/admin/AdminTable";
import { RENEWAL_FEE, RENEWAL_WINDOW_DAYS, VALIDITY_MONTHS } from "@/data/certificateConfig";

export default function AdminSettings() {
  return (
    <AdminScreen
      eyebrow="Fees & settings"
      title="Certificate fee and rules"
      action="Change fee"
      columns={["Setting", "Current value", "Effective from", "Changed by", ""]}
      rows={[
        ["Renewal fee", `${RENEWAL_FEE.currency} ${RENEWAL_FEE.amount} per year`, "—", "—", <Disabled key="h">History</Disabled>],
        ["Validity", `${VALIDITY_MONTHS} months`, "—", "—", ""],
        ["Renewal window", `${RENEWAL_WINDOW_DAYS} days before expiry`, "—", "—", ""],
      ]}
      note="The founder said the fee can change. In the real product it is administrator-managed, effective-dated (applies to future renewals only), and every change is audited (requirements R-F1, R-F2, R-F6). Today it is a constant in data/certificateConfig.ts."
    />
  );
}
