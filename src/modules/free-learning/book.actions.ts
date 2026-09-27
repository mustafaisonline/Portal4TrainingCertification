"use server";

import { revalidatePath } from "next/cache";
import { withTransaction } from "@/db/prisma";
import { authorise } from "@/modules/identity/session";
import { setTopicPublished } from "./book.repository";

/*
 * Administrator action for Free Learning (Milestone 14 Phase 2): publish or
 * unpublish one topic. Authorises `platform_admin` FIRST (an action is its
 * own endpoint — ADR-020); the change is audited in the repository.
 */

export type TopicPublishState = { status: "idle" } | { status: "error"; message: string } | { status: "done"; message: string };

export async function setTopicPublishedAction(_prev: TopicPublishState, formData: FormData): Promise<TopicPublishState> {
  const result = await authorise("platform_admin");
  if (!result.ok) {
    return { status: "error", message: result.reason === "signed-out" ? "Your session has ended. Please sign in again." : "You do not have permission to manage Free Learning." };
  }
  const topicId = String(formData.get("topicId") ?? "").trim();
  const published = String(formData.get("published") ?? "") === "true";
  try {
    const topic = await withTransaction((tx) => setTopicPublished(tx, { topicId, published, actorUserId: result.user.id }));
    if (!topic) return { status: "error", message: "That topic could not be found." };
    revalidatePath("/admin/free-learning");
    revalidatePath("/free-learning", "layout");
    return { status: "done", message: `${topic.title} is now ${topic.published ? "published" : "unpublished"}.` };
  } catch (err) {
    console.error(`[free-learning] publish change failed for topic ${topicId}:`, err instanceof Error ? err.message : err);
    return { status: "error", message: "The change could not be saved. Please try again." };
  }
}
