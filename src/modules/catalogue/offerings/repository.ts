import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";

/*
 * Scheduled offerings — the dated instances a person registers for
 * (ADR-043). Public pages show only what is genuinely scheduled; with no
 * rows they render a first-class "no dates yet" state (DR-02 §4.1: never an
 * invented date). Capacity is displayed, never enforced here (M4).
 */

export type OfferingStatus = "planned" | "open" | "full" | "completed" | "cancelled";
export type DeliveryModality = "live_online" | "face_to_face" | "corporate_private";

export type OfferingRecord = {
  id: string;
  programmeId: string;
  programmeSlug: string;
  programmeTitle: string;
  format: { code: string; name: string; badge: string | null; durationLabel: string; scheduleLabel: string; totalTimeLabel: string } | null;
  modality: DeliveryModality;
  location: string | null;
  timezone: string;
  startsOn: Date;
  endsOn: Date;
  scheduleNote: string | null;
  capacity: number | null;
  status: OfferingStatus;
};

export const MODALITY_LABEL: Record<DeliveryModality, string> = {
  live_online: "Live online",
  face_to_face: "Face-to-face",
  corporate_private: "Private cohort",
};

/** Public, upcoming offerings: planned/open/full, not yet ended, and not
 *  private cohorts. Optionally for one programme. */
export async function listUpcomingPublicOfferings(programmeId?: string, db: Db = getPrisma()): Promise<OfferingRecord[]> {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const rows = await db.scheduledOffering.findMany({
    where: {
      ...(programmeId ? { programmeId } : {}),
      status: { in: ["planned", "open", "full"] },
      endsOn: { gte: today },
      organisationId: null,
    },
    orderBy: { startsOn: "asc" },
    include: {
      programme: { select: { slug: true, title: true } },
      deliveryFormat: { select: { code: true, name: true, badge: true, durationLabel: true, scheduleLabel: true, totalTimeLabel: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    programmeId: r.programmeId,
    programmeSlug: r.programme.slug,
    programmeTitle: r.programme.title,
    format: r.deliveryFormat,
    modality: r.modality,
    location: r.location,
    timezone: r.timezone,
    startsOn: r.startsOn,
    endsOn: r.endsOn,
    scheduleNote: r.scheduleNote,
    capacity: r.capacity,
    status: r.status,
  }));
}
