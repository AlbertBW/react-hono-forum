import { Hono } from "hono";
import type { AppVariables } from "../app";
import { put } from "@vercel/blob";
import { requireAuth } from "./auth";

export const imageRoute = new Hono<AppVariables>().post(
  "/",
  requireAuth,
  async (c) => {
    const body = await c.req.parseBody();
    const image = body["image"];
    console.log(image);
    if (typeof image === "string" || !image.type.startsWith("image/")) {
      return c.json({ error: "Invalid file type" }, 400);
    }

    const blob = await put(image.name, image, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
      contentType: image.type,
    });

    return c.json({ url: blob.url });
  }
);
