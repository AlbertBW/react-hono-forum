import { api } from "@/lib/api";
import { ThreadId } from "../../../server/db/schema";
import { handleRateLimitError } from "./ratelimit-response";

export async function createThreadVote(id: ThreadId, value: number) {
  const res = await api.threads[":id"].vote[":value"].$post({
    param: { id, value: value.toString() },
  });

  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) throw new Error(error.message);
    throw new Error("Failed to update vote");
  }
}

export async function deleteThreadVote(id: ThreadId) {
  const res = await api.threads[":id"].vote.$delete({ param: { id } });

  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) throw new Error(error.message);
    throw new Error("Failed to update vote");
  }
}

export async function updateThreadVote(id: ThreadId, value: number) {
  const res = await api.threads[":id"].vote[":value"].$put({
    param: { id, value: value.toString() },
  });

  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) throw new Error(error.message);
    throw new Error("Failed to update vote");
  }
}
