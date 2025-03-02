import { api } from "@/lib/api";
import { queryOptions } from "@tanstack/react-query";
import { CommunityId, CreateCommunity } from "../../../server/db/schema";

export async function getAllCommunities() {
  const res = await api.communities.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch communities");
  }
  const data = await res.json();
  return data;
}

export const getAllCommunitiesQueryOptions = queryOptions({
  queryKey: ["get-all-communities"],
  queryFn: getAllCommunities,
  staleTime: 1000 * 60 * 5,
});

export type Community = Awaited<ReturnType<typeof getCommunityByName>>;
export async function getCommunityByName(name: string) {
  const res = await api.communities[":name"].$get({ param: { name } });

  if (!res.ok) {
    throw new Error("Failed to fetch community");
  }

  const data = await res.json();
  return data;
}

export const getCommunityQueryOptions = (name: string) => {
  return queryOptions({
    queryKey: ["get-community", name],
    queryFn: () => getCommunityByName(name),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};

export async function createCommunity({ value }: { value: CreateCommunity }) {
  const res = await api.communities.$post({ json: value });
  if (!res.ok) {
    throw new Error("Failed to create community");
  }

  const newCommunity = await res.json();
  return newCommunity;
}

export async function joinCommunity(id: CommunityId) {
  const res = await api.communities.follow[":id"].$post({ param: { id } });
  if (!res.ok) {
    throw new Error("Failed to join community");
  }
}

export async function leaveCommunity(id: CommunityId) {
  const res = await api.communities.follow[":id"].$delete({ param: { id } });
  if (!res.ok) {
    throw new Error("Failed to join community");
  }
}
