import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import {
  insertCommentSchema,
  comment,
  commentVote,
  user,
  commentIdSchema,
  voteSchema,
} from "../db/schema";
import { db } from "../db";
import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { z } from "zod";

export const commentsRoute = new Hono<AppVariables>()
  .get(
    "/:threadId",
    zValidator("param", z.object({ threadId: z.string().uuid() })),
    zValidator(
      "query",
      z.object({
        parentId: z.string().uuid().optional(),
        cursor: z.coerce.date().optional(),
        limit: z.coerce.number().int().positive().default(30),
      })
    ),
    async (c) => {
      const currentUser = c.var.user!;
      const threadId = c.req.valid("param").threadId;
      const parentId = c.req.valid("query").parentId;
      const cursor = c.req.valid("query").cursor;
      const limit = c.req.valid("query").limit;

      const comments = await db
        .select({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          username: user.name,
          avatar: user.image,
          upvotes:
            sql<number>`CAST((SELECT COUNT(*) FROM ${commentVote} WHERE ${commentVote.commentId} = ${comment.id} AND ${commentVote.value} > 0) AS INTEGER)`.as(
              "upvotes"
            ),
          downvotes:
            sql<number>`CAST((SELECT COUNT(*) FROM ${commentVote} WHERE ${commentVote.commentId} = ${comment.id} AND ${commentVote.value} < 0) AS INTEGER)`.as(
              "downvotes"
            ),
          parentId: comment.parentId,
          childrenCount:
            sql<number>`(SELECT COUNT(*) FROM ${comment} c WHERE c.parent_id = ${comment.id})`.as(
              "childrenCount"
            ),
        })
        .from(comment)
        .where(
          and(
            eq(comment.threadId, threadId),
            parentId
              ? eq(comment.parentId, parentId)
              : isNull(comment.parentId),
            cursor ? lt(comment.createdAt, cursor) : undefined
          )
        )
        .leftJoin(commentVote, eq(commentVote.commentId, comment.id))
        .leftJoin(user, eq(user.id, comment.userId))
        .orderBy(desc(comment.createdAt))
        .limit(limit)
        .groupBy(
          comment.id,
          user.name,
          user.image,
          comment.content,
          comment.createdAt,
          comment.updatedAt
        );
      console.log(comments);
      const commentIdArray = comments.map((c) => c.id);

      let userVote: {
        value: number;
        commentId: string;
      }[] = [];

      if (currentUser) {
        const vote = await db.query.commentVote.findMany({
          where: (vote, { and, eq }) =>
            and(
              inArray(vote.commentId, commentIdArray),
              eq(vote.userId, currentUser.id)
            ),
          columns: {
            commentId: true,
            value: true,
          },
        });

        userVote = vote;
      }

      const commentsWithUserVotes = comments.map((comment) => {
        const vote = userVote.find((v) => v.commentId === comment.id);
        return {
          ...comment,
          userVote: vote?.value ?? null,
        };
      });

      return c.json(commentsWithUserVotes);
    }
  )
  .post(
    "/",
    requireAuth,
    zValidator("json", insertCommentSchema),
    async (c) => {
      const user = c.var.user!;
      const commentInput = c.req.valid("json");

      const [newComment] = await db
        .insert(comment)
        .values({ ...commentInput, userId: user.id })
        .returning();

      await db
        .insert(commentVote)
        .values({
          commentId: newComment.id,
          userId: user.id,
          value: 1,
        })
        .returning();

      return c.json(newComment, 201);
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

      const voteExists = await db.query.commentVote.findFirst({
        where: (vote, { and, eq }) =>
          and(eq(vote.commentId, id), eq(vote.userId, user.id)),
      });

      if (voteExists) {
        return c.json({ error: "Already voted" }, 400);
      }

      const [vote] = await db
        .insert(commentVote)
        .values({ commentId: id, userId: user.id, value })
        .returning();

      return c.json(vote, 201);
    }
  )
  .delete(
    "/:id/vote",
    requireAuth,
    zValidator("param", commentIdSchema),
    async (c) => {
      const user = c.var.user!;
      const id = c.req.valid("param").id;

      const existingVote = await db.query.commentVote.findFirst({
        where: (commentVote, { and, eq }) =>
          and(eq(commentVote.commentId, id), eq(commentVote.userId, user.id)),
      });

      if (!existingVote) {
        return c.json({ error: "Not voted" }, 400);
      }

      const [vote] = await db
        .delete(commentVote)
        .where(
          and(eq(commentVote.commentId, id), eq(commentVote.userId, user.id))
        )
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

      const voteExists = await db.query.commentVote.findFirst({
        where: (vote, { and, eq }) =>
          and(eq(vote.commentId, id), eq(vote.userId, user.id)),
      });

      if (!voteExists) {
        return c.json({ error: "Not voted" }, 400);
      }

      const [vote] = await db
        .update(commentVote)
        .set({ value })
        .where(
          and(eq(commentVote.commentId, id), eq(commentVote.userId, user.id))
        )
        .returning();

      c.status(200);
      return c.json(vote);
    }
  );
