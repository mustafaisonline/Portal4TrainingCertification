import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { getPrisma, withTransaction } from "@/db/prisma";
import { sendEmail } from "@/modules/notifications/email";
import { writeAudit } from "@/modules/platform/audit/repository";
import { isCountryCode } from "@/content/countries";
import { resetPasswordMessage, verifyEmailMessage } from "./emails";
import { publishedDocuments } from "./legal-documents";
import { identityEmailAllowed } from "./email-limits";
import { emailVerificationRequired } from "./email-verification";
import { signUpHumanCheckProblem } from "./human-check";
import { LIMITS, validateDateOfBirth } from "./profile-validation";
import { createRegisteredIdentity, findUserByAuthSubject, markEmailVerified } from "./users.repository";

/**
 * The registration details rule (founder decision 2026-09-27): full name,
 * country and date of birth "as on your government ID" are mandatory at
 * sign-up. Returns the first problem in words, or null when all is well.
 * The same limits the profile form applies (profile-validation.ts).
 */
export function registrationDetailsProblem(body: Record<string, unknown>): string | null {
  const name = typeof body["name"] === "string" ? body["name"].trim() : "";
  if (name.length < LIMITS.legalNameMin || name.length > LIMITS.legalNameMax) {
    return "Please enter your full name as it appears on your government ID.";
  }
  const country = typeof body["country"] === "string" ? body["country"].trim().toUpperCase() : "";
  if (!isCountryCode(country)) return "Please choose your country as on your government ID.";
  const dob = typeof body["dateOfBirth"] === "string" ? body["dateOfBirth"].trim() : "";
  if (!dob) return "Please enter your date of birth as on your government ID.";
  const checked = validateDateOfBirth(dob);
  if (!checked.ok) return checked.message;
  return null;
}

/*
 * Better Auth — the authentication provider (ADR-006 recommendation, executed
 * on WIREFRAME_TO_PRODUCTION_PLAN.md §0.1 default 1; MILESTONE_2_EXECUTION_
 * PLAN.md §6 records every commitment below).
 *
 * SURFACE (condition 1): email + password, email verification, password
 * reset, sessions. Nothing else — no organisation, admin, OIDC-provider,
 * API-key, magic-link, anonymous, device or SCIM plugins. TOTP two-factor
 * was built in M2 and REMOVED for MVP 1 by founder decision (2026-09-21);
 * the `auth_two_factors` table and `auth_users.two_factor_enabled` column
 * stay in place unused — dropping them is a destructive migration for a
 * separate approval. Re-enabling = restoring commit 5d08cdc's plugin wiring.
 *
 * SEPARATION (conditions 2–3): Better Auth owns the `auth_*` tables and only
 * those. Our `users`, `user_roles`, `consents` and `audit_log` are written by
 * the hooks below through the identity repositories, in one transaction.
 * Nothing outside src/modules/identity imports this file's session shape;
 * route code uses ./session.ts.
 */

/**
 * Every activation link — from sign-up, "send a new link" or a blocked sign-in — opens the confirmation page
 * (CR-2026-10-03-1245), whatever callback the request carried. Only the redirect target changes; the signed
 * token is untouched.
 */
function confirmationLink(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("callbackURL", "/email-confirmed");
    return u.toString();
  } catch {
    return url;
  }
}

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
    requireEmailVerification: emailVerificationRequired(),
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: ONE_HOUR,
    sendResetPassword: async ({ user, url }) => {
      // Not awaited on purpose (timing-safe: the response must not reveal
      // whether an address exists). The row records the outcome.
      void (async () => {
        if (!(await identityEmailAllowed("reset", user.email))) return console.warn("[email] password-reset email skipped: per-address cap reached");
        await sendEmail(resetPasswordMessage({ to: user.email, name: user.name, url, expiresInMinutes: 60 }));
      })().catch((err) => console.error("[email] password-reset email could not be recorded", err));
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
    // With the setting on, a sign-in attempt on an unconfirmed address sends a fresh activation link.
    sendOnSignIn: true,
    // OFF (security review, MEDIUM): with auto sign-in, an attacker who registers someone else's address with the
    // attacker's own password would sign the VICTIM into the attacker's account when the victim clicks the link.
    // The person signs in with their own password instead; /email-confirmed then shows the confirmation.
    autoSignInAfterVerification: false,
    expiresIn: ONE_HOUR,
    sendVerificationEmail: async ({ user, url }) => {
      void (async () => {
        if (!(await identityEmailAllowed("verify", user.email))) return console.warn("[email] verification email skipped: per-address cap reached");
        await sendEmail(verifyEmailMessage({ to: user.email, name: user.name, url: confirmationLink(url), expiresInMinutes: 60 }));
      })().catch((err) => console.error("[email] verification email could not be recorded", err));
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
      "/change-password": { window: 60, max: 5 },
    },
  },

  advanced: {
    cookiePrefix: "p4tc",
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-up/email") {
        // The human check comes FIRST (CR-2026-10-03-1245): before any lookup, so a script learns nothing — not
        // even whether an address is taken — until it has passed. One-time challenge, checked on the server.
        const humanProblem = await signUpHumanCheckProblem((ctx.body ?? {}) as Record<string, unknown>, ctx.headers ?? ctx.request?.headers);
        if (humanProblem) {
          throw new APIError("BAD_REQUEST", { code: humanProblem, message: "Please complete the check to show you are a person, then try again." });
        }
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
        // Founder decision 2026-09-21 (option A): a sign-up for an address
        // that already has an account is a clear error, not Better Auth's
        // enumeration-safe synthetic success (which it returns whenever
        // autoSignIn is false). The existing credential is never touched.
        const email = typeof body["email"] === "string" ? body["email"].trim().toLowerCase() : "";
        if (email && (await getPrisma().authUser.findUnique({ where: { email }, select: { id: true } }))) {
          throw new APIError("UNPROCESSABLE_ENTITY", {
            code: "USER_ALREADY_EXISTS",
            message: "An account with this email already exists. Sign in, or reset your password.",
          });
        }
        // Founder decision 2026-09-27: the government-ID fields — full name,
        // date of birth, country — are mandatory AT registration (with the
        // unique email), so a new account can go straight to payment. The
        // form checks the same rules; this is the guard a direct POST meets.
        const problem = registrationDetailsProblem(body);
        if (problem) throw new APIError("BAD_REQUEST", { code: "REGISTRATION_DETAILS_INVALID", message: problem });
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // A successful password change is an identity mutation → audited.
      if (ctx.path === "/change-password" && ctx.context.returned && !(ctx.context.returned instanceof APIError)) {
        const subject = ctx.context.session?.user.id;
        if (!subject) return;
        await withTransaction(async (tx) => {
          const ours = await findUserByAuthSubject(subject, tx);
          if (!ours) return;
          await writeAudit(tx, {
            actorUserId: ours.id,
            action: "password.changed",
            entityType: "user",
            entityId: ours.id,
            after: { otherSessionsRevoked: (ctx.body as { revokeOtherSessions?: boolean } | undefined)?.revokeOtherSessions === true },
          });
        });
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user, ctx) => {
          // The mapping, atomically (plan §6.2). `publishedDocuments()` was
          // non-null in the before-hook of this same request.
          const consented = publishedDocuments();
          if (!consented) throw new APIError("FORBIDDEN", { code: "REGISTRATION_CLOSED", message: "Registration is not open yet." });
          // The date of birth is NOT a Better Auth field (no column on
          // auth_users): it is read from the sign-up request the hook runs
          // inside of — validated by the before-hook — and stored on OUR
          // profile row only.
          const body = (ctx?.body ?? {}) as Record<string, unknown>;
          try {
            await withTransaction((tx) =>
              createRegisteredIdentity(tx, {
                subject: user.id,
                email: user.email,
                name: user.name,
                country: typeof user["country"] === "string" ? user["country"] : null,
                dateOfBirth: typeof body["dateOfBirth"] === "string" ? body["dateOfBirth"] : null,
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
    },
  },

  plugins: [
    // Must be last: lets server actions set cookies (docs/integrations/next).
    nextCookies(),
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
