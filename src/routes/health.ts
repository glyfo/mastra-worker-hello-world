import type { Context } from "hono";

export const health = (c: Context) => {
  const ip = c.req.header("cf-connecting-ip") ?? "unknown";
  const cfRay = c.req.header("cf-ray") ?? "unknown";
  const now = new Date().toISOString();

  console.info(`Health check from ${ip} at ${now}`);

  return c.json({
    status: "ok",
    timestamp: now,
    cf_ray: cfRay,
  });
};
