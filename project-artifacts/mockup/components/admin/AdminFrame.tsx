"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignInGate } from "@/components/account/SignInGate";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { endDemoSession, useDemoRole } from "@/lib/demoSession";

/**
 * Trainer / administrator area — WIREFRAME, 2026-09-20, founder direction.
 * Rebuilt the same day with its own demo persona ("Trainer / admin" on the
 * sign-in page) and a full page set. See docs/execution/ADMIN_REQUIREMENTS.md.
 *
 * ⚠ THE ROLE IS A BROWSER LABEL, NOT A PERMISSION. `useDemoRole` reads a word
 * from sessionStorage; anyone can set it. There is no server, so nothing here
 * is protected — every page is a static file. The real product needs scoped
 * RBAC enforced at the data layer (ADR-020) and an audit row per action
 * (ADR-022). Every table shows SAMPLE rows; every action button is disabled.
 */
const groups: { title: string; items: { href: string; label: string }[] }[] = [
  { title: "Overview", items: [{ href: "/admin", label: "Dashboard" }] },
  {
    title: "Delivery",
    items: [
      { href: "/admin/programme", label: "Programme" },
      { href: "/admin/offerings", label: "Dates & seats" },
      { href: "/admin/registrations", label: "Registrations & attendance" },
      { href: "/admin/participants", label: "Participants" },
    ],
  },
  {
    title: "Commerce",
    items: [
      { href: "/admin/orders", label: "Orders & payments" },
      { href: "/admin/enquiries", label: "Enquiries" },
      { href: "/admin/organisations", label: "Organisations" },
    ],
  },
  { title: "Certificates", items: [{ href: "/admin/certificates", label: "Certificates" }] },
  {
    title: "Configuration",
    items: [
      { href: "/admin/settings", label: "Fees & settings" },
      { href: "/admin/emails", label: "Emails" },
      { href: "/admin/users", label: "Users & roles" },
    ],
  },
  {
    title: "Records",
    items: [
      { href: "/admin/audit", label: "Audit log" },
      { href: "/admin/reports", label: "Reports" },
    ],
  },
];

function isActive(path: string, href: string) {
  return href === "/admin" ? path === "/admin" : path === href || path.startsWith(`${href}/`);
}

export function AdminFrame({ children }: { children: ReactNode }) {
  const role = useDemoRole();
  const router = useRouter();
  const path = (usePathname() ?? "/admin").replace(/\/+$/, "") || "/admin";

  if (role === "unknown") return <div className="min-h-[60vh] bg-[var(--color-ground-tint)]" aria-hidden="true" />;
  if (role === null) {
    return (
      <SignInGate
        title="Trainer & admin area"
        body="Sign in with the Trainer / admin demo account (shown on the sign-in page) to walk the operations wireframe."
        returnTo="/admin"
      />
    );
  }
  if (role !== "admin") {
    return (
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[480px] px-4 py-20 sm:px-6">
          <Card variant="panel" className="p-6 text-center sm:p-8">
            <h1 className="text-h1 mb-3">Administrator account needed</h1>
            <p className="text-body-sm mb-6 text-[var(--color-ink-quiet)]">
              You are signed in as a participant. Sign out and use the Trainer /
              admin demo account shown on the sign-in page.
            </p>
            <Button
              type="button"
              onClick={() => {
                endDemoSession();
                router.push("/sign-in");
              }}
            >
              Sign out and switch
            </Button>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="border-b border-[var(--color-line)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]">
        <p role="note" className="text-body-sm mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
          <span>
            <strong className="font-semibold">Trainer / admin wireframe — sample data.</strong>{" "}
            The role is a browser label, not a permission; every action is disabled.
          </span>
          <button
            type="button"
            onClick={() => {
              endDemoSession();
              router.push("/sign-out");
            }}
            className="underline underline-offset-4 hover:opacity-80"
          >
            End demo session
          </button>
        </p>
      </div>
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto grid max-w-[1280px] grid-cols-[minmax(0,1fr)] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:py-12">
          <nav aria-label="Admin" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:gap-5 lg:overflow-visible lg:px-0 lg:pb-0">
              {groups.map((g) => (
                <div key={g.title} className="flex shrink-0 gap-1 lg:flex-col">
                  <p className="text-label mb-0 hidden lg:mb-1.5 lg:block">{g.title}</p>
                  {g.items.map((it) => {
                    const active = isActive(path, it.href);
                    return (
                      <Link
                        key={it.href}
                        href={it.href}
                        aria-current={active ? "page" : undefined}
                        className={`block whitespace-nowrap rounded-[var(--radius-plate)] px-3 py-2 text-body-sm transition-colors ${
                          active
                            ? "bg-[var(--color-ground-raised)] font-medium text-[var(--color-ink)] shadow-[0_1px_0_var(--color-line)]"
                            : "text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-raised)] hover:text-[var(--color-ink)]"
                        }`}
                      >
                        {it.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </>
  );
}
