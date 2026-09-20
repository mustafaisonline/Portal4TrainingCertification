"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { Button } from "@/components/ui/Button";
import { isDemoSignedIn, setReturnTo } from "@/lib/demoSession";

/**
 * "Register your interest" on the PUBLIC programme page — founder direction,
 * 2026-09-20: if the visitor is not signed in, ask them to sign in; if they
 * already are, take them to the programme registration page (/checkout).
 *
 * The decision is made AT CLICK TIME (a synchronous read of the demo session,
 * lib/demoSession.ts) rather than during render, so the button is correct even
 * before hydration finishes. Its `href` is /checkout, so with JavaScript
 * unavailable it still lands somewhere sensible (the checkout shows its own
 * sign-in gate). Signed-out: the checkout path is remembered so sign-in
 * returns the visitor to registration.
 *
 * Client-side demo behaviour, not access control — see lib/demoSession.ts.
 */
export function RegisterInterestButton({
  children = "Register your interest",
}: {
  children?: string;
}) {
  const router = useRouter();
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (isDemoSignedIn()) return; // let the link go to /checkout
    e.preventDefault();
    setReturnTo("/checkout");
    router.push("/sign-in");
  }
  return (
    <Button href="/checkout" onClick={onClick}>
      {children}
    </Button>
  );
}
