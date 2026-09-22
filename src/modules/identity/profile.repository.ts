import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { writeAudit } from "@/modules/platform/audit/repository";
import { encryptSecret, last4 } from "./profile-crypto";

/*
 * User profile — one row per user, created on first save
 * (MILESTONE_5A_EXECUTION_PLAN.md). The ID number is written encrypted and
 * only its last four characters are ever read back for display; the audit
 * row names the fields that changed and never carries the number or the
 * photo bytes.
 */

export type IdDocumentType = "nric" | "passport";

export const INDUSTRIES = ["banking", "energy", "telecom", "government", "technology", "education", "healthcare", "manufacturing", "retail", "other"] as const;
export const EXPERIENCE_BANDS = ["0-2", "3-5", "6-10", "10+"] as const;
export const HEARD_ABOUT = ["search", "linkedin", "referral", "employer", "event", "other"] as const;

/** Everything the profile page shows. The ID number is masked here already. */
export type ProfileView = {
  userId: string;
  email: string;
  legalName: string;
  displayName: string | null;
  phoneE164: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
  timezone: string | null;
  organisation: string | null;
  jobTitle: string | null;
  industry: string | null;
  experienceBand: string | null;
  linkedinUrl: string | null;
  idType: IdDocumentType | null;
  /** "••••1234" or null. */
  idNumberMasked: string | null;
  nationalityCode: string | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  marketingConsent: boolean;
  heardAbout: string | null;
  hasPhoto: boolean;
  photoUpdatedAt: Date | null;
  completedAt: Date | null;
};

/** Fields a participant must have before the first paid registration
 *  (plan §3; founder decisions §8). Order = the order they are asked. */
export const REQUIRED_FOR_CHECKOUT = [
  ["legalName", "Full name as on your ID"],
  ["phoneE164", "Mobile number"],
  ["addressLine1", "Address"],
  ["city", "City"],
  ["postalCode", "Postal code"],
  ["countryCode", "Country"],
  ["organisation", "Organisation"],
  ["jobTitle", "Job title"],
  ["idType", "ID document type"],
  ["idNumberMasked", "ID number"],
  ["nationalityCode", "Nationality"],
  ["dateOfBirth", "Date of birth"],
] as const satisfies readonly (readonly [keyof ProfileView, string])[];

export function missingForCheckout(view: ProfileView | null): string[] {
  if (!view) return REQUIRED_FOR_CHECKOUT.map(([, label]) => label);
  return REQUIRED_FOR_CHECKOUT.filter(([field]) => {
    const v: unknown = view[field];
    return v === null || v === undefined || v === "";
  }).map(([, label]) => label);
}

export function isCompleteForCheckout(view: ProfileView | null): boolean {
  return missingForCheckout(view).length === 0;
}

const select = {
  userId: true, legalName: true, displayName: true, phoneE164: true, addressLine1: true, addressLine2: true, city: true, state: true,
  postalCode: true, countryCode: true, timezone: true, organisation: true, jobTitle: true, industry: true, experienceBand: true,
  linkedinUrl: true, idType: true, idNumberLast4: true, nationalityCode: true, dateOfBirth: true, marketingConsentAt: true, heardAbout: true,
  photoMime: true, photoUpdatedAt: true, completedAt: true,
  user: { select: { email: true, name: true } },
} as const;

type Row = NonNullable<Awaited<ReturnType<typeof load>>>;

function load(db: Db, userId: string) {
  return db.userProfile.findUnique({ where: { userId }, select });
}

function toView(r: Row): ProfileView {
  return {
    userId: r.userId,
    email: r.user.email,
    legalName: r.legalName,
    displayName: r.displayName,
    phoneE164: r.phoneE164,
    addressLine1: r.addressLine1,
    addressLine2: r.addressLine2,
    city: r.city,
    state: r.state,
    postalCode: r.postalCode,
    countryCode: r.countryCode,
    timezone: r.timezone,
    organisation: r.organisation,
    jobTitle: r.jobTitle,
    industry: r.industry,
    experienceBand: r.experienceBand,
    linkedinUrl: r.linkedinUrl,
    idType: r.idType,
    idNumberMasked: r.idNumberLast4 ? `••••${r.idNumberLast4}` : null,
    nationalityCode: r.nationalityCode,
    dateOfBirth: r.dateOfBirth ? r.dateOfBirth.toISOString().slice(0, 10) : null,
    marketingConsent: r.marketingConsentAt !== null,
    heardAbout: r.heardAbout,
    hasPhoto: r.photoMime !== null,
    photoUpdatedAt: r.photoUpdatedAt,
    completedAt: r.completedAt,
  };
}

/** The profile, or a view seeded from the identity row when none exists yet. */
export async function getProfile(userId: string, db: Db = getPrisma()): Promise<ProfileView | null> {
  const row = await load(db, userId);
  return row ? toView(row) : null;
}

export type ProfileInput = {
  legalName: string;
  displayName: string | null;
  phoneE164: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  countryCode: string | null;
  timezone: string | null;
  organisation: string | null;
  jobTitle: string | null;
  industry: string | null;
  experienceBand: string | null;
  linkedinUrl: string | null;
  idType: IdDocumentType | null;
  /** Clear ID number to set, or null to leave the stored one unchanged. */
  idNumber: string | null;
  nationalityCode: string | null;
  dateOfBirth: string | null; // YYYY-MM-DD
  marketingConsent: boolean;
  heardAbout: string | null;
};

const CHANGE_KEYS: (keyof ProfileInput)[] = [
  "legalName", "displayName", "phoneE164", "addressLine1", "addressLine2", "city", "state", "postalCode", "countryCode", "timezone",
  "organisation", "jobTitle", "industry", "experienceBand", "linkedinUrl", "idType", "nationalityCode", "dateOfBirth", "marketingConsent", "heardAbout",
];

/**
 * Create or update the profile in the caller's transaction and audit the
 * names of the fields that changed. Also keeps `users.name` in step with the
 * legal name (the identity row's name is what the rest of the portal greets
 * the person by) and `users.country` in step with the country code's name
 * when a `countryName` is supplied.
 */
export async function saveProfile(tx: Tx, userId: string, input: ProfileInput, countryName?: string | null): Promise<ProfileView> {
  const before = await load(tx, userId);
  const changed: string[] = [];
  const beforeView = before ? toView(before) : null;
  for (const k of CHANGE_KEYS) {
    const prev = beforeView ? (beforeView as unknown as Record<string, unknown>)[k] : null;
    if ((prev ?? null) !== (input[k] ?? null)) changed.push(k);
  }
  const idChange = input.idNumber !== null && input.idNumber !== "";
  if (idChange) changed.push("idNumber");

  const data = {
    legalName: input.legalName.trim(),
    displayName: input.displayName,
    phoneE164: input.phoneE164,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    countryCode: input.countryCode,
    timezone: input.timezone,
    organisation: input.organisation,
    jobTitle: input.jobTitle,
    industry: input.industry,
    experienceBand: input.experienceBand,
    linkedinUrl: input.linkedinUrl,
    idType: input.idType,
    ...(idChange ? { idNumberCiphertext: encryptSecret(input.idNumber!.trim()), idNumberLast4: last4(input.idNumber!) } : {}),
    nationalityCode: input.nationalityCode,
    dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00Z`) : null,
    marketingConsentAt: input.marketingConsent ? (before?.marketingConsentAt ?? new Date()) : null,
    heardAbout: input.heardAbout,
  };
  const saved = await tx.userProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data, select });
  const view = toView(saved);
  const complete = isCompleteForCheckout(view);
  if (complete !== (saved.completedAt !== null)) {
    await tx.userProfile.update({ where: { userId }, data: { completedAt: complete ? new Date() : null } });
    view.completedAt = complete ? new Date() : null;
  }
  // Keep the identity row's display name and country in step.
  const userPatch: { name?: string; country?: string } = {};
  const greetingName = input.displayName?.trim() || data.legalName;
  if (greetingName && greetingName !== saved.user.name) userPatch.name = greetingName;
  if (countryName) userPatch.country = countryName;
  if (Object.keys(userPatch).length) await tx.user.update({ where: { id: userId }, data: userPatch });

  if (changed.length) {
    await writeAudit(tx, {
      actorUserId: userId,
      action: "profile.updated",
      entityType: "user",
      entityId: userId,
      after: { changed, idNumberLast4: idChange ? last4(input.idNumber!) : undefined },
    });
  }
  return view;
}

const PHOTO_MAX_BYTES = 300 * 1024;
const PHOTO_MIMES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function savePhoto(tx: Tx, userId: string, input: Uint8Array, mime: string): Promise<void> {
  if (!PHOTO_MIMES.has(mime)) throw new Error("unsupported image type");
  if (input.byteLength === 0 || input.byteLength > PHOTO_MAX_BYTES) throw new Error("photo must be between 1 byte and 300 KB");
  // Copy into a plain ArrayBuffer-backed view (Prisma's Bytes type excludes
  // SharedArrayBuffer-backed views).
  const bytes = new Uint8Array(new ArrayBuffer(input.byteLength));
  bytes.set(input);
  await tx.userProfile.upsert({
    where: { userId },
    create: { userId, legalName: (await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } })).name, photo: bytes, photoMime: mime, photoUpdatedAt: new Date() },
    update: { photo: bytes, photoMime: mime, photoUpdatedAt: new Date() },
  });
  await writeAudit(tx, { actorUserId: userId, action: "profile.updated", entityType: "user", entityId: userId, after: { changed: ["photo"] } });
}

export async function removePhoto(tx: Tx, userId: string): Promise<void> {
  const exists = await tx.userProfile.findUnique({ where: { userId }, select: { photoMime: true } });
  if (!exists?.photoMime) return;
  await tx.userProfile.update({ where: { userId }, data: { photo: null, photoMime: null, photoUpdatedAt: null } });
  await writeAudit(tx, { actorUserId: userId, action: "profile.updated", entityType: "user", entityId: userId, after: { changed: ["photo"], photo: "removed" } });
}

/** Bytes for the session-gated photo route only. */
export async function getPhoto(userId: string, db: Db = getPrisma()): Promise<{ bytes: Uint8Array; mime: string; updatedAt: Date } | null> {
  const row = await db.userProfile.findUnique({ where: { userId }, select: { photo: true, photoMime: true, photoUpdatedAt: true } });
  if (!row?.photo || !row.photoMime) return null;
  return { bytes: row.photo, mime: row.photoMime, updatedAt: row.photoUpdatedAt ?? new Date(0) };
}
