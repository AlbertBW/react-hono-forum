import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { community, post } from "./db/schema";

export type Post = InferSelectModel<typeof post>;
export const insertPostSchema = createInsertSchema(post, {
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  content: z
    .string()
    .min(10, "Content must be at least 10 characters")
    .max(1000),
}).omit({ userId: true, id: true, createdAt: true, updatedAt: true });
export type CreatePost = z.infer<typeof insertPostSchema>;

export const postIdSchema = z.object({ id: z.string().uuid() });
export type PostId = Post["id"];

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
