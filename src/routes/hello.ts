// src/routes/hello.ts
import type { Context } from "hono";
import { SimpleAgent } from "../lib/agent"; // ensure path matches your file
import { Models } from "../providers";

export async function hello(c: Context) {
  const body = await c.req.json().catch(() => ({} as { name?: string }));
  const name = body.name ?? "World";

  const agent = new SimpleAgent(c, {
    provider: "workers-ai", // uses your v5 providers via AI Gateway
    model: Models.WorkersAI.LLAMA_3_1_8B,
    name: "hello-agent",
    instructions:
      "You are a friendly greeter. Always respond with enthusiasm and include the person's name.",
  });

  try {
    // v5 non-stream: pass a STRING (not an object)
    const greeting = await agent.generateVNext(`Say hello to ${name}`);
    return c.json({ greeting, name });
  } catch (err: any) {
    return c.json({ error: err?.message ?? "Generation failed" }, 500);
  }
}
