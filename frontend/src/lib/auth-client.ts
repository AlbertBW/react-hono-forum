import { createAuthClient } from "better-auth/react";

export const { signIn, signOut, signUp, useSession } = createAuthClient({
  baseURL: import.meta.env.VITE_HOST_NAME,
});
