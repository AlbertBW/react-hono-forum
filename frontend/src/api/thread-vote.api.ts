import { api } from "@/lib/api";
import { ThreadId } from "../../../server/db/schema";

export async function createThreadVote(id: ThreadId, value: number) {
  const res = await api.threads[":id"].vote[":value"].$post({
    param: { id, value: value.toString() },
  });

  if (!res.ok) {
    throw new Error("Failed to vote");
  }

  const data = await res.json();
  return data;
}

export async function deleteThreadVote(id: ThreadId) {
  const res = await api.threads[":id"].vote.$delete({ param: { id } });

  if (!res.ok) {
    throw new Error("Failed to delete vote");
  }

  const data = await res.json();
  return data;
}

export async function updateThreadVote(id: ThreadId, value: number) {
  console.log("create vote", id, value);
  const res = await api.threads[":id"].vote[":value"].$put({
    param: { id, value: value.toString() },
  });

  if (!res.ok) {
    throw new Error("Failed to update vote");
  }

  const data = await res.json();
  return data;
}
