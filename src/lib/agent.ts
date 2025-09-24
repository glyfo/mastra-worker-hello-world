// src/lib/agent.ts
import type { Context } from "hono";
import { Agent } from "@mastra/core";
import { MastraProviders, Models } from "../providers";
import { trace } from "./utils";

type CreateAgentOpts = {
  provider?: "cloudflare" | "openai" | "auto";
  model?: string;
  name?: string;
  instructions?: string;
};

export async function createMastraAgent(c: Context, opts: CreateAgentOpts = {}) {
  trace("createMastraAgent:start", { opts });

  const prov =
    opts.provider === "cloudflare"
      ? MastraProviders.cloudflare({ context: c })
      : opts.provider === "openai"
      ? MastraProviders.openai({ context: c })
      : MastraProviders.auto(c);

  const modelId = opts.model ?? Models.WorkersAI.LLAMA_3_1_8B;

  // Mastra 0.18 expects `DynamicArgument<MastraLanguageModel>`.
  // We provide an OpenAI-compatible model via Gateway; cast to satisfy TS.
  const modelThunk = () => prov(modelId);
  const modelArg = modelThunk as unknown as ReturnType<typeof modelThunk>; // keep IDE hints
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mastraModel = (modelArg as unknown) as any;

  const agent = new Agent({
    name: opts.name ?? "agent",
    instructions: opts.instructions ?? "You are a helpful AI assistant.",
    model: mastraModel,
  });

  trace("createMastraAgent:created", { name: agent.name, modelId });
  return agent;
}
