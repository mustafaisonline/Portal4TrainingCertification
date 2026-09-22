import type { Db, Tx } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { writeAudit } from "@/modules/platform/audit/repository";
import type { EnquiryKind, EnquiryRecord } from "./repository";

/*
 * Enquiries for administrators (Milestone 8 plan §2 item 3): list with
 * status filter and search, one enquiry in full, and the ONE write —
 * changing the status — which takes the caller's transaction and writes its
 * `enquiry.status_changed` audit row in it (ADR-022). The states are the
 * existing enum `new · replied · closed`; "reopen" returns to `new` (plan
 * §3 G2). No email is sent from here.
 */

export const ENQUIRY_STATUSES = ["new", "replied", "closed"] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];
export const ENQUIRY_STATUS_LABEL: Record<EnquiryStatus, string> = { new: "New", replied: "Replied", closed: "Closed" };
export const ENQUIRY_KINDS = ["general", "organisation", "programme_interest"] as const satisfies readonly EnquiryKind[];
export const ENQUIRY_KIND_LABEL: Record<EnquiryKind, string> = { general: "General", organisation: "Organisation", programme_interest: "Programme interest" };

export function isEnquiryStatus(value: string): value is EnquiryStatus {
  return (ENQUIRY_STATUSES as readonly string[]).includes(value);
}
export function isEnquiryKind(value: string): value is EnquiryKind {
  return (ENQUIRY_KINDS as readonly string[]).includes(value);
}

export class EnquiryNotFoundError extends Error {
  constructor(id: string) {
    super(`Enquiry ${id} not found.`);
    this.name = "EnquiryNotFoundError";
  }
}

export type AdminEnquiryItem = EnquiryRecord & { programmeTitle: string | null };

export type AdminEnquiryFilters = {
  status?: EnquiryStatus;
  kind?: EnquiryKind;
  /** Part of the name, email, organisation or message. */
  q?: string;
  page?: number;
  pageSize?: number;
};

export type AdminEnquiryPage = { items: AdminEnquiryItem[]; total: number; page: number; pageSize: number; pageCount: number };

export const ADMIN_ENQUIRIES_PAGE_SIZE = 25;

const include = { programme: { select: { title: true } } } as const;

type Row = EnquiryRecord & { programme: { title: string } | null };

function toItem(r: Row): AdminEnquiryItem {
  const { programme, ...rest } = r;
  return { ...rest, programmeTitle: programme?.title ?? null };
}

export async function listEnquiriesForAdmin(filters: AdminEnquiryFilters = {}, db: Db = getPrisma()): Promise<AdminEnquiryPage> {
  const pageSize = Math.min(Math.max(filters.pageSize ?? ADMIN_ENQUIRIES_PAGE_SIZE, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const q = filters.q?.trim();
  const where = {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.kind ? { kind: filters.kind } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { organisation: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [total, rows] = await Promise.all([
    db.enquiry.count({ where }),
    db.enquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include }),
  ]);
  return { items: rows.map(toItem), total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getEnquiryForAdmin(id: string, db: Db = getPrisma()): Promise<AdminEnquiryItem | null> {
  if (!isUuid(id)) return null;
  const row = await db.enquiry.findUnique({ where: { id }, include });
  return row ? toItem(row) : null;
}

/** Enquiries nobody has acted on yet — the overview board's count. */
export async function countOpenEnquiries(db: Db = getPrisma()): Promise<number> {
  return db.enquiry.count({ where: { status: "new" } });
}

/**
 * Change the status and audit it in the caller's transaction. Setting the
 * status it already has is a no-op (no audit row: nothing changed).
 */
export async function setEnquiryStatus(tx: Tx, id: string, actorUserId: string, status: EnquiryStatus): Promise<AdminEnquiryItem> {
  if (!isUuid(id)) throw new EnquiryNotFoundError(id);
  const before = await tx.enquiry.findUnique({ where: { id }, include });
  if (!before) throw new EnquiryNotFoundError(id);
  if (before.status === status) return toItem(before);
  const row = await tx.enquiry.update({ where: { id }, data: { status }, include });
  await writeAudit(tx, {
    actorUserId,
    action: "enquiry.status_changed",
    entityType: "enquiry",
    entityId: id,
    before: { status: before.status },
    after: { status: row.status },
  });
  return toItem(row);
}
