import { AdminScreen, Disabled, Stat } from "@/components/admin/AdminTable";
import { orders } from "@/data/adminSamples";

export default function AdminOrders() {
  return (
    <AdminScreen
      eyebrow="Orders & payments"
      title="Orders"
      action="Raise invoice"
      columns={["Order", "Participant", "Item", "Amount", "Method", "State", ""]}
      rows={orders.map((o) => [<span key="i" className="text-mono">{o.id}</span>, o.who, o.item, o.amount, o.method, o.state, <span key="a" className="flex gap-3"><Disabled>Receipt</Disabled><Disabled>Refund</Disabled></span>])}
      note="Sample orders. Payment states (pending / succeeded / failed / abandoned / refunded / disputed) come from Stripe webhooks; refunds follow the refund policy (B3) and are audited. Corporate invoices (A5) need the legal entity and tax treatment (B4, B5)."
    >
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-3">
        <Stat label="Paid this month" value="RM 9,998" sub="+ USD 2,821" />
        <Stat label="Invoices pending" value="1" sub="Rs. 102,839.86" />
        <Stat label="Refunds" value="1" sub="RM 4,999" />
      </div>
    </AdminScreen>
  );
}
