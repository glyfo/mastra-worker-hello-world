// src/agents/helloAgent.ts
import type { Context } from "hono";
import { MastraAgent } from "@/lib/agent";   // was ../lib/agent
import { Models } from "@/providers";        // was ../providers

export function helloAgent(c: Context) {
  return new MastraAgent(c, {
    provider: "workers-ai",
    model: Models.WorkersAI.LLAMA_3_1_8B,
    name: "hello-agent",
    instructions:
      "You are a friendly greeter. Always respond with enthusiasm and include the person's name.",
  });
}

