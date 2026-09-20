import type { Metadata } from "next";
import { VerifyDetail } from "@/components/certificates/VerifyDetail";
import { PublicShell } from "@/components/PublicShell";
import { STATIC_VERIFY_IDS } from "@/data/certificates";

/**
 * The unique, shareable URL for one certificate — WIREFRAME, 2026-09-20,
 * founder requirement: "a unique URL for the user's certificate … it should
 * show the user's certificate and active and expiry status".
 *
 * The URL is /verify/<certificate ID>. The ID is 8 random characters from a
 * 31-symbol alphabet (lib/certificates.ts): unguessable and non-sequential, so
 * the URL itself is safe to make public and cannot be enumerated.
 *
 * WIREFRAME LIMIT: the static export can only pre-build pages for IDs known at
 * build time — the sample IDs plus the demo participant's fixed ID. The real
 * product resolves any ID from the database at request time (a dynamic route),
 * and returns a real 404 for an unknown one. What the page SHOWS is decided
 * client-side from the sample registry (+ the demo session's certificate).
 */
export function generateStaticParams() {
  return STATIC_VERIFY_IDS.map((id) => ({ id }));
}

export const metadata: Metadata = {
  title: "Certificate verification — Data & AI Academy",
  description: "Verify a Data & AI Academy certificate of completion.",
  // A certificate page is reached from a link the holder chose to share, not
  // discovered through search engines.
  robots: { index: false, follow: false },
};

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PublicShell>
      <section className="bg-[var(--color-ground-tint)]">
        <div className="mx-auto max-w-[860px] px-4 py-10 sm:px-6 sm:py-14">
          <VerifyDetail id={id} />
        </div>
      </section>
    </PublicShell>
  );
}
