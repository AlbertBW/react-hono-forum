import { Hono } from "hono";
import { auth } from "../auth";
import { createMiddleware } from "hono/factory";
import type { AppVariables } from "../app";

export const authRoute = new Hono().on(["POST", "GET"], "/**", (c) => {
  return auth.handler(c.req.raw);
});

// This middleware is used to get the user from the session
// and set it in the context
export const getUser = createMiddleware<AppVariables>(async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      c.set("user", null);
      c.set("session", null);
      return next();
    }
    c.set("user", session.user);
    c.set("session", session.session);
    return next();
  } catch (error) {
    console.error(error);
    return c.json({ error: "Unauthorized" }, 401);
  }
});

// This middleware is used to require authentication for a route
export const requireAuth = createMiddleware<AppVariables>(async (c, next) => {
  const user = c.var.user;
  const session = c.var.session;
  if (!user || !session) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  return next();
});
