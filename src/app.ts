import { Hono } from "hono";
import { health } from "./routes/health";
import { hello } from "./routes/hello";
import { trace } from "./lib/trace";

const app = new Hono();

// (Optional) minimal error boundary so unhandled errors become JSON
app.onError((err, c) => {
  trace("unhandled", { path: c.req.path, err: err?.message });
  return c.json({ error: "Internal Server Error" }, 500);
});

// Routes
app.get("/", health);
app.post("/hello", hello);

export { app };
export default app;
