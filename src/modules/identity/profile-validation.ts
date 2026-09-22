import { DIAL_CODES, isCountryCode, isDialCode } from "@/content/countries";
import type { IdDocumentType, ProfileInput } from "./profile.repository";

/*
 * Profile validation — pure functions (Milestone 5a, USER_PROFILE_REQUIREMENTS
 * §3). No database, no session: the server action calls `validateProfile`
 * and the client form reuses the small helpers (E.164 split, date-of-birth
 * bounds). Only `import type` from the repository so nothing from the data
 * layer reaches the browser bundle.
 */

export const LIMITS = {
  legalNameMin: 2,
  legalNameMax: 200,
  displayNameMax: 100,
  addressLineMax: 200,
  cityMax: 100,
  stateMax: 100,
  postalCodeMax: 20,
  organisationMax: 200,
  jobTitleMax: 120,
  linkedinMax: 300,
  /** E.164: digits after the "+", country code included. */
  phoneDigitsMin: 8,
  phoneDigitsMax: 15,
  dobMinAgeYears: 16,
  dobMaxAgeYears: 100,
} as const;

export type Validation<T> = { ok: true; value: T } | { ok: false; message: string };

/* ---------------------------------------------------------------- phone */

/** Dial prefix from the select + the national number as typed → E.164. A
 *  leading trunk "0" is dropped (012-345 6789 with +60 → +60123456789). */
export function toE164(dial: string, national: string): Validation<string> {
  if (!isDialCode(dial)) return { ok: false, message: "Choose the country code for your number." };
  let digits = national.replace(/[\s\-().]/g, "");
  if (digits === "") return { ok: false, message: "Enter your mobile number." };
  if (!/^\d+$/.test(digits)) return { ok: false, message: "Use digits only — spaces, dashes and brackets are fine." };
  digits = digits.replace(/^0+/, "");
  const all = dial.slice(1) + digits;
  if (all.length < LIMITS.phoneDigitsMin || all.length > LIMITS.phoneDigitsMax) {
    return { ok: false, message: "That does not look like a complete mobile number." };
  }
  return { ok: true, value: `+${all}` };
}

/** Best split of a stored E.164 number back into prefix + national number
 *  for the form (longest matching dial code wins). */
export function splitE164(e164: string | null | undefined): { dial: string; national: string } {
  if (!e164) return { dial: "", national: "" };
  const match = [...DIAL_CODES].map((d) => d.dial).filter((dial) => e164.startsWith(dial)).sort((a, b) => b.length - a.length)[0];
  if (!match) return { dial: "", national: e164.replace(/^\+/, "") };
  return { dial: match, national: e164.slice(match.length) };
}

/* ---------------------------------------------------------- ID document */

/** NRIC: exactly 12 digits (dashes/spaces in the input are dropped).
 *  Passport: 6–12 letters or digits. Never logged by callers. */
export function validateIdNumber(idType: IdDocumentType, raw: string): Validation<string> {
  if (idType === "nric") {
    const digits = raw.replace(/[\s-]/g, "");
    if (!/^\d{12}$/.test(digits)) return { ok: false, message: "An NRIC number has 12 digits (dashes are optional)." };
    return { ok: true, value: digits };
  }
  const value = raw.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z0-9]{6,12}$/.test(value)) return { ok: false, message: "A passport number has 6 to 12 letters or digits." };
  return { ok: true, value };
}

/* ------------------------------------------------------- date of birth */

function shiftYears(date: Date, years: number): string {
  const d = new Date(Date.UTC(date.getUTCFullYear() + years, date.getUTCMonth(), date.getUTCDate()));
  return d.toISOString().slice(0, 10);
}

/** `min`/`max` for the date input: 100 years ago … 16 years ago. */
export function dobBounds(now = new Date()): { min: string; max: string } {
  return { min: shiftYears(now, -LIMITS.dobMaxAgeYears), max: shiftYears(now, -LIMITS.dobMinAgeYears) };
}

export function validateDateOfBirth(raw: string, now = new Date()): Validation<string> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { ok: false, message: "Enter your date of birth as a date." };
  const parsed = new Date(`${raw}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== raw) {
    return { ok: false, message: "That is not a real calendar date." };
  }
  const { min, max } = dobBounds(now);
  if (raw > max) return { ok: false, message: `You must be at least ${LIMITS.dobMinAgeYears} years old.` };
  if (raw < min) return { ok: false, message: "Please check the year." };
  return { ok: true, value: raw };
}

/* ------------------------------------------------------------ LinkedIn */

export function validateLinkedinUrl(raw: string): Validation<string> {
  const value = raw.trim();
  if (value.length > LIMITS.linkedinMax) return { ok: false, message: "That link is too long." };
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, message: "Enter the full link, starting with https://www.linkedin.com/." };
  }
  if (url.protocol !== "https:" || (url.hostname !== "www.linkedin.com" && url.hostname !== "linkedin.com")) {
    return { ok: false, message: "Only https://www.linkedin.com/ or https://linkedin.com/ links are accepted." };
  }
  return { ok: true, value };
}

/* ------------------------------------------------------------ time zone */

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------ the form */

export type ProfileFormFields =
  | "legalName"
  | "displayName"
  | "phone"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "state"
  | "postalCode"
  | "countryCode"
  | "timezone"
  | "organisation"
  | "jobTitle"
  | "industry"
  | "experienceBand"
  | "linkedinUrl"
  | "idType"
  | "idNumber"
  | "nationalityCode"
  | "dateOfBirth"
  | "heardAbout";

export type ProfileFieldErrors = Partial<Record<ProfileFormFields, string>>;

/** Raw strings as they arrive from the form (missing = empty). */
export type RawProfileForm = Partial<Record<ProfileFormFields | "phoneDial" | "marketingConsent", string>>;

export type ProfileLists = {
  industries: readonly string[];
  experienceBands: readonly string[];
  heardAbout: readonly string[];
};

function text(raw: RawProfileForm, key: keyof RawProfileForm): string {
  return (raw[key] ?? "").trim();
}

function optionalText(raw: RawProfileForm, key: ProfileFormFields, max: number, errors: ProfileFieldErrors): string | null {
  const v = text(raw, key);
  if (v === "") return null;
  if (v.length > max) errors[key] = `Use at most ${max} characters.`;
  return v;
}

function optionalChoice(raw: RawProfileForm, key: ProfileFormFields, allowed: readonly string[], errors: ProfileFieldErrors): string | null {
  const v = text(raw, key);
  if (v === "") return null;
  if (!allowed.includes(v)) errors[key] = "Choose one of the options.";
  return v;
}

/**
 * Validate every field of the profile form. Every field except the legal
 * name may be left empty here — what is REQUIRED before a paid registration
 * is decided by `missingForCheckout` in the repository, so a person can save
 * progressively (plan §1). An empty ID number means "keep the stored one".
 */
export function validateProfile(
  raw: RawProfileForm,
  lists: ProfileLists,
  now = new Date(),
): { ok: true; input: ProfileInput } | { ok: false; fieldErrors: ProfileFieldErrors } {
  const errors: ProfileFieldErrors = {};

  const legalName = text(raw, "legalName");
  if (legalName.length < LIMITS.legalNameMin || legalName.length > LIMITS.legalNameMax) errors.legalName = "Please enter your full name as it appears on your ID.";

  const displayName = optionalText(raw, "displayName", LIMITS.displayNameMax, errors);

  let phoneE164: string | null = null;
  const phoneDial = text(raw, "phoneDial");
  const phoneNational = text(raw, "phone");
  if (phoneNational !== "") {
    const r = toE164(phoneDial, phoneNational);
    if (r.ok) phoneE164 = r.value;
    else errors.phone = r.message;
  }

  const addressLine1 = optionalText(raw, "addressLine1", LIMITS.addressLineMax, errors);
  const addressLine2 = optionalText(raw, "addressLine2", LIMITS.addressLineMax, errors);
  const city = optionalText(raw, "city", LIMITS.cityMax, errors);
  const state = optionalText(raw, "state", LIMITS.stateMax, errors);
  const postalCode = optionalText(raw, "postalCode", LIMITS.postalCodeMax, errors);

  const countryRaw = text(raw, "countryCode").toUpperCase();
  const countryCode = countryRaw === "" ? null : countryRaw;
  if (countryCode && !isCountryCode(countryCode)) errors.countryCode = "Choose your country from the list.";

  const tz = text(raw, "timezone");
  const timezone = tz === "" ? null : tz;
  if (timezone && (timezone.length > 64 || !isValidTimezone(timezone))) errors.timezone = "Choose a valid time zone (for example Asia/Kuala_Lumpur).";

  const organisation = optionalText(raw, "organisation", LIMITS.organisationMax, errors);
  const jobTitle = optionalText(raw, "jobTitle", LIMITS.jobTitleMax, errors);
  const industry = optionalChoice(raw, "industry", lists.industries, errors);
  const experienceBand = optionalChoice(raw, "experienceBand", lists.experienceBands, errors);

  let linkedinUrl: string | null = null;
  const linkedinRaw = text(raw, "linkedinUrl");
  if (linkedinRaw !== "") {
    const r = validateLinkedinUrl(linkedinRaw);
    if (r.ok) linkedinUrl = r.value;
    else errors.linkedinUrl = r.message;
  }

  const idTypeRaw = text(raw, "idType");
  const idType: IdDocumentType | null = idTypeRaw === "nric" || idTypeRaw === "passport" ? idTypeRaw : null;
  if (idTypeRaw !== "" && idType === null) errors.idType = "Choose NRIC or passport.";

  let idNumber: string | null = null;
  const idNumberRaw = text(raw, "idNumber");
  if (idNumberRaw !== "") {
    if (!idType) errors.idType = "Choose the type of ID document first.";
    else {
      const r = validateIdNumber(idType, idNumberRaw);
      if (r.ok) idNumber = r.value;
      else errors.idNumber = r.message;
    }
  }

  const nationalityRaw = text(raw, "nationalityCode").toUpperCase();
  const nationalityCode = nationalityRaw === "" ? null : nationalityRaw;
  if (nationalityCode && !isCountryCode(nationalityCode)) errors.nationalityCode = "Choose your nationality from the list.";

  let dateOfBirth: string | null = null;
  const dobRaw = text(raw, "dateOfBirth");
  if (dobRaw !== "") {
    const r = validateDateOfBirth(dobRaw, now);
    if (r.ok) dateOfBirth = r.value;
    else errors.dateOfBirth = r.message;
  }

  const marketingConsent = raw.marketingConsent === "on" || raw.marketingConsent === "true";
  const heardAbout = optionalChoice(raw, "heardAbout", lists.heardAbout, errors);

  if (Object.keys(errors).length) return { ok: false, fieldErrors: errors };
  return {
    ok: true,
    input: {
      legalName,
      displayName,
      phoneE164,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      countryCode,
      timezone,
      organisation,
      jobTitle,
      industry,
      experienceBand,
      linkedinUrl,
      idType,
      idNumber,
      nationalityCode,
      dateOfBirth,
      marketingConsent,
      heardAbout,
    },
  };
}
