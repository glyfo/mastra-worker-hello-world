import type { Context } from "hono";
import { createMastraAgent } from "../lib/agent";
import { Models } from "../providers";
import { trace } from "../lib/trace";

export async function hello(c: Context) {
  const body = await c.req.json().catch(() => ({} as { name?: string }));
  const name = body.name || "World";

  try {
    trace("POST /hello: request received", { name });

    const agent = await createMastraAgent(c, {
      name: "hello-agent",
      instructions:
        "You are a friendly greeter. Always respond with enthusiasm and include the person's name.",
      model: Models.WorkersAI.LLAMA_3_1_8B,
    });

    const response = await agent.generate(`Say hello to ${name}`);

    trace("POST /hello: got agent response", { text: response.text });
    return c.json({ greeting: response.text, name });
  } catch (err: any) {
    trace("POST /hello: error", { message: err?.message ?? String(err) });
    return c.json({ error: err?.message ?? String(err) }, 500);
  }
}
