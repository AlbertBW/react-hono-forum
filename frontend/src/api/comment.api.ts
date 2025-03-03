import { api } from "@/lib/api";
import { ThreadId } from "../../../server/db/schema";
import { queryOptions } from "@tanstack/react-query";
import { handleRateLimitError } from "./ratelimit-response";

export async function createComment(
  threadId: ThreadId,
  content: string,
  parentId?: string
) {
  const res = await api.comments.$post({
    json: {
      threadId,
      content,
      parentId,
    },
  });

  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { data: null, error: error };
    throw new Error("Failed to create comment");
  }

  const data = await res.json();
  return { data, error: null };
}

export async function getComments(threadId: ThreadId) {
  const res = await api.comments[":threadId"].$get({ param: { threadId } });

  if (!res.ok) {
    throw new Error("Failed to fetch comments");
  }

  const data = await res.json();
  return data;
}

export const getCommentsQueryOptions = (threadId: ThreadId) =>
  queryOptions({
    queryKey: ["get-comments", threadId],
    queryFn: () => getComments(threadId),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
