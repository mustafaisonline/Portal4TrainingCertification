import { afterAll, describe, expect, it } from "vitest";
import { disconnectPrisma, getPrisma, withTransaction } from "@/db/prisma";
import { decryptSecret } from "@/modules/identity/profile-crypto";
import { getPhoto, getProfile, isCompleteForCheckout, missingForCheckout, REQUIRED_FOR_CHECKOUT, removePhoto, savePhoto, saveProfile } from "@/modules/identity/profile.repository";
import { listAuditForEntity } from "@/modules/platform/audit/repository";
import { completeProfileInput, deleteTestUser, uniqueEmail } from "../helpers/identity-db";

/*
 * User profile — integration against the REAL test database (M5a plan §5
 * criteria 2–4). The ID number is stored as ciphertext only; the view and
 * the audit row never carry it; completeness is derived, not typed.
 */

const prisma = getPrisma();
const emails: string[] = [];

async function createUser(name = "Pia Profile") {
  const email = uniqueEmail("m5a");
  emails.push(email);
  return prisma.user.create({ data: { email, name, country: null }, select: { id: true, email: true, name: true } });
}

afterAll(async () => {
  for (const e of emails) await deleteTestUser(e);
  await disconnectPrisma();
});

const NRIC = "900101145678";

describe("saveProfile", () => {
  it("stores the ID number encrypted, shows only the last four, and audits field names without the number", async () => {
    const user = await createUser();
    const view = await withTransaction((tx) => saveProfile(tx, user.id, completeProfileInput({ idType: "nric", idNumber: NRIC }), "Malaysia"));

    expect(view.idNumberMasked).toBe("••••5678");
    expect(JSON.stringify(view)).not.toContain(NRIC);

    const row = await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id } });
    expect(row.idNumberCiphertext).not.toBeNull();
    expect(row.idNumberCiphertext).not.toContain(NRIC);
    expect(row.idNumberCiphertext!.startsWith("v1:")).toBe(true);
    expect(row.idNumberLast4).toBe("5678");
    expect(decryptSecret(row.idNumberCiphertext!)).toBe(NRIC);

    const audit = (await listAuditForEntity(prisma, "user", user.id)).filter((a) => a.action === "profile.updated");
    expect(audit).toHaveLength(1);
    const after = audit[0]!.after as { changed: string[]; idNumberLast4?: string };
    expect(after.changed).toEqual(expect.arrayContaining(["legalName", "phoneE164", "countryCode", "idType", "idNumber", "dateOfBirth"]));
    const serialised = JSON.stringify(audit[0]);
    expect(serialised).not.toContain(NRIC);
    expect(serialised).not.toContain(NRIC.slice(0, 8));
    expect(after.idNumberLast4).toBe("5678");

    // The identity row mirrors the greeting name and the country name.
    const identity = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(identity.name).toBe("Test Person");
    expect(identity.country).toBe("Malaysia");
  });

  it("an empty ID number on a later save keeps the stored one; a new one replaces it", async () => {
    const user = await createUser();
    await withTransaction((tx) => saveProfile(tx, user.id, completeProfileInput({ idType: "nric", idNumber: NRIC })));
    const before = await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id }, select: { idNumberCiphertext: true } });

    const kept = await withTransaction((tx) => saveProfile(tx, user.id, completeProfileInput({ idType: "nric", idNumber: null, city: "Penang" })));
    expect(kept.idNumberMasked).toBe("••••5678");
    expect(kept.city).toBe("Penang");
    const same = await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id }, select: { idNumberCiphertext: true } });
    expect(same.idNumberCiphertext).toBe(before.idNumberCiphertext);

    const replaced = await withTransaction((tx) => saveProfile(tx, user.id, completeProfileInput({ idType: "passport", idNumber: "A9876543" })));
    expect(replaced.idType).toBe("passport");
    expect(replaced.idNumberMasked).toBe("••••6543");
    const changed = await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id }, select: { idNumberCiphertext: true } });
    expect(changed.idNumberCiphertext).not.toBe(before.idNumberCiphertext);
    expect(decryptSecret(changed.idNumberCiphertext!)).toBe("A9876543");
  });

  it("missingForCheckout shrinks as fields are added; completedAt is set only when nothing is missing", async () => {
    const user = await createUser();
    expect(missingForCheckout(await getProfile(user.id))).toEqual(REQUIRED_FOR_CHECKOUT.map(([, label]) => label));

    const empty = completeProfileInput({
      phoneE164: null, addressLine1: null, city: null, postalCode: null, countryCode: null, organisation: null, jobTitle: null,
      idType: null, idNumber: null, nationalityCode: null, dateOfBirth: null,
    });
    const step1 = await withTransaction((tx) => saveProfile(tx, user.id, empty));
    const m1 = missingForCheckout(step1);
    expect(m1).not.toContain("Full name as on your ID");
    expect(m1).toContain("Mobile number");
    expect(m1).toContain("ID number");
    expect(step1.completedAt).toBeNull();
    expect(isCompleteForCheckout(step1)).toBe(false);

    const step2 = await withTransaction((tx) => saveProfile(tx, user.id, { ...empty, phoneE164: "+60123456789", addressLine1: "1 Jalan", city: "KL", postalCode: "50000", countryCode: "MY" }));
    const m2 = missingForCheckout(step2);
    expect(m2.length).toBeLessThan(m1.length);
    expect(m2).toEqual(["Organisation", "Job title", "ID document type", "ID number", "Nationality", "Date of birth"]);

    const step3 = await withTransaction((tx) => saveProfile(tx, user.id, completeProfileInput({ idType: "nric", idNumber: NRIC })));
    expect(missingForCheckout(step3)).toEqual([]);
    expect(isCompleteForCheckout(step3)).toBe(true);
    expect(step3.completedAt).toBeInstanceOf(Date);
    const row = await prisma.userProfile.findUniqueOrThrow({ where: { userId: user.id }, select: { completedAt: true } });
    expect(row.completedAt).not.toBeNull();

    // Removing a required field un-completes it again.
    const step4 = await withTransaction((tx) => saveProfile(tx, user.id, completeProfileInput({ organisation: null })));
    expect(step4.completedAt).toBeNull();
    expect(missingForCheckout(step4)).toEqual(["Organisation"]);
  });
});

describe("photo", () => {
  const PNG_1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

  it("savePhoto stores the bytes and marks hasPhoto; removePhoto clears them; both audited as 'photo'", async () => {
    const user = await createUser("Pat Photo");
    expect(await getPhoto(user.id)).toBeNull();

    await withTransaction((tx) => savePhoto(tx, user.id, new Uint8Array(PNG_1x1), "image/png"));
    const stored = await getPhoto(user.id);
    expect(stored?.mime).toBe("image/png");
    expect(Buffer.from(stored!.bytes).equals(PNG_1x1)).toBe(true);
    const view = await getProfile(user.id);
    expect(view?.hasPhoto).toBe(true);
    expect(view?.photoUpdatedAt).toBeInstanceOf(Date);
    // A photo alone seeds the row from the identity name; nothing else is required yet.
    expect(view?.legalName).toBe("Pat Photo");

    await withTransaction((tx) => removePhoto(tx, user.id));
    expect(await getPhoto(user.id)).toBeNull();
    expect((await getProfile(user.id))?.hasPhoto).toBe(false);

    const audit = (await listAuditForEntity(prisma, "user", user.id)).filter((a) => a.action === "profile.updated");
    expect(audit.map((a) => (a.after as { changed: string[] }).changed)).toEqual([["photo"], ["photo"]]);
    expect(JSON.stringify(audit)).not.toContain(PNG_1x1.toString("base64"));
  });

  it("refuses the wrong type and an oversized image", async () => {
    const user = await createUser();
    await expect(withTransaction((tx) => savePhoto(tx, user.id, new Uint8Array(PNG_1x1), "image/gif"))).rejects.toThrow(/unsupported/);
    await expect(withTransaction((tx) => savePhoto(tx, user.id, new Uint8Array(300 * 1024 + 1), "image/png"))).rejects.toThrow(/300 KB/);
    expect(await getPhoto(user.id)).toBeNull();
  });
});
