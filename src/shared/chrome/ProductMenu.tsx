"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ProductMenuData } from "./product-menu-data";
import { productMenuAgentic, productMenuLearning, productMenuMore, type ProductMenuLink } from "./site-nav";

/*
 * The "Product" panel (CR-2026-10-04-0110; founder: "a submenu opens on top of Hero section, having menu all possible menu
 * items we have, in a categories manner … make sure it does not overflow from the screen … not for mobile"). Desktop header
 * only (the phone has its own full menu). A disclosure: the button opens it, Esc / a click outside / choosing a link closes
 * it. The panel spans the header's width, scrolls inside itself if the screen is short, and flows into 2, 3 or 5 columns.
 */

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
      <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const linkClass = "rounded-[var(--radius-plate)] px-2 py-1.5 text-body-sm text-[var(--color-ink-quiet)] hover:bg-[var(--color-ground-raised)] hover:text-[var(--color-ink)] block";

export function ProductMenu({ data }: { data: ProductMenuData }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "/";
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  // A navigation closes the panel (links also close it themselves, for same-page anchors).
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const close = () => setOpen(false);
  const renderLink = (l: ProductMenuLink) => (
    <li key={l.href + l.label}>
      <Link href={l.href} onClick={close} className={linkClass}>
        {l.label}
      </Link>
      {l.children ? (
        <ul className="mt-0.5 flex flex-col border-l border-[var(--color-line)] pl-3 ml-2">
          {l.children.map((c) => (
            <li key={c.href}>
              <Link href={c.href} onClick={close} className={linkClass}>
                {c.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
  const section = (id: string, title: string, children: React.ReactNode) => (
    <div key={id} data-testid={`product-section-${id}`}>
      <h2 className="text-label mb-2 px-2">{title}</h2>
      <ul className="flex flex-col">{children}</ul>
    </div>
  );

  return (
    <div ref={wrap}>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="product-menu"
        data-testid="product-menu-button"
        className={`flex items-center gap-1 border-b-2 py-1 transition-colors hover:text-[var(--color-ink)] ${open ? "border-[var(--color-cyan)] font-medium text-[var(--color-ink)]" : "border-transparent"}`}
      >
        Product
        <Chevron open={open} />
      </button>
      {open ? (
        <div id="product-menu" role="region" aria-label="Product menu" data-testid="product-menu" className="absolute inset-x-0 top-full z-20 max-h-[calc(100dvh-5rem)] overflow-y-auto border-b border-[var(--color-line)] bg-[var(--color-ground)] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
          <div className="mx-auto grid max-w-[1280px] gap-x-8 gap-y-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {section(productMenuLearning.id, productMenuLearning.title, productMenuLearning.links.map(renderLink))}
            {section(
              "trainings",
              "Trainings",
              <>
                {data.trainings.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/programs/${t.slug}`} onClick={close} className={linkClass} data-testid="product-training-link">
                      {t.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/programs" onClick={close} className={`${linkClass} font-medium text-[var(--color-primary)]`} data-testid="product-all-trainings">
                    {data.moreTrainings ? "More trainings →" : "See all trainings →"}
                  </Link>
                </li>
              </>,
            )}
            {section(
              "dashboard",
              "Dashboard",
              data.dashboard.map((d) => (
                <li key={d.href + d.label}>
                  <Link href={d.href} onClick={close} className={linkClass}>
                    {d.label}
                  </Link>
                </li>
              )),
            )}
            {section(productMenuAgentic.id, productMenuAgentic.title, productMenuAgentic.links.map(renderLink))}
            {section(productMenuMore.id, productMenuMore.title, productMenuMore.links.map(renderLink))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
