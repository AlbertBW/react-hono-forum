import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  comment,
  community,
  communityFollow,
  insertThreadSchema,
  thread,
  threadIdSchema,
  threadVote,
  user,
  voteSchema,
} from "../db/schema";
import { db } from "../db";
import {
  and,
  count,
  desc,
  eq,
  lt,
  sql,
  asc,
  inArray,
  countDistinct,
} from "drizzle-orm";
import { requireAuth } from "./auth";
import type { AppVariables } from "../app";

export type OrderBy = "newest" | "oldest" | "popular";

export const threadsRoute = new Hono<AppVariables>()
  .post("/", requireAuth, zValidator("json", insertThreadSchema), async (c) => {
    const userThread = c.req.valid("json");
    const user = c.var.user;

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [newThread] = await db
      .insert(thread)
      .values({ ...userThread, userId: user.id })
      .returning();

    await db.insert(threadVote).values({
      threadId: newThread.id,
      userId: user.id,
      value: 1,
    });

    c.status(201);
    return c.json(newThread);
  })
  .get(
    "/list",
    zValidator(
      "query",
      z.object({
        communityName: z.string().optional(),
        userId: z.string().optional(),
        orderBy: z.custom<OrderBy>().optional(),
        following: z.coerce.boolean().optional(),
        limit: z.coerce.number().int().positive().default(30),
        cursor: z.coerce.date().optional(),
      })
    ),
    async (c) => {
      const currentUser = c.var.user;
      const { communityName, userId, limit, cursor, orderBy, following } =
        c.req.valid("query");

      let followingIds: string[] | null = null;
      if (currentUser && following) {
        const communityFollows = await db.query.communityFollow.findMany({
          where: (follow, { eq }) => eq(follow.userId, currentUser.id),
          columns: { communityId: true },
        });

        followingIds = communityFollows.map((follow) => follow.communityId);
      }

      const unformattedThreads = await db.execute(sql`
        WITH vote_counts AS (
          SELECT 
            thread_id,
            SUM(CASE WHEN value > 0 THEN 1 ELSE 0 END) AS upvotes,
            SUM(CASE WHEN value < 0 THEN 1 ELSE 0 END) AS downvotes
          FROM ${threadVote}
          GROUP BY thread_id
        )
        SELECT
          t.id,
          t.title,
          t.created_at AS "createdAt",
          u.name AS "username",
          u.id AS "userId",
          COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0) AS "voteScore",
          ${
            currentUser
              ? sql`
            EXISTS (
              SELECT 1 FROM ${communityFollow} 
              WHERE ${communityFollow.userId} = ${currentUser.id} 
              AND ${communityFollow.communityId} = t.community_id
            )
          `
              : sql`FALSE`
          } AS "userFollow",
          CASE WHEN ${
            !communityName || communityName === "all"
          } THEN NULL ELSE u.image END AS "userAvatar",
          CASE WHEN ${
            !communityName || communityName === "all"
          } THEN c.icon ELSE NULL END AS "communityIcon",
          c.name AS "communityName",
          t.community_id AS "communityId",
          c.is_private AS "communityPrivate",
          COALESCE(vc.upvotes, 0) AS "upvotes",
          COALESCE(vc.downvotes, 0) AS "downvotes",
          COUNT(DISTINCT cm.id) AS "commentsCount"
        FROM ${thread} t
        INNER JOIN ${community} c ON t.community_id = c.id
        LEFT JOIN ${user} u ON t.user_id = u.id
        LEFT JOIN vote_counts vc ON t.id = vc.thread_id
        LEFT JOIN ${comment} cm ON cm.thread_id = t.id
        WHERE
          ${
            communityName && communityName !== "all"
              ? sql`LOWER(c.name) = LOWER(${communityName})`
              : sql`TRUE`
          }
          ${
            communityName && communityName === "all"
              ? sql`AND c.is_private = FALSE`
              : sql``
          }
          ${cursor ? sql`AND t.created_at < ${cursor}` : sql``}
          ${userId ? sql`AND t.user_id = ${userId}` : sql``}
          ${
            followingIds && followingIds.length > 0
              ? sql`AND c.id IN (${sql.join(followingIds)})`
              : sql``
          }
        GROUP BY
          t.id, t.title, t.created_at, u.name, u.id, u.image, c.name, c.icon, c.is_private, vc.upvotes, vc.downvotes
        ORDER BY
          ${
            orderBy === "popular"
              ? sql`(COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0)) DESC`
              : orderBy === "oldest"
              ? sql`t.created_at ASC`
              : sql`t.created_at DESC`
          }
        LIMIT ${limit}
      `);

      // Format the result to match your expected output
      const threads = unformattedThreads.map((row) => ({
        id: row.id as string,
        title: row.title as string,
        createdAt: new Date(row.createdAt as string),
        username: row.username as string,
        userId: row.userId as string,
        voteScore: Number(row.voteScore || 0),
        userFollow: row.userFollow === true,
        userAvatar: row.userAvatar as string,
        communityIcon: row.communityIcon as string,
        communityName: row.communityName as string,
        communityId: row.communityId as string,
        communityPrivate: row.communityPrivate === true,
        upvotes: Number(row.upvotes || 0),
        downvotes: Number(row.downvotes || 0),
        commentsCount: Number(row.commentsCount || 0),
      }));

      if (threads.length === 0) {
        return c.json([], 200);
      }

      if (
        communityName !== "all" &&
        threads[0].communityPrivate &&
        !threads[0].userFollow
      ) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      let threadsWithUserVotes = threads.map((thread) => {
        return { ...thread, userVote: null as number | null };
      });

      if (currentUser) {
        const threadsIds = threads.map((thread) => thread.id);
        const userVotes = await db.query.threadVote.findMany({
          where: (vote, { and, inArray }) =>
            and(
              inArray(vote.threadId, threadsIds),
              eq(vote.userId, currentUser.id)
            ),
        });

        threadsWithUserVotes = threads.map((thread) => {
          const userVote = userVotes.find(
            (vote) => vote.threadId === thread.id
          );
          return { ...thread, userVote: userVote?.value ?? null };
        });
      }

      return c.json(threadsWithUserVotes, 200);
    }
  )
  .get("/single/:id", zValidator("param", threadIdSchema), async (c) => {
    const { id } = c.req.valid("param");
    const currentUser = c.var.user;

    const [data] = await db
      .select({
        id: thread.id,
        title: thread.title,
        content: thread.content,
        createdAt: thread.createdAt,
        username: user.name,
        userId: user.id,
        communityName: community.name,
        upvotes:
          sql<number>`CAST((SELECT COUNT(*) FROM ${threadVote} WHERE ${threadVote.threadId} = ${thread.id} AND ${threadVote.value} > 0) AS INTEGER)`.as(
            "upvotes"
          ),
        downvotes:
          sql<number>`CAST((SELECT COUNT(*) FROM ${threadVote} WHERE ${threadVote.threadId} = ${thread.id} AND ${threadVote.value} < 0) AS INTEGER)`.as(
            "downvotes"
          ),
        commentsCount: count(comment.id),
      })
      .from(thread)
      .where(eq(thread.id, id))
      .leftJoin(user, eq(thread.userId, user.id))
      .leftJoin(community, eq(thread.communityId, community.id))
      .leftJoin(comment, eq(comment.threadId, thread.id))
      .groupBy(
        thread.id,
        thread.title,
        thread.content,
        thread.createdAt,
        user.name,
        user.id,
        community.name
      )
      .limit(1);

    if (!data) {
      return c.json({ error: "not found" }, 404);
    }

    let userVote = null as number | null;

    if (currentUser) {
      const vote = await db.query.threadVote.findFirst({
        where: (vote, { and, eq }) =>
          and(eq(vote.threadId, id), eq(vote.userId, currentUser.id)),
      });

      userVote = vote?.value ?? null;
    }

    return c.json({ ...data, userVote });
  })
  .delete(
    "/:id",
    requireAuth,
    zValidator("param", threadIdSchema),
    async (c) => {
      const user = c.var.user!;
      const id = z.string().uuid().parse(c.req.param("id"));

      const userThread = await db.query.thread.findFirst({
        where: (thread, { and, eq }) => eq(thread.id, id),
        with: { community: { with: { moderators: true } } },
      });

      if (userThread) {
        // User is a mod or the thread owner
        const authorisedUser =
          userThread?.community.moderators.some(
            (mod) => mod.userId === user.id
          ) || userThread?.userId === user.id;

        if (!authorisedUser) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const [deletedThread] = await db
          .delete(thread)
          .where(eq(thread.id, id))
          .returning();

        return c.json(deletedThread, 200);
      } else {
        return c.json({ error: "Not found" }, 404);
      }
    }
  )
  .post(
    "/:id/vote/:value",
    requireAuth,
    zValidator("param", voteSchema),
    async (c) => {
      const user = c.var.user!;
      const id = c.req.valid("param").id;
      const value = c.req.valid("param").value;

      const voteExists = await db.query.threadVote.findFirst({
        where: (vote, { and, eq }) =>
          and(eq(vote.threadId, id), eq(vote.userId, user.id)),
      });

      if (voteExists) {
        return c.json({ error: "Already voted" }, 400);
      }

      const [vote] = await db
        .insert(threadVote)
        .values({ threadId: id, userId: user.id, value })
        .returning();

      c.status(201);
      return c.json(vote);
    }
  )
  .delete(
    "/:id/vote",
    requireAuth,
    zValidator("param", threadIdSchema),
    async (c) => {
      const user = c.var.user!;
      const id = c.req.valid("param").id;

      const existingVote = await db.query.threadVote.findFirst({
        where: (vote, { and, eq }) =>
          and(eq(vote.threadId, id), eq(vote.userId, user.id)),
      });

      if (!existingVote) {
        return c.json({ error: "Not voted" }, 400);
      }

      const [vote] = await db
        .delete(threadVote)
        .where(and(eq(threadVote.threadId, id), eq(threadVote.userId, user.id)))
        .returning();

      c.status(200);
      return c.json(vote);
    }
  )
  .put(
    "/:id/vote/:value",
    requireAuth,
    zValidator("param", voteSchema),
    async (c) => {
      const user = c.var.user!;
      const id = c.req.valid("param").id;
      const value = c.req.valid("param").value;

      const voteExists = await db.query.threadVote.findFirst({
        where: (vote, { and, eq }) =>
          and(eq(vote.threadId, id), eq(vote.userId, user.id)),
      });

      if (!voteExists) {
        return c.json({ error: "Not voted" }, 400);
      }

      const [vote] = await db
        .update(threadVote)
        .set({ value })
        .where(and(eq(threadVote.threadId, id), eq(threadVote.userId, user.id)))
        .returning();

      c.status(200);
      return c.json(vote);
    }
  )
  .get(
    "/voted",
    zValidator(
      "query",
      z.object({
        userId: z.string(),
        voted: z.coerce.number().min(-1).max(1),
        limit: z.coerce.number().int().positive().default(30),
        cursor: z.coerce.date().optional(),
      })
    ),
    async (c) => {
      const { userId, voted, limit, cursor } = c.req.valid("query");

      const data = await db
        .select({
          threadId: threadVote.threadId,
          votedAt: threadVote.createdAt,
          title: thread.title,
          threadCreatedAt: thread.createdAt,
          communityName: community.name,
          communityId: thread.communityId,
          communityIcon: community.icon,
        })
        .from(threadVote)
        .where(
          and(
            eq(threadVote.userId, userId),
            eq(threadVote.value, voted),
            cursor ? lt(threadVote.createdAt, cursor) : undefined
          )
        )
        .innerJoin(thread, eq(thread.id, threadVote.threadId))
        .innerJoin(community, eq(community.id, thread.communityId))
        .orderBy(desc(threadVote.createdAt))
        .limit(limit);

      return c.json(data, 200);
    }
  );
