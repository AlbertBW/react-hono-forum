import { api } from "@/lib/api";
import { queryOptions } from "@tanstack/react-query";

export type UserWithModerator = NonNullable<
  Awaited<ReturnType<typeof findUserByEmail>>["data"]
>;
export async function findUserByEmail(email: string) {
  const res = await api.users.$get({ query: { email } });
  if (!res.ok) {
    if (res.status === 404) {
      return { data: null, error: "User not found" };
    }
    throw new Error("Failed to find user");
  }
  const data = await res.json();
  return { data: data, error: null };
}

export type User = NonNullable<Awaited<ReturnType<typeof getUserById>>>;
export async function getUserById(userId: string) {
  const res = await api.users.$get({ query: { userId } });
  if (!res.ok) {
    throw new Error("Failed to get user");
  }
  const data = await res.json();
  return data;
}

export const getUserByIdQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["get-user", userId],
    queryFn: () => getUserById(userId),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

export async function deleteAccount(reason?: string) {
  const res = await api.users.$delete({ json: { reason } });
  if (!res.ok) {
    throw new Error("Failed to delete account");
  }
  return;
}

export async function getUserOverview(userId: string) {
  const res = await api.users.overview[":userId"].$get({ param: { userId } });
  if (!res.ok) {
    throw new Error("Failed to get user overview");
  }
  const data = await res.json();
  return data;
}

export const getUserOverviewQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["get-user-overview", userId],
    queryFn: () => getUserOverview(userId),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
