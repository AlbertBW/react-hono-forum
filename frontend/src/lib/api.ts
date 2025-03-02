import { hc } from "hono/client";
import type { ApiRoutes } from "../../../server/app";
import { queryOptions } from "@tanstack/react-query";
import {
  CreatePost,
  PostId,
  CreateCommunity,
  CommunityId,
} from "../../../server/db/schema";

const client = hc<ApiRoutes>("/");

export const api = client.api;

async function getCurrentUser() {
  const res = await api.users.profile.$get();
  if (!res.ok) {
    throw new Error("Failed to fetch user");
  }
  const data = await res.json();
  return data;
}

export const userQueryOptions = queryOptions({
  queryKey: ["get-current-user"],
  queryFn: getCurrentUser,
  staleTime: Infinity,
});

export async function getAllPosts() {
  const res = await api.posts.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }
  const data = await res.json();
  return data;
}

export const getAllPostsQueryOptions = queryOptions({
  queryKey: ["get-all-posts"],
  queryFn: getAllPosts,
  staleTime: 1000 * 60 * 5,
});

export async function createPost({ value }: { value: CreatePost }) {
  const res = await api.posts.$post({ json: value });
  if (!res.ok) {
    throw new Error("Failed to create post");
  }

  const newPost = await res.json();
  return newPost;
}

export async function getAllCommunities() {
  const res = await api.communities.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch communities");
  }
  const data = await res.json();
  return data;
}

export async function getPostById(id: PostId) {
  const res = await api.posts.single[":id"].$get({ param: { id } });
  if (!res.ok) {
    throw new Error("Failed to fetch post");
  }
  const data = await res.json();
  return data;
}

export const getPostQueryOptions = (id: PostId) =>
  queryOptions({
    queryKey: ["get-post", id],
    queryFn: () => getPostById(id),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

export type PostCard = Awaited<
  ReturnType<typeof getPostsByCommunityName>
>[number];
export async function getPostsByCommunityName(communityName: string) {
  const res = await api.posts.community[":name"].$get({
    param: { name: communityName },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch posts");
  }
  const data = await res.json();
  return data;
}

export const getPostsQueryOptions = (communityName: string) =>
  queryOptions({
    queryKey: ["get-posts", communityName],
    queryFn: () => getPostsByCommunityName(communityName),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

export const getAllCommunitiesQueryOptions = queryOptions({
  queryKey: ["get-all-communities"],
  queryFn: getAllCommunities,
  staleTime: 1000 * 60 * 5,
});

export type Community = Awaited<ReturnType<typeof getCommunityByName>>;
export async function getCommunityByName(name: string) {
  const res = await api.communities[":name"].$get({ param: { name } });
  console.log(res.status);
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

export const loadingCreatePostQueryOptions = queryOptions<{
  post?: CreatePost;
}>({
  queryKey: ["loading-create-post"],
  queryFn: async () => {
    return {};
  },
  staleTime: Infinity,
});

export async function deletePost(id: PostId) {
  const res = await api.posts[":id"].$delete({ param: { id } });
  if (!res.ok) {
    throw new Error("Failed to delete post");
  }
}

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

export async function createVote(id: PostId, value: number) {
  const res = await api.posts[":id"].vote[":value"].$post({
    param: { id, value: value.toString() },
  });

  if (!res.ok) {
    throw new Error("Failed to vote");
  }

  const data = await res.json();
  return data;
}

export async function deleteVote(id: PostId) {
  const res = await api.posts[":id"].vote.$delete({ param: { id } });

  if (!res.ok) {
    throw new Error("Failed to delete vote");
  }

  const data = await res.json();
  return data;
}

export async function updateVote(id: PostId, value: number) {
  console.log("create vote", id, value);
  const res = await api.posts[":id"].vote[":value"].$put({
    param: { id, value: value.toString() },
  });

  if (!res.ok) {
    throw new Error("Failed to update vote");
  }

  const data = await res.json();
  return data;
}

export async function createComment(
  postId: PostId,
  content: string,
  parentId?: string
) {
  const res = await api.comments.$post({
    json: {
      postId,
      content,
      parentId,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to create comment");
  }

  const data = await res.json();
  return data;
}
