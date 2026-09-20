import Link from "next/link";
import { SampleTag } from "@/components/account/SampleTag";
import { WireframeNote } from "@/components/auth/FormParts";
import { Card } from "@/components/ui/Card";

const tiles = [
  { href: "/admin/offerings", label: "Seats left · next date", value: "5 of 16" },
  { href: "/admin/registrations", label: "Registrations this month", value: "3" },
  { href: "/admin/certificates", label: "Certificates due for renewal", value: "1" },
  { href: "/admin/settings", label: "Renewal fee", value: "USD 10" },
];
export default function AdminOverview() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Overview</p>
        <h1 className="text-display">Operations</h1>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link href={t.href} className="block h-full">
              <Card variant="panel" className="h-full p-5 transition-colors hover:border-[var(--color-primary)]">
                <p className="text-label mb-2">{t.label}</p>
                <p className="text-h1 text-[var(--color-primary)]">
                  {t.value}
                  <SampleTag />
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
      <WireframeNote>Sample figures. This is the trainer/administrator side the participant screens depend on — none of it is connected.</WireframeNote>
    </div>
  );
}
