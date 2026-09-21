"use client";

import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

/*
 * Browser-side client for the auth endpoints. Same plugin surface as the
 * server (none beyond email/password since MFA was removed for MVP 1 —
 * founder decision 2026-09-21). `inferAdditionalFields` carries the
 * `country` field's type from the server config; nothing about roles lives
 * here — authorisation is server-side (./session.ts).
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
