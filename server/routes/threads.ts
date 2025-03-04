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
import { and, count, desc, eq, inArray, lt, sql } from "drizzle-orm";
import { requireAuth } from "./auth";
import type { AppVariables } from "../app";

export const threadsRoute = new Hono<AppVariables>()
  .get("/", async (c) => {
    const user = c.var.user;
    const threads = await db.query.thread.findMany({
      orderBy: desc(thread.createdAt),
    });

    return c.json({ threads: threads });
  })
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
    "/community/:name",
    zValidator("param", z.object({ name: z.string() })),
    zValidator(
      "query",
      z.object({
        limit: z.coerce.number().int().positive().default(30),
        cursor: z.coerce.date().optional(),
      })
    ),
    async (c) => {
      const communityName = c.req.param("name");
      const currentUser = c.var.user;
      const cursor = c.req.valid("query").cursor;
      const limit = c.req.valid("query").limit;

      const threads = await db
        .select({
          id: thread.id,
          title: thread.title,
          createdAt: thread.createdAt,
          username: user.name,
          communityName: community.name,
          communityId: thread.communityId,
          communityPrivate: community.isPrivate,
          upvotes:
            sql<number>`(SELECT COUNT(*) FROM ${threadVote} WHERE ${threadVote.threadId} = ${thread.id} AND ${threadVote.value} > 0)`.as(
              "upvotes"
            ),
          downvotes:
            sql<number>`(SELECT COUNT(*) FROM ${threadVote} WHERE ${threadVote.threadId} = ${thread.id} AND ${threadVote.value} < 0)`.as(
              "downvotes"
            ),
          commentsCount: count(comment.id),
        })
        .from(thread)
        .innerJoin(community, eq(thread.communityId, community.id))
        .where(
          and(
            sql`lower(${community.name}) = lower(${communityName})`,
            cursor ? lt(thread.createdAt, cursor) : undefined
          )
        )
        .leftJoin(user, eq(thread.userId, user.id))
        .leftJoin(threadVote, eq(threadVote.threadId, thread.id))
        .leftJoin(comment, eq(comment.threadId, thread.id))
        .orderBy(desc(thread.createdAt))
        .limit(limit)
        .groupBy(
          thread.id,
          thread.title,
          thread.createdAt,
          user.name,
          community.name,
          community.isPrivate,
          threadVote.value
        );

      if (threads.length === 0) {
        return c.json([], 200);
      }

      let userFollowing = null as boolean | null;

      if (currentUser) {
        const following = await db.query.communityFollow.findFirst({
          where: (follow, { and, eq }) =>
            and(
              eq(follow.userId, currentUser.id),
              eq(follow.communityId, threads[0].communityId)
            ),
        });

        userFollowing = following ? true : false;
      }

      if (threads[0].communityPrivate && !userFollowing) {
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
        communityName: community.name,
        upvotes:
          sql<number>`(SELECT COUNT(*) FROM ${threadVote} WHERE ${threadVote.threadId} = ${thread.id} AND ${threadVote.value} > 0)`.as(
            "upvotes"
          ),
        downvotes:
          sql<number>`(SELECT COUNT(*) FROM ${threadVote} WHERE ${threadVote.threadId} = ${thread.id} AND ${threadVote.value} < 0)`.as(
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
        where: (thread, { and, eq }) =>
          and(eq(thread.id, id), eq(thread.userId, user.id)),
      });

      if (!userThread) {
        return c.json({ error: "not found" }, 404);
      }

      const [deletedThread] = await db
        .delete(thread)
        .where(eq(thread.id, id))
        .returning();

      return c.json({ thread: deletedThread });
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
  );
