import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import {
  community,
  communityFollow,
  insertCommunitySchema,
  post,
  postVote,
  user,
} from "../db/schema";
import { db } from "../db";
import { and, count, countDistinct, desc, eq, sql, sum } from "drizzle-orm";

export const communitiesRoute = new Hono<AppVariables>()
  .get("/", async (c) => {
    const communities = await db
      .select({
        id: community.id,
        name: community.name,
        description: community.description,
        icon: community.icon,
        isPrivate: community.isPrivate,
        postCount: countDistinct(post.id),
        userCount: countDistinct(communityFollow.userId),
      })
      .from(community)
      .leftJoin(post, eq(post.communityId, community.id))
      .leftJoin(communityFollow, eq(communityFollow.communityId, community.id))
      .groupBy(
        community.id,
        community.name,
        community.description,
        community.icon,
        community.isPrivate
      );

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

    const [communityData] = await db
      .select({
        id: community.id,
        name: community.name,
        description: community.description,
        icon: community.icon,
        isPrivate: community.isPrivate,
        createdAt: community.createdAt,
        postCount: countDistinct(post.id),
        userCount: countDistinct(communityFollow.userId),
      })
      .from(community)
      .where(sql`lower(${community.name}) = lower(${name})`)
      .leftJoin(post, eq(post.communityId, community.id))
      .leftJoin(communityFollow, eq(communityFollow.communityId, community.id))
      .groupBy(
        community.id,
        community.name,
        community.description,
        community.icon,
        community.isPrivate
      );

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
      .where(eq(post.communityId, communityDataWithFollow.id))
      .leftJoin(user, eq(post.userId, user.id))
      .leftJoin(community, eq(post.communityId, community.id))
      .leftJoin(postVote, eq(postVote.postId, post.id))
      .orderBy(desc(post.createdAt))
      .groupBy(
        post.id,
        post.title,
        post.content,
        post.createdAt,
        user.name,
        community.name,
        postVote.value
      );

    return c.json({ community: communityDataWithFollow, posts });
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
