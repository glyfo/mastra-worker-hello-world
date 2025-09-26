// src/routes/hello.ts
import type { Context } from "hono";
import { helloAgent } from "../agents";

export async function hello(c: Context) {
  const body = await c.req.json().catch(() => ({} as { name?: string }));
  const name = body.name ?? "World";

  const agent = helloAgent(c);

  try {
    // v5 non-stream: pass a STRING (not an object)
    const greeting = await agent.generateVNext(`Say hello to ${name} and give additional information about yourself`);
    return c.json({ greeting, name });
  } catch (err: any) {
    return c.json({ error: err?.message ?? "Generation failed" }, 500);
  }
}
