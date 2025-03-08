import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import {
  community,
  communityFollow,
  insertCommunitySchema,
  thread,
} from "../db/schema";
import { db } from "../db";
import { lt, and, countDistinct, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

export const communitiesRoute = new Hono<AppVariables>()
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        limit: z.coerce.number().int().positive().default(30),
        search: z.coerce.string().optional(),
        cursor: z.coerce.date().optional(),
      })
    ),
    async (c) => {
      const user = c.var.user;
      const limit = c.req.valid("query").limit;
      const search = c.req.valid("query").search;
      const cursor = c.req.valid("query").cursor;

      const communities = await db
        .select({
          id: community.id,
          name: community.name,
          userFollow: user
            ? sql<boolean>`
              EXISTS (
                SELECT 1 FROM ${communityFollow} 
                WHERE ${communityFollow.userId} = ${user.id} 
                AND ${communityFollow.communityId} = ${community.id}
              )
            `.as("userFollow")
            : sql<boolean>`FALSE`.as("userFollow"),
          description: community.description,
          icon: community.icon,
          threadCount: countDistinct(thread.id),
          userCount: countDistinct(communityFollow.userId),
          createdAt: community.createdAt,
        })
        .from(community)
        .leftJoin(thread, eq(thread.communityId, community.id))
        .leftJoin(
          communityFollow,
          eq(communityFollow.communityId, community.id)
        )
        .where(
          and(
            cursor ? lt(community.createdAt, cursor) : undefined,
            eq(community.isPrivate, false)
          )
        )
        .orderBy(
          search === "new"
            ? desc(community.createdAt)
            : search === "popular"
            ? desc(countDistinct(thread.id))
            : desc(community.createdAt)
        )
        .limit(limit)
        .groupBy(
          community.id,
          community.name,
          community.description,
          community.icon,
          community.isPrivate
        );

      return c.json(communities);
    }
  )
  .post(
    "/",
    requireAuth,
    zValidator("json", insertCommunitySchema),
    async (c) => {
      const communityThread = c.req.valid("json");
      const user = c.var.user!;

      const [newCommunity] = await db
        .insert(community)
        .values({
          ...communityThread,
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
        threadCount: countDistinct(thread.id),
        userCount: countDistinct(communityFollow.userId),
      })
      .from(community)
      .where(sql`lower(${community.name}) = lower(${name})`)
      .leftJoin(thread, eq(thread.communityId, community.id))
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
          where: and(
            eq(communityFollow.userId, session.userId),
            eq(communityFollow.communityId, communityData.id)
          ),
        })
      : undefined;

    let isFollowing = null as boolean | null;
    if (follow) {
      isFollowing = follow.communityId === communityData.id;
    }

    return c.json({
      ...communityData,
      isFollowing,
    });
  })
  .post("/follow/:id", requireAuth, async (c) => {
    const user = c.var.user!;
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
    const user = c.var.user!;
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
