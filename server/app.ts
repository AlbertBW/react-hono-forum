import { Hono } from "hono";
import { logger } from "hono/logger";
import { postsRoute } from "./routes/posts";
import { serveStatic } from "hono/bun";
import { authRoute, getUser } from "./routes/auth";
import { cors } from "hono/cors";
import { usersRoute } from "./routes/users";
import { sessionRoute } from "./routes/session";
import type { Session, User } from "better-auth";

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
  .route("/posts", postsRoute)
  .route("/auth", authRoute)
  .route("/users", usersRoute)
  .route("/session", sessionRoute);

app.get("*", serveStatic({ root: "./frontend/dist" }));
app.get("*", serveStatic({ path: "./frontend/dist/index.html" }));

export default app;
export type ApiRoutes = typeof apiRoutes;
