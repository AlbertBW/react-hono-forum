import { api } from "@/lib/api";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { CommunityId, CreateCommunity } from "../../../server/db/schema";
import { handleRateLimitError } from "./ratelimit-response";

export type Search = "new" | "popular" | "following";

export type CommunityCardType = Awaited<
  ReturnType<typeof getAllCommunities>
>[number];
export async function getAllCommunities(
  limit?: number,
  search?: Search,
  cursor?: string
) {
  const res = await api.communities.$get({
    query: {
      limit: String(limit),
      search,
      cursor,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch communities");
  }
  const data = await res.json();
  return data;
}

export const getAllCommunitiesInfiniteQueryOptions = (
  limit = 10,
  search: Search
) =>
  infiniteQueryOptions({
    queryKey: ["get-infinite-communities", search, limit],
    queryFn: async ({ pageParam }) =>
      await getAllCommunities(limit, search, pageParam),
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
    const error = handleRateLimitError(res);
    if (error) return { data: null, error: error };
    throw new Error("Failed to create community");
  }

  const newCommunity = await res.json();
  return { data: newCommunity, error: null };
}

export async function joinCommunity(id: CommunityId) {
  const res = await api.communities.follow[":id"].$post({ param: { id } });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) throw new Error(error.message);
    throw new Error("Failed to join community");
  }
}

export async function leaveCommunity(id: CommunityId) {
  const res = await api.communities.follow[":id"].$delete({ param: { id } });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) throw new Error(error.message);
    throw new Error("Failed to join community");
  }
}

export async function deleteCommunity(id: CommunityId) {
  const res = await api.communities.delete[":id"].$delete({ param: { id } });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { error: error };
    throw new Error("Failed to delete community");
  }
}

export async function updateCommunityIcon(id: CommunityId, iconUrl: string) {
  const res = await api.communities.icon[":id"].$put({
    param: { id },
    json: { iconUrl: iconUrl },
  });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { error: error };
    throw new Error("Failed to update community icon");
  }
}

export async function updateCommunityBanner(
  id: CommunityId,
  bannerUrl: string
) {
  const res = await api.communities.banner[":id"].$put({
    param: { id },
    json: { bannerUrl },
  });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { error: error };
    throw new Error("Failed to update community icon");
  }
}

export async function updateCommunityDescription(
  id: CommunityId,
  description: string
) {
  const res = await api.communities.description[":id"].$put({
    param: { id },
    json: { description },
  });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { error: error };
    throw new Error("Failed to update community icon");
  }
}

export async function deleteModerator({
  modId,
  communityId,
}: {
  modId: string;
  communityId: string;
}) {
  const res = await api.moderators.community[":communityId"][":userId"].$delete(
    {
      param: { communityId, userId: modId },
    }
  );
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { error: error };
    throw new Error("Failed to delete moderator");
  }
}

export async function createModerator({
  communityId,
  userId,
}: {
  communityId: string;
  userId: string;
}) {
  const res = await api.moderators.community[":communityId"][":userId"].$post({
    param: { communityId, userId },
  });
  if (!res.ok) {
    const error = handleRateLimitError(res);
    if (error) return { error: error };
    throw new Error("Failed to create moderator");
  }
}
