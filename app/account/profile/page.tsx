import type { Metadata } from "next";
import { countryCodeFor } from "@/content/countries";
import { EXPERIENCE_BANDS, getProfile, HEARD_ABOUT, INDUSTRIES, missingForCheckout, type ProfileView } from "@/modules/identity/profile.repository";
import { requireUser } from "@/modules/identity/session";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { safeReturnTo } from "@/shared/util/return-to";
import { PhotoUploader } from "./PhotoUploader";
import { ProfileForm } from "./ProfileForm";

/*
 * Your profile — /account/profile (Milestone 5a plan §2 item 2; requirements
 * §6). Server component on the real session: reads the `user_profiles` view
 * (ID number already masked to its last four) and renders the sections in
 * the order the requirements list them. The completeness banner names what
 * is still needed before a paid registration; when the checkout gate sent
 * the person here (`?complete=1&return-to=/checkout/…`) it says so and the
 * form offers "Continue to registration" once the profile is complete.
 * Password changes stay on /account/security; the "Your data" card (export /
 * delete) waits for the Privacy policy (M5 C20).
 */
export const metadata: Metadata = { title: "Your profile" };

export default async function ProfilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser("/account/profile");
  const sp = await searchParams;
  const fromCheckout = sp["complete"] === "1";
  const returnRaw = sp["return-to"];
  const returnTo = fromCheckout ? safeReturnTo(typeof returnRaw === "string" ? returnRaw : null, "/schedule") : null;

  const view = await getProfile(user.id);
  const missing = missingForCheckout(view);
  // A person registered before the profile table existed has no row yet:
  // seed the form from the identity row so nothing they gave us is retyped.
  const initial: ProfileView =
    view ?? {
      userId: user.id,
      email: user.email,
      legalName: user.name,
      displayName: null,
      phoneE164: null,
      addressLine1: null,
      addressLine2: null,
      city: null,
      state: null,
      postalCode: null,
      countryCode: countryCodeFor(user.country),
      timezone: null,
      organisation: null,
      jobTitle: null,
      industry: null,
      experienceBand: null,
      linkedinUrl: null,
      idType: null,
      idNumberMasked: null,
      nationalityCode: null,
      dateOfBirth: null,
      marketingConsent: false,
      heardAbout: null,
      hasPhoto: false,
      photoUpdatedAt: null,
      completedAt: null,
    };

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-label mb-2 text-[var(--color-primary)]">Profile &amp; security</p>
        <h1 className="text-display">Your profile</h1>
      </header>

      {missing.length > 0 ? (
        <div
          role="status"
          data-testid="profile-missing"
          className="rounded-[var(--radius-plate)] border border-[var(--color-primary)]/40 bg-[var(--color-ground-raised)] px-5 py-4"
        >
          {fromCheckout ? (
            <p className="text-body-sm mb-1 font-medium text-[var(--color-ink)]">A few details are needed before you can register for that date.</p>
          ) : null}
          <p className="text-body-sm text-[var(--color-ink-quiet)]">
            Before you can register for a date, please add: <span className="text-[var(--color-ink)]">{missing.join(", ")}</span>.
          </p>
        </div>
      ) : fromCheckout && returnTo ? (
        <p
          role="status"
          data-testid="profile-complete"
          className="text-body-sm rounded-[var(--radius-plate)] border border-[var(--color-line)] bg-[var(--color-ground-raised)] px-5 py-4 text-[var(--color-ink-quiet)]"
        >
          Your profile has everything needed to register — use &ldquo;Continue to registration&rdquo; below.
        </p>
      ) : null}

      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-2">Photo</h2>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          Optional. Shown in your account menu. Resized in your browser to 256 px before it is uploaded; it is only ever visible to you.
        </p>
        <PhotoUploader name={user.name} hasPhoto={initial.hasPhoto} photoVersion={initial.photoUpdatedAt?.getTime() ?? 0} />
      </Card>

      <ProfileForm
        view={initial}
        lists={{ industries: INDUSTRIES, experienceBands: EXPERIENCE_BANDS, heardAbout: HEARD_ABOUT }}
        returnTo={returnTo}
        isComplete={missing.length === 0}
      />

      <Card variant="panel" className="p-6 sm:p-8">
        <h2 className="text-h1 mb-2">Password</h2>
        <p className="text-body-sm mb-5 text-[var(--color-ink-quiet)]">
          Change your password from the Security page. Other devices signed in to your account will be signed out.
        </p>
        <Button variant="secondary" href="/account/security">
          Change password
        </Button>
      </Card>

      <div>
        <Button variant="secondary" href="/sign-out">
          Sign out
        </Button>
      </div>
    </div>
  );
}
