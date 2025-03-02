import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import { insertCommentSchema, comment, commentVote, user } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export const commentsRoute = new Hono<AppVariables>()
  .get("/:threadId", async (c) => {
    const threadId = c.req.param("threadId");

    const comments = await db
      .select({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        username: user.name,
        avatar: user.image,
      })
      .from(comment)
      .where(eq(comment.threadId, threadId))
      .leftJoin(commentVote, eq(commentVote.commentId, comment.id))
      .leftJoin(user, eq(user.id, comment.userId))
      .groupBy(
        comment.id,
        user.name,
        user.image,
        comment.content,
        comment.createdAt
      );

    return c.json(comments);
  })
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
  );
