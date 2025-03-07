import { api } from "@/lib/api";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { CreateThread, ThreadId } from "../../../server/db/schema";
import { handleRateLimitError } from "./ratelimit-response";

// export async function getAllThreads() {
//   const res = await api.threads.$get();

//   if (!res.ok) {
//     throw new Error("Failed to fetch threads");
//   }
//   const data = await res.json();
//   return data;
// }

// export const getAllThreadsQueryOptions = queryOptions({
//   queryKey: ["get-all-threads"],
//   queryFn: getAllThreads,
//   staleTime: 1000 * 60 * 5,
// });

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

// export async function getThreadsByCommunityName(
//   communityName: string,
//   limit?: number,
//   cursor?: string
// ) {
//   const res = await api.threads.community[":name"].$get({
//     param: { name: communityName },
//   });
//   if (!res.ok) {
//     throw new Error("Failed to fetch threads");
//   }
//   const data = await res.json();
//   return data;
// }

// export const getThreadsQueryOptions = (
//   communityName: string,
//   limit?: number,
//   cursor?: string
// ) =>
//   queryOptions({
//     queryKey: ["get-threads", communityName, limit, cursor],
//     queryFn: () => getThreadsByCommunityName(communityName, limit, cursor),
//     staleTime: 1000 * 60 * 5,
//     retry: false,
//   });

export async function deleteThread(id: ThreadId) {
  const res = await api.threads[":id"].$delete({ param: { id } });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { error: error };
    throw new Error("Failed to delete thread");
  }
}

export type ThreadCardType = Awaited<
  ReturnType<typeof getThreadsByCommunityName>
>[number];
export const getThreadsByCommunityName = async (
  name: string,
  limit?: number,
  cursor?: string
) => {
  const res = await api.threads.community[":name"].$get({
    param: { name },
    query: {
      limit: String(limit),
      cursor,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch threads");
  }

  return res.json();
};

export const getThreadsInfiniteQueryOptions = (
  name: string,
  limit: number = 10
) =>
  infiniteQueryOptions({
    queryKey: ["threads", "infinite", name],
    queryFn: async ({ pageParam }) =>
      await getThreadsByCommunityName(
        name,
        limit,
        pageParam as string | undefined
      ),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) {
        return undefined;
      }
      return lastPage[lastPage.length - 1].createdAt;
    },
    staleTime: 1000 * 60 * 5,
    initialPageParam: undefined as string | undefined,
    retry: false,
  });

export type ThreadCardWithCommunityImage = Awaited<
  ReturnType<typeof getAllThreads>
>[number];
export const getAllThreads = async (limit?: number, cursor?: string) => {
  const res = await api.threads.$get({
    query: {
      limit: String(limit),
      cursor,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch threads");
  }

  return res.json();
};

export const getAllThreadsInfiniteQueryOptions = (limit: number = 10) =>
  infiniteQueryOptions({
    queryKey: ["all-threads", "infinite", limit],
    queryFn: async ({ pageParam }) =>
      await getAllThreads(limit, pageParam as string | undefined),
    getNextPageParam: (lastPage) => {
      if (lastPage.length === 0) {
        return undefined;
      }
      return lastPage[lastPage.length - 1].createdAt;
    },
    staleTime: 1000 * 60 * 5,
    initialPageParam: undefined as string | undefined,
    retry: false,
  });
