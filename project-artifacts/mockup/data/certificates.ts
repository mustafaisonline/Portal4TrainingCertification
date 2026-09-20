import { ID_PREFIX } from "./certificateConfig";
import { PROGRAMME_TITLE } from "./demoParticipant";
import { addDays, addMonths, toIso, type Certificate } from "@/lib/certificates";

/**
 * SAMPLE REGISTRY for the public verification wireframe — added 2026-09-20.
 *
 * ⚠ EVERY RECORD HERE IS INVENTED, and every screen that shows one says so
 * (a "Sample" chip and a diagonal SAMPLE watermark on the certificate). No one
 * listed has completed any programme — none has run. A public directory of
 * "people who completed the training" is precisely the kind of thing that
 * would be fabricated social proof if it were not unmistakably labelled, so:
 *   • names are obviously fictional (surname "Sample" / "Example");
 *   • IDs contain `0`/`1`, which the real ID alphabet never produces
 *     (lib/certificates.ts), so they cannot be confused with or collide with
 *     real IDs;
 *   • they are rendered only by the sample-labelled wireframe screens.
 * Never copy any of this into a real page.
 *
 * DATES ARE RELATIVE TO "TODAY" on purpose. Fixed dates would drift: the
 * "renewal due" example would silently become "expired" a few weeks after this
 * was written, and reviewers would lose one of the three statuses this
 * registry exists to demonstrate. Computed once per page load by the caller.
 *
 * Together the samples cover every state a reviewer needs to see:
 *   Alex Sample   — Active
 *   Priya Example — Expired (lapsed ~4 months ago)
 *   Chen Sample   — Active, renewal due (12 days left) and NOT listed, so a
 *                   name search must not find them but their ID/URL still works
 *   Sam Example   — Active (Mastery format), listed
 * The demo participant's own certificate is not here: it exists only inside
 * the demo session (lib/demoCertificate.ts) and is merged in by the screens.
 */

/** Fixed sample ID for the demo participant's certificate — needed as a fixed
 *  string so /verify/[id] can be pre-built for the static export. */
export const DEMO_CERT_ID = `${ID_PREFIX}-2026-DEM0-0001`;

export const SAMPLE_IDS = [
  `${ID_PREFIX}-2026-SMP0-0001`,
  `${ID_PREFIX}-2026-SMP0-0002`,
  `${ID_PREFIX}-2026-SMP0-0003`,
  `${ID_PREFIX}-2026-SMP0-0004`,
];

export function sampleRegistry(now: Date): Certificate[] {
  const today = toIso(now);
  const make = (
    id: string,
    holderName: string,
    formatName: string,
    expiresOn: string,
    listed: boolean,
  ): Certificate => {
    const issuedOn = addMonths(expiresOn, -12);
    return {
      id,
      holderName,
      programmeTitle: PROGRAMME_TITLE,
      formatName,
      completedOn: issuedOn,
      issuedOn,
      expiresOn,
      listed,
      sample: true,
    };
  };
  return [
    make(SAMPLE_IDS[0], "Alex Sample", "Bootcamp", addDays(today, 180), true),
    make(SAMPLE_IDS[1], "Priya Example", "Accelerator", addDays(today, -120), true),
    make(SAMPLE_IDS[2], "Chen Sample", "Bootcamp", addDays(today, 12), false),
    make(SAMPLE_IDS[3], "Sam Example", "Mastery", addDays(today, 300), true),
  ];
}

/** Every ID the static export must pre-build a /verify/[id] page for. */
export const STATIC_VERIFY_IDS = [...SAMPLE_IDS, DEMO_CERT_ID];

