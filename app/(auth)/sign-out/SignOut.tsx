"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { authClient } from "@/modules/identity/auth-client";

/** Performs the sign-out on arrival (server-side session revocation), then
 *  refreshes so the header's account controls reflect the signed-out state. */
export function SignOut() {
  const router = useRouter();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void authClient.signOut().finally(() => router.refresh());
  }, [router]);
  return null;
}
