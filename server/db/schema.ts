import { relations, type InferSelectModel } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const pgTable = pgTableCreator((name) => `rhf_${name}`);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const userRelations = relations(user, ({ many }) => ({
  threads: many(thread),
  comments: many(comment),
  communities: many(community),
  votes: many(threadVote),
  sessions: many(session),
  accounts: many(account),
}));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const thread = pgTable("thread", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  communityId: text("community_id")
    .notNull()
    .references(() => community.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const threadRelations = relations(thread, ({ one, many }) => ({
  user: one(user, {
    fields: [thread.userId],
    references: [user.id],
  }),
  community: one(community, {
    fields: [thread.communityId],
    references: [community.id],
  }),
  votes: many(threadVote),
  comments: many(comment),
}));

export const threadVote = pgTable(
  "thread_vote",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "set null" }),
    threadId: text("thread_id")
      .notNull()
      .references(() => thread.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.threadId],
    }),
  ]
);

export const threadVoteRelations = relations(threadVote, ({ one }) => ({
  user: one(user, {
    fields: [threadVote.userId],
    references: [user.id],
  }),
  thread: one(thread, {
    fields: [threadVote.threadId],
    references: [thread.id],
  }),
}));

export const community = pgTable(
  "community",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull().unique(),
    description: text("description"),
    icon: text("icon"),
    isPrivate: boolean("is_private").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("community_name_idx").on(table.name)]
);

export const communityRelations = relations(community, ({ many }) => ({
  threads: many(thread),
  followers: many(communityFollow),
}));

export const communityFollow = pgTable(
  "community_follow",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    communityId: text("community_id")
      .notNull()
      .references(() => community.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.communityId],
    }),
  ]
);

export const communityFollowRelations = relations(
  communityFollow,
  ({ one }) => ({
    user: one(user, {
      fields: [communityFollow.userId],
      references: [user.id],
    }),
    community: one(community, {
      fields: [communityFollow.communityId],
      references: [community.id],
    }),
  })
);

export const comment = pgTable("comment", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  content: text("content").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  threadId: text("thread_id").references(() => thread.id, {
    onDelete: "cascade",
  }),
  parentId: text("parent_id").references((): AnyPgColumn => comment.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commentRelations = relations(comment, ({ one, many }) => ({
  user: one(user, {
    fields: [comment.userId],
    references: [user.id],
  }),
  thread: one(thread, {
    fields: [comment.threadId],
    references: [thread.id],
  }),
  parent: one(comment, {
    fields: [comment.parentId],
    references: [comment.id],
    relationName: "parent",
  }),
  replies: many(comment, { relationName: "replies" }),
  votes: many(commentVote),
}));

export const commentVote = pgTable(
  "comment_vote",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "set null" }),
    commentId: text("comment_id")
      .notNull()
      .references(() => comment.id, { onDelete: "cascade" }),
    value: integer("value").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.commentId],
    }),
  ]
);

export const commentVoteRelations = relations(commentVote, ({ one }) => ({
  user: one(user, {
    fields: [commentVote.userId],
    references: [user.id],
  }),
  comment: one(comment, {
    fields: [commentVote.commentId],
    references: [comment.id],
  }),
}));

export type Thread = InferSelectModel<typeof thread>;
export const insertThreadSchema = createInsertSchema(thread, {
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(1000),
  communityId: z.string().uuid(),
}).omit({
  userId: true,
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateThread = z.infer<typeof insertThreadSchema>;

export const threadIdSchema = z.object({ id: z.string().uuid() });
export type ThreadId = Thread["id"];

export type Community = InferSelectModel<typeof community>;
export const insertCommunitySchema = createInsertSchema(community, {
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(30, "Name must be no more than 30 characters")
    .refine((name) => !name.includes(" "), {
      message: "Name cannot contain spaces",
    })
    .refine((name) => /^[a-zA-Z0-9]+$/.test(name), {
      message: "Name can only contain letters and numbers",
    }),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  icon: z.string(),
  isPrivate: z.boolean(),
}).omit({ id: true, createdAt: true, updatedAt: true });
export type CreateCommunity = z.infer<typeof insertCommunitySchema>;
export type CommunityId = Community["id"];

export const insertCommentSchema = createInsertSchema(comment, {
  content: z.string().min(3, "Content must be at least 3 characters").max(1000),
  threadId: z.string().uuid(),
  parentId: z.string().uuid().nullish(),
}).omit({
  userId: true,
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type CreateComment = z.infer<typeof insertCommentSchema>;
