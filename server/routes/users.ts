import { Hono } from "hono";
import { getUser, requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppVariables } from "../app";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";

export const usersRoute = new Hono<AppVariables>()
  .get(
    "/",
    requireAuth,
    zValidator(
      "query",
      z.object({
        email: z.string().email(),
      })
    ),
    async (c) => {
      const email = c.req.valid("query").email;
      const userExists = await db.query.user.findFirst({
        where: eq(user.email, email),
        with: { moderator: { columns: { communityId: true } } },
        columns: {
          id: true,
          email: true,
          name: true,
          image: true,
        },
      });

      if (!userExists) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json(userExists, 200);
    }
  )
  .get("/profile", getUser, (c) => {
    const user = c.var.user;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    return c.json({ user: user });
  });
