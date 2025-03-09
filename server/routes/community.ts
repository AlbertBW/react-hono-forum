import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import {
  community,
  communityFollow,
  insertCommunitySchema,
  moderator,
  thread,
  user,
} from "../db/schema";
import { db } from "../db";
import { lt, and, countDistinct, desc, eq, sql, exists } from "drizzle-orm";
import { z } from "zod";

type CommunityMod = {
  userId: string;
  username: string;
  avatar: string;
};

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
            search !== "following" ? eq(community.isPrivate, false) : undefined,
            user && search === "following"
              ? eq(communityFollow.userId, user.id)
              : undefined
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

      const result = await db.transaction(async (tx) => {
        const [newCommunity] = await tx
          .insert(community)
          .values({
            ...communityThread,
          })
          .returning();

        const [mod] = await tx
          .insert(moderator)
          .values({
            userId: user.id,
            communityId: newCommunity.id,
          })
          .returning();

        const [follow] = await tx
          .insert(communityFollow)
          .values({
            userId: user.id,
            communityId: newCommunity.id,
          })
          .returning();

        return { newCommunity, mod, follow };
      });

      const newCommunity = result.newCommunity;

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
        banner: community.banner,
        isPrivate: community.isPrivate,
        createdAt: community.createdAt,
        threadCount: countDistinct(thread.id),
        userCount: countDistinct(communityFollow.userId),
        moderators: sql<CommunityMod[]>`COALESCE(
          json_agg(
            json_build_object(
              'userId', ${user.id}, 
              'username', ${user.name}, 
              'avatar', ${user.image}
            )
          ) FILTER (WHERE ${user.id} IS NOT NULL),
          '[]'
        )`,
      })
      .from(community)
      .where(sql`lower(${community.name}) = lower(${name})`)
      .leftJoin(thread, eq(thread.communityId, community.id))
      .leftJoin(communityFollow, eq(communityFollow.communityId, community.id))
      .leftJoin(moderator, eq(moderator.communityId, community.id))
      .leftJoin(user, eq(user.id, moderator.userId))
      .groupBy(
        community.id,
        community.name,
        community.description,
        community.icon,
        community.banner,
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
