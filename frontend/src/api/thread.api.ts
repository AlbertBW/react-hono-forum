import { api } from "@/lib/api";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { CreateThread, ThreadId } from "../../../server/db/schema";
import { handleRateLimitError } from "./ratelimit-response";
import { OrderBy } from "../../../server/routes/threads";

export async function createThread({ value }: { value: CreateThread }) {
  const res = await api.threads.$post({ json: value });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { data: null, error: error };
    throw new Error("Failed to create thread");
  }

  const newThread = await res.json();
  return { data: newThread, error: null };
}

export async function getSingleThreadById(id: ThreadId) {
  const res = await api.threads.single[":id"].$get({ param: { id } });
  if (!res.ok) {
    throw new Error("Failed to fetch thread");
  }
  const data = await res.json();
  return data;
}

export const getSingleThreadQueryOptions = (id: ThreadId) =>
  queryOptions({
    queryKey: ["get-thread", id],
    queryFn: () => getSingleThreadById(id),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

export async function deleteThread(id: ThreadId) {
  const res = await api.threads[":id"].$delete({ param: { id } });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { error: error };
    throw new Error("Failed to delete thread");
  }
}

export type ThreadCardType = Awaited<ReturnType<typeof getThreadsList>>[number];
export const getThreadsList = async ({
  userId,
  communityName,
  orderBy,
  following,
  limit,
  cursor,
}: {
  userId?: string;
  communityName?: string;
  orderBy?: OrderBy;
  following?: boolean;
  limit: number;
  cursor?: string;
}) => {
  const res = await api.threads.list.$get({
    query: {
      userId,
      communityName,
      orderBy,
      following: following ? String(following) : undefined,
      limit: String(limit),
      cursor,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch threads");
  }

  return res.json();
};

export const getThreadsInfiniteQueryOptions = ({
  userId,
  communityName,
  following,
  limit = 10,
}: {
  userId?: string;
  communityName?: string;
  following?: boolean;
  limit?: number;
}) =>
  infiniteQueryOptions({
    queryKey: ["threads", "infinite", userId, communityName, following, limit],
    queryFn: async ({ pageParam }) =>
      await getThreadsList({
        userId,
        communityName,
        following,
        limit,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0 || lastPage.length < limit) {
        return undefined;
      }
      return lastPage[lastPage.length - 1].createdAt;
    },
    staleTime: 1000 * 60 * 5,
    initialPageParam: undefined as string | undefined,
    retry: false,
  });

export const getPopularThreadsQueryOptions = (limit = 10) =>
  queryOptions({
    queryKey: ["popular-threads"],
    queryFn: () =>
      getThreadsList({ communityName: "all", orderBy: "popular", limit }),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

export type VotedThreadCardType = Awaited<
  ReturnType<typeof getThreadsListByVoted>
>[number];
export async function getThreadsListByVoted({
  userId,
  voted,
  limit,
  cursor,
}: {
  userId: string;
  voted: 1 | -1;
  limit: number;
  cursor?: string;
}) {
  const res = await api.threads.voted.$get({
    query: {
      userId,
      voted: String(voted),
      limit: String(limit),
      cursor,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch threads");
  }

  return res.json();
}
export const getThreadsByVotedInfiniteQueryOptions = ({
  userId,
  voted,
  limit = 10,
}: {
  userId: string;
  voted: 1 | -1;
  limit?: number;
}) =>
  infiniteQueryOptions({
    queryKey: ["threads", "voted", userId, voted],
    queryFn: async ({ pageParam }) =>
      await getThreadsListByVoted({
        userId,
        voted,
        limit,
        cursor: pageParam as string | undefined,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0 || lastPage.length < limit) {
        return undefined;
      }
      return lastPage[lastPage.length - 1].votedAt;
    },
    staleTime: 1000 * 60 * 5,
    initialPageParam: undefined as string | undefined,
    retry: false,
  });
