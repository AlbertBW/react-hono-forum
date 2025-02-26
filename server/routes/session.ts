import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";

export const sessionRoute = new Hono<AppVariables>().get(
  "/",
  requireAuth,
  (c) => {
    const session = c.var.session;
    const user = c.var.user;

    return c.json({
      session,
      user,
    });
  }
);
