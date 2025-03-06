import { api } from "@/lib/api";
import { CreateComment, ThreadId } from "../../../server/db/schema";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { handleRateLimitError } from "./ratelimit-response";

export async function createComment(
  threadId: ThreadId,
  content: string,
  parentId?: string
) {
  await new Promise((r) => setTimeout(r, 5000));
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

export type Comment = Awaited<ReturnType<typeof getComments>>[0];
export async function getComments(
  threadId: ThreadId,
  limit: number = 10,
  parentId?: string,
  cursor?: string
) {
  const limitString = limit.toString();
  const res = await api.comments[":threadId"].$get({
    param: { threadId },
    query: { cursor, parentId, limit: limitString },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch comments");
  }

  const data = await res.json();
  return data;
}

export const getCommentsInfiniteQueryOptions = (
  threadId: ThreadId,
  limit: number = 10,
  parentId?: string
) =>
  infiniteQueryOptions({
    queryKey: ["threads", "infinite", threadId, limit, parentId],
    queryFn: async ({ pageParam }) =>
      await getComments(
        threadId,
        limit,
        parentId,
        pageParam as string | undefined
      ),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0 || lastPage.length < limit) {
        return undefined;
      }
      return lastPage[lastPage.length - 1].createdAt;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

export const loadingCreateCommentQueryOptions = queryOptions<{
  comment?: CreateComment;
}>({
  queryKey: ["loading-create-comment"],
  queryFn: async () => {
    return {};
  },
  staleTime: Infinity,
});
