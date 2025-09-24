// src/routes/hello.ts
import type { Context } from "hono";
import { createMastraAgent } from "../lib/agent";
import { Models } from "../providers";
import { extractText, trace } from "../lib/utils";

export async function hello(c: Context) {
  const body = await c.req.json().catch(() => ({} as { name?: string }));
  const name = body.name ?? "World";

  const agent = await createMastraAgent(c, {
    provider: "auto",
    model: Models.WorkersAI.LLAMA_3_1_8B,
    name: "hello-agent",
    instructions:
      "You are a friendly greeter. Always respond with enthusiasm and include the person's name.",
  });

  try {
    // v2 API (array of messages)
    const result = await agent.generateVNext([
      { role: "system", content: "You are a friendly greeter." },
      { role: "user", content: `Say hello to ${name}` },
    ]);

    const text = extractText(result);
    return c.json({ greeting: text, name });
  } catch (err: any) {
    trace("hello route error", { message: err?.message });
    return c.json({ error: err?.message ?? "Generation failed" }, 500);
  }
}
