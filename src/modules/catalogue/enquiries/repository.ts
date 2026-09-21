import type { Db } from "@/db/prisma";
import { getPrisma } from "@/db/prisma";

/* Enquiries — persistent from the first submission (Rule 6). Read side is
 * for tests now and the admin enquiries screen in M8. */

export type EnquiryKind = "general" | "organisation" | "programme_interest";

export type NewEnquiry = {
  kind: EnquiryKind;
  name: string;
  email: string;
  organisation: string | null;
  message: string;
  programmeId: string | null;
  sourcePath: string;
};

export type EnquiryRecord = NewEnquiry & { id: string; status: "new" | "replied" | "closed"; createdAt: Date };

export async function createEnquiry(input: NewEnquiry, db: Db = getPrisma()): Promise<EnquiryRecord> {
  return db.enquiry.create({ data: { ...input, email: input.email.trim().toLowerCase() } });
}

export async function findEnquiriesByEmail(email: string, db: Db = getPrisma()): Promise<EnquiryRecord[]> {
  return db.enquiry.findMany({ where: { email: email.trim().toLowerCase() }, orderBy: { createdAt: "desc" } });
}
