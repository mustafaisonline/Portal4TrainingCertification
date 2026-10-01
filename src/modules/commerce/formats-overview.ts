import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { scopeWhere, type TrainingScope } from "@/modules/catalogue/programmes/admin.repository";
import { interestCountsByFormat } from "./interest.repository";

/*
 * Formats overview — every pace format of the trainings in the caller's scope
 * (CR-2026-10-01-2138, F1). A Trainer sees the formats of their own trainings,
 * an administrator all of them. Each format carries how many dates are
 * scheduled under it and how many people registered interest, so the screen
 * answers "which formats have no date yet, and who is waiting for them?".
 * Read-only: declaring a format and scheduling it stay in the existing
 * per-training Formats and Dates tabs, which this screen links to.
 */

export type FormatOverviewRow = {
  formatId: string;
  code: string;
  name: string;
  badge: string | null;
  durationLabel: string;
  scheduleLabel: string;
  totalTimeLabel: string;
  /** Dates with status open that have not started — what a person can register for today. */
  openDates: number;
  /** Dates not yet ended and not cancelled (planned, open or full). */
  upcomingDates: number;
  interestConfirmed: number;
  interestNotified: number;
};

export type TrainingFormatsOverview = {
  programmeId: string;
  slug: string;
  title: string;
  status: "published" | "unlisted" | "retired";
  formats: FormatOverviewRow[];
};

export async function listFormatsOverview(scope: TrainingScope, now = new Date(), db: Db = getPrisma()): Promise<TrainingFormatsOverview[]> {
  const today = new Date(now);
  today.setUTCHours(0, 0, 0, 0);
  const [programmes, counts] = await Promise.all([
    db.programme.findMany({
      where: scopeWhere(scope),
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        formatsDelivery: {
          orderBy: { position: "asc" },
          select: {
            id: true, code: true, name: true, badge: true, durationLabel: true, scheduleLabel: true, totalTimeLabel: true,
            offerings: { where: { endsOn: { gte: today }, status: { in: ["planned", "open", "full"] } }, select: { status: true, startsOn: true, organisationId: true } },
          },
        },
      },
    }),
    interestCountsByFormat(scope, db),
  ]);
  return programmes.map((p) => ({
    programmeId: p.id,
    slug: p.slug,
    title: p.title,
    status: p.status,
    formats: p.formatsDelivery.map((f) => ({
      formatId: f.id,
      code: f.code,
      name: f.name,
      badge: f.badge,
      durationLabel: f.durationLabel,
      scheduleLabel: f.scheduleLabel,
      totalTimeLabel: f.totalTimeLabel,
      openDates: f.offerings.filter((o) => o.status === "open" && o.startsOn.getTime() >= today.getTime() && o.organisationId === null).length,
      upcomingDates: f.offerings.length,
      interestConfirmed: counts.get(f.id)?.confirmed ?? 0,
      interestNotified: counts.get(f.id)?.notified ?? 0,
    })),
  }));
}

/** The figures for the overview card. */
export function summariseFormats(rows: readonly TrainingFormatsOverview[]) {
  const formats = rows.flatMap((r) => r.formats);
  return {
    trainings: rows.length,
    trainingsWithoutFormats: rows.filter((r) => r.formats.length === 0).length,
    formats: formats.length,
    formatsWithoutDate: formats.filter((f) => f.openDates === 0).length,
    interested: formats.reduce((n, f) => n + f.interestConfirmed, 0),
    awaitingNotice: formats.reduce((n, f) => n + (f.interestConfirmed - f.interestNotified), 0),
  };
}
