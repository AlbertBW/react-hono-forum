import { hc } from "hono/client";
import type { ApiRoutes } from "../../../server/app";
import { queryOptions } from "@tanstack/react-query";
import { PostId, type CreatePost } from "../../../server/shared-types";

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
