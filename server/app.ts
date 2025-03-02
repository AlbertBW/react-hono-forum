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

export type AppVariables = {
  Variables: {
    user: User | null;
    session: Session | null;
  };
};

const app = new Hono<AppVariables>();

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

app.use("*", getUser);

const apiRoutes = app
  .basePath("/api")
  .route("/auth", authRoute)
  .route("/threads", threadsRoute)
  .route("/users", usersRoute)
  .route("/communities", communitiesRoute)
  .route("/comments", commentsRoute);

app.get("*", serveStatic({ root: "./frontend/dist" }));
app.get("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;
export type ApiRoutes = typeof apiRoutes;
