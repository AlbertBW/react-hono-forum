import { Hono } from "hono";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { type AppVariables } from "../app";
import { and, asc, count, desc, eq, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import {
  comment,
  commentVote,
  community,
  communityFollow,
  moderator,
  thread,
  threadVote,
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
  )
  .get(
    "/overview/:userId",
    zValidator("param", z.object({ userId: z.string() })),
    async (c) => {
      const { userId } = c.req.valid("param");

      const [userData, statsResult] = await Promise.all([
        db.query.user.findFirst({
          where: eq(user.id, userId),
          columns: {
            id: true,
            name: true,
            image: true,
            createdAt: true,
          },
          with: {
            moderator: {
              with: {
                community: { columns: { id: true, name: true, icon: true } },
              },
              limit: 10,
              orderBy: desc(moderator.createdAt),
            },
            comments: {
              with: {
                thread: {
                  columns: { id: true, title: true },
                  with: { community: { columns: { name: true } } },
                },
              },
              columns: { id: true, content: true, createdAt: true },
              orderBy: desc(comment.createdAt),
              limit: 3,
            },
            threads: {
              columns: { id: true, title: true, createdAt: true },
              with: { community: { columns: { name: true } } },
              orderBy: desc(thread.createdAt),
              limit: 3,
            },
          },
        }),
        db.execute<{
          threadUpvotes: number;
          threadDownvotes: number;
          commentUpvotes: number;
          commentDownvotes: number;
          postCount: number;
          commentCount: number;
          communitiesCreatedCount: number;
        }>(sql`
        SELECT 
          -- Thread upvotes
          CAST(COALESCE((
            SELECT SUM(CASE WHEN value > 0 THEN 1 ELSE 0 END)
            FROM ${threadVote}
            JOIN ${thread} ON ${threadVote.threadId} = ${thread.id}
            WHERE ${thread.userId} = ${userId}
          ), 0) AS INTEGER) as "threadUpvotes",
          
          -- Thread downvotes
          CAST(COALESCE((
            SELECT SUM(CASE WHEN value < 0 THEN 1 ELSE 0 END)
            FROM ${threadVote}
            JOIN ${thread} ON ${threadVote.threadId} = ${thread.id}
            WHERE ${thread.userId} = ${userId}
          ), 0) AS INTEGER) as "threadDownvotes",
          
          -- Comment upvotes
          CAST(COALESCE((
            SELECT SUM(CASE WHEN value > 0 THEN 1 ELSE 0 END)
            FROM ${commentVote}
            JOIN ${comment} ON ${commentVote.commentId} = ${comment.id}
            WHERE ${comment.userId} = ${userId}
          ), 0) AS INTEGER) as "commentUpvotes",
          
          -- Comment downvotes
          CAST(COALESCE((
            SELECT SUM(CASE WHEN value < 0 THEN 1 ELSE 0 END)
            FROM ${commentVote}
            JOIN ${comment} ON ${commentVote.commentId} = ${comment.id}
            WHERE ${comment.userId} = ${userId}
          ), 0) AS INTEGER) as "commentDownvotes",
          
          -- Post count
          CAST(COALESCE((
            SELECT COUNT(*) 
            FROM ${thread}
            WHERE ${thread.userId} = ${userId}
          ), 0) AS INTEGER) as "postCount",
          
          -- Comment count
          CAST(COALESCE((
            SELECT COUNT(*)
            FROM ${comment}
            WHERE ${comment.userId} = ${userId}
          ), 0) AS INTEGER) as "commentCount",
          
          -- Communities created count
          CAST(COALESCE((
            SELECT COUNT(*)
            FROM ${community}
            WHERE ${community.ownerId} = ${userId}
          ), 0) AS INTEGER) as "communitiesCreatedCount"
      `),
      ]);

      if (!userData) {
        return c.json({ error: "User not found" }, 404);
      }

      // Extract all values from the result
      const {
        threadUpvotes,
        threadDownvotes,
        commentUpvotes,
        commentDownvotes,
        postCount,
        commentCount,
        communitiesCreatedCount,
      } = statsResult.rows[0] || {
        threadUpvotes: 0,
        threadDownvotes: 0,
        commentUpvotes: 0,
        commentDownvotes: 0,
        postCount: 0,
        commentCount: 0,
        communitiesCreatedCount: 0,
      };

      // XP formula:
      // Thread creation: 5 XP each
      // Comment creation: 1 XP each
      // Community creation: 10 XP each
      // Upvotes received: 2 XP each
      // Downvotes received: -1 XP each
      // Moderator status: 15 XP per community
      const XP =
        postCount * 5 +
        commentCount * 1 +
        communitiesCreatedCount * 10 +
        (threadUpvotes + commentUpvotes) * 2 -
        (threadDownvotes + commentDownvotes) * 1 +
        (userData?.moderator?.length || 0) * 15;

      const endTime = performance.now();

      return c.json(
        {
          user: userData,
          stats: {
            postCount,
            commentCount,
            communitiesCreatedCount,
            XP: Math.max(0, XP),
            threadUpvotes: threadUpvotes,
            commentUpvotes: commentUpvotes,
            totalUpvotes: threadUpvotes + commentUpvotes,
            totalDownvotes: threadDownvotes + commentDownvotes,
          },
        },
        200
      );
    }
  );
