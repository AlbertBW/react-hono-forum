import { Hono } from "hono";
import type { AppVariables } from "../app";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth } from "./auth";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { community, moderator } from "../db/schema";

export const moderatorsRoute = new Hono<AppVariables>()
  .post(
    "/community/:communityId/:userId",
    requireAuth,
    zValidator(
      "param",
      z.object({ communityId: z.string().uuid(), userId: z.string().uuid() })
    ),
    async (c) => {
      const currentUser = c.var.user!;
      const communityId = c.req.valid("param").communityId;
      const userToAddId = c.req.valid("param").userId;

      const communityExists = await db.query.community.findFirst({
        where: eq(community.id, communityId),
        with: { moderators: true },
      });

      if (communityExists) {
        let isAuthorised = false;
        let modExists = false;

        for (const mod of communityExists.moderators) {
          if (mod.userId === currentUser.id) isAuthorised = true;
          if (mod.userId === userToAddId) modExists = true;

          if (isAuthorised && modExists) break;
        }
        if (!isAuthorised) {
          return c.json({ error: "Unauthorized" }, 401);
        }
        if (modExists) {
          return c.json({ error: "User is already a mod" }, 400);
        }

        const [created] = await db
          .insert(moderator)
          .values({ userId: userToAddId, communityId })
          .returning();

        return c.json(created, 201);
      } else {
        return c.json({ error: "Community not found" }, 404);
      }
    }
  )
  .delete(
    "/community/:communityId/:userId",
    requireAuth,
    zValidator(
      "param",
      z.object({ communityId: z.string().uuid(), userId: z.string().uuid() })
    ),
    async (c) => {
      const user = c.var.user!;
      const communityId = c.req.valid("param").communityId;
      const modId = c.req.valid("param").userId;

      const communityExists = await db.query.community.findFirst({
        where: eq(community.id, communityId),
        with: { moderators: true },
      });

      if (communityExists) {
        let isAuthorised = false;
        let modExists = false;

        for (const mod of communityExists.moderators) {
          if (mod.userId === user.id) isAuthorised = true;
          if (mod.userId === modId) modExists = true;

          if (isAuthorised && modExists) break;
        }
        if (!isAuthorised) {
          return c.json({ error: "Unauthorized" }, 401);
        }
        if (!modExists) {
          return c.json({ error: "Mod not found" }, 404);
        }

        const [deleted] = await db
          .delete(moderator)
          .where(
            and(
              eq(moderator.userId, modId),
              eq(moderator.communityId, communityId)
            )
          )
          .returning();

        return c.json(deleted, 200);
      } else {
        return c.json({ error: "Community not found" }, 404);
      }
    }
  );
