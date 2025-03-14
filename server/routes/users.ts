import { Hono } from "hono";
import { getUser, requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppVariables } from "../app";
import { and, asc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  comment,
  community,
  communityFollow,
  moderator,
  thread,
  user,
} from "../db/schema";

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
  })
  .delete(
    "/",
    requireAuth,
    zValidator(
      "json",
      z.object({ reason: z.string().min(3).max(100).optional() })
    ),
    async (c) => {
      const currentUser = c.var.user!;
      const { reason } = c.req.valid("json");

      const deletedComments = await db
        .update(comment)
        .set({
          userId: null,
          updatedAt: new Date(),
        })
        .where(eq(comment.userId, currentUser.id))
        .returning();

      const deletedFollows = await db
        .delete(communityFollow)
        .where(eq(communityFollow.userId, currentUser.id))
        .returning();

      const ownedCommunities = await db.query.community.findMany({
        where: eq(community.ownerId, currentUser.id),
        columns: { id: true },
      });

      if (ownedCommunities.length > 0) {
        // get oldest mod from each community and set as owner
        const communityIds = ownedCommunities.map((c) => c.id);
        for (const communityId of communityIds) {
          const oldestMod = await db.query.moderator.findFirst({
            where: and(
              eq(moderator.communityId, communityId),
              ne(moderator.userId, currentUser.id)
            ),
            orderBy: asc(moderator.createdAt),
            columns: { userId: true },
          });

          const newOwner = await db
            .update(community)
            .set({ ownerId: oldestMod ? oldestMod.userId : null })
            .where(eq(community.id, communityId))
            .returning();
        }
      }

      const deletedThreads = await db
        .update(thread)
        .set({ userId: null, updatedAt: new Date() })
        .where(eq(thread.userId, currentUser.id))
        .returning();

      const deletedMods = await db
        .delete(moderator)
        .where(eq(moderator.userId, currentUser.id))
        .returning();

      const deleted = await db.delete(user).where(eq(user.id, currentUser.id));

      return c.json({ success: true }, 200);
    }
  );
