import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins";
import { getPrisma, withTransaction } from "@/db/prisma";
import { sendEmail } from "@/modules/notifications/email";
import { writeAudit } from "@/modules/platform/audit/repository";
import { resetPasswordMessage, verifyEmailMessage } from "./emails";
import { publishedDocuments } from "./legal-documents";
import { createRegisteredIdentity, findUserByAuthSubject, markEmailVerified } from "./users.repository";

/*
 * Better Auth — the authentication provider (ADR-006 recommendation, executed
 * on WIREFRAME_TO_PRODUCTION_PLAN.md §0.1 default 1; MILESTONE_2_EXECUTION_
 * PLAN.md §6 records every commitment below).
 *
 * SURFACE (condition 1): email + password, email verification, password
 * reset, sessions, TOTP two-factor. Nothing else — no organisation, admin,
 * OIDC-provider, API-key, magic-link, anonymous, device or SCIM plugins.
 *
 * SEPARATION (conditions 2–3): Better Auth owns the `auth_*` tables and only
 * those. Our `users`, `user_roles`, `consents` and `audit_log` are written by
 * the hooks below through the identity repositories, in one transaction.
 * Nothing outside src/modules/identity imports this file's session shape;
 * route code uses ./session.ts.
 */

const APP_NAME = "Data & AI Academy";
const ONE_HOUR = 60 * 60;

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is not set — see .env.example (ADR-030: secrets come from the environment).`);
  return v;
}

const baseURL = process.env["APP_BASE_URL"] ?? "http://localhost:3100";

export const auth = betterAuth({
  appName: APP_NAME,
  baseURL,
  secret: requiredEnv("BETTER_AUTH_SECRET"),
  telemetry: { enabled: false },

  database: prismaAdapter(getPrisma(), { provider: "postgresql" }),

  // Better Auth's tables, named so their role is visible in every query.
  user: {
    modelName: "authUser",
    additionalFields: {
      // Collected on the reviewed registration form; copied to `users.country`
      // by the create hook. Input only.
      country: { type: "string", required: false, input: true, returned: false },
    },
  },
  session: {
    modelName: "authSession",
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh after a day of use
    // No cookie cache: sign-out and password reset must take effect at once.
  },
  account: { modelName: "authAccount" },
  verification: { modelName: "authVerification" },

  emailAndPassword: {
    enabled: true,
    // Founder decision 2026-09-21 (evening): minimum 8 (was the documented
    // default of 12, plan §10.3).
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Founder decision 2026-09-21 (evening): no email provider exists yet
    // (ADR-015 open), so a verification link cannot be delivered. Sign-in is
    // allowed with email + password immediately after registration. The
    // verification email is still recorded in the outbox (sendOnSignUp) and
    // `users.email_verified_at` still records a verified address, so this
    // can be switched back to `true` the day a provider is wired.
    requireEmailVerification: false,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    sendResetPassword: async ({ user, url }) => {
      // Not awaited on purpose (timing-safe: the response must not reveal
      // whether an address exists). The row records the outcome.
      void sendEmail(resetPasswordMessage({ to: user.email, name: user.name, url, expiresInMinutes: 60 }));
    },
    onPasswordReset: async ({ user }) => {
      await withTransaction(async (tx) => {
        const ours = await findUserByAuthSubject(user.id, tx);
        if (!ours) return;
        await writeAudit(tx, {
          actorUserId: ours.id,
          action: "password.reset",
          entityType: "user",
          entityId: ours.id,
          after: { sessionsRevoked: true },
        });
      });
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: ONE_HOUR,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail(verifyEmailMessage({ to: user.email, name: user.name, url, expiresInMinutes: 60 }));
    },
    afterEmailVerification: async (user) => {
      await withTransaction((tx) => markEmailVerified(tx, user.id));
    },
  },

  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "authRateLimit",
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 60, max: 3 },
      "/send-verification-email": { window: 60, max: 3 },
      "/two-factor/verify-totp": { window: 60, max: 5 },
      "/two-factor/verify-backup-code": { window: 60, max: 5 },
    },
  },

  advanced: {
    cookiePrefix: "p4tc",
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        // Consent gate (plan §6.9). Enforced HERE, on the endpoint, so a direct
        // POST cannot bypass the form: registration is closed until the legal
        // documents are published, and requires explicit acceptance.
        if (!publishedDocuments()) {
          throw new APIError("FORBIDDEN", {
            code: "REGISTRATION_CLOSED",
            message: "Registration is not open yet: the Terms of service and Privacy policy have not been published.",
          });
        }
        const body = (ctx.body ?? {}) as Record<string, unknown>;
        if (body["consent"] !== true) {
          throw new APIError("BAD_REQUEST", {
            code: "CONSENT_REQUIRED",
            message: "Please accept the Terms of service and Privacy policy to create an account.",
          });
        }
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // The mapping, atomically (plan §6.2). `publishedDocuments()` was
          // non-null in the before-hook of this same request.
          const consented = publishedDocuments();
          if (!consented) throw new APIError("FORBIDDEN", { code: "REGISTRATION_CLOSED", message: "Registration is not open yet." });
          try {
            await withTransaction((tx) =>
              createRegisteredIdentity(tx, {
                subject: user.id,
                email: user.email,
                name: user.name,
                country: typeof user["country"] === "string" ? user["country"] : null,
                consented,
              }),
            );
          } catch (err) {
            // No half-registered person: remove the provider user we cannot map.
            await getPrisma().authUser.delete({ where: { id: user.id } }).catch(() => undefined);
            throw err;
          }
        },
      },
      update: {
        before: async (update, ctx) => {
          // MFA state changes are identity mutations → audited (AD-4).
          if (typeof update["twoFactorEnabled"] === "boolean") {
            const subject = ctx?.context.session?.user.id;
            if (subject) {
              const enabled = update["twoFactorEnabled"];
              await withTransaction(async (tx) => {
                const ours = await findUserByAuthSubject(subject, tx);
                if (!ours) return;
                await writeAudit(tx, {
                  actorUserId: ours.id,
                  action: enabled ? "mfa.enabled" : "mfa.disabled",
                  entityType: "user",
                  entityId: ours.id,
                  after: { twoFactorEnabled: enabled },
                });
              });
            }
          }
        },
      },
    },
  },

  plugins: [
    twoFactor({
      issuer: APP_NAME,
      schema: { twoFactor: { modelName: "authTwoFactor" } },
    }),
    // Must be last: lets server actions set cookies (docs/integrations/next).
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
