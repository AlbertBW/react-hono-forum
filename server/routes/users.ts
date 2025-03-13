import { Hono } from "hono";
import { getUser, requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppVariables } from "../app";
import { eq, or } from "drizzle-orm";
import { db } from "../db";
import { user } from "../db/schema";

export const usersRoute = new Hono<AppVariables>()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        email: z.string().email().optional(),
        userId: z.string().optional(),
      })
    ),
    async (c) => {
      const { email, userId } = c.req.valid("query");

      if (!email && !userId) {
        return c.json({ error: "Email or userId is required" }, 400);
      }

      const userExists = await db.query.user.findFirst({
        where: or(
          email ? eq(user.email, email) : undefined,
          userId ? eq(user.id, userId) : undefined
        ),
        with: { moderator: { columns: { communityId: true } } },
        columns: {
          id: true,
          email: true,
          name: true,
          image: true,
          createdAt: true,
        },
      });

      if (!userExists) {
        return c.json({ error: "User not found" }, 404);
      }

      return c.json(userExists, 200);
    }
  )
  .get("/profile", requireAuth, async (c) => {
    const user = c.var.user;
    return c.json(user, 200);
  });
