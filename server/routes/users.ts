import { Hono } from "hono";
import { getUser } from "./auth";

export const usersRoute = new Hono()
  .get("/", (c) => {
    return c.json({ users: [] });
  })
  .get("/profile", getUser, (c) => {
    const user = c.var.user;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    return c.json({ user: user });
  });
