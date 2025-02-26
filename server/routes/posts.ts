import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { insertPostSchema, postIdSchema } from "../shared-types";
import { post } from "../db/schema";
import { db } from "../db";
import { desc, eq } from "drizzle-orm";
import { requireAuth } from "./auth";
import type { AppVariables } from "../app";

const postSchema = z.object({
  id: z.number().int().positive().min(1),
  title: z.string().min(3).max(100),
  content: z.string().min(3).max(1000),
});

export const postsRoute = new Hono<AppVariables>()
  .get("/", async (c) => {
    const user = c.var.user;
    console.log(user);
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

    c.status(201);
    return c.json(newPost);
  })
  .get("/:id", zValidator("param", postIdSchema), async (c) => {
    const { id } = c.req.valid("param");

    const post = await db.query.post.findFirst({
      where: (post, { eq }) => eq(post.id, id),
    });

    if (!post) {
      return c.notFound();
    }

    return c.json({ post: null });
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
      return c.notFound();
    }

    const [deletedPost] = await db
      .delete(post)
      .where(eq(post.id, id))
      .returning();

    return c.json({ post: deletedPost });
  });
