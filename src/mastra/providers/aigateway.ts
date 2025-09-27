import { createAiGateway } from "ai-gateway-provider";
import { createOpenAI } from "@ai-sdk/openai";

export function makeGatewayWorkersAI(env: {
  CF_ACCOUNT_ID: string;
  CF_GATEWAY: string;
  CF_API_TOKEN: string;
}) {
  const aigateway = createAiGateway({
    accountId: env.CF_ACCOUNT_ID,
    gateway: env.CF_GATEWAY,
    apiKey: env.CF_API_TOKEN,
  });

  const openaiCompat = createOpenAI({
    apiKey: env.CF_API_TOKEN,
    baseURL: `https://gateway.ai.cloudflare.com/v1/${env.CF_ACCOUNT_ID}/${env.CF_GATEWAY}/compat`,
  });

  // Expose Workers AI via Gateway (OpenAI-compatible)
  return () =>
    aigateway([
      openaiCompat("workers-ai/@cf/meta/llama-3.1-8b-instruct"),
    ]);
}
