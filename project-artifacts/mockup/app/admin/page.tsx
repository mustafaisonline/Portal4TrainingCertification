import Link from "next/link";
import { AdminHeader, AdminTable, Stat } from "@/components/admin/AdminTable";
import { WireframeNote } from "@/components/auth/FormParts";
import { Card } from "@/components/ui/Card";
import { auditLog, enquiries, orders } from "@/data/adminSamples";
import { offerings } from "@/data/demoParticipant";

/** Admin dashboard — what needs attention today, then the numbers. Sample. */
const actions = [
  { href: "/admin/registrations", text: "Record attendance for Bootcamp · Day 2" },
  { href: "/admin/registrations", text: "Mark completion for 3 Bootcamp participants → certificates issue" },
  { href: "/admin/orders", text: "1 invoice pending (Priya Example · Accelerator)" },
  { href: "/admin/enquiries", text: "2 enquiries need a reply" },
  { href: "/admin/certificates", text: "1 certificate renewal due within 30 days" },
];
export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-8">
      <AdminHeader eyebrow="Dashboard" title="Operations" />
      <section aria-labelledby="todo">
        <h2 id="todo" className="text-h1 mb-3">Needs attention</h2>
        <Card variant="panel" className="p-2">
          <ul className="flex flex-col">
            {actions.map((a) => (
              <li key={a.text}>
                <Link href={a.href} className="text-body-sm block rounded-[var(--radius-plate)] px-3 py-2.5 hover:bg-[var(--color-ground-tint)]">
                  {a.text} <span className="text-[var(--color-primary)]">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </section>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Seats sold · next date" value="11 / 16" sub="Bootcamp · 12–13 Nov" />
        <Stat label="Revenue this month" value="RM 9,998" sub="+ USD 2,821 · Rs. 102,839 pending" />
        <Stat label="Active certificates" value="3" sub="1 renewal due · 1 expired" />
        <Stat label="Open enquiries" value="2" sub="1 team, 1 individual" />
      </div>
      <section aria-labelledby="upcoming">
        <h2 id="upcoming" className="text-h1 mb-3">Upcoming offerings</h2>
        <AdminTable columns={["Format", "Dates", "Seats", ""]} rows={offerings.map((o, i) => [o.formatName, o.dates, ["11 / 16", "12 / 12 (full)", "6 / 20"][i], <Link key="l" href={`/admin/offerings/${o.id}`} className="text-[var(--color-primary)] underline underline-offset-4">Open</Link>])} />
      </section>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[repeat(2,minmax(0,1fr))]">
        <section aria-labelledby="recent-orders">
          <h2 id="recent-orders" className="text-h1 mb-3">Recent orders</h2>
          <AdminTable columns={["Order", "Who", "Amount", "State"]} rows={orders.slice(0, 4).map((o) => [<span key="i" className="text-mono">{o.id}</span>, o.who, o.amount, o.state])} />
        </section>
        <section aria-labelledby="recent-enq">
          <h2 id="recent-enq" className="text-h1 mb-3">Recent enquiries</h2>
          <AdminTable columns={["From", "Type", "State"]} rows={enquiries.slice(0, 4).map((e) => [e.from, e.type, e.state])} />
        </section>
      </div>
      <section aria-labelledby="activity">
        <h2 id="activity" className="text-h1 mb-3">Recent activity</h2>
        <AdminTable columns={["Who", "Action", "Target"]} rows={auditLog.slice(0, 5).map((a) => [a.who, a.action, a.target])} />
      </section>
      <WireframeNote>Sample figures throughout. The real dashboard is computed from live records; nothing here is connected.</WireframeNote>
    </div>
  );
}
