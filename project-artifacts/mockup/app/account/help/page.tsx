import Link from "next/link";
import { Card } from "@/components/ui/Card";

/** Help — WIREFRAME, 2026-09-20. Signposts only; no invented contact details. */
const links = [
  { href: "/faq", title: "Frequently asked questions", body: "The programme, paying, the certificate, your data." },
  { href: "/contact-us", title: "Contact us", body: "Send an enquiry." },
  { href: "/refund-policy", title: "Refund & cancellation policy", body: "Not yet published." },
  { href: "/privacy", title: "Privacy policy", body: "Not yet published." },
  { href: "/account/profile", title: "Profile & security", body: "Change your details or password." },
];
export default function HelpPage() {
  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Help</p>
        <h1 className="text-display">How can we help?</h1>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="block h-full">
              <Card variant="panel" className="h-full p-5 transition-colors hover:border-[var(--color-primary)]">
                <p className="text-body-lg font-medium">{l.title}</p>
                <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">{l.body}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
