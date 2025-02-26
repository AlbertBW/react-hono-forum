import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { post } from "./db/schema";

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
