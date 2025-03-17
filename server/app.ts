import { Hono } from "hono";
import { logger } from "hono/logger";
import { threadsRoute } from "./routes/threads";
import { serveStatic } from "hono/bun";
import { authRoute, getUser } from "./routes/auth";
import { cors } from "hono/cors";
import { usersRoute } from "./routes/users";
import type { Session, User } from "better-auth";
import { communitiesRoute } from "./routes/community";
import { commentsRoute } from "./routes/comments";
import { createRateLimiter } from "./ratelimit";
import { imageRoute } from "./routes/image";
import { moderatorsRoute } from "./routes/moderators";

export type AppVariables = {
  Variables: {
    user: User | null;
    session: Session | null;
  };
};

const app = new Hono<AppVariables>();

const ratelimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 3,
});

app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: process.env.HOST_NAME!,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);
app.use("/api/*", ratelimiter);
app.use("/api/*", getUser);

const apiRoutes = app
  .basePath("/api")
  .route("/auth", authRoute)
  .route("/threads", threadsRoute)
  .route("/users", usersRoute)
  .route("/communities", communitiesRoute)
  .route("/comments", commentsRoute)
  .route("/image", imageRoute)
  .route("/moderators", moderatorsRoute);

app.get("*", serveStatic({ root: "./frontend/dist" }));
app.get("*", async (c) => {
  return c.html(await Bun.file("./frontend/dist/index.html").text());
});

export default app;
export type ApiRoutes = typeof apiRoutes;
