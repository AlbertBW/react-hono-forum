import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  community,
  insertPostSchema,
  post,
  postIdSchema,
  postVote,
  user,
} from "../db/schema";
import { db } from "../db";
import { and, desc, eq, sql } from "drizzle-orm";
import { requireAuth } from "./auth";
import type { AppVariables } from "../app";

export const postsRoute = new Hono<AppVariables>()
  .get("/", async (c) => {
    const user = c.var.user;
    const posts = await db.query.post.findMany({
      orderBy: desc(post.createdAt),
    });

    return c.json({ posts: posts });
  })
  .post("/", requireAuth, zValidator("json", insertPostSchema), async (c) => {
    const userPost = c.req.valid("json");
    const user = c.var.user;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const [newPost] = await db
      .insert(post)
      .values({ ...userPost, userId: user.id })
      .returning();

    await db.insert(postVote).values({
      postId: newPost.id,
      userId: user.id,
      value: 1,
    });

    c.status(201);
    return c.json(newPost);
  })
  .get("/:id", zValidator("param", postIdSchema), async (c) => {
    const { id } = c.req.valid("param");

    const [data] = await db
      .select({
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        username: user.name,
        communityName: community.name,
        upvotes:
          sql<number>`(SELECT COUNT(*) FROM ${postVote} WHERE ${postVote.postId} = ${post.id} AND ${postVote.value} > 0)`.as(
            "upvotes"
          ),
        downvotes:
          sql<number>`(SELECT COUNT(*) FROM ${postVote} WHERE ${postVote.postId} = ${post.id} AND ${postVote.value} < 0)`.as(
            "downvotes"
          ),
        userVote: postVote.value,
      })
      .from(post)
      .where(eq(post.id, id))
      .leftJoin(user, eq(post.userId, user.id))
      .leftJoin(community, eq(post.communityId, community.id))
      .leftJoin(postVote, eq(postVote.postId, post.id))
      .groupBy(
        post.id,
        post.title,
        post.content,
        post.createdAt,
        user.name,
        community.name,
        postVote.value
      )
      .limit(1);

    if (!data) {
      return c.json({ error: "not found" }, 404);
    }

    return c.json(data);
  })
  .delete("/:id", requireAuth, zValidator("param", postIdSchema), async (c) => {
    const user = c.var.user;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = z.string().uuid().parse(c.req.param("id"));

    const userPost = await db.query.post.findFirst({
      where: (post, { and, eq }) =>
        and(eq(post.id, id), eq(post.userId, user.id)),
    });

    if (!userPost) {
      return c.json({ error: "not found" }, 404);
    }

    const [deletedPost] = await db
      .delete(post)
      .where(eq(post.id, id))
      .returning();

    return c.json({ post: deletedPost });
  })
  .post(
    "/:id/vote/:value",
    requireAuth,
    zValidator(
      "param",
      z.object({
        id: z.string().uuid(),
        value: z.coerce.number().min(-1).max(1),
      })
    ),
    async (c) => {
      const user = c.var.user;
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.valid("param").id;
      const value = c.req.valid("param").value;

      const voteExists = await db.query.postVote.findFirst({
        where: (vote, { and, eq }) =>
          and(eq(vote.postId, id), eq(vote.userId, user.id)),
      });

      if (voteExists) {
        return c.json({ error: "Already voted" }, 400);
      }

      const [vote] = await db
        .insert(postVote)
        .values({ postId: id, userId: user.id, value })
        .returning();

      c.status(201);
      return c.json(vote);
    }
  )
  .delete(
    "/:id/vote",
    requireAuth,
    zValidator("param", postIdSchema),
    async (c) => {
      const user = c.var.user;
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.valid("param").id;

      const existingVote = await db.query.postVote.findFirst({
        where: (vote, { and, eq }) =>
          and(eq(vote.postId, id), eq(vote.userId, user.id)),
      });

      if (!existingVote) {
        return c.json({ error: "Not voted" }, 400);
      }

      const [vote] = await db
        .delete(postVote)
        .where(and(eq(postVote.postId, id), eq(postVote.userId, user.id)))
        .returning();

      c.status(200);
      return c.json(vote);
    }
  )
  .put(
    "/:id/vote/:value",
    requireAuth,
    zValidator(
      "param",
      z.object({
        id: z.string().uuid(),
        value: z.coerce.number().min(-1).max(1),
      })
    ),
    async (c) => {
      const user = c.var.user;
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const id = c.req.valid("param").id;
      const value = c.req.valid("param").value;

      const voteExists = await db.query.postVote.findFirst({
        where: (vote, { and, eq }) =>
          and(eq(vote.postId, id), eq(vote.userId, user.id)),
      });

      if (!voteExists) {
        return c.json({ error: "Not voted" }, 400);
      }

      const [vote] = await db
        .update(postVote)
        .set({ value })
        .where(and(eq(postVote.postId, id), eq(postVote.userId, user.id)))
        .returning();

      c.status(200);
      return c.json(vote);
    }
  );
