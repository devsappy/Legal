import "./env";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import { auth } from "./routes/auth";
import { chat } from "./routes/chat";
import { conversations } from "./routes/conversations";
import { admin } from "./routes/admin";
import { pub } from "./routes/public";
import { ensureSchema } from "./lib/db";

/**
 * Sahakar Sahayak API. The frontend proxies /api/* here, so cookies stay
 * same-origin; CORS is only for calling it directly (CORS_ORIGIN).
 */
const app = new Hono();

app.use(logger((line) => process.env.QUIET ? undefined : console.log(line)));
if (process.env.CORS_ORIGIN) {
  app.use("/api/*", cors({ origin: process.env.CORS_ORIGIN.split(","), credentials: true }));
}

app.route("/api", pub);
app.route("/api/auth", auth);
app.route("/api/chat", chat);
app.route("/api/conversations", conversations);
app.route("/api/admin", admin);

app.notFound((c) => c.json({ ok: false, error: "not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ ok: false, error: err.message }, 500);
});

const port = Number(process.env.PORT ?? 4000);
const hostname = process.env.HOST ?? "127.0.0.1";
try {
  await ensureSchema();
} catch (err) {
  console.error(`database unavailable: ${(err as Error).message}`);
  process.exit(1);
}
serve({ fetch: app.fetch, port, hostname }, () => {
  console.log(`sahayak api listening on http://${hostname}:${port}`);
});

export default app;
