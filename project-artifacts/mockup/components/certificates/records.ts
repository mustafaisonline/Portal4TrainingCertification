import { useMemo } from "react";
import { assetPath } from "@/lib/basePath";
import type { Certificate } from "@/lib/certificates";
import { DEMO_CERT_ID, sampleRegistry } from "@/data/certificates";
import {
  PROGRAMME_TITLE,
  demoParticipant,
  getOffering,
} from "@/data/demoParticipant";
import { useDemoCertificate, type DemoCertificate } from "@/lib/demoCertificate";
import { useNow } from "@/lib/useNow";

/** The demo participant's certificate as a public record (only exists while
 *  the demo session holds one — lib/demoCertificate.ts). */
export function demoCertificateRecord(c: DemoCertificate): Certificate {
  return {
    id: DEMO_CERT_ID,
    holderName: demoParticipant.name,
    programmeTitle: PROGRAMME_TITLE,
    formatName: getOffering(c.offeringId)?.formatName ?? "",
    completedOn: c.issuedOn,
    issuedOn: c.issuedOn,
    expiresOn: c.expiresOn,
    listed: c.listed,
    sample: true,
  };
}

/** The registry the public screens search: the sample records plus the demo
 *  participant's own certificate if one has been issued. `ready` is false until
 *  today's date and the demo state are known (see lib/useNow.ts). */
export function useRegistry(): {
  ready: boolean;
  now: Date | null;
  registry: Certificate[];
} {
  const now = useNow();
  const demo = useDemoCertificate();
  const registry = useMemo(() => {
    if (!now) return [];
    const list = sampleRegistry(now);
    if (demo) list.push(demoCertificateRecord(demo));
    return list;
  }, [now, demo]);
  return { ready: now !== null && demo !== undefined, now, registry };
}

/** Absolute verification URL for a certificate ID, honouring the Pages base
 *  path. Client-only (needs `window`). */
export function verificationUrl(id: string): string {
  const slash = process.env.NEXT_PUBLIC_BASE_PATH ? "/" : "";
  return `${window.location.origin}${assetPath(`/verify/${id}`)}${slash}`;
}
