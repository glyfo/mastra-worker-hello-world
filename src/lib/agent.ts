import type { Context } from "hono";
import { trace } from "./trace";
import { MastraProviders, Models } from "../providers";
// NOTE: you use Agent but didn't import it in your snippet.
// Make sure this import is correct for your Mastra SDK version:
import { Agent } from "@mastra/core"; // <-- adjust if your package name differs

type CreateAgentOpts = {
  name?: string;
  instructions?: string;
  model?: string;
};

export async function createMastraAgent(
  c: Context,
  opts: CreateAgentOpts = {}
) {
  trace("createMastraAgent: starting", { opts });

  const provider = MastraProviders.auto(c);
  const model = opts.model ?? Models.WorkersAI.LLAMA_3_1_8B;

  const agent = new Agent({
    name: opts.name ?? "agent",
    instructions: opts.instructions ?? "You are a helpful AI assistant.",
    model: provider.get()(model),
  });

  trace("createMastraAgent: created agent", { name: agent.name });
  return agent;
}
