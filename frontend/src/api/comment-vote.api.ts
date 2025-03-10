import { api } from "@/lib/api";
import { CommentId } from "../../../server/db/schema";
import { handleRateLimitError } from "./ratelimit-response";

export async function createCommentVote(id: CommentId, value: number) {
  const res = await api.comments.vote[":id"][":value"].$post({
    param: { id, value: value.toString() },
  });

  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) throw new Error(error.message);
    throw new Error("Failed to update vote");
  }
}

export async function deleteCommentVote(id: CommentId) {
  const res = await api.comments.vote[":id"].$delete({
    param: { id },
  });

  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) throw new Error(error.message);
    throw new Error("Failed to update vote");
  }
}

export async function updateCommentVote(id: CommentId, value: number) {
  const res = await api.comments.vote[":id"][":value"].$put({
    param: { id, value: value.toString() },
  });

  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) throw new Error(error.message);
    throw new Error("Failed to update vote");
  }
}
