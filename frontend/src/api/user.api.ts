import { api } from "@/lib/api";

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
