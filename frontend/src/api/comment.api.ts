import { api } from "@/lib/api";
import { CreateComment, ThreadId } from "../../../server/db/schema";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
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

export type Comment = Awaited<ReturnType<typeof getComments>>[0];
export async function getComments(
  threadId: ThreadId,
  limit: number = 10,
  parentId?: string,
  cursor?: string
) {
  const limitString = limit.toString();
  const res = await api.comments.thread[":id"].$get({
    param: { id: threadId },
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
    retry: 3,
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

export type UserComment = Awaited<ReturnType<typeof getUserComments>>[0];
export async function getUserComments(
  userId: string,
  limit: number = 10,
  cursor?: string
) {
  const res = await api.comments.user.$get({
    query: { userId, limit: limit.toString(), cursor },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user comments");
  }

  const data = await res.json();
  return data;
}

export const getUserCommentsInfiniteQueryOptions = (
  userId: string,
  limit: number = 10
) =>
  infiniteQueryOptions({
    queryKey: ["user", userId],
    queryFn: async ({ pageParam }) =>
      await getUserComments(userId, limit, pageParam as string | undefined),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0 || lastPage.length < limit) {
        return undefined;
      }
      return lastPage[lastPage.length - 1].createdAt;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5,
    retry: 3,
  });

export async function deleteComment(commentId: string) {
  const res = await api.comments.delete[":id"].$delete({
    param: { id: commentId },
  });

  if (!res.ok) {
    throw new Error("Failed to delete comment");
  }
}
