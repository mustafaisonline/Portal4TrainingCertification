/*
 * Pure offering vocabulary — enums, labels, defaults — with NO database
 * import, so client components (the admin form) can use it without dragging
 * the Prisma/pg layer into the browser bundle. `repository.ts` re-exports
 * everything here for server code.
 */

export type OfferingStatus = "planned" | "open" | "full" | "completed" | "cancelled";
export type DeliveryModality = "live_online" | "face_to_face" | "corporate_private";

export const OFFERING_STATUSES: readonly OfferingStatus[] = ["planned", "open", "full", "completed", "cancelled"];
export const DELIVERY_MODALITIES: readonly DeliveryModality[] = ["live_online", "face_to_face", "corporate_private"];

export const MODALITY_LABEL: Record<DeliveryModality, string> = {
  live_online: "Live online",
  face_to_face: "Face-to-face",
  corporate_private: "Private cohort",
};

export const OFFERING_STATUS_LABEL: Record<OfferingStatus, string> = {
  planned: "Planned",
  open: "Open",
  full: "Full",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const DEFAULT_TIMEZONE = "Asia/Kuala_Lumpur";
