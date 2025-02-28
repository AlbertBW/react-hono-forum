import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import { insertCommunitySchema } from "../shared-types";
import { community, post, user } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { username } from "better-auth/plugins";

export const communitiesRoute = new Hono<AppVariables>()
  .get("/", async (c) => {
    const communities = await db.query.community.findMany();
    return c.json(communities);
  })
  .post(
    "/",
    requireAuth,
    zValidator("json", insertCommunitySchema),
    async (c) => {
      const communityPost = c.req.valid("json");
      const user = c.var.user;
      if (!user) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [newCommunity] = await db
        .insert(community)
        .values({
          ...communityPost,
        })
        .returning();

      c.status(201);
      return c.json(newCommunity);
    }
  )
  .get("/:name", async (c) => {
    const name = c.req.param("name");
    const session = c.var.session;

    const communityData = await db.query.community.findFirst({
      where: eq(community.name, name),
      columns: {
        id: true,
        name: true,
        description: true,
        icon: true,
        isPrivate: true,
        createdAt: true,
      },
    });

    if (!communityData) {
      return c.json({ error: "not found" }, 404);
    }

    if (communityData.isPrivate) {
      return c.json({ communityData, postsData: [] });
    }

    const posts = await db
      .select({ post, user })
      .from(post)
      .where(eq(post.communityId, communityData.id))
      .leftJoin(user, eq(post.userId, user.id));

    const postsData = posts.map((p) => ({
      id: p.post.id,
      title: p.post.title,
      content: p.post.content,
      createdAt: p.post.createdAt,
      username: p.user?.name,
      communityName: communityData.name,
    }));

    return c.json({ communityData, postsData });
  })
  .delete("/:id", requireAuth, async (c) => {
    return c.json({ community: null });
  });
