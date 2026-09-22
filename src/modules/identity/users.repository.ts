import { countryName, isCountryCode } from "@/content/countries";
import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";
import type { PublishedDocuments } from "./legal-documents";
import { REQUIRED_DOCUMENTS } from "./legal-documents";

/*
 * Business identity (`users`) and the provider mapping (`auth_identities`).
 *
 * DECISION_B §B, condition 3 — the mapping pattern: our UUID is the identity
 * every business table references; the provider's subject is confined to
 * `auth_identities`. This module is the only code that reads or writes that
 * bridge.
 */

export const AUTH_PROVIDER = "better-auth" as const;

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  country: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

const select = { id: true, email: true, name: true, country: true, emailVerifiedAt: true, createdAt: true } as const;

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findUserById(userId: string, db: Db = getPrisma()): Promise<UserRecord | null> {
  return db.user.findUnique({ where: { id: userId }, select });
}

export async function findUserByEmail(email: string, db: Db = getPrisma()): Promise<UserRecord | null> {
  return db.user.findUnique({ where: { email: normaliseEmail(email) }, select });
}

/** Resolve the provider's subject (Better Auth's user id) to our user. */
export async function findUserByAuthSubject(subject: string, db: Db = getPrisma()): Promise<UserRecord | null> {
  const identity = await db.authIdentity.findUnique({
    where: { provider_providerSubject: { provider: AUTH_PROVIDER, providerSubject: subject } },
    select: { user: { select } },
  });
  return identity?.user ?? null;
}

export type RegisterIdentityInput = {
  /** Better Auth's user id. */
  subject: string;
  email: string;
  name: string;
  /** An ISO 3166-1 alpha-2 code from the registration form (Milestone 5a);
   *  older callers may still pass a free-text name, kept as given. */
  country: string | null;
  /** The published versions the person accepted — required; registration is
   *  closed when there are none (legal-documents.ts). */
  consented: PublishedDocuments;
};

/**
 * Everything a registration creates on OUR side, in ONE transaction (plan
 * §6.2): users → auth_identities → user_profiles → user_roles(participant,
 * platform) → consents → audit rows. The caller (the Better Auth after-hook)
 * removes the provider user if this throws, so a half-registered person
 * cannot exist. `users.country` keeps holding the country NAME (existing
 * readers); the profile row holds the ISO code when one was given.
 */
export async function createRegisteredIdentity(tx: Tx, input: RegisterIdentityInput): Promise<UserRecord> {
  const rawCountry = input.country?.trim() || null;
  const countryCode = rawCountry && isCountryCode(rawCountry.toUpperCase()) ? rawCountry.toUpperCase() : null;
  const user = await tx.user.create({
    data: {
      email: normaliseEmail(input.email),
      name: input.name.trim(),
      country: countryCode ? countryName(countryCode) : rawCountry,
    },
    select,
  });
  await tx.authIdentity.create({
    data: { userId: user.id, provider: AUTH_PROVIDER, providerSubject: input.subject },
  });
  await tx.userProfile.create({
    data: { userId: user.id, legalName: user.name, countryCode },
  });
  await tx.userRole.create({
    data: { userId: user.id, role: "participant", scopeType: "platform", scopeId: null, grantedByUserId: null },
  });
  for (const key of REQUIRED_DOCUMENTS) {
    await tx.consent.create({
      data: { userId: user.id, documentKey: key, documentVersion: input.consented[key] },
    });
  }
  await writeAudit(tx, {
    actorUserId: user.id,
    action: "user.registered",
    entityType: "user",
    entityId: user.id,
    after: { email: user.email, name: user.name, country: user.country, roles: ["participant@platform"] },
  });
  await writeAudit(tx, {
    actorUserId: user.id,
    action: "consent.recorded",
    entityType: "user",
    entityId: user.id,
    after: { ...input.consented },
  });
  return user;
}

export type ProfileInput = { name: string; country: string | null };

/**
 * The person edits their own profile (account shell, 2026-09-21). Updates
 * OUR `users` row — the source of truth for name and country — and writes
 * the `profile.updated` audit row with the before/after of the fields that
 * changed, in the caller's transaction. Email is not editable here: a change
 * of address needs a verification email, which no provider can deliver yet.
 * Returns null when the user no longer exists.
 */
export async function updateUserProfile(tx: Tx, userId: string, input: ProfileInput): Promise<UserRecord | null> {
  const current = await findUserById(userId, tx);
  if (!current) return null;
  const name = input.name.trim();
  const country = input.country?.trim() || null;
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  if (name !== current.name) {
    before["name"] = current.name;
    after["name"] = name;
  }
  if (country !== current.country) {
    before["country"] = current.country;
    after["country"] = country;
  }
  if (Object.keys(after).length === 0) return current;
  const updated = await tx.user.update({ where: { id: userId }, data: { name, country }, select });
  await writeAudit(tx, {
    actorUserId: userId,
    action: "profile.updated",
    entityType: "user",
    entityId: userId,
    before,
    after,
  });
  return updated;
}

/** Called when the provider confirms the address. Idempotent. */
export async function markEmailVerified(tx: Tx, subject: string): Promise<UserRecord | null> {
  const user = await findUserByAuthSubject(subject, tx);
  if (!user) return null;
  if (user.emailVerifiedAt) return user;
  const now = new Date();
  const updated = await tx.user.update({ where: { id: user.id }, data: { emailVerifiedAt: now }, select });
  await writeAudit(tx, {
    actorUserId: user.id,
    action: "user.email_verified",
    entityType: "user",
    entityId: user.id,
    before: { emailVerifiedAt: null },
    after: { emailVerifiedAt: now.toISOString() },
  });
  return updated;
}
