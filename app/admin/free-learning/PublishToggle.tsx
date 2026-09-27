"use client";

import { useActionState } from "react";
import { setTopicPublishedAction, type TopicPublishState } from "@/modules/free-learning/book.actions";
import { Button } from "@/shared/ui/Button";

const initial: TopicPublishState = { status: "idle" };

export function PublishToggle({ topicId, published, title }: { topicId: string; published: boolean; title: string }) {
  const [state, action, pending] = useActionState(setTopicPublishedAction, initial);
  return (
    <form action={action} className="flex flex-col gap-1">
      <input type="hidden" name="topicId" value={topicId} />
      <input type="hidden" name="published" value={published ? "false" : "true"} />
      <Button type="submit" variant="secondary" disabled={pending} data-testid="free-learning-toggle" aria-label={`${published ? "Unpublish" : "Publish"} ${title}`}>
        {pending ? "Saving…" : published ? "Unpublish" : "Publish"}
      </Button>
      {state.status === "error" ? (
        <span role="alert" className="text-body-sm text-[var(--color-danger)]">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
