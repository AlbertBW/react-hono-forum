import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import { insertCommentSchema, comment } from "../db/schema";
import { db } from "../db";

export const commentsRoute = new Hono<AppVariables>().post(
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

    return c.json(newComment, 201);
  }
);
