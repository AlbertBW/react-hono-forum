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
