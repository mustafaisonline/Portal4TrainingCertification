"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { COUNTRIES, countryName, DIAL_CODES } from "@/content/countries";
import { updateProfileAction, type ProfileFormState } from "@/modules/identity/profile.actions";
import type { ProfileView } from "@/modules/identity/profile.repository";
import { dobBounds, LIMITS, splitE164, type ProfileLists } from "@/modules/identity/profile-validation";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Field, FormStatus, SelectField } from "@/shared/ui/forms";

/*
 * The profile form (Milestone 5a; requirements §6). One <form> bound to the
 * `updateProfileAction` server action, laid out as the sections the
 * requirements list; per-field errors; a form-level status. Fields are
 * controlled so a validation error does not wipe what was typed. The ID
 * number input is ALWAYS empty on render — the stored number is shown only
 * as its last four in the placeholder, and an empty input means "keep it".
 * Vocabulary lists arrive as props from the server page (the repository that
 * owns them imports the database layer and must not reach the browser).
 */

const initialState: ProfileFormState = { status: "idle" };

const INDUSTRY_LABEL: Record<string, string> = {
  banking: "Banking & finance",
  energy: "Energy & utilities",
  telecom: "Telecommunications",
  government: "Government & public sector",
  technology: "Technology",
  education: "Education",
  healthcare: "Healthcare",
  manufacturing: "Manufacturing",
  retail: "Retail",
  other: "Other",
};

const EXPERIENCE_LABEL: Record<string, string> = { "0-2": "0–2 years", "3-5": "3–5 years", "6-10": "6–10 years", "10+": "More than 10 years" };

const HEARD_LABEL: Record<string, string> = {
  search: "Search engine",
  linkedin: "LinkedIn",
  referral: "A colleague or friend",
  employer: "My employer",
  event: "An event or talk",
  other: "Other",
};

function SectionTitle({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-h1">{children}</h2>
      {hint ? <p className="text-body-sm mt-1 text-[var(--color-ink-quiet)]">{hint}</p> : null}
    </div>
  );
}

export function ProfileForm({
  view,
  lists,
  returnTo,
  isComplete,
}: {
  view: ProfileView;
  lists: ProfileLists;
  /** Same-site path the checkout gate sent the person from, or null. */
  returnTo: string | null;
  /** Whether the server found nothing missing for checkout on this render. */
  isComplete: boolean;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, initialState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : {};
  const consentId = useId();
  const tzListId = useId();

  const phone = splitE164(view.phoneE164);
  const [values, setValues] = useState({
    legalName: view.legalName,
    displayName: view.displayName ?? "",
    phoneDial: phone.dial || "+60",
    phone: phone.national,
    addressLine1: view.addressLine1 ?? "",
    addressLine2: view.addressLine2 ?? "",
    city: view.city ?? "",
    state: view.state ?? "",
    postalCode: view.postalCode ?? "",
    countryCode: view.countryCode ?? "",
    timezone: view.timezone ?? "",
    organisation: view.organisation ?? "",
    jobTitle: view.jobTitle ?? "",
    industry: view.industry ?? "",
    experienceBand: view.experienceBand ?? "",
    linkedinUrl: view.linkedinUrl ?? "",
    idType: view.idType ?? "",
    idNumber: "",
    nationalityCode: view.nationalityCode ?? "",
    dateOfBirth: view.dateOfBirth ?? "",
    marketingConsent: view.marketingConsent,
    heardAbout: view.heardAbout ?? "",
  });
  const [timezones, setTimezones] = useState<string[]>([]);

  // Browser-only: the time zone is suggested from the device when the field
  // is empty, and the datalist is filled after mount (server and browser
  // ICU lists can differ, so it is not rendered on the server).
  useEffect(() => {
    try {
      const own = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setValues((v) => (v.timezone === "" && own ? { ...v, timezone: own } : v));
      setTimezones(Intl.supportedValuesOf("timeZone"));
    } catch {
      // Older engines: the field stays a plain text input.
    }
  }, []);

  // After a save the number is stored encrypted; never keep it in the input.
  useEffect(() => {
    if (state.status === "saved") setValues((v) => (v.idNumber === "" ? v : { ...v, idNumber: "" }));
  }, [state]);

  const bind = (field: Exclude<keyof typeof values, "marketingConsent">) => ({
    name: field,
    value: values[field],
    onChange: (e: { target: { value: string } }) => setValues((v) => ({ ...v, [field]: e.target.value })),
  });

  const dob = dobBounds();
  // Offer the way back to checkout once the profile is complete: after a
  // save (the action's answer) or on arrival (the server's).
  const showContinue = returnTo !== null && (state.status === "saved" ? state.missing.length === 0 : state.status === "idle" && isComplete);

  return (
    <form action={action} aria-label="Your profile" className="flex flex-col gap-8" noValidate>
      <Card variant="panel" className="p-6 sm:p-8">
        <SectionTitle>Identity &amp; contact</SectionTitle>
        <div className="flex flex-col gap-5">
          <Field label="Email" name="email" type="email" defaultValue={view.email} readOnly hint="Changing your email is not available yet." />
          <Field
            label="Full name (as on your ID)"
            autoComplete="name"
            required
            minLength={LIMITS.legalNameMin}
            maxLength={LIMITS.legalNameMax}
            hint="Printed on your Certificate of Completion, so it must match your identity document."
            error={fieldErrors.legalName}
            {...bind("legalName")}
          />
          <Field
            label="Preferred name"
            optional
            autoComplete="nickname"
            maxLength={LIMITS.displayNameMax}
            hint="How we greet you and what goes on a name badge."
            error={fieldErrors.displayName}
            {...bind("displayName")}
          />
          <div className="grid gap-5 sm:grid-cols-[minmax(9rem,1fr)_2fr]">
            <SelectField label="Country code" {...bind("phoneDial")}>
              {DIAL_CODES.map((d) => (
                <option key={d.code} value={d.dial}>
                  {countryName(d.code)} ({d.dial})
                </option>
              ))}
            </SelectField>
            <Field
              label="Mobile number"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              hint="For joining details and contact on the day."
              error={fieldErrors.phone}
              {...bind("phone")}
            />
          </div>
          <Field
            label="Time zone"
            optional
            list={tzListId}
            maxLength={64}
            hint="Live-online session times are shown in this zone."
            error={fieldErrors.timezone}
            {...bind("timezone")}
          />
          <datalist id={tzListId}>
            {timezones.map((tz) => (
              <option key={tz} value={tz} />
            ))}
          </datalist>
        </div>
      </Card>

      <Card variant="panel" className="p-6 sm:p-8">
        <SectionTitle>Address</SectionTitle>
        <div className="flex flex-col gap-5">
          <Field label="Address line 1" autoComplete="address-line1" maxLength={LIMITS.addressLineMax} error={fieldErrors.addressLine1} {...bind("addressLine1")} />
          <Field label="Address line 2" optional autoComplete="address-line2" maxLength={LIMITS.addressLineMax} error={fieldErrors.addressLine2} {...bind("addressLine2")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City" autoComplete="address-level2" maxLength={LIMITS.cityMax} error={fieldErrors.city} {...bind("city")} />
            <Field label="State or region" optional autoComplete="address-level1" maxLength={LIMITS.stateMax} error={fieldErrors.state} {...bind("state")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Postal code" autoComplete="postal-code" maxLength={LIMITS.postalCodeMax} error={fieldErrors.postalCode} {...bind("postalCode")} />
            <SelectField
              label="Country"
              autoComplete="country"
              hint="Sets the price region you are charged in."
              error={fieldErrors.countryCode}
              {...bind("countryCode")}
            >
              <option value="">Select your country</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </SelectField>
          </div>
        </div>
      </Card>

      <Card variant="panel" className="p-6 sm:p-8">
        <SectionTitle>Professional</SectionTitle>
        <div className="flex flex-col gap-5">
          <Field
            label="Organisation"
            autoComplete="organization"
            maxLength={LIMITS.organisationMax}
            hint="Your employer — needed for invoices and any HRD Corp claim."
            error={fieldErrors.organisation}
            {...bind("organisation")}
          />
          <Field label="Job title" autoComplete="organization-title" maxLength={LIMITS.jobTitleMax} error={fieldErrors.jobTitle} {...bind("jobTitle")} />
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="Industry" optional error={fieldErrors.industry} {...bind("industry")}>
              <option value="">Select an industry</option>
              {lists.industries.map((k) => (
                <option key={k} value={k}>
                  {INDUSTRY_LABEL[k] ?? k}
                </option>
              ))}
            </SelectField>
            <SelectField label="Years of experience" optional hint="Helps the expert tailor examples." error={fieldErrors.experienceBand} {...bind("experienceBand")}>
              <option value="">Select a range</option>
              {lists.experienceBands.map((k) => (
                <option key={k} value={k}>
                  {EXPERIENCE_LABEL[k] ?? k}
                </option>
              ))}
            </SelectField>
          </div>
          <Field
            label="LinkedIn profile"
            optional
            type="url"
            inputMode="url"
            autoComplete="url"
            placeholder="https://www.linkedin.com/in/…"
            maxLength={LIMITS.linkedinMax}
            hint="For the alumni community."
            error={fieldErrors.linkedinUrl}
            {...bind("linkedinUrl")}
          />
        </div>
      </Card>

      <Card variant="panel" className="p-6 sm:p-8">
        <SectionTitle hint="Needed for your Certificate of Completion and, where applicable, HRD Corp attendance records. Stored encrypted; only the last four digits are ever shown.">
          Identity document
        </SectionTitle>
        <div className="flex flex-col gap-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="ID document type" error={fieldErrors.idType} {...bind("idType")}>
              <option value="">Select a document</option>
              <option value="nric">NRIC (MyKad)</option>
              <option value="passport">Passport</option>
            </SelectField>
            <Field
              label="ID number"
              autoComplete="off"
              spellCheck={false}
              maxLength={20}
              placeholder={view.idNumberMasked ? `Stored: ${view.idNumberMasked} — enter a new number to change` : undefined}
              hint={values.idType === "nric" ? "12 digits; dashes are optional." : values.idType === "passport" ? "6 to 12 letters or digits." : undefined}
              error={fieldErrors.idNumber}
              {...bind("idNumber")}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField label="Nationality" error={fieldErrors.nationalityCode} {...bind("nationalityCode")}>
              <option value="">Select your nationality</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </SelectField>
            <Field label="Date of birth" type="date" autoComplete="bday" min={dob.min} max={dob.max} error={fieldErrors.dateOfBirth} {...bind("dateOfBirth")} />
          </div>
        </div>
      </Card>

      <Card variant="panel" className="p-6 sm:p-8">
        <SectionTitle>Preferences</SectionTitle>
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3">
            <input
              id={consentId}
              type="checkbox"
              name="marketingConsent"
              checked={values.marketingConsent}
              onChange={(e) => setValues((v) => ({ ...v, marketingConsent: e.target.checked }))}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
            />
            <label htmlFor={consentId} className="text-body-sm text-[var(--color-ink-quiet)]">
              Yes, send me news about programmes and dates by email. Under the Personal Data Protection Act 2010 this is optional and you can
              withdraw it here at any time.
            </label>
          </div>
          <SelectField label="How did you hear about us?" optional error={fieldErrors.heardAbout} {...bind("heardAbout")}>
            <option value="">Select an option</option>
            {lists.heardAbout.map((k) => (
              <option key={k} value={k}>
                {HEARD_LABEL[k] ?? k}
              </option>
            ))}
          </SelectField>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending} data-testid="profile-save">
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {showContinue && returnTo ? (
          <Button variant="secondary" href={returnTo} data-testid="profile-continue">
            Continue to registration
          </Button>
        ) : null}
        {state.status === "error" ? <FormStatus tone="error">{state.message}</FormStatus> : null}
        {state.status === "saved" ? (
          <FormStatus tone="success">
            {state.missing.length === 0 ? "Your changes have been saved." : `Your changes have been saved. Still needed before you can register: ${state.missing.join(", ")}.`}
          </FormStatus>
        ) : null}
      </div>
    </form>
  );
}
