import type { Context } from "hono";
import { SimpleAgent } from "../lib/agent";
import { Models } from "../providers";

export async function hello(c: Context) {
  const body = await c.req.json().catch(() => ({} as { name?: string }));
  const name = body.name ?? "World";

  const agent = new SimpleAgent(c, {
    provider: "auto",
    model: Models.WorkersAI.LLAMA_3_1_8B,
    name: "hello-agent",
    instructions:
      "You are a friendly greeter. Always respond with enthusiasm and include the person's name.",
  });

  try {
    const greeting = await agent.generate(`Say hello to ${name}`);
    return c.json({ greeting, name });
  } catch (err: any) {
    return c.json({ error: err?.message ?? "Generation failed" }, 500);
  }
}
