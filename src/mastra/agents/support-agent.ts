import { Agent } from "@mastra/core";
import type { Context } from "hono";
import { makeGatewayWorkersAI } from "../providers/aigateway";

export function makeSupportAgent(c: Context) {
  const model = makeGatewayWorkersAI((c as any).env);

  return new Agent({
    name: "support",
    instructions: "Be concise and helpful.",
    model,
  });
}
