import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import { insertCommunitySchema } from "../shared-types";
import { community, communityFollow, post, user } from "../db/schema";
import { db } from "../db";
import { and, eq, sql } from "drizzle-orm";

export const communitiesRoute = new Hono<AppVariables>()
  .get("/", async (c) => {
    const communities = await db.query.community.findMany({
      extras: {
        postCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${post} p 
          WHERE p.community_id = ${community.id})`.as("postCount"),
        userCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${communityFollow} u
          WHERE u.community_id = ${community.id})`.as("userCount"),
      },
    });

    console.log(communities);
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
      extras: {
        postCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${post} p 
          WHERE p.community_id = ${community.id})`.as("postCount"),
        userCount: sql<number>`(
          SELECT COUNT(*)
          FROM ${communityFollow} u
          WHERE u.community_id = ${community.id})`.as("userCount"),
      },
    });

    if (!communityData) {
      return c.json({ error: "not found" }, 404);
    }

    const follow = session
      ? await db.query.communityFollow.findFirst({
          where: eq(communityFollow.userId, session.userId),
        })
      : undefined;

    let isFollowing = false;
    if (follow) {
      isFollowing = follow.communityId === communityData.id;
    }

    const communityDataWithFollow = {
      ...communityData,
      isFollowing,
    };

    if (communityDataWithFollow.isPrivate && !isFollowing) {
      return c.json({ community: communityDataWithFollow, posts: [] });
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

    return c.json({ community: communityDataWithFollow, posts: postsData });
  })
  .post("/follow/:id", requireAuth, async (c) => {
    const user = c.var.user;

    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const id = c.req.param("id");

    const communityExists = await db.query.community.findFirst({
      where: eq(community.id, id),
    });

    if (!communityExists) {
      return c.json({ error: "Community not found" }, 404);
    }

    const [follow] = await db
      .insert(communityFollow)
      .values({
        userId: user.id,
        communityId: id,
      })
      .returning();

    return c.json(follow);
  })
  .delete("/follow/:id", requireAuth, async (c) => {
    const user = c.var.user;
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    const id = c.req.param("id");
    const follow = await db.query.communityFollow.findFirst({
      where: and(
        eq(communityFollow.userId, user.id),
        eq(communityFollow.communityId, id)
      ),
    });
    if (!follow) {
      return c.json({ error: "Not following community" }, 404);
    }
    const [deleted] = await db
      .delete(communityFollow)
      .where(
        and(
          eq(communityFollow.userId, user.id),
          eq(communityFollow.communityId, id)
        )
      )
      .returning();
    return c.json(deleted);
  });
