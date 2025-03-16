import { Hono } from "hono";
import type { AppVariables } from "../app";
import { requireAuth } from "./auth";
import { zValidator } from "@hono/zod-validator";
import {
  community,
  communityFollow,
  descriptionSchema,
  insertCommunitySchema,
  moderator,
  thread,
  user,
} from "../db/schema";
import { db } from "../db";
import { lt, and, countDistinct, desc, eq, sql } from "drizzle-orm";
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
        cursor: z.string().optional(),
      })
    ),
    async (c) => {
      const user = c.var.user;
      const limit = c.req.valid("query").limit;
      const search = c.req.valid("query").search;
      const cursor = c.req.valid("query").cursor;

      const isPopularSort = search === "popular";
      let dateTimeCursor: Date | undefined;
      let popularCursor: { count: number; id: string } | undefined;

      if (cursor) {
        if (isPopularSort) {
          // For popular sort, just use ID as cursor
          popularCursor = JSON.parse(cursor);
        } else if (search === "new") {
          dateTimeCursor = new Date(cursor);
        }
      }

      if (popularCursor) {
        const { id: idCursorValue, count: followerCount } = popularCursor;

        const data = await db.execute(
          sql`
          WITH community_stats AS (
            SELECT 
              c.id,
              c.name,
              c.description,
              c.icon,
              c.banner,
              c.is_private,
              c.created_at,
              COUNT(DISTINCT cf.user_id) AS follower_count,
              COUNT(DISTINCT t.id) AS thread_count,
              ${
                user
                  ? sql`
                EXISTS (
                  SELECT 1 FROM ${communityFollow} 
                  WHERE ${communityFollow.userId} = ${user.id} 
                  AND ${communityFollow.communityId} = c.id
                )
              `
                  : sql`FALSE`
              } AS user_follow
            FROM ${community} c
            LEFT JOIN ${communityFollow} cf ON c.id = cf.community_id
            LEFT JOIN ${thread} t ON t.community_id = c.id
            GROUP BY c.id, c.name, c.description, c.icon, c.banner, c.is_private, c.created_at
          )
          SELECT 
            id,
            name,
            description,
            icon,
            banner,
            is_private AS "isPrivate",
            created_at AS "createdAt",
            follower_count AS "userCount",
            thread_count AS "threadCount",
            user_follow AS "userFollow"
          FROM community_stats
          WHERE (follower_count < ${followerCount}) OR (follower_count = ${followerCount} AND id < ${idCursorValue})
          ORDER BY follower_count DESC, id DESC
          LIMIT ${limit};
        `
        );

        const communities = data.rows.map((row) => ({
          id: row.id as string,
          name: row.name as string,
          description: row.description as string,
          icon: row.icon as string,
          threadCount: Number(row.threadCount || 0),
          userCount: Number(row.userCount || 0),
          userFollow: row.userFollow === true,
          createdAt: new Date(row.createdAt as string),
        }));

        return c.json(communities);
      }

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
            dateTimeCursor
              ? lt(community.createdAt, dateTimeCursor)
              : undefined,
            search !== "following" ? eq(community.isPrivate, false) : undefined,
            user && search === "following"
              ? eq(communityFollow.userId, user.id)
              : undefined
          )
        )
        .orderBy(
          search === "new"
            ? desc(community.createdAt)
            : desc(community.createdAt)
        )
        .limit(limit)
        .groupBy(
          community.id,
          community.name,
          community.description,
          community.icon,
          community.isPrivate,
          community.createdAt
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
            ownerId: user.id,
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
  .get(
    "/:name",
    zValidator("param", z.object({ name: z.string() })),
    async (c) => {
      const name = c.req.valid("param").name;
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
          moderators: sql<CommunityMod[]>`
          COALESCE(
            jsonb_agg(
              DISTINCT jsonb_build_object(
                'userId', ${user.id},
                'username', ${user.name},
                'avatar', ${user.image}
              )
            ) FILTER (WHERE ${moderator.userId} IS NOT NULL),
            '[]'::jsonb
          )
        `.as("moderators"),
        })
        .from(community)
        .where(sql`lower(${community.name}) = lower(${name})`)
        .leftJoin(thread, eq(thread.communityId, community.id))
        .leftJoin(
          communityFollow,
          eq(communityFollow.communityId, community.id)
        )
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
    }
  )
  .delete(
    "/delete/:id",
    requireAuth,
    zValidator("param", z.object({ id: z.string().uuid() })),
    async (c) => {
      const id = c.req.valid("param").id;

      const communityExists = await db.query.community.findFirst({
        where: eq(community.id, id),
        with: { moderators: true },
      });

      if (!communityExists) {
        return c.json({ error: "Community not found" }, 404);
      }

      await db.delete(community).where(eq(community.id, id)).execute();

      return c.json({ success: true });
    }
  )
  .post(
    "/follow/:id",
    requireAuth,
    zValidator("param", z.object({ id: z.string().uuid() })),
    async (c) => {
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
    }
  )
  .delete(
    "/follow/:id",
    requireAuth,
    zValidator("param", z.object({ id: z.string().uuid() })),
    async (c) => {
      const user = c.var.user!;
      const id = c.req.valid("param").id;
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
    }
  )
  .put(
    "/icon/:id",
    requireAuth,
    zValidator("param", z.object({ id: z.string().uuid() })),
    zValidator("json", z.object({ iconUrl: z.string().url() })),
    async (c) => {
      const user = c.var.user!;
      const id = c.req.valid("param").id;
      const icon = c.req.valid("json").iconUrl;

      const communityExists = await db.query.community.findFirst({
        where: eq(community.id, id),
        with: { moderators: true },
      });

      if (communityExists) {
        const authorisedUser = communityExists?.moderators.some(
          (mod) => mod.userId === user.id
        );

        if (!authorisedUser) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const [updated] = await db
          .update(community)
          .set({
            icon,
          })
          .where(eq(community.id, id))
          .returning();

        return c.json(updated, 200);
      } else {
        return c.json({ error: "Community not found" }, 404);
      }
    }
  )
  .put(
    "/banner/:id",
    requireAuth,
    zValidator("param", z.object({ id: z.string().uuid() })),
    zValidator("json", z.object({ bannerUrl: z.string().url() })),
    async (c) => {
      const user = c.var.user!;
      const id = c.req.valid("param").id;
      const banner = c.req.valid("json").bannerUrl;

      const communityExists = await db.query.community.findFirst({
        where: eq(community.id, id),
        with: { moderators: true },
      });

      if (communityExists) {
        const authorisedUser = communityExists?.moderators.some(
          (mod) => mod.userId === user.id
        );

        if (!authorisedUser) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const [updated] = await db
          .update(community)
          .set({
            banner,
          })
          .where(eq(community.id, id))
          .returning();

        return c.json(updated, 200);
      } else {
        return c.json({ error: "Community not found" }, 404);
      }
    }
  )
  .put(
    "/description/:id",
    requireAuth,
    zValidator("param", z.object({ id: z.string().uuid() })),
    zValidator("json", z.object({ description: descriptionSchema })),
    async (c) => {
      const user = c.var.user!;
      const id = c.req.valid("param").id;
      const description = c.req.valid("json").description;

      const communityExists = await db.query.community.findFirst({
        where: eq(community.id, id),
        with: { moderators: true },
      });

      if (communityExists) {
        const authorisedUser = communityExists?.moderators.some(
          (mod) => mod.userId === user.id
        );

        if (!authorisedUser) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const [updated] = await db
          .update(community)
          .set({
            description,
          })
          .where(eq(community.id, id))
          .returning();

        return c.json(updated, 200);
      } else {
        return c.json({ error: "Community not found" }, 404);
      }
    }
  )
  .put(
    "/privacy/:id",
    requireAuth,
    zValidator("param", z.object({ id: z.string().uuid() })),
    zValidator("json", z.object({ isPrivate: z.boolean() })),
    async (c) => {
      const user = c.var.user!;
      const id = c.req.valid("param").id;
      const { isPrivate } = c.req.valid("json");

      const communityExists = await db.query.community.findFirst({
        where: eq(community.id, id),
        with: { moderators: true },
      });

      if (communityExists) {
        const authorisedUser = communityExists.moderators.some(
          (mod) => mod.userId === user.id
        );

        if (!authorisedUser) {
          return c.json({ error: "Unauthorized" }, 401);
        }

        const [updated] = await db
          .update(community)
          .set({ isPrivate })
          .where(eq(community.id, id))
          .returning();

        return c.json(updated, 200);
      } else {
        return c.json({ error: "Community not found" }, 404);
      }
    }
  );
