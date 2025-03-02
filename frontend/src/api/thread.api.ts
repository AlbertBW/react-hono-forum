import { api } from "@/lib/api";
import { queryOptions } from "@tanstack/react-query";
import { CreateThread, ThreadId } from "../../../server/db/schema";

export async function getAllThreads() {
  const res = await api.threads.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch threads");
  }
  const data = await res.json();
  return data;
}

export const getAllThreadsQueryOptions = queryOptions({
  queryKey: ["get-all-threads"],
  queryFn: getAllThreads,
  staleTime: 1000 * 60 * 5,
});

export async function createThread({ value }: { value: CreateThread }) {
  const res = await api.threads.$post({ json: value });
  if (!res.ok) {
    throw new Error("Failed to create thread");
  }

  const newThread = await res.json();
  return newThread;
}

export async function getThreadById(id: ThreadId) {
  const res = await api.threads.single[":id"].$get({ param: { id } });
  if (!res.ok) {
    throw new Error("Failed to fetch thread");
  }
  const data = await res.json();
  return data;
}

export const getThreadQueryOptions = (id: ThreadId) =>
  queryOptions({
    queryKey: ["get-thread", id],
    queryFn: () => getThreadById(id),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

export type ThreadCard = Awaited<
  ReturnType<typeof getThreadsByCommunityName>
>[number];
export async function getThreadsByCommunityName(communityName: string) {
  const res = await api.threads.community[":name"].$get({
    param: { name: communityName },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch threads");
  }
  const data = await res.json();
  return data;
}

export const getThreadsQueryOptions = (communityName: string) =>
  queryOptions({
    queryKey: ["get-threads", communityName],
    queryFn: () => getThreadsByCommunityName(communityName),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

export async function deleteThread(id: ThreadId) {
  const res = await api.threads[":id"].$delete({ param: { id } });
  if (!res.ok) {
    throw new Error("Failed to delete thread");
  }
}
