import { hc } from "hono/client";
import type { ApiRoutes } from "../../../server/app";
import { queryOptions } from "@tanstack/react-query";
import { CreateThread } from "../../../server/db/schema";

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

export const loadingCreateThreadQueryOptions = queryOptions<{
  thread?: CreateThread;
}>({
  queryKey: ["loading-create-thread"],
  queryFn: async () => {
    return {};
  },
  staleTime: Infinity,
});
