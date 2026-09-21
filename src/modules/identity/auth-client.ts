"use client";

import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

/*
 * Browser-side client for the auth endpoints. Same plugin surface as the
 * server (twoFactor only). `inferAdditionalFields` carries the `country`
 * field's type from the server config; nothing about roles lives here —
 * authorisation is server-side (./session.ts).
 */
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), twoFactorClient()],
});
