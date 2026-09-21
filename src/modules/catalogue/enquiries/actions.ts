"use server";

import { headers } from "next/headers";
import { sendEmail } from "@/modules/notifications/email";
import { getPrisma } from "@/db/prisma";
import { createEnquiry, type EnquiryKind } from "./repository";

/*
 * Contact / register-interest — a server action (ADR-004). Validates, writes
 * the `enquiries` row, records a notification email through the outbox, and
 * returns a result the form renders. The client never fabricates success.
 *
 * Rate limit: 5 submissions per client per 10 minutes, counted in the
 * database (restart-safe) — reuses the auth rate-limit table with its own
 * key prefix so no new table is needed.
 */

export type EnquiryFormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: Partial<Record<"name" | "email" | "message", string>> }
  | { status: "sent"; reference: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

async function overLimit(clientKey: string): Promise<boolean> {
  const prisma = getPrisma();
  const key = `enquiry:${clientKey}`;
  const now = Date.now();
  const row = await prisma.authRateLimit.findUnique({ where: { key } });
  if (!row || now - Number(row.lastRequest) > WINDOW_MS) {
    await prisma.authRateLimit.upsert({
      where: { key },
      create: { id: key, key, count: 1, lastRequest: BigInt(now) },
      update: { count: 1, lastRequest: BigInt(now) },
    });
    return false;
  }
  if (row.count >= MAX_PER_WINDOW) return true;
  await prisma.authRateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
  return false;
}

export async function submitEnquiry(_prev: EnquiryFormState, formData: FormData): Promise<EnquiryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const organisation = String(formData.get("organisation") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "general");
  const kind: EnquiryKind = kindRaw === "organisation" || kindRaw === "programme_interest" ? kindRaw : "general";
  const programmeId = String(formData.get("programmeId") ?? "").trim() || null;
  const sourcePath = String(formData.get("sourcePath") ?? "/contact-us").slice(0, 200);
  // Honeypot: real people never fill a field they cannot see.
  if (String(formData.get("website") ?? "")) return { status: "sent", reference: "—" };

  const fieldErrors: Partial<Record<"name" | "email" | "message", string>> = {};
  if (name.length < 2 || name.length > 200) fieldErrors.name = "Please enter your name.";
  if (!EMAIL_RE.test(email) || email.length > 254) fieldErrors.email = "Please enter a valid email address.";
  if (message.length < 10 || message.length > 5000) fieldErrors.message = "Please tell us a little more (at least 10 characters).";
  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  const h = await headers();
  const clientKey = (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? "local").split(",")[0]!.trim();
  if (await overLimit(clientKey)) {
    return { status: "error", message: "Too many messages in a short time. Please try again in a few minutes.", fieldErrors: {} };
  }

  const enquiry = await createEnquiry({ kind, name, email, organisation, message, programmeId, sourcePath });

  const notify = process.env["ENQUIRY_NOTIFY_EMAIL"];
  if (notify) {
    void sendEmail({
      to: notify,
      templateKey: "enquiry.notify",
      subject: `New ${kind.replace("_", " ")} enquiry from ${name}`,
      text: `From: ${name} <${email}>${organisation ? ` · ${organisation}` : ""}\nSource: ${sourcePath}\nReference: ${enquiry.id}\n\n${message}`,
    });
  }
  return { status: "sent", reference: enquiry.id.slice(0, 8).toUpperCase() };
}
