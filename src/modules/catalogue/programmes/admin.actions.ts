"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { isUuid } from "@/modules/catalogue/offerings/repository";
import { trainingAccess, type TrainingAccess } from "./admin-access";
import { CONTENT_FIELDS, FEE_REGIONS, PROGRAMME_LEVELS, PROGRAMME_STATUSES, type ContentFieldErrors, type ContentForm } from "./constants";
import {
  createTraining,
  removeTrainingFee,
  replaceTrainingFormats,
  replaceTrainingModules,
  saveTrainingFee,
  setTrainingStatus,
  TrainingRefusedError,
  TrainingValidationError,
  updateTrainingContent,
  updateTrainingDetails,
  type TrainingDetailsErrors,
  type TrainingDetailsInput,
  type TrainingFeeErrors,
  type TrainingFeeInput,
  type TrainingFormatInput,
  type TrainingModuleInput,
} from "./admin.repository";
import { formToContent } from "./content-codec";
import type { PriceRegion, ProgrammeLevel, ProgrammeStatus } from "./types";

/*
 * Trainings admin — the forms' server actions (M12 WP2). Each action
 * resolves the caller's training scope FIRST (an action is its own HTTP
 * endpoint and must gate itself — ADR-020), parses the form into a typed
 * input, and writes through admin.repository.ts inside one transaction
 * with its audit row. Field errors come from the repository so every rule
 * lives in one place.
 */

export type FormState<E = Record<string, string>> =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: E }
  | { status: "saved"; id: string; slug?: string };

const CHECK = "Please check the highlighted fields.";

function text(fd: FormData, name: string): string {
  return String(fd.get(name) ?? "").trim();
}

async function gate(): Promise<{ access: Extract<TrainingAccess, { ok: true }> } | { error: FormState<never> }> {
  const access = await trainingAccess();
  if (!access.ok) {
    return {
      error: {
        status: "error",
        message: access.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to manage trainings.",
        fieldErrors: {} as never,
      },
    };
  }
  return { access };
}

function revalidate(id?: string, slug?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/trainings");
  if (id) revalidatePath(`/admin/trainings/${id}`);
  revalidatePath("/programs");
  if (slug) revalidatePath(`/programs/${slug}`);
  revalidatePath("/schedule");
  revalidatePath("/sitemap.xml");
}

function failure<E>(err: unknown, what: string): FormState<E> {
  if (err instanceof TrainingValidationError) return { status: "error", message: CHECK, fieldErrors: err.fieldErrors as E };
  if (err instanceof TrainingRefusedError) return { status: "error", message: err.message, fieldErrors: {} as E };
  console.error(`[trainings] ${what} failed`, err);
  return { status: "error", message: `We could not save the ${what}. Please try again.`, fieldErrors: {} as E };
}

/* ---------------------------------------------------------------- details */

function parseDetails(fd: FormData): TrainingDetailsInput {
  const levelRaw = text(fd, "level");
  const sortRaw = text(fd, "sortOrder");
  return {
    title: text(fd, "title"),
    subtitle: text(fd, "subtitle"),
    slug: text(fd, "slug"),
    domainId: text(fd, "domainId"),
    level: (PROGRAMME_LEVELS as readonly string[]).includes(levelRaw) ? (levelRaw as ProgrammeLevel) : ("foundation" as ProgrammeLevel),
    flagship: fd.get("flagship") === "on",
    durationLabel: text(fd, "durationLabel"),
    prerequisites: text(fd, "prerequisites"),
    formats: text(fd, "formats")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
    certificateLabel: text(fd, "certificateLabel"),
    audienceSummary: text(fd, "audienceSummary"),
    summary: text(fd, "summary"),
    valueProposition: text(fd, "valueProposition"),
    sortOrder: /^\d+$/.test(sortRaw) ? Number(sortRaw) : sortRaw ? -1 : 0,
  };
}

export async function createTrainingAction(_prev: FormState<TrainingDetailsErrors>, fd: FormData): Promise<FormState<TrainingDetailsErrors>> {
  const g = await gate();
  if ("error" in g) return g.error;
  try {
    const created = await withTransaction((tx) => createTraining(tx, parseDetails(fd), { userId: g.access.user.id, expertId: g.access.expertId }));
    revalidate(created.id, created.slug);
    return { status: "saved", id: created.id, slug: created.slug };
  } catch (err) {
    return failure(err, "training");
  }
}

export async function updateTrainingDetailsAction(_prev: FormState<TrainingDetailsErrors>, fd: FormData): Promise<FormState<TrainingDetailsErrors>> {
  const g = await gate();
  if ("error" in g) return g.error;
  const id = text(fd, "id");
  if (!isUuid(id)) return { status: "error", message: "This training could not be found.", fieldErrors: {} };
  try {
    const input = parseDetails(fd);
    await withTransaction((tx) => updateTrainingDetails(tx, id, g.access.scope, input, g.access.user.id));
    revalidate(id, input.slug || undefined);
    return { status: "saved", id };
  } catch (err) {
    return failure(err, "details");
  }
}

/* ---------------------------------------------------------------- content */

export async function updateTrainingContentAction(_prev: FormState<ContentFieldErrors>, fd: FormData): Promise<FormState<ContentFieldErrors>> {
  const g = await gate();
  if ("error" in g) return g.error;
  const id = text(fd, "id");
  if (!isUuid(id)) return { status: "error", message: "This training could not be found.", fieldErrors: {} };
  const form = Object.fromEntries(CONTENT_FIELDS.map((f) => [f, String(fd.get(f) ?? "")])) as ContentForm;
  const { content, errors } = formToContent(form);
  if (!content) return { status: "error", message: CHECK, fieldErrors: errors };
  try {
    await withTransaction((tx) => updateTrainingContent(tx, id, g.access.scope, content, g.access.user.id));
    revalidate(id, text(fd, "slug") || undefined);
    return { status: "saved", id };
  } catch (err) {
    return failure(err, "content");
  }
}

/* ---------------------------------------------------------------- modules */

/** The modules editor posts its rows as one JSON field (`modulesJson`). */
export async function replaceTrainingModulesAction(_prev: FormState<Record<string, string>>, fd: FormData): Promise<FormState<Record<string, string>>> {
  const g = await gate();
  if ("error" in g) return g.error;
  const id = text(fd, "id");
  if (!isUuid(id)) return { status: "error", message: "This training could not be found.", fieldErrors: {} };
  let modules: TrainingModuleInput[];
  try {
    const parsed: unknown = JSON.parse(text(fd, "modulesJson") || "[]");
    if (!Array.isArray(parsed)) throw new Error("not an array");
    modules = parsed.map((m: Record<string, unknown>) => ({
      title: String(m.title ?? ""),
      description: String(m.description ?? ""),
      pointsText: String(m.pointsText ?? ""),
    }));
  } catch {
    return { status: "error", message: "The curriculum could not be read. Reload the page and try again.", fieldErrors: {} };
  }
  try {
    await withTransaction((tx) => replaceTrainingModules(tx, id, g.access.scope, modules, g.access.user.id));
    revalidate(id, text(fd, "slug") || undefined);
    return { status: "saved", id };
  } catch (err) {
    if (err instanceof TrainingValidationError) {
      // Per-row errors: flatten to "<index>.<field>" keys for the editor.
      const flat: Record<string, string> = {};
      for (const [i, e] of Object.entries(err.fieldErrors as unknown as Record<string, Record<string, string>>)) for (const [f, msg] of Object.entries(e)) flat[`${i}.${f}`] = msg;
      return { status: "error", message: CHECK, fieldErrors: flat };
    }
    return failure(err, "curriculum");
  }
}

/* ---------------------------------------------------------------- formats */

export async function replaceTrainingFormatsAction(_prev: FormState<Record<string, string>>, fd: FormData): Promise<FormState<Record<string, string>>> {
  const g = await gate();
  if ("error" in g) return g.error;
  const id = text(fd, "id");
  if (!isUuid(id)) return { status: "error", message: "This training could not be found.", fieldErrors: {} };
  let formats: TrainingFormatInput[];
  try {
    const parsed: unknown = JSON.parse(text(fd, "formatsJson") || "[]");
    if (!Array.isArray(parsed)) throw new Error("not an array");
    formats = parsed.map((f: Record<string, unknown>) => ({
      name: String(f.name ?? ""),
      badge: String(f.badge ?? ""),
      durationLabel: String(f.durationLabel ?? ""),
      scheduleLabel: String(f.scheduleLabel ?? ""),
      totalTimeLabel: String(f.totalTimeLabel ?? ""),
      bestForText: String(f.bestForText ?? ""),
    }));
  } catch {
    return { status: "error", message: "The formats could not be read. Reload the page and try again.", fieldErrors: {} };
  }
  try {
    await withTransaction((tx) => replaceTrainingFormats(tx, id, g.access.scope, formats, g.access.user.id));
    revalidate(id, text(fd, "slug") || undefined);
    return { status: "saved", id };
  } catch (err) {
    if (err instanceof TrainingValidationError) {
      const flat: Record<string, string> = {};
      for (const [i, e] of Object.entries(err.fieldErrors as unknown as Record<string, Record<string, string>>)) for (const [f, msg] of Object.entries(e)) flat[`${i}.${f}`] = msg;
      return { status: "error", message: CHECK, fieldErrors: flat };
    }
    return failure(err, "formats");
  }
}

/* ------------------------------------------------------------------- fees */

export async function saveTrainingFeeAction(_prev: FormState<TrainingFeeErrors>, fd: FormData): Promise<FormState<TrainingFeeErrors>> {
  const g = await gate();
  if ("error" in g) return g.error;
  const id = text(fd, "id");
  if (!isUuid(id)) return { status: "error", message: "This training could not be found.", fieldErrors: {} };
  const regionRaw = text(fd, "region");
  if (!(FEE_REGIONS as readonly string[]).includes(regionRaw)) return { status: "error", message: "Unknown fee row.", fieldErrors: {} };
  const input: TrainingFeeInput = {
    region: regionRaw as PriceRegion,
    currency: text(fd, "currency"),
    listAmount: text(fd, "listAmount"),
    offerAmount: text(fd, "offerAmount"),
    offerLabel: text(fd, "offerLabel"),
    offerName: text(fd, "offerName"),
    minParticipants: text(fd, "minParticipants"),
    note: text(fd, "note"),
    validFrom: text(fd, "validFrom"),
    validTo: text(fd, "validTo"),
  };
  try {
    await withTransaction((tx) => saveTrainingFee(tx, id, g.access.scope, input, g.access.user.id));
    revalidate(id, text(fd, "slug") || undefined);
    return { status: "saved", id };
  } catch (err) {
    return failure(err, "fee");
  }
}

export async function removeTrainingFeeAction(_prev: FormState<TrainingFeeErrors>, fd: FormData): Promise<FormState<TrainingFeeErrors>> {
  const g = await gate();
  if ("error" in g) return g.error;
  const id = text(fd, "id");
  const regionRaw = text(fd, "region");
  if (!isUuid(id) || !(FEE_REGIONS as readonly string[]).includes(regionRaw)) return { status: "error", message: "Unknown fee row.", fieldErrors: {} };
  if (text(fd, "confirm") !== "yes") return { status: "error", message: "Tick the confirmation before removing a fee row.", fieldErrors: {} };
  try {
    await withTransaction((tx) => removeTrainingFee(tx, id, g.access.scope, regionRaw as PriceRegion, g.access.user.id));
    revalidate(id, text(fd, "slug") || undefined);
    return { status: "saved", id };
  } catch (err) {
    return failure(err, "fee");
  }
}

/* ----------------------------------------------------------------- status */

/** Administrators only (decision L2): a Trainer's request to publish is a
 *  message to an administrator, not a state change. */
export async function setTrainingStatusAction(_prev: FormState<{ status?: string }>, fd: FormData): Promise<FormState<{ status?: string }>> {
  const g = await gate();
  if ("error" in g) return g.error;
  if (!g.access.isAdmin) return { status: "error", message: "Only an administrator can publish or unpublish a training.", fieldErrors: {} };
  const id = text(fd, "id");
  const statusRaw = text(fd, "status");
  if (!isUuid(id)) return { status: "error", message: "This training could not be found.", fieldErrors: {} };
  if (!(PROGRAMME_STATUSES as readonly string[]).includes(statusRaw)) return { status: "error", message: "Choose a status.", fieldErrors: { status: "Choose a status." } };
  try {
    await withTransaction((tx) => setTrainingStatus(tx, id, statusRaw as ProgrammeStatus, g.access.user.id));
    revalidate(id, text(fd, "slug") || undefined);
    return { status: "saved", id };
  } catch (err) {
    return failure(err, "status");
  }
}
